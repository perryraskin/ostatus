import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import type { PushStatusPayload } from "@/lib/types"

const sql = neon(process.env.DATABASE_URL!)

// Public endpoint - no auth required
// Services call this endpoint to report their status
// GET: Simple ping to report service is alive
// POST: Report status with optional error/degraded info
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return handlePush(token, { status: "ok" })
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  let payload: PushStatusPayload = { status: "ok" }

  try {
    const body = await request.json()
    payload = {
      status: body.status || "ok",
      message: body.message,
      metadata: body.metadata,
    }
  } catch {
    // If body parsing fails, treat as simple ping
  }

  return handlePush(token, payload)
}

async function handlePush(token: string, payload: PushStatusPayload) {
  try {
    // Find the endpoint with this push token
    const endpoints = await sql`
      SELECT e.id, e.service_id, e.name, e.expected_interval, e.grace_period,
             s.user_id, s.name as service_name
      FROM endpoints e
      JOIN services s ON e.service_id = s.id
      WHERE e.push_token = ${token}
    `

    if (endpoints.length === 0) {
      return NextResponse.json(
        { error: "Invalid token", message: "No endpoint found with this token" },
        { status: 404 },
      )
    }

    const endpoint = endpoints[0]
    const now = new Date()

    // Determine status based on payload
    let status: "operational" | "degraded" | "outage" = "operational"
    let isDegraded = false
    let errorMessage: string | null = null

    if (payload.status === "degraded") {
      status = "degraded"
      isDegraded = true
      errorMessage = payload.message || "Service reported degraded performance"
    } else if (payload.status === "error") {
      // Error with degraded flag means degraded, not outage
      status = "degraded"
      isDegraded = true
      errorMessage = payload.message || "Service reported an error"
    } else {
      // status === "ok" or undefined
      status = "operational"
      isDegraded = false
      errorMessage = null
    }

    // Update the endpoint status
    await sql`
      UPDATE endpoints 
      SET last_ping = ${now.toISOString()}, 
          status = ${status},
          is_degraded = ${isDegraded},
          error_message = ${errorMessage}
      WHERE id = ${endpoint.id}
    `

    // Update the service's aggregated status
    await updateServiceAggregatedStatus(endpoint.service_id)

    // Log to status history
    const historyId = generateId()
    await sql`
      INSERT INTO endpoint_status_history (id, endpoint_id, status, message, metadata, created_at)
      VALUES (${historyId}, ${endpoint.id}, ${status}, ${payload.message || null}, ${JSON.stringify(payload.metadata || {})}, ${now.toISOString()})
    `

    return NextResponse.json({
      success: true,
      message: "Status received",
      endpoint: endpoint.name,
      service: endpoint.service_name,
      status,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("Error processing push:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function updateServiceAggregatedStatus(serviceId: string) {
  // Get all endpoints for this service and calculate aggregated status
  const endpoints = await sql`
    SELECT status, expected_interval, grace_period, last_ping
    FROM endpoints
    WHERE service_id = ${serviceId}
  `

  let aggregatedStatus: "operational" | "degraded" | "outage" | "unknown" = "unknown"

  if (endpoints.length > 0) {
    const now = new Date()
    const statuses = endpoints.map((e) => {
      // Check if endpoint has timed out
      if (e.last_ping) {
        const lastPing = new Date(e.last_ping)
        const timeoutMs = (e.expected_interval + e.grace_period) * 1000
        const elapsed = now.getTime() - lastPing.getTime()

        if (elapsed > timeoutMs) {
          return "outage"
        }
      } else {
        // Never pinged - unknown
        return "unknown"
      }
      return e.status || "unknown"
    })

    if (statuses.every((s) => s === "operational")) {
      aggregatedStatus = "operational"
    } else if (statuses.some((s) => s === "outage")) {
      aggregatedStatus = "outage"
    } else if (statuses.some((s) => s === "degraded")) {
      aggregatedStatus = "degraded"
    }
  }

  await sql`
    UPDATE services 
    SET aggregated_status = ${aggregatedStatus}, last_updated = NOW()
    WHERE id = ${serviceId}
  `
}

function generateId() {
  return Math.random().toString(36).substring(2, 15)
}
