import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Download, Upload } from "lucide-react";

export default async function AdminProductsPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: { page?: string } }) {
  const prefix = locale === "en" ? "/en" : "";
  const page = parseInt(searchParams.page || "1");
  const [products, total] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * 20, take: 20, include: { category: true } }),
    prisma.product.count(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Products ({total})</h1>
        <div className="flex gap-2">
          <a href="/api/admin/products/export"><Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export CSV</Button></a>
          <Link href={`${prefix}/admin/products/new`}><Button><Plus className="h-4 w-4 mr-2" /> Add Product</Button></Link>
        </div>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full">
          <thead><tr className="border-b"><th className="text-left p-3 text-sm font-medium">Image</th><th className="text-left p-3 text-sm font-medium">Name</th><th className="text-left p-3 text-sm font-medium">SKU</th><th className="text-left p-3 text-sm font-medium">Price</th><th className="text-left p-3 text-sm font-medium">Stock</th><th className="text-left p-3 text-sm font-medium">Status</th><th className="text-left p-3 text-sm font-medium">Actions</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b hover:bg-muted/50">
                <td className="p-3"><div className="relative h-10 w-10 rounded bg-muted overflow-hidden">{p.images[0] ? <Image src={p.images[0]} alt="" fill className="object-cover" /> : <div className="h-full w-full" />}</div></td>
                <td className="p-3"><p className="font-medium text-sm">{p.nameEn}</p><p className="text-xs text-muted-foreground">{p.nameEl}</p></td>
                <td className="p-3 text-sm">{p.sku}</td>
                <td className="p-3 text-sm font-medium">€{Number(p.price).toFixed(2)}</td>
                <td className="p-3"><Badge variant={p.stock === 0 ? "destructive" : p.stock <= 5 ? "warning" as any : "default"}>{p.stock}</Badge></td>
                <td className="p-3"><Badge variant={p.isActive ? "success" as any : "secondary"}>{p.isActive ? "Active" : "Draft"}</Badge></td>
                <td className="p-3"><Link href={`${prefix}/admin/products/${p.id}`}><Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-8 text-center text-muted-foreground">No products found</p>}
      </CardContent></Card>
    </div>
  );
}
