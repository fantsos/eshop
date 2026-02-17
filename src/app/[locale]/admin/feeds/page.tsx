"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Plus, RefreshCw, Trash2, Rss } from "lucide-react";

interface Feed {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  syncInterval: number;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncMessage: string | null;
  _count: { products: number };
}

export default function AdminFeedsPage() {
  const pathname = usePathname();
  const prefix = pathname.startsWith("/en") ? "/en" : "";
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", url: "", syncInterval: "6", productPath: "" });

  const loadFeeds = () => {
    fetch("/api/admin/feeds").then((r) => r.json()).then(setFeeds);
  };

  useEffect(() => { loadFeeds(); }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/admin/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        url: form.url,
        syncInterval: parseInt(form.syncInterval),
        productPath: form.productPath,
        fieldMapping: {},
      }),
    });
    if (res.ok) {
      toast({ title: "Feed created" });
      setOpen(false);
      setForm({ name: "", url: "", syncInterval: "6", productPath: "" });
      loadFeeds();
    } else {
      const data = await res.json();
      toast({ title: "Error", description: data.error, variant: "destructive" });
    }
  };

  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      const res = await fetch(`/api/admin/feeds/${id}/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Sync completed", description: `Created: ${data.created}, Updated: ${data.updated}, Deactivated: ${data.deactivated}` });
      } else {
        toast({ title: "Sync failed", description: data.error, variant: "destructive" });
      }
      loadFeeds();
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this feed? Products will be kept but unlinked.")) return;
    const res = await fetch(`/api/admin/feeds/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Feed deleted" });
      loadFeeds();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Rss className="h-8 w-8" /> Supplier Feeds
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Feed</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Supplier Feed</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Supplier ABC" />
              </div>
              <div>
                <Label>XML URL</Label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://supplier.com/feed.xml" />
              </div>
              <div>
                <Label>Product Path</Label>
                <Input value={form.productPath} onChange={(e) => setForm({ ...form, productPath: e.target.value })} placeholder="e.g. store.products.product" />
              </div>
              <div>
                <Label>Sync Interval (hours)</Label>
                <Input type="number" value={form.syncInterval} onChange={(e) => setForm({ ...form, syncInterval: e.target.value })} />
              </div>
              <Button onClick={handleCreate} className="w-full">Create Feed</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4">Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Products</th>
                <th className="p-4">Interval</th>
                <th className="p-4">Last Sync</th>
                <th className="p-4">Last Result</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeds.map((feed) => (
                <tr key={feed.id} className="border-b">
                  <td className="p-4">
                    <Link href={`${prefix}/admin/feeds/${feed.id}`} className="font-medium hover:underline">
                      {feed.name}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{feed.url}</div>
                  </td>
                  <td className="p-4">
                    <Badge variant={feed.isActive ? "default" : "secondary"}>
                      {feed.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4">{feed._count.products}</td>
                  <td className="p-4">{feed.syncInterval}h</td>
                  <td className="p-4 text-sm">
                    {feed.lastSyncAt ? new Date(feed.lastSyncAt).toLocaleString() : "Never"}
                  </td>
                  <td className="p-4">
                    {feed.lastSyncStatus && (
                      <Badge variant={feed.lastSyncStatus === "success" ? "default" : "destructive"}>
                        {feed.lastSyncStatus}
                      </Badge>
                    )}
                    {feed.lastSyncMessage && (
                      <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">{feed.lastSyncMessage}</div>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleSync(feed.id)} disabled={syncing === feed.id}>
                      <RefreshCw className={`h-4 w-4 mr-1 ${syncing === feed.id ? "animate-spin" : ""}`} /> Sync
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(feed.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {feeds.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No feeds configured. Click "Add Feed" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
