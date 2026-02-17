import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return buildMetadata({ title: t("meta.termsTitle"), description: t("meta.termsDescription"), locale, path: "/terms" });
}

export default function TermsPage({ params: { locale } }: { params: { locale: string } }) {
  const isEn = locale === "en";
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{isEn ? "Terms of Service" : "Όροι Χρήσης"}</h1>
      <Card><CardContent className="p-6 prose max-w-none space-y-4">
        <h2 className="text-xl font-semibold">{isEn ? "1. General" : "1. Γενικά"}</h2>
        <p>{isEn ? "By using our website and services, you agree to these terms. We reserve the right to modify these terms at any time." : "Χρησιμοποιώντας τον ιστότοπο και τις υπηρεσίες μας, συμφωνείτε με αυτούς τους όρους. Διατηρούμε το δικαίωμα τροποποίησης αυτών των όρων ανά πάσα στιγμή."}</p>
        <h2 className="text-xl font-semibold">{isEn ? "2. Orders & Payments" : "2. Παραγγελίες & Πληρωμές"}</h2>
        <p>{isEn ? "All prices are in EUR and include VAT. Payment is required at the time of order. We accept credit cards, PayPal, bank transfer, IRIS, and cash on delivery." : "Όλες οι τιμές είναι σε EUR και περιλαμβάνουν ΦΠΑ. Η πληρωμή απαιτείται κατά την παραγγελία. Δεχόμαστε κάρτες, PayPal, τραπεζική μεταφορά, IRIS και αντικαταβολή."}</p>
        <h2 className="text-xl font-semibold">{isEn ? "3. Shipping" : "3. Αποστολή"}</h2>
        <p>{isEn ? "We ship within Greece. Delivery times are 2-5 business days. Free shipping for orders above €50." : "Αποστέλλουμε εντός Ελλάδας. Χρόνος παράδοσης 2-5 εργάσιμες ημέρες. Δωρεάν αποστολή για παραγγελίες άνω των €50."}</p>
        <h2 className="text-xl font-semibold">{isEn ? "4. Returns" : "4. Επιστροφές"}</h2>
        <p>{isEn ? "Products can be returned within 14 days of delivery in their original condition and packaging. Refunds are processed within 14 days of receiving the returned item." : "Τα προϊόντα μπορούν να επιστραφούν εντός 14 ημερών από την παράδοση στην αρχική τους κατάσταση. Οι επιστροφές χρημάτων γίνονται εντός 14 ημερών από τη λήψη του προϊόντος."}</p>
        <h2 className="text-xl font-semibold">{isEn ? "5. Privacy" : "5. Απόρρητο"}</h2>
        <p>{isEn ? "Your personal data is processed in accordance with our Privacy Policy and GDPR regulations." : "Τα προσωπικά σας δεδομένα επεξεργάζονται σύμφωνα με την Πολιτική Απορρήτου μας και τον κανονισμό GDPR."}</p>
      </CardContent></Card>
    </div>
  );
}
