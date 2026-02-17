import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("meta.privacyTitle"), description: t("meta.privacyDescription") };
}

export default function PrivacyPage({ params: { locale } }: { params: { locale: string } }) {
  const isEn = locale === "en";
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{isEn ? "Privacy Policy" : "Πολιτική Απορρήτου"}</h1>
      <Card><CardContent className="p-6 prose max-w-none space-y-4">
        <h2 className="text-xl font-semibold">{isEn ? "Data We Collect" : "Δεδομένα που συλλέγουμε"}</h2>
        <p>{isEn ? "We collect personal information you provide when creating an account, placing orders, or contacting us: name, email, phone, shipping address, and payment information." : "Συλλέγουμε προσωπικά στοιχεία που παρέχετε κατά τη δημιουργία λογαριασμού, τις παραγγελίες ή την επικοινωνία: όνομα, email, τηλέφωνο, διεύθυνση αποστολής και πληροφορίες πληρωμής."}</p>
        <h2 className="text-xl font-semibold">{isEn ? "How We Use Your Data" : "Πώς χρησιμοποιούμε τα δεδομένα σας"}</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>{isEn ? "Process and fulfill your orders" : "Επεξεργασία και εκπλήρωση παραγγελιών"}</li>
          <li>{isEn ? "Send order confirmations and shipping updates" : "Αποστολή επιβεβαιώσεων και ενημερώσεων αποστολής"}</li>
          <li>{isEn ? "Respond to customer service inquiries" : "Απάντηση σε ερωτήματα εξυπηρέτησης"}</li>
          <li>{isEn ? "Send promotional emails (with your consent)" : "Αποστολή προωθητικών email (με τη συγκατάθεσή σας)"}</li>
        </ul>
        <h2 className="text-xl font-semibold">{isEn ? "Your Rights" : "Τα δικαιώματά σας"}</h2>
        <p>{isEn ? "Under GDPR, you have the right to access, correct, delete, or export your personal data. Contact us at info@eshop.fantsos.gr to exercise these rights." : "Σύμφωνα με τον GDPR, έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής ή εξαγωγής των δεδομένων σας. Επικοινωνήστε στο info@eshop.fantsos.gr."}</p>
        <h2 className="text-xl font-semibold">Cookies</h2>
        <p>{isEn ? "We use essential cookies for site functionality and authentication. No third-party tracking cookies are used without your consent." : "Χρησιμοποιούμε απαραίτητα cookies για τη λειτουργικότητα και την αυθεντικοποίηση. Δεν χρησιμοποιούνται cookies τρίτων χωρίς τη συγκατάθεσή σας."}</p>
      </CardContent></Card>
    </div>
  );
}
