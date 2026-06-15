import type { Metadata } from 'next';
import { headers } from 'next/headers';
import localFont from 'next/font/local';
import { z } from 'zod';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ThemeProvider } from '@/lib/context/ThemeContext';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pix3lnote',
  description: 'Your personal note-taking app',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get('x-nonce') ?? '';

  const rawBoardUrl = process.env.PIX3LBOARD_URL || process.env.NEXT_PUBLIC_PIX3LBOARD_URL || '';
  const parsedBoard = z.string().url().safeParse(rawBoardUrl);
  const pix3lboardUrl = parsedBoard.success ? parsedBoard.data : 'https://board.pix3ltools.com';

  const pix3lConfig = { pix3lboardUrl };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script nonce={nonce} dangerouslySetInnerHTML={{
          __html: `window.__PIX3L_CONFIG__=${JSON.stringify(pix3lConfig)};(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t==null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
        }} />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
