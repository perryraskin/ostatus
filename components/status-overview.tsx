"use client"

import type { Service } from "@/lib/types"
import { StatusBadge } from "./status-badge"

interface StatusOverviewProps {
  services: Service[]
}

export function StatusOverview({ services }: StatusOverviewProps) {
  const operational = services.filter((s) => s.aggregatedStatus === "operational").length
  const degraded = services.filter((s) => s.aggregatedStatus === "degraded").length
  const outage = services.filter((s) => s.aggregatedStatus === "outage").length
  const totalEndpoints = services.reduce((acc, s) => acc + s.endpoints.length, 0)

  const overallStatus = outage > 0 ? "outage" : degraded > 0 ? "degraded" : "operational"

  return (
    <div className="border-4 border-black bg-card shadow-[8px_8px_0px_0px_#000] p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Overall Status */}
        <div className="flex items-center gap-4">
          <div
            className={`w-20 h-20 border-4 border-black flex items-center justify-center ${
              overallStatus === "operational"
                ? "bg-emerald-500"
                : overallStatus === "degraded"
                  ? "bg-amber-400"
                  : "bg-red-500"
            }`}
          >
            <span className={`text-4xl ${overallStatus === "degraded" ? "text-black" : "text-white"}`}>
              {overallStatus === "operational" ? "✓" : overallStatus === "degraded" ? "!" : "✗"}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase">System Status</h2>
            <StatusBadge status={overallStatus} size="lg" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Services" value={services.length} variant="primary" />
          <StatCard label="Operational" value={operational} variant="success" />
          <StatCard label="Degraded" value={degraded} variant="warning" />
          <StatCard label="Outages" value={outage} variant="danger" />
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="mt-6 pt-4 border-t-4 border-black">
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="font-bold uppercase">Monitoring:</span>
          <span>
            {totalEndpoints} endpoints across {services.length} services
          </span>
          <span className="ml-auto text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant: "primary" | "success" | "warning" | "danger"
}) {
  const variantClasses = {
    primary: "bg-primary text-primary-foreground",
    success: "bg-emerald-500 text-white",
    warning: "bg-amber-400 text-black",
    danger: "bg-red-500 text-white",
  }

  return (
    <div className={`border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_#000] ${variantClasses[variant]}`}>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-xs font-bold uppercase">{label}</div>
    </div>
  )
}
