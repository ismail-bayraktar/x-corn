"use client"

import * as React from "react"
import {
  IconRobot,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { BotControls } from "@/components/bot/BotControls"

const data = {
  navMain: [
    {
      title: "Bot Kontrol",
      url: "/dashboard/bot-control",
      icon: IconRobot,
      items: [
        {
          title: "Kontrol Paneli",
          url: "/dashboard/bot-control",
        },
      ],
    },
    {
      title: "Hesaplar",
      url: "/dashboard/accounts",
      icon: IconUsers,
      items: [
        {
          title: "Hesap Yönetimi",
          url: "/dashboard/accounts",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard/bot-control">
                <IconRobot className="!size-5" />
                <span className="text-base font-semibold">Twitter Bot Panel</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <BotControls />
      </SidebarFooter>
    </Sidebar>
  )
}
