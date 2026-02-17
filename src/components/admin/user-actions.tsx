"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Ban, ShieldCheck, Loader2 } from "lucide-react";

export function UserActions({ userId, role, isBanned }: { userId: string; role: string; isBanned: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleBan = async () => {
    if (!confirm(isBanned ? "Unban this user?" : "Ban this user? They will not be able to log in.")) return;
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: !isBanned }),
    });
    router.refresh();
    setLoading(false);
  };

  const toggleRole = async () => {
    const newRole = role === "ADMIN" ? "CUSTOMER" : "ADMIN";
    if (!confirm(`Change role to ${newRole}?`)) return;
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex gap-1">
      <Button variant={isBanned ? "outline" : "destructive"} size="sm" onClick={toggleBan} disabled={loading}>
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : isBanned ? <ShieldCheck className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
        <span className="ml-1 text-xs">{isBanned ? "Unban" : "Ban"}</span>
      </Button>
      <Button variant="outline" size="sm" onClick={toggleRole} disabled={loading}>
        <span className="text-xs">{role === "ADMIN" ? "Demote" : "Promote"}</span>
      </Button>
    </div>
  );
}
