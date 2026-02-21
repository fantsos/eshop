import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return buildMetadata({ title: t("meta.faqTitle"), description: t("meta.faqDescription"), locale, path: "/faq" });
}

const faqs = {
  en: [
    { q: "How can I place an order?", a: "Browse our products, add items to your cart, and proceed to checkout. You can check out as a guest or create an account." },
    { q: "What payment methods do you accept?", a: "We accept credit/debit cards (Visa, Mastercard), PayPal, bank transfer, IRIS instant transfer, and cash on delivery." },
    { q: "How long does shipping take?", a: "Standard shipping takes 2-5 business days within Greece. Express shipping is available for select areas." },
    { q: "Can I return a product?", a: "Yes, you can return products within 14 days of delivery. Products must be unused and in original packaging." },
    { q: "How can I track my order?", a: "Once your order is shipped, you'll receive a tracking number via email. You can also check your order status in your account." },
    { q: "Do you ship internationally?", a: "Currently we ship within Greece and Cyprus. International shipping will be available soon." },
    { q: "How can I contact customer support?", a: "You can reach us via email at fantsos@gmail.com or through our contact form." },
  ],
  el: [
    { q: "Πώς μπορώ να κάνω παραγγελία;", a: "Περιηγηθείτε στα προϊόντα μας, προσθέστε αντικείμενα στο καλάθι σας και προχωρήστε στην ολοκλήρωση. Μπορείτε να αγοράσετε ως επισκέπτης ή να δημιουργήσετε λογαριασμό." },
    { q: "Ποιους τρόπους πληρωμής δέχεστε;", a: "Δεχόμαστε πιστωτικές/χρεωστικές κάρτες (Visa, Mastercard), PayPal, τραπεζική μεταφορά, IRIS και αντικαταβολή." },
    { q: "Πόσο χρόνο παίρνει η αποστολή;", a: "Η τυπική αποστολή διαρκεί 2-5 εργάσιμες ημέρες εντός Ελλάδας. Express αποστολή διαθέσιμη σε επιλεγμένες περιοχές." },
    { q: "Μπορώ να επιστρέψω ένα προϊόν;", a: "Ναι, μπορείτε να επιστρέψετε προϊόντα εντός 14 ημερών από την παράδοση. Τα προϊόντα πρέπει να είναι αχρησιμοποίητα στην αρχική συσκευασία." },
    { q: "Πώς μπορώ να παρακολουθήσω την παραγγελία μου;", a: "Μόλις αποσταλεί η παραγγελία σας, θα λάβετε αριθμό παρακολούθησης μέσω email. Μπορείτε επίσης να ελέγξετε την κατάσταση στον λογαριασμό σας." },
    { q: "Στέλνετε στο εξωτερικό;", a: "Αυτή τη στιγμή στέλνουμε εντός Ελλάδας και Κύπρου. Η διεθνής αποστολή θα είναι σύντομα διαθέσιμη." },
    { q: "Πώς μπορώ να επικοινωνήσω;", a: "Μπορείτε να μας βρείτε στο fantsos@gmail.com ή μέσω της φόρμας επικοινωνίας." },
  ],
};

export default async function FAQPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("common");
  const items = locale === "en" ? faqs.en : faqs.el;
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{t("faqTitle")}</h1>
      <div className="space-y-4">
        {items.map((faq, i) => (
          <Card key={i}><CardContent className="p-6">
            <h3 className="font-semibold mb-2">{faq.q}</h3>
            <p className="text-sm text-muted-foreground">{faq.a}</p>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
