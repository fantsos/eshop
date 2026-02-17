import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncFeed } from "@/lib/feed-sync";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const feeds = await prisma.supplierFeed.findMany({
    where: { isActive: true },
  });

  const dueFeeds = feeds.filter((feed) => {
    if (!feed.lastSyncAt) return true;
    const nextSync = new Date(feed.lastSyncAt.getTime() + feed.syncInterval * 60 * 60 * 1000);
    return nextSync <= now;
  });

  const results: Record<string, any> = {};

  for (const feed of dueFeeds) {
    try {
      results[feed.name] = await syncFeed(feed.id);
    } catch (error: any) {
      results[feed.name] = { error: error.message };
    }
  }

  return NextResponse.json({
    synced: Object.keys(results).length,
    total: feeds.length,
    results,
  });
}
