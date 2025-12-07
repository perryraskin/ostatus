export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD"

export type HealthCheckEndpoint = {
  id: string
  name: string
  description?: string
  // Push-specific fields
  pushToken: string // Unique token for this endpoint
  expectedInterval: number // How often we expect a ping (in seconds)
  gracePeriod: number // Extra time before marking as outage (in seconds)
  // Status tracking
  lastPing?: Date
  status?: "operational" | "degraded" | "outage" | "unknown"
  errorMessage?: string // Error message from the service
  isDegraded?: boolean // Whether service reported degraded state
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

export type PushStatusPayload = {
  status?: "ok" | "degraded" | "error" // Optional - defaults to "ok"
  message?: string // Optional error/status message
  metadata?: Record<string, unknown> // Optional additional data
}

export type HealthCheckResult = {
  endpointId: string
  timestamp: Date
  status: "success" | "failure"
  message?: string
}

export type PublicPage = {
  id: string
  slug: string
  title: string
  description: string
  logoUrl?: string
  customDomain?: string
  serviceIds: string[]
  isPublished: boolean
  showEndpointDetails: boolean
  primaryColor: string
  createdAt: Date
  updatedAt: Date
}
