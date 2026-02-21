import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return { ...buildMetadata({ title: t("meta.cartTitle"), description: t("meta.cartDescription"), locale, path: "/cart" }), robots: { index: false, follow: false } };
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
