"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  MapPin,
  Globe,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

export function Header() {
  const t = useTranslations("common");
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const currentLocale = pathname.startsWith("/en") ? "en" : "el";
  const switchLocale = currentLocale === "el" ? "en" : "el";

  const handleLocaleSwitch = () => {
    const segments = pathname.split("/");
    if (segments[1] === "en") {
      segments.splice(1, 1);
    } else {
      segments.splice(1, 0, "en");
    }
    const newPath = segments.join("/") || "/";
    // Update locale cookie so middleware picks up the new locale
    document.cookie = `NEXT_LOCALE=${switchLocale}; path=/; max-age=31536000; samesite=lax`;
    // Full reload to ensure middleware runs and locale is applied
    window.location.href = newPath;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const prefix = currentLocale === "en" ? "/en" : "";
      router.push(`${prefix}/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex h-8 items-center justify-between text-xs">
          <span>{t("freeShipping")} - {t("freeShippingOver")}</span>
          <button onClick={handleLocaleSwitch} className="flex items-center gap-1 hover:underline">
            <Globe className="h-3 w-3" />
            {currentLocale === "el" ? t("english") : t("greek")}
          </button>
        </div>
      </div>

      {/* Main header */}
      <div className="container flex h-16 items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t("toggleMenu")}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Logo */}
        <Link href={currentLocale === "en" ? "/en" : "/"} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            E
          </div>
          <span className="hidden font-bold text-xl sm:inline-block">E-Shop</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href={currentLocale === "en" ? "/en" : "/"} className="font-medium hover:text-primary transition-colors">
            {t("home")}
          </Link>
          <Link href={currentLocale === "en" ? "/en/products" : "/products"} className="font-medium hover:text-primary transition-colors">
            {t("products")}
          </Link>
          <Link href={currentLocale === "en" ? "/en/categories" : "/categories"} className="font-medium hover:text-primary transition-colors">
            {t("categories")}
          </Link>
          <Link href={currentLocale === "en" ? "/en/deals" : "/deals"} className="font-medium text-red-500 hover:text-red-600 transition-colors">
            {t("deals")}
          </Link>
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchProducts")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Link href={currentLocale === "en" ? "/en/wishlist" : "/wishlist"}>
            <Button variant="ghost" size="icon" className="relative" aria-label={t("viewWishlist")}>
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {wishlistCount}
                </Badge>
              )}
            </Button>
          </Link>

          <Link href={currentLocale === "en" ? "/en/cart" : "/cart"}>
            <Button variant="ghost" size="icon" className="relative" aria-label={t("viewCart")}>
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("accountMenu")}>
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{session.user?.name || session.user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(session.user as any)?.role === "ADMIN" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={currentLocale === "en" ? "/en/admin" : "/admin"}>
                        <LayoutDashboard className="mr-2 h-4 w-4" /> {t("account")} Admin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href={currentLocale === "en" ? "/en/account/profile" : "/account/profile"}>
                    <User className="mr-2 h-4 w-4" /> {t("profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={currentLocale === "en" ? "/en/orders" : "/orders"}>
                    <Package className="mr-2 h-4 w-4" /> {t("orders")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={currentLocale === "en" ? "/en/account/addresses" : "/account/addresses"}>
                    <MapPin className="mr-2 h-4 w-4" /> {t("addresses")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href={currentLocale === "en" ? "/en/auth/login" : "/auth/login"}>
              <Button variant="outline" size="sm">
                {t("login")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden border-t px-4 py-2">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchProducts")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col p-4 gap-2">
            <Link href={currentLocale === "en" ? "/en" : "/"} className="py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>
              {t("home")}
            </Link>
            <Link href={currentLocale === "en" ? "/en/products" : "/products"} className="py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>
              {t("products")}
            </Link>
            <Link href={currentLocale === "en" ? "/en/categories" : "/categories"} className="py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>
              {t("categories")}
            </Link>
            <Link href={currentLocale === "en" ? "/en/deals" : "/deals"} className="py-2 font-medium text-red-500" onClick={() => setMobileMenuOpen(false)}>
              {t("deals")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
