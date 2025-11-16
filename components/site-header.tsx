'use client';

import { usePathname } from 'next/navigation';
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useBotStore } from '@/lib/bot/store';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/bot-control': 'Bot Kontrol',
  '/dashboard/accounts': 'Hesap Yönetimi',
};

export function SiteHeader() {
  const pathname = usePathname();
  const { isRunning } = useBotStore();
  const title = PAGE_TITLES[pathname] || 'Twitter Bot Panel';

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium hidden sm:block">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          {isRunning && (
            <Badge variant="default" className="bg-green-600 hidden sm:flex">
              Bot Çalışıyor
            </Badge>
          )}
        </div>
      </div>
    </header>
  )
}
