export function ProductJsonLd({ product, locale }: { product: any; locale?: string }) {
  const name = locale === "el" ? (product.nameEl || product.nameEn) : (product.nameEn || product.nameEl);
  const description = locale === "el" ? (product.descriptionEl || product.descriptionEn) : (product.descriptionEn || product.descriptionEl);
  const specs = product.specs as Record<string, string> | null;

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: product.images?.length > 0 ? product.images : undefined,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      price: product.flashSalePrice || product.price,
      priceCurrency: "EUR",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: product.url || undefined,
      ...(product.compareAtPrice && { priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] }),
    },
  };

  if (specs?.gtin || specs?.GTIN) jsonLd.gtin = specs.gtin || specs.GTIN;
  if (specs?.mpn || specs?.MPN) jsonLd.mpn = specs.mpn || specs.MPN;

  if (product.rating && product.rating > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 1,
    };
  }

  if (product.reviews && product.reviews.length > 0) {
    jsonLd.review = product.reviews.map((r: any) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
      author: { "@type": "Person", name: r.userName || "Anonymous" },
      ...(r.comment && { reviewBody: r.comment }),
      ...(r.createdAt && { datePublished: r.createdAt }),
    }));
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "E-Shop",
    url: process.env.NEXTAUTH_URL || "https://fantsos.gr",
    logo: `${process.env.NEXTAUTH_URL || "https://fantsos.gr"}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Greek", "English"],
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
