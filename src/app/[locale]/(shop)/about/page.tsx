import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  const isEn = locale === "en";
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{isEn ? "About Us" : "Σχετικά με εμάς"}</h1>
      <Card><CardContent className="prose max-w-none p-6 space-y-4">
        <p>{isEn
          ? "Welcome to E-Shop, your trusted online destination for electronics, household items, and much more. We are committed to providing high-quality products at competitive prices with exceptional customer service."
          : "Καλώς ήρθατε στο E-Shop, τον αξιόπιστο online προορισμό σας για ηλεκτρονικά, είδη σπιτιού και πολλά ακόμα. Δεσμευόμαστε να παρέχουμε προϊόντα υψηλής ποιότητας σε ανταγωνιστικές τιμές με εξαιρετική εξυπηρέτηση πελατών."}</p>
        <h2 className="text-xl font-semibold">{isEn ? "Our Mission" : "Η αποστολή μας"}</h2>
        <p>{isEn
          ? "To make online shopping accessible, affordable, and enjoyable for everyone. We carefully curate our product selection to ensure you get the best value for your money."
          : "Να κάνουμε τις ηλεκτρονικές αγορές προσβάσιμες, οικονομικές και ευχάριστες για όλους. Επιλέγουμε προσεκτικά τα προϊόντα μας για να εξασφαλίσουμε ότι θα πάρετε την καλύτερη αξία για τα χρήματά σας."}</p>
        <h2 className="text-xl font-semibold">{isEn ? "Why Choose Us" : "Γιατί να μας επιλέξετε"}</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>{isEn ? "Wide selection of quality products" : "Μεγάλη ποικιλία ποιοτικών προϊόντων"}</li>
          <li>{isEn ? "Competitive prices and regular deals" : "Ανταγωνιστικές τιμές και τακτικές προσφορές"}</li>
          <li>{isEn ? "Fast and reliable shipping" : "Γρήγορη και αξιόπιστη αποστολή"}</li>
          <li>{isEn ? "Secure payment options" : "Ασφαλείς επιλογές πληρωμής"}</li>
          <li>{isEn ? "Dedicated customer support" : "Αφοσιωμένη υποστήριξη πελατών"}</li>
        </ul>
      </CardContent></Card>
    </div>
  );
}
