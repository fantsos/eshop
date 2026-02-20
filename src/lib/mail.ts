import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  if (!process.env.SMTP_HOST) {
    console.log("SMTP not configured, skipping email:", { to, subject });
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@fantsos.gr",
    to,
    subject,
    html,
  });
}

export function orderStatusEmail(orderNumber: string, status: string, trackingNumber: string | null, locale: string) {
  const isGreek = locale === "el";
  const statusNames: Record<string, { el: string; en: string }> = {
    CONFIRMED: { el: "Επιβεβαιώθηκε", en: "Confirmed" },
    PROCESSING: { el: "Σε επεξεργασία", en: "Processing" },
    SHIPPED: { el: "Απεστάλη", en: "Shipped" },
    DELIVERED: { el: "Παραδόθηκε", en: "Delivered" },
    CANCELLED: { el: "Ακυρώθηκε", en: "Cancelled" },
  };
  const statusName = statusNames[status]?.[isGreek ? "el" : "en"] || status;

  return {
    subject: isGreek
      ? `Ενημέρωση Παραγγελίας #${orderNumber} - ${statusName}`
      : `Order Update #${orderNumber} - ${statusName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">${isGreek ? "Ενημέρωση Παραγγελίας" : "Order Update"}</h1>
        <p>${isGreek ? "Παραγγελία" : "Order"}: <strong>#${orderNumber}</strong></p>
        <p>${isGreek ? "Νέα κατάσταση" : "New status"}: <strong>${statusName}</strong></p>
        ${trackingNumber ? `<p>${isGreek ? "Αριθμός αποστολής" : "Tracking number"}: <strong>${trackingNumber}</strong></p>` : ""}
        <p>${isGreek ? "Μπορείτε να δείτε την παραγγελία σας" : "You can view your order"}: <a href="${process.env.NEXTAUTH_URL}/orders/${orderNumber}">${isGreek ? "εδώ" : "here"}</a></p>
      </div>
    `,
  };
}

export function verificationEmail(token: string, locale: string) {
  const isGreek = locale === "el";
  const url = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  return {
    subject: isGreek ? "Επαλήθευση Email" : "Verify Your Email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">${isGreek ? "Επαλήθευση Email" : "Verify Your Email"}</h1>
        <p>${isGreek ? "Πατήστε τον παρακάτω σύνδεσμο για να επαληθεύσετε το email σας:" : "Click the link below to verify your email address:"}</p>
        <a href="${url}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">${isGreek ? "Επαλήθευση Email" : "Verify Email"}</a>
        <p style="color: #666; font-size: 14px;">${isGreek ? "Ο σύνδεσμος λήγει σε 24 ώρες." : "This link expires in 24 hours."}</p>
      </div>
    `,
  };
}

export function orderConfirmationEmail(orderNumber: string, total: string, locale: string) {
  const isGreek = locale === "el";
  return {
    subject: isGreek
      ? `Επιβεβαίωση Παραγγελίας #${orderNumber}`
      : `Order Confirmation #${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">${isGreek ? "Ευχαριστούμε για την παραγγελία σας!" : "Thank you for your order!"}</h1>
        <p>${isGreek ? "Αριθμός παραγγελίας" : "Order number"}: <strong>${orderNumber}</strong></p>
        <p>${isGreek ? "Σύνολο" : "Total"}: <strong>${total}</strong></p>
        <p>${isGreek ? "Θα σας ενημερώσουμε όταν αποσταλεί η παραγγελία σας." : "We'll notify you when your order ships."}</p>
      </div>
    `,
  };
}
