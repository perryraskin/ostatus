import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

// GET all services with their endpoints for the current user
export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const services = await sql`
      SELECT 
        s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'name', e.name,
              'description', e.description,
              'pushToken', e.push_token,
              'expectedInterval', COALESCE(e.expected_interval, 60),
              'gracePeriod', COALESCE(e.grace_period, 60),
              'status', e.status,
              'isDegraded', COALESCE(e.is_degraded, false),
              'errorMessage', e.error_message,
              'lastPing', e.last_ping
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) as endpoints
      FROM services s
      LEFT JOIN endpoints e ON s.id = e.service_id
      WHERE s.user_id = ${user.id}
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `

    // Calculate real-time status based on timeouts
    const now = new Date()
    const formattedServices = services.map((s) => {
      const endpoints = (s.endpoints || []).map((e: Record<string, unknown>) => {
        // Check if endpoint is timed out
        let status = e.status as string
        let errorMessage = e.errorMessage as string | null

        if (e.lastPing) {
          const lastPing = new Date(e.lastPing as string)
          const expectedInterval = (e.expectedInterval as number) || 60
          const gracePeriod = (e.gracePeriod as number) || 60
          const timeoutMs = (expectedInterval + gracePeriod) * 1000
          const elapsed = now.getTime() - lastPing.getTime()

          if (elapsed > timeoutMs) {
            status = "outage"
            errorMessage = `No ping received for ${Math.floor(elapsed / 1000)}s (timeout: ${expectedInterval + gracePeriod}s)`
          }
        } else {
          status = "unknown"
          errorMessage = "Waiting for first ping"
        }

        return { ...e, status, errorMessage }
      })

      // Calculate aggregated status
      let aggregatedStatus = "unknown"
      if (endpoints.length > 0) {
        const statuses = endpoints.map((e: Record<string, unknown>) => e.status)
        if (statuses.every((st: string) => st === "operational")) aggregatedStatus = "operational"
        else if (statuses.some((st: string) => st === "outage")) aggregatedStatus = "outage"
        else if (statuses.some((st: string) => st === "degraded")) aggregatedStatus = "degraded"
      }

      return {
        id: s.id,
        name: s.name,
        description: s.description || "",
        category: s.category || "Uncategorized",
        aggregatedStatus,
        lastUpdated: s.last_updated,
        endpoints,
      }
    })

    return NextResponse.json(formattedServices)
  } catch (error) {
    console.error("Failed to fetch services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

// POST create a new service
export async function POST(request: Request) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, category } = body

    await sql`
      INSERT INTO services (id, name, description, category, aggregated_status, last_updated, user_id)
      VALUES (${id}, ${name}, ${description || ""}, ${category || "Uncategorized"}, 'unknown', NOW(), ${user.id})
    `

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Failed to create service:", error)
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}
