import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { orderNumber: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "ADMIN";

  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: {
      items: true,
      user: { select: { name: true, email: true } },
      shippingAddress: true,
      billingAddress: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && order.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const shipping = order.shippingAddress;
  const billing = order.billingAddress || shipping;

  // Generate HTML invoice
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice ${order.orderNumber}</title>
<style>
body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
.header { display: flex; justify-content: space-between; margin-bottom: 40px; }
.logo { font-size: 24px; font-weight: bold; color: #f97316; }
.invoice-info { text-align: right; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th { background: #f3f4f6; text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; }
td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
.totals { margin-left: auto; width: 300px; }
.totals td { border: none; }
.totals .total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
.addresses { display: flex; gap: 40px; margin-bottom: 30px; }
.address-block h3 { margin-bottom: 5px; color: #666; font-size: 12px; text-transform: uppercase; }
.footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">E-Shop</div>
  <div class="invoice-info">
    <h2>INVOICE</h2>
    <p><strong>Order:</strong> ${order.orderNumber}</p>
    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString("el-GR")}</p>
    <p><strong>Payment:</strong> ${order.paymentMethod.replace("_", " ")}</p>
    <p><strong>Status:</strong> ${order.paymentStatus}</p>
  </div>
</div>

<div class="addresses">
  <div class="address-block">
    <h3>Shipping Address</h3>
    <p>${shipping?.name || ""}<br>${shipping?.street || ""}<br>${shipping?.city || ""} ${shipping?.zip || ""}<br>${shipping?.phone || ""}</p>
  </div>
  <div class="address-block">
    <h3>Billing Address</h3>
    <p>${billing?.name || ""}<br>${billing?.street || ""}<br>${billing?.city || ""} ${billing?.zip || ""}<br>${billing?.phone || ""}</p>
  </div>
  <div class="address-block">
    <h3>Customer</h3>
    <p>${order.user.name || ""}<br>${order.user.email}</p>
  </div>
</div>

<table>
  <thead>
    <tr><th>Item</th><th>SKU</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
  </thead>
  <tbody>
    ${order.items.map((item) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.productId.slice(0, 8)}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">&euro;${Number(item.price).toFixed(2)}</td>
      <td style="text-align:right">&euro;${(Number(item.price) * item.quantity).toFixed(2)}</td>
    </tr>`).join("")}
  </tbody>
</table>

<table class="totals">
  <tr><td>Subtotal</td><td style="text-align:right">&euro;${Number(order.subtotal).toFixed(2)}</td></tr>
  <tr><td>Shipping</td><td style="text-align:right">&euro;${Number(order.shipping).toFixed(2)}</td></tr>
  <tr><td>Tax</td><td style="text-align:right">&euro;${Number(order.tax).toFixed(2)}</td></tr>
  ${order.discount && Number(order.discount) > 0 ? `<tr><td>Discount</td><td style="text-align:right">-&euro;${Number(order.discount).toFixed(2)}</td></tr>` : ""}
  <tr class="total"><td>Total</td><td style="text-align:right">&euro;${Number(order.total).toFixed(2)}</td></tr>
</table>

<div class="footer">
  <p>E-Shop &mdash; eshop.fantsos.gr</p>
  <p>Thank you for your purchase!</p>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
