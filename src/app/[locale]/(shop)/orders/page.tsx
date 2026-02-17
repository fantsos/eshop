import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("meta.ordersTitle"), description: t("meta.ordersDescription") };
}

export default async function OrdersPage({ params: { locale } }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale === "en" ? "en/" : ""}auth/login`);
  const t = await getTranslations("common");
  const to = await getTranslations("order");
  const prefix = locale === "en" ? "/en" : "";

  const orders = await prisma.order.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, include: { items: true } });

  if (orders.length === 0) return (<div className="container py-16 text-center"><Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" /><h1 className="text-2xl font-bold mb-2">{t("myOrders")}</h1><p className="text-muted-foreground">{t("noResults")}</p></div>);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t("myOrders")}</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <Link key={order.id} href={`${prefix}/orders/${order.orderNumber}`}>
            <Card className="hover:shadow-md transition-shadow mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="font-medium">#{order.orderNumber}</p><p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p></div>
                  <div className="text-right"><Badge>{to(`status.${order.status}` as any)}</Badge><p className="font-bold mt-1">&euro;{Number(order.total).toFixed(2)}</p></div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
