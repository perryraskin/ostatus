import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

// PUT update endpoint status (for health check results)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, responseTime, errorMessage, serviceId } = body

    await sql`
      UPDATE endpoints 
      SET 
        status = ${status}, 
        response_time = ${responseTime || null}, 
        error_message = ${errorMessage || null},
        last_check = NOW()
      WHERE id = ${id}
    `

    // Update service aggregated status
    if (serviceId) {
      const endpoints = await sql`SELECT status FROM endpoints WHERE service_id = ${serviceId}`

      let aggregatedStatus = "unknown"
      if (endpoints.length > 0) {
        const statuses = endpoints.map((e) => e.status)
        if (statuses.every((s) => s === "operational")) aggregatedStatus = "operational"
        else if (statuses.some((s) => s === "outage")) aggregatedStatus = "outage"
        else if (statuses.some((s) => s === "degraded")) aggregatedStatus = "degraded"
      }

      await sql`UPDATE services SET aggregated_status = ${aggregatedStatus}, last_updated = NOW() WHERE id = ${serviceId}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update endpoint status:", error)
    return NextResponse.json({ error: "Failed to update endpoint status" }, { status: 500 })
  }
}
