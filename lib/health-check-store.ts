import type { Service, HealthCheckEndpoint } from "./types"

// Generate unique IDs
export const generateId = () => Math.random().toString(36).substring(2, 15)

export const generatePushToken = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export const defaultServices: Service[] = [
  {
    id: generateId(),
    name: "Authentication API",
    description: "User authentication and authorization services",
    category: "Core Services",
    aggregatedStatus: "operational",
    lastUpdated: new Date(),
    endpoints: [
      {
        id: generateId(),
        name: "Auth Service Heartbeat",
        description: "Pings every 60 seconds from auth microservice",
        pushToken: generatePushToken(),
        expectedInterval: 60,
        gracePeriod: 30,
        status: "operational",
        lastPing: new Date(Date.now() - 30000), // 30 seconds ago
      },
    ],
  },
  {
    id: generateId(),
    name: "Scheduled Jobs",
    description: "Background tasks and cron jobs",
    category: "Background Services",
    aggregatedStatus: "degraded",
    lastUpdated: new Date(),
    endpoints: [
      {
        id: generateId(),
        name: "Daily Backup Job",
        description: "Expected to run every 24 hours",
        pushToken: generatePushToken(),
        expectedInterval: 86400, // 24 hours
        gracePeriod: 3600, // 1 hour grace
        status: "operational",
        lastPing: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        id: generateId(),
        name: "Hourly Sync",
        description: "Syncs data every hour",
        pushToken: generatePushToken(),
        expectedInterval: 3600, // 1 hour
        gracePeriod: 300, // 5 min grace
        status: "degraded",
        isDegraded: true,
        lastPing: new Date(Date.now() - 4200000), // 70 minutes ago
        errorMessage: "Service reported degraded performance",
      },
    ],
  },
  {
    id: generateId(),
    name: "Payment Gateway",
    description: "Payment processing and transaction management",
    category: "Core Services",
    aggregatedStatus: "operational",
    lastUpdated: new Date(),
    endpoints: [
      {
        id: generateId(),
        name: "Payment Processor",
        description: "Heartbeat from payment service",
        pushToken: generatePushToken(),
        expectedInterval: 30,
        gracePeriod: 15,
        status: "operational",
        lastPing: new Date(Date.now() - 10000),
      },
    ],
  },
  {
    id: generateId(),
    name: "Email Service",
    description: "Transactional email delivery",
    category: "Infrastructure",
    aggregatedStatus: "outage",
    lastUpdated: new Date(),
    endpoints: [
      {
        id: generateId(),
        name: "Email Worker",
        description: "Email queue processor - expected every 5 minutes",
        pushToken: generatePushToken(),
        expectedInterval: 300,
        gracePeriod: 60,
        status: "outage",
        lastPing: new Date(Date.now() - 600000), // 10 minutes ago - missed
        errorMessage: "No ping received within expected interval",
      },
    ],
  },
  {
    id: generateId(),
    name: "Database Cluster",
    description: "Primary database monitoring",
    category: "Infrastructure",
    aggregatedStatus: "operational",
    lastUpdated: new Date(),
    endpoints: [
      {
        id: generateId(),
        name: "Primary DB Heartbeat",
        description: "Database health check every 10 seconds",
        pushToken: generatePushToken(),
        expectedInterval: 10,
        gracePeriod: 5,
        status: "operational",
        lastPing: new Date(Date.now() - 5000),
      },
      {
        id: generateId(),
        name: "Read Replica Heartbeat",
        description: "Replica sync check every 30 seconds",
        pushToken: generatePushToken(),
        expectedInterval: 30,
        gracePeriod: 15,
        status: "operational",
        lastPing: new Date(Date.now() - 20000),
      },
    ],
  },
]

// Calculate aggregated status from endpoints, considering timeouts
export function calculateAggregatedStatus(endpoints: HealthCheckEndpoint[]): Service["aggregatedStatus"] {
  if (endpoints.length === 0) return "unknown"

  const now = new Date()
  const statuses = endpoints.map((e) => {
    // Check if endpoint has timed out
    if (e.lastPing) {
      const lastPing = new Date(e.lastPing)
      const timeoutMs = (e.expectedInterval + e.gracePeriod) * 1000
      const elapsed = now.getTime() - lastPing.getTime()

      if (elapsed > timeoutMs) {
        return "outage"
      }
    } else {
      // Never pinged
      return "unknown"
    }
    return e.status || "unknown"
  })

  if (statuses.every((s) => s === "operational")) return "operational"
  if (statuses.some((s) => s === "outage")) return "outage"
  if (statuses.some((s) => s === "degraded")) return "degraded"
  return "unknown"
}

// Check if an endpoint is timed out
export function isEndpointTimedOut(endpoint: HealthCheckEndpoint): boolean {
  if (!endpoint.lastPing) return true // Never pinged = timed out

  const now = new Date()
  const lastPing = new Date(endpoint.lastPing)
  const timeoutMs = (endpoint.expectedInterval + endpoint.gracePeriod) * 1000
  const elapsed = now.getTime() - lastPing.getTime()

  return elapsed > timeoutMs
}
