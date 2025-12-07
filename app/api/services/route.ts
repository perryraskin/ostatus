import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

// GET all services with their endpoints
export async function GET() {
  try {
    const services = await sql`
      SELECT 
        s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'name', e.name,
              'url', e.url,
              'method', e.method,
              'headers', e.headers,
              'body', e.body,
              'interval', e.interval_seconds,
              'timeout', e.timeout_ms,
              'successCriteria', e.success_criteria,
              'failureCriteria', e.failure_criteria,
              'status', e.status,
              'responseTime', e.response_time,
              'errorMessage', e.error_message,
              'lastCheck', e.last_check
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) as endpoints
      FROM services s
      LEFT JOIN endpoints e ON s.id = e.service_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `

    const formattedServices = services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || "",
      category: s.category || "Uncategorized",
      aggregatedStatus: s.aggregated_status,
      lastUpdated: s.last_updated,
      endpoints: s.endpoints || [],
    }))

    return NextResponse.json(formattedServices)
  } catch (error) {
    console.error("Failed to fetch services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

// POST create a new service
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, category } = body

    await sql`
      INSERT INTO services (id, name, description, category, aggregated_status, last_updated)
      VALUES (${id}, ${name}, ${description || ""}, ${category || "Uncategorized"}, 'unknown', NOW())
    `

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Failed to create service:", error)
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}
