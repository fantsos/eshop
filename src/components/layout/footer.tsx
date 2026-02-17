"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const prefix = pathname.startsWith("/en") ? "/en" : "";
  const [nlEmail, setNlEmail] = useState("");
  const [nlStatus, setNlStatus] = useState<"" | "ok" | "err">("");

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                E
              </div>
              <span className="font-bold text-xl">E-Shop</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t("storeDescription")}
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" aria-label={t("visitFacebook")}><Facebook className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" aria-label={t("visitInstagram")}><Instagram className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" aria-label={t("visitTwitter")}><Twitter className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("products")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={`${prefix}/products`} className="hover:text-foreground">{t("all")} {t("products")}</Link></li>
              <li><Link href={`${prefix}/deals`} className="hover:text-foreground">{t("deals")}</Link></li>
              <li><Link href={`${prefix}/products?sort=newest`} className="hover:text-foreground">{t("newArrivals")}</Link></li>
              <li><Link href={`${prefix}/products?sort=popular`} className="hover:text-foreground">{t("bestSellers")}</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4">{t("customerService")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={`${prefix}/about`} className="hover:text-foreground">{t("footer.about")}</Link></li>
              <li><Link href={`${prefix}/contact`} className="hover:text-foreground">{t("footer.contact")}</Link></li>
              <li><Link href={`${prefix}/faq`} className="hover:text-foreground">{t("footer.faq")}</Link></li>
              <li><Link href={`${prefix}/shipping-policy`} className="hover:text-foreground">{t("footer.shipping")}</Link></li>
              <li><Link href={`${prefix}/return-policy`} className="hover:text-foreground">{t("footer.returns")}</Link></li>
              <li><Link href={`${prefix}/track-order`} className="hover:text-foreground">{t("trackOrder")}</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.newsletter")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("newsletterDescription")}
            </p>
            <form className="flex gap-2" onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: nlEmail }) });
                if (res.ok) { setNlStatus("ok"); setNlEmail(""); } else setNlStatus("err");
              } catch { setNlStatus("err"); }
            }}>
              <Input placeholder={t("footer.enterEmail")} type="email" className="flex-1" value={nlEmail} onChange={e => setNlEmail(e.target.value)} required />
              <Button type="submit">{t("footer.subscribe")}</Button>
            </form>
            {nlStatus === "ok" && <p className="text-xs text-green-600 mt-1">{t("subscribed")}</p>}
            {nlStatus === "err" && <p className="text-xs text-red-600 mt-1">{t("errorTryAgain")}</p>}
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} E-Shop. {t("footer.allRightsReserved")}.</p>
          <div className="flex gap-4">
            <Link href={`${prefix}/terms`} className="hover:text-foreground">{t("footer.terms")}</Link>
            <Link href={`${prefix}/privacy`} className="hover:text-foreground">{t("footer.privacy")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
