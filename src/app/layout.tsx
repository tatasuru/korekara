import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AppFooter } from '@/components/layout/app-footer';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/shadcn-ui/sidebar';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'KOREKARA',
  description: 'schedule and todo management'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} overflow-hidden overscroll-none antialiased md:overflow-auto md:overscroll-auto`}>
        <SidebarProvider>
          <AppSidebar />
          <main className='flex h-[calc(100svh-75px)] w-full flex-col gap-2 p-4 md:h-auto md:p-2'>
            <SidebarTrigger className='hidden md:flex' />
            {children}
          </main>
          <AppFooter className='flex md:hidden' />
        </SidebarProvider>
      </body>
    </html>
  );
}
