import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, email: true, role: true, isBanned: true, createdAt: true, _count: { select: { orders: true } } } });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Users ({users.length})</h1>
      <Card><CardContent className="p-0">
        <table className="w-full">
          <thead><tr className="border-b"><th className="text-left p-3 text-sm font-medium">Name</th><th className="text-left p-3 text-sm font-medium">Email</th><th className="text-left p-3 text-sm font-medium">Role</th><th className="text-left p-3 text-sm font-medium">Orders</th><th className="text-left p-3 text-sm font-medium">Status</th><th className="text-left p-3 text-sm font-medium">Joined</th></tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id} className="border-b hover:bg-muted/50">
              <td className="p-3 text-sm font-medium">{u.name || "-"}</td>
              <td className="p-3 text-sm">{u.email}</td>
              <td className="p-3"><Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge></td>
              <td className="p-3 text-sm">{u._count.orders}</td>
              <td className="p-3"><Badge variant={u.isBanned ? "destructive" : "success" as any}>{u.isBanned ? "Banned" : "Active"}</Badge></td>
              <td className="p-3 text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
