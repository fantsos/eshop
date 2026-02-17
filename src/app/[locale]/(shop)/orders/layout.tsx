import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return buildMetadata({ title: t("meta.ordersTitle"), description: t("meta.ordersDescription"), locale, path: "/orders" });
}

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
