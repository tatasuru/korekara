'use client';

import { usePathname, useRouter } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/shadcn-ui/sidebar';
import { cn } from '@/lib/utils';

import { Calendar, Home, Inbox, Search, Settings } from 'lucide-react';

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
    icon: Inbox
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const currentPath = pathname === '/' ? 'calendar' : pathname.split('/')[1];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>MENU</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      'flex w-full items-center justify-start rounded-md px-4 py-2',
                      currentPath === item.title.toLowerCase() ? 'bg-gray-100' : 'hover:bg-gray-100'
                    )}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
