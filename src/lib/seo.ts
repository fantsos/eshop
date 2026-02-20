import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://fantsos.gr";

export function buildMetadata({
  title,
  description,
  locale,
  path,
}: {
  title: string;
  description: string;
  locale: string;
  path: string;
}): Metadata {
  const url = `${BASE_URL}/${locale}${path}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "E-Shop",
      locale: locale === "el" ? "el_GR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: url,
      languages: {
        el: `${BASE_URL}/el${path}`,
        en: `${BASE_URL}/en${path}`,
      },
    },
  };
}
