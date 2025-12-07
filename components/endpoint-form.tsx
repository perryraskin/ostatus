"use client"

import type React from "react"

import { useState } from "react"
import type { HealthCheckEndpoint, HttpMethod, ResponseCriteria } from "@/lib/types"
import { generateId } from "@/lib/health-check-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Trash2 } from "lucide-react"
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
  const [url, setUrl] = useState(endpoint?.url || "")
  const [method, setMethod] = useState<HttpMethod>(endpoint?.method || "GET")
  const [interval, setInterval] = useState(endpoint?.interval || 30)
  const [timeout, setTimeout] = useState(endpoint?.timeout || 5000)
  const [successCriteria, setSuccessCriteria] = useState<ResponseCriteria[]>(
    endpoint?.successCriteria || [{ type: "status_code", operator: "equals", value: "200" }],
  )
  const [failureCriteria, setFailureCriteria] = useState<ResponseCriteria[]>(endpoint?.failureCriteria || [])
  const [headersText, setHeadersText] = useState(endpoint?.headers ? JSON.stringify(endpoint.headers, null, 2) : "")
  const [body, setBody] = useState(endpoint?.body || "")

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
      url,
      method,
      headers,
      body: body || undefined,
      interval,
      timeout,
      successCriteria,
      failureCriteria,
      status: endpoint?.status || "unknown",
    }

    onSave(newEndpoint)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_#000] w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-secondary">
          <h2 className="text-xl font-black uppercase text-secondary-foreground">
            {endpoint ? "Edit Endpoint" : "Add Health Check Endpoint"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 border-2 border-black bg-card hover:bg-primary hover:text-primary-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold uppercase">
                Endpoint Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Login Endpoint"
                required
                className="border-2 border-black font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method" className="font-bold uppercase">
                Method
              </Label>
              <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
                <SelectTrigger className="border-2 border-black">
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

          {/* Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interval" className="font-bold uppercase">
                Check Interval (seconds)
              </Label>
              <Input
                id="interval"
                type="number"
                min={5}
                value={interval}
                onChange={(e) => setInterval(Number.parseInt(e.target.value))}
                className="border-2 border-black font-mono"
              />
            </div>

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
          </div>

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
              <Label className="font-bold uppercase text-[#00cc00]">Success Criteria</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCriteria("success")}
                className="border-2 border-black bg-[#00cc00]/20 hover:bg-[#00cc00]/40"
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
              <Label className="font-bold uppercase text-primary">Failure Criteria</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCriteria("failure")}
                className="border-2 border-black bg-primary/20 hover:bg-primary/40"
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
              className="flex-1 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-accent text-accent-foreground hover:bg-accent/90"
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
        variant === "success" ? "bg-[#00cc00]/10" : "bg-primary/10",
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
        className="h-9 w-9 p-0 border-2 border-black hover:bg-primary hover:text-primary-foreground"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
