"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyData {
  month: string;
  revenue: number;
}

interface StatusData {
  status: string;
  count: number;
}

interface ChartData {
  monthlyData: MonthlyData[];
  statusData: StatusData[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
  REFUNDED: "#6b7280",
};

export default function DashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard/charts")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch chart data");
        return res.json();
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent><div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Order Status Distribution</CardTitle></CardHeader>
          <CardContent><div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div></CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error || "Failed to load charts"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.monthlyData.map((d) => d.revenue), 1);
  const totalOrders = data.statusData.reduce((sum, s) => sum + s.count, 0);
  const maxStatusCount = Math.max(...data.statusData.map((s) => s.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Monthly Revenue Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1.5" style={{ height: "220px" }}>
            {data.monthlyData.map((d) => {
              const heightPct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
              return (
                <div
                  key={d.month}
                  className="flex-1 flex flex-col items-center justify-end h-full group"
                >
                  {/* Tooltip on hover */}
                  <div className="text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
                    {"\u20AC"}{d.revenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  {/* Bar */}
                  <div
                    className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
                    style={{
                      height: `${Math.max(heightPct, 2)}%`,
                      backgroundColor: d.revenue > 0 ? "#3b82f6" : "#e5e7eb",
                      minHeight: "4px",
                    }}
                  />
                  {/* Label */}
                  <div className="text-[10px] text-muted-foreground mt-1.5 whitespace-nowrap">
                    {d.month}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Y-axis summary */}
          <div className="flex justify-between mt-3 text-xs text-muted-foreground border-t pt-2">
            <span>Max: {"\u20AC"}{maxRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            <span>
              Total: {"\u20AC"}
              {data.monthlyData
                .reduce((s, d) => s + d.revenue, 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Order Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.statusData.length === 0 && (
              <p className="text-muted-foreground text-sm">No orders yet</p>
            )}
            {data.statusData
              .sort((a, b) => b.count - a.count)
              .map((s) => {
                const pct = totalOrders > 0 ? (s.count / totalOrders) * 100 : 0;
                const widthPct = (s.count / maxStatusCount) * 100;
                const color = STATUS_COLORS[s.status] || "#6b7280";
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-medium">{s.status}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {s.count} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: color,
                          minWidth: s.count > 0 ? "8px" : "0px",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          {totalOrders > 0 && (
            <div className="text-xs text-muted-foreground border-t pt-2 mt-4">
              Total orders: {totalOrders}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
