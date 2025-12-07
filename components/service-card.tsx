"use client"

import { useState } from "react"
import type { Service, HealthCheckEndpoint } from "@/lib/types"
import { StatusBadge, StatusDot } from "./status-badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Settings, Trash2, Plus, Clock, Radio, Copy, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { isEndpointTimedOut } from "@/lib/health-check-store"

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (serviceId: string) => void
  onAddEndpoint: (serviceId: string) => void
  onEditEndpoint: (serviceId: string, endpoint: HealthCheckEndpoint) => void
  onDeleteEndpoint: (serviceId: string, endpointId: string) => void
}

export function ServiceCard({
  service,
  onEdit,
  onDelete,
  onAddEndpoint,
  onEditEndpoint,
  onDeleteEndpoint,
}: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border-4 border-black bg-card shadow-[8px_8px_0px_0px_#000] transition-all hover:shadow-[12px_12px_0px_0px_#000]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-4">
          <StatusDot status={service.aggregatedStatus} size="lg" />
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">{service.name}</h3>
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={service.aggregatedStatus} size="sm" />
          <span className="text-sm font-mono bg-muted px-2 py-1 border-2 border-black">
            {service.endpoints.length} endpoint{service.endpoints.length !== 1 ? "s" : ""}
          </span>
          {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t-4 border-black">
          {/* Service Actions */}
          <div className="flex gap-2 p-4 bg-muted border-b-4 border-black">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(service)
              }}
              className="border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Service
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAddEndpoint(service.id)
              }}
              className="border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Endpoint
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(service.id)
              }}
              className="border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-muted hover:bg-muted/80 ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>

          {/* Endpoints List */}
          <div className="divide-y-4 divide-black">
            {service.endpoints.map((endpoint) => (
              <EndpointRow
                key={endpoint.id}
                endpoint={endpoint}
                onEdit={() => onEditEndpoint(service.id, endpoint)}
                onDelete={() => onDeleteEndpoint(service.id, endpoint.id)}
              />
            ))}

            {service.endpoints.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p className="font-bold">No endpoints configured</p>
                <p className="text-sm mt-1">Add push endpoints to monitor this service</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EndpointRow({
  endpoint,
  onEdit,
  onDelete,
}: {
  endpoint: HealthCheckEndpoint
  onEdit: () => void
  onDelete: () => void
}) {
  const [copied, setCopied] = useState(false)
  const timedOut = isEndpointTimedOut(endpoint)

  const copyPingUrl = () => {
    if (endpoint.pushToken) {
      const pingUrl = `${window.location.origin}/api/push/${endpoint.pushToken}`
      navigator.clipboard.writeText(pingUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatLastPing = (lastPing?: Date) => {
    if (!lastPing) return "Never"
    const date = new Date(lastPing)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  // Determine display status (may be overridden by timeout)
  const displayStatus = timedOut ? "outage" : endpoint.status || "unknown"

  return (
    <div className="p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <StatusDot status={displayStatus} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{endpoint.name}</span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold border-2 border-black bg-amber-100 text-amber-800 flex items-center gap-1">
                <Radio className="w-3 h-3" />
                PUSH
              </span>
              {timedOut && (
                <span className="px-2 py-0.5 text-xs font-mono font-bold border-2 border-red-500 bg-red-100 text-red-700 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  TIMEOUT
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-mono text-muted-foreground truncate max-w-xs">
                /api/push/{endpoint.pushToken?.substring(0, 8)}...
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  copyPingUrl()
                }}
                className="h-6 w-6 p-0 border border-black hover:bg-muted"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            {endpoint.description && <p className="text-xs text-muted-foreground mt-1">{endpoint.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Metrics */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 font-mono">
              <Radio className="w-4 h-4" />
              <span
                className={cn(
                  displayStatus === "operational"
                    ? "text-emerald-500"
                    : displayStatus === "degraded"
                      ? "text-amber-500"
                      : "text-red-500",
                )}
              >
                {formatLastPing(endpoint.lastPing)}
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>every {formatInterval(endpoint.expectedInterval)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 border-2 border-black hover:bg-primary hover:text-primary-foreground"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 border-2 border-black hover:bg-muted"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {endpoint.errorMessage && (
        <div
          className={cn(
            "mt-2 p-2 border-2 text-sm font-mono",
            displayStatus === "outage"
              ? "bg-red-500/10 border-red-500 text-red-700"
              : "bg-amber-500/10 border-amber-500 text-amber-700",
          )}
        >
          {endpoint.errorMessage}
        </div>
      )}

      {/* Timing Info */}
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="px-2 py-0.5 text-xs font-mono bg-muted border border-black">
          Expected every {formatInterval(endpoint.expectedInterval)}
        </span>
        <span className="px-2 py-0.5 text-xs font-mono bg-muted border border-black">
          Grace: {formatInterval(endpoint.gracePeriod)}
        </span>
        <span className="px-2 py-0.5 text-xs font-mono bg-muted border border-black">
          Timeout: {formatInterval(endpoint.expectedInterval + endpoint.gracePeriod)}
        </span>
      </div>
    </div>
  )
}
