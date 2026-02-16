import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect(`/${locale === "en" ? "en/" : ""}auth/login`);
  return (
    <div className="flex min-h-screen">
      <AdminSidebar locale={locale} />
      <main className="flex-1 p-8 bg-muted/30">{children}</main>
    </div>
  );
}
