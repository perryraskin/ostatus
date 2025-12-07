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

// Default services for demo - added monitoringType and push example
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
        name: "Login Endpoint",
        monitoringType: "pull",
        url: "https://jsonplaceholder.typicode.com/users/1",
        method: "GET",
        interval: 30,
        timeout: 5000,
        successCriteria: [{ type: "status_code", operator: "equals", value: "200" }],
        failureCriteria: [{ type: "status_code", operator: "greater_than", value: "499" }],
        status: "operational",
        responseTime: 145,
      },
      {
        id: generateId(),
        name: "Token Refresh",
        monitoringType: "pull",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        method: "GET",
        interval: 60,
        timeout: 3000,
        successCriteria: [
          { type: "status_code", operator: "equals", value: "200" },
          { type: "response_time", operator: "less_than", value: "1000" },
        ],
        failureCriteria: [],
        status: "operational",
        responseTime: 89,
      },
    ],
  },
  {
    id: generateId(),
    name: "Scheduled Jobs",
    description: "Background tasks and cron jobs",
    category: "Background Services",
    aggregatedStatus: "operational",
    lastUpdated: new Date(),
    endpoints: [
      {
        id: generateId(),
        name: "Daily Backup Job",
        monitoringType: "push",
        pushToken: generatePushToken(),
        url: "",
        method: "GET",
        interval: 86400, // Expected every 24 hours
        gracePeriod: 3600, // 1 hour grace period
        timeout: 5000,
        successCriteria: [],
        failureCriteria: [],
        status: "operational",
        lastPing: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        id: generateId(),
        name: "Hourly Sync",
        monitoringType: "push",
        pushToken: generatePushToken(),
        url: "",
        method: "GET",
        interval: 3600, // Expected every hour
        gracePeriod: 300, // 5 minute grace period
        timeout: 5000,
        successCriteria: [],
        failureCriteria: [],
        status: "degraded",
        lastPing: new Date(Date.now() - 4200000), // 70 minutes ago (missed)
        errorMessage: "No ping received within expected interval",
      },
    ],
  },
  {
    id: generateId(),
    name: "Payment Gateway",
    description: "Payment processing and transaction management",
    category: "Core Services",
    aggregatedStatus: "degraded",
    lastUpdated: new Date(),
    endpoints: [
      {
        id: generateId(),
        name: "Process Payment",
        monitoringType: "pull",
        url: "https://jsonplaceholder.typicode.com/posts",
        method: "GET",
        interval: 15,
        timeout: 10000,
        successCriteria: [{ type: "status_code", operator: "equals", value: "200" }],
        failureCriteria: [],
        status: "degraded",
        responseTime: 890,
        errorMessage: "Response time exceeds threshold",
      },
    ],
  },
  {
    id: generateId(),
    name: "CDN & Static Assets",
    description: "Content delivery and static file hosting",
    category: "Infrastructure",
    aggregatedStatus: "operational",
    lastUpdated: new Date(),
    endpoints: [
      {
        id: generateId(),
        name: "Asset Server",
        monitoringType: "pull",
        url: "https://jsonplaceholder.typicode.com/albums/1",
        method: "GET",
        interval: 60,
        timeout: 5000,
        successCriteria: [{ type: "status_code", operator: "equals", value: "200" }],
        failureCriteria: [],
        status: "operational",
        responseTime: 45,
      },
    ],
  },
  {
    id: generateId(),
    name: "Database Cluster",
    description: "Primary database and read replicas",
    category: "Infrastructure",
    aggregatedStatus: "outage",
    lastUpdated: new Date(),
    endpoints: [
      {
        id: generateId(),
        name: "Primary DB",
        monitoringType: "pull",
        url: "https://httpstat.us/500",
        method: "GET",
        interval: 10,
        timeout: 3000,
        successCriteria: [{ type: "status_code", operator: "equals", value: "200" }],
        failureCriteria: [{ type: "status_code", operator: "greater_than", value: "499" }],
        status: "outage",
        responseTime: 0,
        errorMessage: "Connection refused",
      },
    ],
  },
]

// Calculate aggregated status from endpoints
export function calculateAggregatedStatus(endpoints: HealthCheckEndpoint[]): Service["aggregatedStatus"] {
  if (endpoints.length === 0) return "unknown"

  const statuses = endpoints.map((e) => e.status || "unknown")

  if (statuses.every((s) => s === "operational")) return "operational"
  if (statuses.some((s) => s === "outage")) return "outage"
  if (statuses.some((s) => s === "degraded")) return "degraded"
  return "unknown"
}
