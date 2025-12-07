import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

export async function POST(request: Request) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, serviceId, name, description, pushToken, expectedInterval = 60, gracePeriod = 60 } = body

    const serviceCheck = await sql`SELECT id FROM services WHERE id = ${serviceId} AND user_id = ${user.id}`
    if (serviceCheck.length === 0) {
      return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 404 })
    }

    await sql`
      INSERT INTO endpoints (
        id, service_id, name, description, push_token, 
        expected_interval, grace_period, status, is_degraded
      )
      VALUES (
        ${id}, ${serviceId}, ${name}, ${description || null}, ${pushToken},
        ${expectedInterval}, ${gracePeriod}, 'unknown', false
      )
    `

    // Update service aggregated status
    await updateServiceStatus(serviceId)

    return NextResponse.json({ success: true, id, pushToken })
  } catch (error) {
    console.error("Failed to create endpoint:", error)
    return NextResponse.json({ error: "Failed to create endpoint" }, { status: 500 })
  }
}

async function updateServiceStatus(serviceId: string) {
  const endpoints = await sql`
    SELECT status, expected_interval, grace_period, last_ping 
    FROM endpoints 
    WHERE service_id = ${serviceId}
  `

  let status = "unknown"
  if (endpoints.length > 0) {
    const now = new Date()
    const statuses = endpoints.map((e) => {
      if (e.last_ping) {
        const lastPing = new Date(e.last_ping)
        const timeoutMs = (e.expected_interval + e.grace_period) * 1000
        const elapsed = now.getTime() - lastPing.getTime()
        if (elapsed > timeoutMs) return "outage"
      } else {
        return "unknown"
      }
      return e.status
    })

    if (statuses.every((s) => s === "operational")) status = "operational"
    else if (statuses.some((s) => s === "outage")) status = "outage"
    else if (statuses.some((s) => s === "degraded")) status = "degraded"
  }

  await sql`UPDATE services SET aggregated_status = ${status}, last_updated = NOW() WHERE id = ${serviceId}`
}
