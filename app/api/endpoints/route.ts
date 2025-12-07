import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

// POST create a new endpoint
export async function POST(request: Request) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      serviceId,
      name,
      url,
      method,
      headers,
      requestBody,
      interval,
      timeout,
      successCriteria,
      failureCriteria,
    } = body

    const serviceCheck = await sql`SELECT id FROM services WHERE id = ${serviceId} AND user_id = ${user.id}`
    if (serviceCheck.length === 0) {
      return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 404 })
    }

    await sql`
      INSERT INTO endpoints (
        id, service_id, name, url, method, headers, body, 
        interval_seconds, timeout_ms, success_criteria, failure_criteria, status
      )
      VALUES (
        ${id}, ${serviceId}, ${name}, ${url}, ${method}, 
        ${headers ? JSON.stringify(headers) : null}::jsonb, 
        ${requestBody || null},
        ${interval}, ${timeout}, 
        ${JSON.stringify(successCriteria || [])}::jsonb, 
        ${JSON.stringify(failureCriteria || [])}::jsonb, 
        'unknown'
      )
    `

    // Update service aggregated status
    await updateServiceStatus(serviceId)

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Failed to create endpoint:", error)
    return NextResponse.json({ error: "Failed to create endpoint" }, { status: 500 })
  }
}

async function updateServiceStatus(serviceId: string) {
  const endpoints = await sql`SELECT status FROM endpoints WHERE service_id = ${serviceId}`

  let status = "unknown"
  if (endpoints.length > 0) {
    const statuses = endpoints.map((e) => e.status)
    if (statuses.every((s) => s === "operational")) status = "operational"
    else if (statuses.some((s) => s === "outage")) status = "outage"
    else if (statuses.some((s) => s === "degraded")) status = "degraded"
  }

  await sql`UPDATE services SET aggregated_status = ${status}, last_updated = NOW() WHERE id = ${serviceId}`
}
