"use client"

import useSWR from "swr"
import type { Service } from "@/lib/types"
import { StatusBadge, StatusDot } from "./status-badge"
import { RefreshCw, Clock, Zap, Radio, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PublicStatusViewProps {
  slug: string
}

export function PublicStatusView({ slug }: PublicStatusViewProps) {
  const { data, error, isLoading } = useSWR(`/api/status/${slug}`, fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-black uppercase">Loading Status...</h3>
        </div>
      </div>
    )
  }

  if (error || !data || data.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="border-4 border-black p-12 text-center bg-card shadow-[8px_8px_0px_0px_#000] max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-black uppercase mb-2">Page Not Found</h3>
          <p className="text-muted-foreground">This status page doesn't exist or is not published yet.</p>
        </div>
      </div>
    )
  }

  const { page, services } = data
  const primaryColor = page.primaryColor || "#3b82f6"

  return (
    <div className="min-h-screen bg-background">
      {/* Apply primary color via CSS variable */}
      <style jsx global>{`
        :root {
          --public-primary: ${primaryColor};
        }
      `}</style>

      {/* Header */}
      <header className="border-b-4 border-black bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center text-center">
            {page.logoUrl && (
              <img src={page.logoUrl || "/placeholder.svg"} alt="Logo" className="h-16 mb-4 object-contain" />
            )}
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">{page.title}</h1>
            {page.description && <p className="text-muted-foreground mt-2 max-w-2xl">{page.description}</p>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overall Status */}
        <PublicStatusOverview services={services} primaryColor={primaryColor} />

        {/* Services */}
        {services.length > 0 ? (
          <div className="space-y-4">
            {services.map((service: Service) => (
              <PublicServiceCard key={service.id} service={service} showEndpoints={page.showEndpointDetails} />
            ))}
          </div>
        ) : (
          <div className="border-4 border-black p-12 text-center bg-card shadow-[8px_8px_0px_0px_#000]">
            <div className="text-6xl mb-4">📡</div>
            <h3 className="text-xl font-black uppercase">No Services Configured</h3>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-muted mt-auto">
        <div className="container mx-auto px-4 py-4 text-center font-mono text-sm">
          <span className="font-bold">Auto-refresh:</span> Every 30 seconds •
          <span className="font-bold ml-2">Last updated:</span> {new Date().toLocaleTimeString()}
        </div>
      </footer>
    </div>
  )
}

function PublicStatusOverview({
  services,
  primaryColor,
}: {
  services: Service[]
  primaryColor: string
}) {
  const operational = services.filter((s) => s.aggregatedStatus === "operational").length
  const degraded = services.filter((s) => s.aggregatedStatus === "degraded").length
  const outage = services.filter((s) => s.aggregatedStatus === "outage").length

  const overallStatus = outage > 0 ? "outage" : degraded > 0 ? "degraded" : "operational"

  return (
    <div className="border-4 border-black bg-card shadow-[8px_8px_0px_0px_#000] p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
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
          <div
            className="border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_#000] text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="text-3xl font-black">{services.length}</div>
            <div className="text-xs font-bold uppercase">Total Services</div>
          </div>
          <div className="border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_#000] bg-emerald-500 text-white">
            <div className="text-3xl font-black">{operational}</div>
            <div className="text-xs font-bold uppercase">Operational</div>
          </div>
          <div className="border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_#000] bg-amber-400 text-black">
            <div className="text-3xl font-black">{degraded}</div>
            <div className="text-xs font-bold uppercase">Degraded</div>
          </div>
          <div className="border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_#000] bg-red-500 text-white">
            <div className="text-3xl font-black">{outage}</div>
            <div className="text-xs font-bold uppercase">Outages</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PublicServiceCard({
  service,
  showEndpoints,
}: {
  service: Service
  showEndpoints: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border-4 border-black bg-card shadow-[8px_8px_0px_0px_#000]">
      <div
        className={`flex items-center justify-between p-4 ${showEndpoints ? "cursor-pointer" : ""}`}
        onClick={() => showEndpoints && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <StatusDot status={service.aggregatedStatus} size="lg" />
          <div>
            <h3 className="text-xl font-black uppercase">{service.name}</h3>
            {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={service.aggregatedStatus} size="sm" />
          {showEndpoints && service.endpoints.length > 0 && (
            <>
              <span className="text-sm font-mono bg-muted px-2 py-1 border-2 border-black">
                {service.endpoints.length} endpoint{service.endpoints.length !== 1 ? "s" : ""}
              </span>
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </>
          )}
        </div>
      </div>

      {showEndpoints && isExpanded && service.endpoints.length > 0 && (
        <div className="border-t-4 border-black divide-y-2 divide-black">
          {service.endpoints.map((endpoint) => (
            <div key={endpoint.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status={endpoint.status || "unknown"} />
                <div>
                  <span className="font-bold">{endpoint.name}</span>
                  {endpoint.monitoringType === "push" && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-mono border border-black bg-amber-100 text-amber-800">
                      <Radio className="w-3 h-3 inline mr-1" />
                      PUSH
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-mono">
                {endpoint.monitoringType === "push" ? (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {endpoint.lastPing ? new Date(endpoint.lastPing).toLocaleTimeString() : "Never"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    {endpoint.responseTime ? `${endpoint.responseTime}ms` : "—"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
