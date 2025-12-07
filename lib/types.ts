export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD"

export type MonitoringType = "pull" | "push"

export type ResponseCriteria = {
  type: "status_code" | "response_body" | "response_time" | "json_field"
  operator: "equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "regex"
  value: string
}

export type HealthCheckEndpoint = {
  id: string
  name: string
  monitoringType: MonitoringType
  pushToken?: string // Unique token for push endpoints
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  body?: string
  interval: number // in seconds (for pull: check interval, for push: expected ping interval)
  timeout: number // in milliseconds
  gracePeriod?: number // seconds after interval before marking as outage (for push)
  successCriteria: ResponseCriteria[]
  failureCriteria: ResponseCriteria[]
  lastCheck?: Date
  lastPing?: Date // For push endpoints - when we last received a ping
  status?: "operational" | "degraded" | "outage" | "unknown"
  responseTime?: number
  errorMessage?: string
}

export type Service = {
  id: string
  name: string
  description: string
  category: string
  endpoints: HealthCheckEndpoint[]
  aggregatedStatus: "operational" | "degraded" | "outage" | "unknown"
  lastUpdated: Date
}

export type HealthCheckResult = {
  endpointId: string
  timestamp: Date
  status: "success" | "failure"
  responseTime: number
  statusCode?: number
  errorMessage?: string
}
