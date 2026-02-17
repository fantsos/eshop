import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return buildMetadata({ title: t("meta.shippingTitle"), description: t("meta.shippingDescription"), locale, path: "/shipping-policy" });
}

export default function ShippingPolicyPage({ params: { locale } }: { params: { locale: string } }) {
  const isEn = locale === "en";
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{isEn ? "Shipping Policy" : "Πολιτική Αποστολής"}</h1>
      <Card><CardContent className="p-6 prose max-w-none space-y-4">
        <h2 className="text-xl font-semibold">{isEn ? "Delivery Times" : "Χρόνοι Παράδοσης"}</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>{isEn ? "Athens/Thessaloniki: 1-2 business days" : "Αθήνα/Θεσσαλονίκη: 1-2 εργάσιμες ημέρες"}</li>
          <li>{isEn ? "Rest of Greece: 2-5 business days" : "Υπόλοιπη Ελλάδα: 2-5 εργάσιμες ημέρες"}</li>
          <li>{isEn ? "Islands: 3-7 business days" : "Νησιά: 3-7 εργάσιμες ημέρες"}</li>
        </ul>
        <h2 className="text-xl font-semibold">{isEn ? "Shipping Costs" : "Κόστος Αποστολής"}</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>{isEn ? "Free shipping on orders over €50" : "Δωρεάν αποστολή για παραγγελίες άνω των €50"}</li>
          <li>{isEn ? "Standard shipping: €4.99" : "Τυπική αποστολή: €4,99"}</li>
          <li>{isEn ? "Cash on delivery: +€2.50 fee" : "Αντικαταβολή: +€2,50 χρέωση"}</li>
        </ul>
        <h2 className="text-xl font-semibold">{isEn ? "Order Tracking" : "Παρακολούθηση Παραγγελίας"}</h2>
        <p>{isEn ? "Once your order is shipped, you'll receive a tracking number via email. You can also check your order status in your account or using the order tracking page." : "Μόλις αποσταλεί η παραγγελία σας, θα λάβετε αριθμό παρακολούθησης μέσω email. Μπορείτε επίσης να ελέγξετε την κατάσταση στον λογαριασμό σας ή στη σελίδα παρακολούθησης."}</p>
      </CardContent></Card>
    </div>
  );
}
