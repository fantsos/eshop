import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return { ...buildMetadata({ title: t("meta.checkoutTitle"), description: t("meta.checkoutDescription"), locale, path: "/checkout" }), robots: { index: false, follow: false } };
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
