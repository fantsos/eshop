import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params: { locale, orderNumber } }: { params: { locale: string; orderNumber: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return buildMetadata({ title: t("meta.ordersTitle"), description: t("meta.ordersDescription"), locale, path: `/orders/${orderNumber}` });
}

export default async function OrderDetailPage({ params: { locale, orderNumber }, searchParams }: { params: { locale: string; orderNumber: string }; searchParams: { success?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale === "en" ? "en/" : ""}auth/login`);
  const t = await getTranslations("common");
  const tc = await getTranslations("checkout");
  const to = await getTranslations("order");

  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true, shippingAddress: true } });
  if (!order || order.userId !== session.user.id) notFound();

  return (
    <div className="container py-8 max-w-3xl">
      {searchParams.success && (
        <Card className="mb-8 border-green-500 bg-green-50"><CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">{tc("orderPlaced")}</h2>
          <p className="text-muted-foreground">{tc("orderConfirmation")}</p>
        </CardContent></Card>
      )}
      <Card><CardHeader>
        <div className="flex items-center justify-between"><CardTitle>{t("orderDetails")} #{order.orderNumber}</CardTitle><div className="flex items-center gap-2"><Badge>{to(`status.${order.status}` as any)}</Badge><a href={`/api/orders/${order.orderNumber}/invoice`} target="_blank"><Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1" /> Invoice</Button></a></div></div>
        <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
      </CardHeader><CardContent className="space-y-6">
        <div>{order.items.map(item => (<div key={item.id} className="flex justify-between py-2 border-b last:border-0"><div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">x{item.quantity}</p></div><p className="font-medium">&euro;{(Number(item.price) * item.quantity).toFixed(2)}</p></div>))}</div>
        <Separator />
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span>{t("subtotal")}</span><span>&euro;{Number(order.subtotal).toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span>{t("shipping")}</span><span>&euro;{Number(order.shipping).toFixed(2)}</span></div>
          <Separator /><div className="flex justify-between font-bold text-lg"><span>{t("total")}</span><span>&euro;{Number(order.total).toFixed(2)}</span></div>
        </div>
        {order.shippingAddress && (<><Separator /><div><h3 className="font-medium mb-2">{tc("shippingAddress")}</h3><p className="text-sm text-muted-foreground">{order.shippingAddress.name}<br />{order.shippingAddress.street}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p></div></>)}
      </CardContent></Card>
    </div>
  );
}
