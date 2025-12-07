import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

// PUT update an endpoint
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { serviceId, name, url, method, headers, requestBody, interval, timeout, successCriteria, failureCriteria } =
      body

    const serviceCheck = await sql`SELECT id FROM services WHERE id = ${serviceId} AND user_id = ${user.id}`
    if (serviceCheck.length === 0) {
      return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 404 })
    }

    await sql`
      UPDATE endpoints 
      SET 
        name = ${name}, 
        url = ${url}, 
        method = ${method}, 
        headers = ${headers ? JSON.stringify(headers) : null}::jsonb,
        body = ${requestBody || null},
        interval_seconds = ${interval}, 
        timeout_ms = ${timeout},
        success_criteria = ${JSON.stringify(successCriteria || [])}::jsonb,
        failure_criteria = ${JSON.stringify(failureCriteria || [])}::jsonb
      WHERE id = ${id}
    `

    // Update service aggregated status
    await updateServiceStatus(serviceId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update endpoint:", error)
    return NextResponse.json({ error: "Failed to update endpoint" }, { status: 500 })
  }
}

// DELETE an endpoint
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const url = new URL(request.url)
    const serviceId = url.searchParams.get("serviceId")

    if (serviceId) {
      const serviceCheck = await sql`SELECT id FROM services WHERE id = ${serviceId} AND user_id = ${user.id}`
      if (serviceCheck.length === 0) {
        return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 404 })
      }
    }

    await sql`DELETE FROM endpoints WHERE id = ${id}`

    if (serviceId) {
      await updateServiceStatus(serviceId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete endpoint:", error)
    return NextResponse.json({ error: "Failed to delete endpoint" }, { status: 500 })
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
