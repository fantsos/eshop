import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Download } from "lucide-react";

export default async function AdminOrdersPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: { page?: string; status?: string } }) {
  const prefix = locale === "en" ? "/en" : "";
  const status = searchParams.status || "";
  const where: any = {};
  if (status) where.status = status;

  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { name: true, email: true } }, items: true } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Orders ({orders.length})</h1>
        <a href="/api/admin/orders/export"><Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export CSV</Button></a>
      </div>
      <div className="flex gap-2 mb-6">
        {["", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(s => (
          <Link key={s} href={`${prefix}/admin/orders${s ? `?status=${s}` : ""}`}><Button variant={status === s ? "default" : "outline"} size="sm">{s || "All"}</Button></Link>
        ))}
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full">
          <thead><tr className="border-b"><th className="text-left p-3 text-sm font-medium">Order</th><th className="text-left p-3 text-sm font-medium">Customer</th><th className="text-left p-3 text-sm font-medium">Total</th><th className="text-left p-3 text-sm font-medium">Payment</th><th className="text-left p-3 text-sm font-medium">Status</th><th className="text-left p-3 text-sm font-medium">Date</th><th className="text-left p-3 text-sm font-medium">Actions</th></tr></thead>
          <tbody>{orders.map(order => (
            <tr key={order.id} className="border-b hover:bg-muted/50">
              <td className="p-3 text-sm font-medium">#{order.orderNumber}</td>
              <td className="p-3 text-sm">{order.user?.name || order.user?.email || order.guestEmail || "Guest"}</td>
              <td className="p-3 text-sm font-medium">€{Number(order.total).toFixed(2)}</td>
              <td className="p-3"><Badge variant={order.paymentStatus === "PAID" ? "success" as any : "outline"}>{order.paymentStatus}</Badge></td>
              <td className="p-3"><Badge>{order.status}</Badge></td>
              <td className="p-3 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
              <td className="p-3"><Link href={`${prefix}/admin/orders/${order.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link></td>
            </tr>
          ))}</tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
