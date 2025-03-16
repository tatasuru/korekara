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
    title: 'Calendar',
    url: '#',
    icon: Calendar
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const currentPath = pathname.split('/')[1];
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>MENU</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={cn(currentPath === '' && 'bg-secondary', 'rounded-md')}>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
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
