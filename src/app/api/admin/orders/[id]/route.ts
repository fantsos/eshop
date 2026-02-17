import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail, orderStatusEmail } from "@/lib/mail";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const data: any = {};
    if (body.status) data.status = body.status;
    if (body.paymentStatus) data.paymentStatus = body.paymentStatus;
    if (body.trackingNumber !== undefined) data.trackingNumber = body.trackingNumber;

    // Process Stripe refund if payment status set to REFUNDED
    if (body.paymentStatus === "REFUNDED") {
      const existing = await prisma.order.findUnique({ where: { id: params.id } });
      if (existing?.paymentMethod === "STRIPE" && existing.paymentId && stripe) {
        try {
          await stripe.refunds.create({ payment_intent: existing.paymentId });
        } catch (stripeErr: any) {
          return NextResponse.json({ error: `Stripe refund failed: ${stripeErr.message}` }, { status: 400 });
        }
      }
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data,
      include: { user: { select: { email: true } } },
    });

    // Send email notification on status change
    const recipientEmail = order.user?.email || order.guestEmail;
    if (body.status && recipientEmail) {
      const email = orderStatusEmail(order.orderNumber, body.status, order.trackingNumber, "el");
      sendMail({ to: recipientEmail, ...email }).catch(console.error);
    }

    return NextResponse.json(order);
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
