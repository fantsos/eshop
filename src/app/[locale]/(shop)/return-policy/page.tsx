import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return buildMetadata({ title: t("meta.returnTitle"), description: t("meta.returnDescription"), locale, path: "/return-policy" });
}

export default function ReturnPolicyPage({ params: { locale } }: { params: { locale: string } }) {
  const isEn = locale === "en";
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{isEn ? "Return & Refund Policy" : "Πολιτική Επιστροφών & Αντικατάστασης"}</h1>
      <Card><CardContent className="p-6 prose max-w-none space-y-4">
        <h2 className="text-xl font-semibold">{isEn ? "Return Period" : "Περίοδος Επιστροφής"}</h2>
        <p>{isEn ? "You have 14 calendar days from the date of delivery to return any product, in accordance with EU consumer protection regulations." : "Έχετε 14 ημερολογιακές ημέρες από την ημερομηνία παραλαβής για να επιστρέψετε οποιοδήποτε προϊόν, σύμφωνα με την ευρωπαϊκή νομοθεσία προστασίας καταναλωτή."}</p>
        <h2 className="text-xl font-semibold">{isEn ? "Conditions" : "Προϋποθέσεις"}</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>{isEn ? "Products must be unused and in their original packaging" : "Τα προϊόντα πρέπει να είναι αχρησιμοποίητα στην αρχική τους συσκευασία"}</li>
          <li>{isEn ? "All tags and labels must be intact" : "Όλες οι ετικέτες πρέπει να είναι ανέπαφες"}</li>
          <li>{isEn ? "Include your order number and reason for return" : "Συμπεριλάβετε τον αριθμό παραγγελίας και τον λόγο επιστροφής"}</li>
          <li>{isEn ? "Proof of purchase (receipt or order confirmation) is required" : "Απαιτείται απόδειξη αγοράς (απόδειξη ή επιβεβαίωση παραγγελίας)"}</li>
        </ul>
        <h2 className="text-xl font-semibold">{isEn ? "How to Return" : "Πώς να επιστρέψετε"}</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li>{isEn ? "Contact us at info@fantsos.gr with your order number" : "Επικοινωνήστε μαζί μας στο info@fantsos.gr με τον αριθμό παραγγελίας"}</li>
          <li>{isEn ? "We'll send you a return authorization and shipping label" : "Θα σας στείλουμε εξουσιοδότηση επιστροφής και ετικέτα αποστολής"}</li>
          <li>{isEn ? "Pack the item securely and ship it back to us" : "Συσκευάστε το προϊόν με ασφάλεια και στείλτε το πίσω"}</li>
          <li>{isEn ? "Once we receive and inspect the item, we'll process your refund" : "Μόλις παραλάβουμε και ελέγξουμε το προϊόν, θα επεξεργαστούμε την επιστροφή χρημάτων"}</li>
        </ol>
        <h2 className="text-xl font-semibold">{isEn ? "Refund Process" : "Διαδικασία Επιστροφής Χρημάτων"}</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>{isEn ? "Refunds are processed within 14 days of receiving the returned item" : "Οι επιστροφές χρημάτων γίνονται εντός 14 ημερών από τη λήψη του επιστρεφόμενου προϊόντος"}</li>
          <li>{isEn ? "Refunds are issued to the original payment method" : "Η επιστροφή γίνεται στον αρχικό τρόπο πληρωμής"}</li>
          <li>{isEn ? "Shipping costs are non-refundable unless the product was defective" : "Τα έξοδα αποστολής δεν επιστρέφονται εκτός εάν το προϊόν ήταν ελαττωματικό"}</li>
        </ul>
        <h2 className="text-xl font-semibold">{isEn ? "Defective Products" : "Ελαττωματικά Προϊόντα"}</h2>
        <p>{isEn ? "If you receive a defective or damaged product, contact us immediately. We will arrange a free return and send a replacement or full refund including shipping costs." : "Εάν λάβετε ελαττωματικό ή κατεστραμμένο προϊόν, επικοινωνήστε αμέσως μαζί μας. Θα οργανώσουμε δωρεάν επιστροφή και θα στείλουμε αντικατάσταση ή πλήρη επιστροφή χρημάτων συμπεριλαμβανομένων των εξόδων αποστολής."}</p>
      </CardContent></Card>
    </div>
  );
}
