import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// Public endpoint - no auth required
// Cron jobs and external services ping this URL to report they're alive
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  try {
    const endpoints = await sql`
      SELECT id, service_id, name, expected_interval, grace_period 
      FROM endpoints 
      WHERE push_token = ${token} AND monitoring_type = 'push'
    `

    if (endpoints.length === 0) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    }

    const endpoint = endpoints[0]

    // Update the last_ping timestamp and set status to operational
    await sql`
      UPDATE endpoints 
      SET last_ping = NOW(), 
          status = 'operational',
          last_check = NOW(),
          error_message = NULL
      WHERE id = ${endpoint.id}
    `

    return NextResponse.json({
      success: true,
      message: "Ping received",
      endpoint: endpoint.name,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error processing ping:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Also support POST for flexibility
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  return GET(request, { params })
}
