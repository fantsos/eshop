import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("meta.aboutTitle"), description: t("meta.aboutDescription") };
}

export default async function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("common");
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{t("aboutUs")}</h1>
      <Card><CardContent className="prose max-w-none p-6 space-y-4">
        <p>{t("aboutWelcome")}</p>
        <h2 className="text-xl font-semibold">{t("ourMission")}</h2>
        <p>{t("ourMissionText")}</p>
        <h2 className="text-xl font-semibold">{t("whyChooseUs")}</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>{t("whyWideSelection")}</li>
          <li>{t("whyCompetitivePrices")}</li>
          <li>{t("whyFastShipping")}</li>
          <li>{t("whySecurePayment")}</li>
          <li>{t("whyDedicatedSupport")}</li>
        </ul>
      </CardContent></Card>
    </div>
  );
}
