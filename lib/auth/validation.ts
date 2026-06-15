import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';
import { queryOne, execute } from '@/lib/db/turso';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const ATTEMPT_WINDOW = 15 * 60 * 1000;

export const IP_LOGIN_MAX_ATTEMPTS = 20;
export const IP_LOGIN_LOCKOUT = 30 * 60 * 1000;
export const IP_REGISTER_MAX_ATTEMPTS = 5;
export const IP_REGISTER_LOCKOUT = 15 * 60 * 1000;

interface RateLimitRecord {
  id: string;
  identifier: string;
  endpoint: string;
  attempts: number;
  window_start: string;
  locked_until: string | null;
  created_at: string;
}

interface RateLimitConfig {
  maxAttempts?: number;
  lockoutDuration?: number;
  windowDuration?: number;
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

export function getClientIp(request: NextRequest): string | null {
  const ip =
    request.ip ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null;
  return ip || null;
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string = 'login',
  config?: RateLimitConfig
): Promise<{ allowed: boolean; error?: string; retryAfter?: number }> {
  const windowDuration = config?.windowDuration ?? ATTEMPT_WINDOW;
  const now = Date.now();

  try {
    const record = await queryOne<RateLimitRecord>(
      'SELECT * FROM rate_limits WHERE identifier = :identifier AND endpoint = :endpoint',
      { identifier, endpoint }
    );

    if (!record) return { allowed: true };

    if (record.locked_until) {
      const lockedUntil = new Date(record.locked_until).getTime();
      if (lockedUntil > now) {
        const retryAfter = Math.ceil((lockedUntil - now) / 1000);
        return {
          allowed: false,
          error: `Too many failed attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes`,
          retryAfter,
        };
      }
    }

    const windowStart = new Date(record.window_start).getTime();
    if (now - windowStart > windowDuration) {
      await execute(
        'DELETE FROM rate_limits WHERE identifier = :identifier AND endpoint = :endpoint',
        { identifier, endpoint }
      );
      return { allowed: true };
    }

    return { allowed: true };
  } catch (error) {
    // Fail-closed: block on DB error to prevent brute force when rate limit state is unavailable
    console.error('Rate limit check error:', error);
    return { allowed: false, error: 'Service temporarily unavailable. Please try again shortly.' };
  }
}

export async function recordFailedAttempt(
  identifier: string,
  endpoint: string = 'login',
  config?: RateLimitConfig
): Promise<void> {
  const maxAttempts = config?.maxAttempts ?? MAX_ATTEMPTS;
  const lockoutDuration = config?.lockoutDuration ?? LOCKOUT_DURATION;
  const windowDuration = config?.windowDuration ?? ATTEMPT_WINDOW;
  const now = Date.now();
  const nowISO = new Date(now).toISOString();

  try {
    const record = await queryOne<RateLimitRecord>(
      'SELECT * FROM rate_limits WHERE identifier = :identifier AND endpoint = :endpoint',
      { identifier, endpoint }
    );

    if (!record) {
      await execute(
        `INSERT INTO rate_limits (id, identifier, endpoint, attempts, window_start, locked_until, created_at)
         VALUES (:id, :identifier, :endpoint, 1, :windowStart, NULL, :createdAt)`,
        { id: nanoid(), identifier, endpoint, windowStart: nowISO, createdAt: nowISO }
      );
      return;
    }

    const windowStart = new Date(record.window_start).getTime();
    if (now - windowStart > windowDuration) {
      await execute(
        `UPDATE rate_limits
         SET attempts = 1, window_start = :windowStart, locked_until = NULL
         WHERE identifier = :identifier AND endpoint = :endpoint`,
        { windowStart: nowISO, identifier, endpoint }
      );
      return;
    }

    const newAttempts = record.attempts + 1;
    const lockedUntil = newAttempts >= maxAttempts
      ? new Date(now + lockoutDuration).toISOString()
      : null;

    await execute(
      `UPDATE rate_limits
       SET attempts = :attempts, locked_until = :lockedUntil
       WHERE identifier = :identifier AND endpoint = :endpoint`,
      { attempts: newAttempts, lockedUntil, identifier, endpoint }
    );
  } catch (error) {
    console.error('Record failed attempt error:', error);
  }
}

export async function clearFailedAttempts(
  identifier: string,
  endpoint: string = 'login'
): Promise<void> {
  try {
    await execute(
      'DELETE FROM rate_limits WHERE identifier = :identifier AND endpoint = :endpoint',
      { identifier, endpoint }
    );
  } catch (error) {
    console.error('Clear failed attempts error:', error);
  }
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 1000);
}
