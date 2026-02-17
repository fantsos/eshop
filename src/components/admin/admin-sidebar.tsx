"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, ShoppingCart, Users, FolderTree, Ticket, Settings, ArrowLeft, Truck, Rss } from "lucide-react";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/categories", icon: FolderTree, label: "Categories" },
  { href: "/admin/coupons", icon: Ticket, label: "Coupons" },
  { href: "/admin/shipping", icon: Truck, label: "Shipping" },
  { href: "/admin/feeds", icon: Rss, label: "Feeds" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const prefix = locale === "en" ? "/en" : "";

  return (
    <aside className="w-64 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <Link href={`${prefix}/`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Store</Link>
        <h2 className="font-bold text-lg mt-2">Admin Panel</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const href = `${prefix}${item.href}`;
          const isActive = pathname === href || (item.href !== "/admin" && pathname.startsWith(href));
          return (
            <Link key={item.href} href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
