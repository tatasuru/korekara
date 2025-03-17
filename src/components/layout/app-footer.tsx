'use client';

import { useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/shadcn-ui/button';
import { cn } from '@/lib/utils';

import { Calendar, Clock, Home, Inbox, List, PlusCircle, Search, Settings, User } from 'lucide-react';

// Menu items.
const items = [
  {
    title: 'CALENDAR',
    url: '/',
    icon: Calendar
  },
  {
    title: 'TODOs',
    url: '/todos',
    icon: List
  }
];

export function AppFooter({ className }: { className: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname === '/' ? 'calendar' : pathname.split('/')[1];

  return (
    <div
      className={cn(
        'fixed right-0 bottom-0 left-0 z-50 flex h-14 w-full items-center justify-around border-t border-gray-100 bg-white/95 px-2 shadow-sm backdrop-blur-sm',
        className
      )}>
      <NavButton
        icon={<Calendar className='h-5 w-5' />}
        title='Calendar'
        url='/'
        isActive={currentPath === 'calendar'}
      />
      <NavButton icon={<List className='h-5 w-5' />} title='Todos' url='/todos' isActive={currentPath === 'todos'} />
    </div>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  title: string;
  url: string;
  isActive: boolean;
  onClick?: () => void;
  badge?: number;
}

function NavButton({ icon, title, url, isActive, onClick, badge }: NavButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant='ghost'
      asChild
      className={cn(
        'relative flex h-full w-full flex-1 flex-col gap-1 rounded-none',
        isActive ? 'text-amber-500' : 'text-gray-500 hover:text-amber-400'
      )}>
      <Link href={url} className='flex w-full flex-col'>
        <div className='relative'>
          {icon}
          {badge && (
            <span className='absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white'>
              {badge}
            </span>
          )}
        </div>
        <span className={cn('text-[10px] font-medium', isActive ? 'font-semibold' : '')}>{title}</span>
        {isActive && (
          <div className='absolute bottom-0 h-0.5 w-full rounded-t-full bg-amber-500 transition-all duration-300' />
        )}
      </Link>
    </Button>
  );
}
