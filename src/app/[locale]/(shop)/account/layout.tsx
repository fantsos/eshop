import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return { ...buildMetadata({ title: t("meta.profileTitle"), description: t("meta.profileDescription"), locale, path: "/account" }), robots: { index: false, follow: false } };
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
