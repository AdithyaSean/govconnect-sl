

"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/data";
import { Bell, Menu, MessageCircle, Search, UserSquare, LogOut, CheckCircle, CreditCard, Calendar } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, Timestamp } from "firebase/firestore";
import type { Notification } from "@/lib/types";
import { SriLankaTime } from "./sri-lanka-time";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, refetch } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    if (!user) return;

    const q = query(
        collection(db, "notifications"), 
        where("userId", "==", user.id)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        // Sort on the client-side to avoid needing a composite index
        const sortedNotifs = notifs
            .filter(n => n.createdAt) // Filter out notifications without a timestamp
            .sort((a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());
        setNotifications(sortedNotifs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
      localStorage.removeItem("loggedInNic");
      router.push('/login');
  }

  const handleNotificationClick = async (notification: Notification) => {
      if (!notification.read) {
          const notifRef = doc(db, "notifications", notification.id);
          await updateDoc(notifRef, { read: true });
      }
      router.push(notification.href);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0">
                <div className="p-6">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                  >
                    <UserSquare className="h-6 w-6 text-primary" />
                    <span>GovConnect SL</span>
                  </Link>
                </div>
                <ScrollArea className="flex-grow">
                  <nav className="grid gap-2 text-base font-medium p-4 pt-0">
                    {navItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                         className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          pathname === item.href && "text-primary bg-muted"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </Link>
                    ))}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="hidden md:flex items-center gap-2 font-bold text-lg">
              <UserSquare className="h-7 w-7 text-primary" />
              <span>GovConnect SL</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-2 md:gap-4">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full relative">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notifications</span>
                        {unreadCount > 0 && <Badge className="absolute top-1 right-1 h-4 w-4 shrink-0 justify-center rounded-full p-0 text-xs">{unreadCount}</Badge>}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="px-3 py-2">Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-72">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => {
                            const Icon = LucideIcons[notification.icon] || CheckCircle;
                            return (
                                <DropdownMenuItem key={notification.id} asChild className="p-0 cursor-pointer">
                                   <div onClick={() => handleNotificationClick(notification)} className={cn("flex items-start gap-3 p-3 w-full", !notification.read && "bg-muted/50")}>
                                        <Icon className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                                        <div className="flex flex-col gap-1">
                                            <p className="font-medium leading-tight">{notification.title}</p>
                                            <p className="text-sm text-muted-foreground">{notification.description}</p>
                                            <p className="text-xs text-muted-foreground/70">{(notification.createdAt as Timestamp).toDate().toLocaleString()}</p>
                                       </div>
                                   </div>
                                </DropdownMenuItem>
                            )
                        })
                    ) : (
                        <p className="text-sm text-muted-foreground text-center p-4">No notifications yet.</p>
                    )}
                    </ScrollArea>
                </DropdownMenuContent>
             </DropdownMenu>
             <Link href="/chat">
              <Button variant="ghost" size="icon" className="rounded-full">
                  <MessageCircle className="h-5 w-5" />
                  <span className="sr-only">AI Assistant</span>
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer h-9 w-9">
                  <AvatarImage src={user?.photoURL} alt={user?.name} data-ai-hint="avatar user" />
                  <AvatarFallback>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.name || "Citizen"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/payments">Payments</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="container mx-auto">
        {children}
      </main>
      <footer className="border-t">
        <div className="container mx-auto py-6 text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} GovConnect SL. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
