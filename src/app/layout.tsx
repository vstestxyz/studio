import type {Metadata} from 'next';
import { Geist } from 'next/font/google'; // Using Geist Sans only as an example
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// Correctly import Geist Sans and Geist Mono
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist({ // Assuming Geist can also provide a mono, or use a different mono font
  subsets: ['latin'],
  variable: '--font-geist-mono',
  weight: ['400'], // Specify weights if needed and available for the mono variant
});


export const metadata: Metadata = {
  title: 'Code Utility Suite - Fix & Compare',
  description: 'AI-powered app to detect errors, suggest fixes, correct your code, and compare text/code snippets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
