export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD"

export type ResponseCriteria = {
  type: "status_code" | "response_body" | "response_time" | "json_field"
  operator: "equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "regex"
  value: string
}

export type HealthCheckEndpoint = {
  id: string
  name: string
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  body?: string
  interval: number // in seconds
  timeout: number // in milliseconds
  successCriteria: ResponseCriteria[]
  failureCriteria: ResponseCriteria[]
  lastCheck?: Date
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
