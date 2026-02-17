import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderStatusUpdate } from "@/components/admin/order-status-update";
import { FileText } from "lucide-react";

export default async function AdminOrderDetailPage({ params: { id } }: { params: { locale: string; id: string } }) {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, user: { select: { name: true, email: true } }, shippingAddress: true } });
  if (!order) notFound();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
        <div className="flex items-center gap-2">
          <Link href={`/api/orders/${order.orderNumber}/invoice?format=pdf`} target="_blank"><Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1" />Print Invoice</Button></Link>
          <Badge>{order.status}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Order Info</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
          <p><strong>Customer:</strong> {order.user?.name || order.user?.email || order.guestEmail || "Guest"}</p>
          <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Payment:</strong> {order.paymentMethod} - <Badge variant={order.paymentStatus === "PAID" ? "success" as any : "outline"}>{order.paymentStatus}</Badge></p>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Update Status</CardTitle></CardHeader><CardContent><OrderStatusUpdate orderId={order.id} currentStatus={order.status} currentPaymentStatus={order.paymentStatus} /></CardContent></Card>
      </div>
      <Card className="mt-6"><CardHeader><CardTitle>Items</CardTitle></CardHeader><CardContent>
        {order.items.map(item => (<div key={item.id} className="flex justify-between py-2 border-b last:border-0"><div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">x{item.quantity}</p></div><p className="font-medium">€{(Number(item.price) * item.quantity).toFixed(2)}</p></div>))}
        <Separator className="my-4" />
        <div className="flex justify-between font-bold text-lg"><span>Total</span><span>€{Number(order.total).toFixed(2)}</span></div>
      </CardContent></Card>
    </div>
  );
}
