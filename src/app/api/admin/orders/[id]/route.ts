import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail, orderStatusEmail } from "@/lib/mail";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const data: any = {};
    if (body.status) data.status = body.status;
    if (body.paymentStatus) data.paymentStatus = body.paymentStatus;
    if (body.trackingNumber !== undefined) data.trackingNumber = body.trackingNumber;
    const order = await prisma.order.update({
      where: { id: params.id },
      data,
      include: { user: { select: { email: true } } },
    });

    // Send email notification on status change
    if (body.status && order.user.email) {
      const email = orderStatusEmail(order.orderNumber, body.status, order.trackingNumber, "el");
      sendMail({ to: order.user.email, ...email }).catch(console.error);
    }

    return NextResponse.json(order);
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
