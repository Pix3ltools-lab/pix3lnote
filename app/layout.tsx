import type { Metadata } from 'next';
import { headers } from 'next/headers';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';

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

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: '' }} />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
