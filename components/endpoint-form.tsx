"use client"

import type React from "react"

import { useState } from "react"
import type { HealthCheckEndpoint, HttpMethod, ResponseCriteria, MonitoringType } from "@/lib/types"
import { generateId, generatePushToken } from "@/lib/health-check-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Trash2, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface EndpointFormProps {
  endpoint?: HealthCheckEndpoint
  onSave: (endpoint: HealthCheckEndpoint) => void
  onCancel: () => void
}

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"]
const CRITERIA_TYPES = ["status_code", "response_body", "response_time", "json_field"] as const
const OPERATORS = ["equals", "contains", "not_contains", "greater_than", "less_than", "regex"] as const

export function EndpointForm({ endpoint, onSave, onCancel }: EndpointFormProps) {
  const [name, setName] = useState(endpoint?.name || "")
  const [monitoringType, setMonitoringType] = useState<MonitoringType>(endpoint?.monitoringType || "pull")
  const [pushToken] = useState(endpoint?.pushToken || generatePushToken())
  const [url, setUrl] = useState(endpoint?.url || "")
  const [method, setMethod] = useState<HttpMethod>(endpoint?.method || "GET")
  const [interval, setInterval] = useState(endpoint?.interval || 30)
  const [timeout, setTimeout] = useState(endpoint?.timeout || 5000)
  const [gracePeriod, setGracePeriod] = useState(endpoint?.gracePeriod || 60)
  const [successCriteria, setSuccessCriteria] = useState<ResponseCriteria[]>(
    endpoint?.successCriteria || [{ type: "status_code", operator: "equals", value: "200" }],
  )
  const [failureCriteria, setFailureCriteria] = useState<ResponseCriteria[]>(endpoint?.failureCriteria || [])
  const [headersText, setHeadersText] = useState(endpoint?.headers ? JSON.stringify(endpoint.headers, null, 2) : "")
  const [body, setBody] = useState(endpoint?.body || "")
  const [copied, setCopied] = useState(false)

  const addCriteria = (type: "success" | "failure") => {
    const newCriteria: ResponseCriteria = {
      type: "status_code",
      operator: "equals",
      value: "",
    }
    if (type === "success") {
      setSuccessCriteria([...successCriteria, newCriteria])
    } else {
      setFailureCriteria([...failureCriteria, newCriteria])
    }
  }

  const updateCriteria = (type: "success" | "failure", index: number, field: keyof ResponseCriteria, value: string) => {
    const criteria = type === "success" ? [...successCriteria] : [...failureCriteria]
    criteria[index] = { ...criteria[index], [field]: value }
    if (type === "success") {
      setSuccessCriteria(criteria)
    } else {
      setFailureCriteria(criteria)
    }
  }

  const removeCriteria = (type: "success" | "failure", index: number) => {
    if (type === "success") {
      setSuccessCriteria(successCriteria.filter((_, i) => i !== index))
    } else {
      setFailureCriteria(failureCriteria.filter((_, i) => i !== index))
    }
  }

  const copyPingUrl = () => {
    const pingUrl = `${window.location.origin}/api/ping/${pushToken}`
    navigator.clipboard.writeText(pingUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let headers: Record<string, string> | undefined
    try {
      headers = headersText ? JSON.parse(headersText) : undefined
    } catch {
      headers = undefined
    }

    const newEndpoint: HealthCheckEndpoint = {
      id: endpoint?.id || generateId(),
      name,
      monitoringType,
      pushToken: monitoringType === "push" ? pushToken : undefined,
      url: monitoringType === "pull" ? url : "",
      method,
      headers: monitoringType === "pull" ? headers : undefined,
      body: monitoringType === "pull" && body ? body : undefined,
      interval,
      timeout,
      gracePeriod: monitoringType === "push" ? gracePeriod : undefined,
      successCriteria: monitoringType === "pull" ? successCriteria : [],
      failureCriteria: monitoringType === "pull" ? failureCriteria : [],
      status: endpoint?.status || "unknown",
    }

    onSave(newEndpoint)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_#000] w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-muted">
          <h2 className="text-xl font-black uppercase">{endpoint ? "Edit Endpoint" : "Add Health Check Endpoint"}</h2>
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
          <div className="space-y-2">
            <Label className="font-bold uppercase">Monitoring Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMonitoringType("pull")}
                className={cn(
                  "p-4 border-4 border-black text-left transition-all",
                  monitoringType === "pull"
                    ? "bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_#000]"
                    : "bg-card hover:bg-muted",
                )}
              >
                <span className="font-black block">PULL</span>
                <span className="text-sm opacity-80">Actively check endpoint health</span>
              </button>
              <button
                type="button"
                onClick={() => setMonitoringType("push")}
                className={cn(
                  "p-4 border-4 border-black text-left transition-all",
                  monitoringType === "push"
                    ? "bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_#000]"
                    : "bg-card hover:bg-muted",
                )}
              >
                <span className="font-black block">PUSH</span>
                <span className="text-sm opacity-80">Receive pings from cron jobs</span>
              </button>
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
              placeholder={monitoringType === "push" ? "e.g., Daily Backup Job" : "e.g., Login Endpoint"}
              required
              className="border-2 border-black font-mono"
            />
          </div>

          {monitoringType === "push" && (
            <div className="space-y-2">
              <Label className="font-bold uppercase">Ping URL</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Have your cron job or service ping this URL to report it&apos;s alive
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/ping/${pushToken}`}
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
          )}

          {/* Pull-specific: URL and Method */}
          {monitoringType === "pull" && (
            <>
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="url" className="font-bold uppercase">
                    URL
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/health"
                    required
                    className="border-2 border-black font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method" className="font-bold uppercase">
                    Method
                  </Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
                    <SelectTrigger className="border-2 border-black w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-black">
                      {HTTP_METHODS.map((m) => (
                        <SelectItem key={m} value={m} className="font-mono font-bold">
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Timing - different labels for push vs pull */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interval" className="font-bold uppercase">
                {monitoringType === "push" ? "Expected Interval (seconds)" : "Check Interval (seconds)"}
              </Label>
              <Input
                id="interval"
                type="number"
                min={5}
                value={interval}
                onChange={(e) => setInterval(Number.parseInt(e.target.value))}
                className="border-2 border-black font-mono"
              />
              {monitoringType === "push" && (
                <p className="text-xs text-muted-foreground">How often do you expect a ping?</p>
              )}
            </div>

            {monitoringType === "push" ? (
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
                <p className="text-xs text-muted-foreground">Extra time before marking as down</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="timeout" className="font-bold uppercase">
                  Timeout (ms)
                </Label>
                <Input
                  id="timeout"
                  type="number"
                  min={100}
                  value={timeout}
                  onChange={(e) => setTimeout(Number.parseInt(e.target.value))}
                  className="border-2 border-black font-mono"
                />
              </div>
            )}
          </div>

          {/* Pull-specific: Headers and Body */}
          {monitoringType === "pull" && (
            <>
              {/* Headers */}
              <div className="space-y-2">
                <Label htmlFor="headers" className="font-bold uppercase">
                  Headers (JSON)
                </Label>
                <textarea
                  id="headers"
                  value={headersText}
                  onChange={(e) => setHeadersText(e.target.value)}
                  placeholder={'{\n  "Authorization": "Bearer token"\n}'}
                  rows={3}
                  className="w-full border-2 border-black p-2 font-mono text-sm resize-none"
                />
              </div>

              {/* Body */}
              {["POST", "PUT", "PATCH"].includes(method) && (
                <div className="space-y-2">
                  <Label htmlFor="body" className="font-bold uppercase">
                    Request Body
                  </Label>
                  <textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={'{\n  "key": "value"\n}'}
                    rows={3}
                    className="w-full border-2 border-black p-2 font-mono text-sm resize-none"
                  />
                </div>
              )}

              {/* Success Criteria */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-bold uppercase text-emerald-600">Success Criteria</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addCriteria("success")}
                    className="border-2 border-black bg-emerald-100 hover:bg-emerald-200"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                {successCriteria.map((criteria, idx) => (
                  <CriteriaRow
                    key={idx}
                    criteria={criteria}
                    onUpdate={(field, value) => updateCriteria("success", idx, field, value)}
                    onRemove={() => removeCriteria("success", idx)}
                    variant="success"
                  />
                ))}
              </div>

              {/* Failure Criteria */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-bold uppercase text-red-600">Failure Criteria</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addCriteria("failure")}
                    className="border-2 border-black bg-red-100 hover:bg-red-200"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                {failureCriteria.map((criteria, idx) => (
                  <CriteriaRow
                    key={idx}
                    criteria={criteria}
                    onUpdate={(field, value) => updateCriteria("failure", idx, field, value)}
                    onRemove={() => removeCriteria("failure", idx)}
                    variant="failure"
                  />
                ))}
              </div>
            </>
          )}

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

function CriteriaRow({
  criteria,
  onUpdate,
  onRemove,
  variant,
}: {
  criteria: ResponseCriteria
  onUpdate: (field: keyof ResponseCriteria, value: string) => void
  onRemove: () => void
  variant: "success" | "failure"
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_1fr_1fr_auto] gap-2 p-2 border-2 border-black",
        variant === "success" ? "bg-emerald-50" : "bg-red-50",
      )}
    >
      <Select value={criteria.type} onValueChange={(v) => onUpdate("type", v)}>
        <SelectTrigger className="border-2 border-black text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-2 border-black">
          {CRITERIA_TYPES.map((t) => (
            <SelectItem key={t} value={t} className="font-mono text-xs">
              {t.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={criteria.operator} onValueChange={(v) => onUpdate("operator", v)}>
        <SelectTrigger className="border-2 border-black text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-2 border-black">
          {OPERATORS.map((o) => (
            <SelectItem key={o} value={o} className="font-mono text-xs">
              {o.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={criteria.value}
        onChange={(e) => onUpdate("value", e.target.value)}
        placeholder="Value"
        className="border-2 border-black font-mono text-xs"
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-9 w-9 p-0 border-2 border-black hover:bg-red-200"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
