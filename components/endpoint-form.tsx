"use client"

import type React from "react"
import { useState } from "react"
import type { HealthCheckEndpoint } from "@/lib/types"
import { generateId, generatePushToken } from "@/lib/health-check-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Copy, Check, Info } from "lucide-react"

interface EndpointFormProps {
  endpoint?: HealthCheckEndpoint
  onSave: (endpoint: HealthCheckEndpoint) => void
  onCancel: () => void
}

export function EndpointForm({ endpoint, onSave, onCancel }: EndpointFormProps) {
  const [name, setName] = useState(endpoint?.name || "")
  const [description, setDescription] = useState(endpoint?.description || "")
  const [pushToken] = useState(endpoint?.pushToken || generatePushToken())
  const [expectedInterval, setExpectedInterval] = useState(endpoint?.expectedInterval || 60)
  const [gracePeriod, setGracePeriod] = useState(endpoint?.gracePeriod || 60)
  const [copied, setCopied] = useState(false)

  const copyPingUrl = () => {
    const pingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/push/${pushToken}`
    navigator.clipboard.writeText(pingUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newEndpoint: HealthCheckEndpoint = {
      id: endpoint?.id || generateId(),
      name,
      description: description || undefined,
      pushToken,
      expectedInterval,
      gracePeriod,
      status: endpoint?.status || "unknown",
      lastPing: endpoint?.lastPing,
      errorMessage: endpoint?.errorMessage,
      isDegraded: endpoint?.isDegraded,
    }

    onSave(newEndpoint)
  }

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`
    return `${Math.floor(seconds / 86400)} days`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_#000] w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-muted">
          <h2 className="text-xl font-black uppercase">{endpoint ? "Edit Endpoint" : "Add Push Endpoint"}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 border-2 border-black bg-card hover:bg-black hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Info Banner */}
          <div className="flex gap-3 p-4 bg-blue-50 border-4 border-blue-500">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-blue-800">Push-based Monitoring</p>
              <p className="text-blue-700 mt-1">
                Your service will call our API to report its status. If we don&apos;t receive a ping within the expected
                interval + grace period, the service will be marked as down.
              </p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-bold uppercase">
              Endpoint Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Backup Job, API Heartbeat"
              required
              className="border-2 border-black font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-bold uppercase">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this endpoint monitors"
              className="border-2 border-black font-mono resize-none"
              rows={2}
            />
          </div>

          {/* Push URL */}
          <div className="space-y-2">
            <Label className="font-bold uppercase">Push URL</Label>
            <p className="text-sm text-muted-foreground mb-2">Your service should call this URL to report its status</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/push/${pushToken}`}
                className="border-2 border-black font-mono text-sm bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                onClick={copyPingUrl}
                className="border-2 border-black shrink-0 bg-transparent"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* API Usage Examples */}
          <div className="space-y-2">
            <Label className="font-bold uppercase">API Usage</Label>
            <div className="space-y-3">
              <div className="p-3 bg-muted border-2 border-black">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Simple Ping (Service OK)</p>
                <code className="text-xs font-mono break-all">
                  curl {typeof window !== "undefined" ? window.location.origin : ""}/api/push/{pushToken}
                </code>
              </div>
              <div className="p-3 bg-amber-50 border-2 border-amber-500">
                <p className="text-xs font-bold uppercase text-amber-700 mb-1">Report Degraded Status</p>
                <code className="text-xs font-mono break-all">
                  {`curl -X POST -H "Content-Type: application/json" -d '{"status":"degraded","message":"High latency detected"}' ${typeof window !== "undefined" ? window.location.origin : ""}/api/push/${pushToken}`}
                </code>
              </div>
              <div className="p-3 bg-red-50 border-2 border-red-500">
                <p className="text-xs font-bold uppercase text-red-700 mb-1">Report Error (Degraded)</p>
                <code className="text-xs font-mono break-all">
                  {`curl -X POST -H "Content-Type: application/json" -d '{"status":"error","message":"Database connection failed"}' ${typeof window !== "undefined" ? window.location.origin : ""}/api/push/${pushToken}`}
                </code>
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedInterval" className="font-bold uppercase">
                Expected Interval (seconds)
              </Label>
              <Input
                id="expectedInterval"
                type="number"
                min={5}
                value={expectedInterval}
                onChange={(e) => setExpectedInterval(Number.parseInt(e.target.value))}
                className="border-2 border-black font-mono"
              />
              <p className="text-xs text-muted-foreground">
                How often should we expect a ping? ({formatInterval(expectedInterval)})
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gracePeriod" className="font-bold uppercase">
                Grace Period (seconds)
              </Label>
              <Input
                id="gracePeriod"
                type="number"
                min={0}
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number.parseInt(e.target.value))}
                className="border-2 border-black font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Extra time before marking as outage ({formatInterval(gracePeriod)})
              </p>
            </div>
          </div>

          {/* Timeout Summary */}
          <div className="p-3 bg-muted border-2 border-black">
            <p className="text-sm">
              <span className="font-bold">Timeout:</span> If no ping is received within{" "}
              <span className="font-mono font-bold">{formatInterval(expectedInterval + gracePeriod)}</span>, this
              endpoint will be marked as <span className="text-red-500 font-bold">OUTAGE</span>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t-2 border-black">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {endpoint ? "Update" : "Create"} Endpoint
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
