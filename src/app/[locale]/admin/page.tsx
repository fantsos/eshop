import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import DashboardCharts from "@/components/admin/dashboard-charts";

export default async function AdminDashboard() {
  const [totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders, lowStockProducts] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { name: true, email: true } } } }),
    prisma.product.findMany({ where: { isActive: true, stock: { lte: 5 } }, orderBy: { stock: "asc" }, take: 10 }),
  ]);

  const stats = [
    { title: "Total Revenue", value: `€${Number(totalRevenue._sum.total || 0).toFixed(2)}`, icon: DollarSign },
    { title: "Total Orders", value: totalOrders.toString(), icon: ShoppingCart },
    { title: "Total Users", value: totalUsers.toString(), icon: Users },
    { title: "Active Products", value: totalProducts.toString(), icon: Package },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle><stat.icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stat.value}</div></CardContent></Card>
        ))}
      </div>
      <DashboardCharts />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card><CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader><CardContent><div className="space-y-3">
          {recentOrders.map((order) => (<div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-0"><div><p className="font-medium text-sm">#{order.orderNumber}</p><p className="text-xs text-muted-foreground">{order.user?.name || order.user?.email || "Guest"}</p></div><div className="text-right"><Badge>{order.status}</Badge><p className="text-sm font-medium">€{Number(order.total).toFixed(2)}</p></div></div>))}
          {recentOrders.length === 0 && <p className="text-muted-foreground text-sm">No orders yet</p>}
        </div></CardContent></Card>
        <Card><CardHeader><CardTitle>Low Stock Alert</CardTitle></CardHeader><CardContent><div className="space-y-3">
          {lowStockProducts.map((p) => (<div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0"><div><p className="font-medium text-sm">{p.nameEn}</p><p className="text-xs text-muted-foreground">SKU: {p.sku}</p></div><Badge variant={p.stock === 0 ? "destructive" : "warning" as any}>{p.stock} left</Badge></div>))}
          {lowStockProducts.length === 0 && <p className="text-muted-foreground text-sm">All products well stocked</p>}
        </div></CardContent></Card>
      </div>
    </div>
  );
}
