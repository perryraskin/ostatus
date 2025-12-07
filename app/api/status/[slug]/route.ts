import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

// GET public status page data (no auth required)
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    // Find the public page by slug or custom domain
    const host = request.headers.get("host")
    const pages = await sql`
      SELECT * FROM public_pages
      WHERE (slug = ${slug} OR custom_domain = ${host})
        AND is_published = true
    `

    if (pages.length === 0) {
      return NextResponse.json({ error: "Status page not found" }, { status: 404 })
    }

    const page = pages[0]
    const serviceIds = page.service_ids || []

    if (serviceIds.length === 0) {
      return NextResponse.json({
        page: {
          title: page.title,
          description: page.description,
          logoUrl: page.logo_url,
          primaryColor: page.primary_color,
          showEndpointDetails: page.show_endpoint_details,
        },
        services: [],
      })
    }

    // Fetch services and their endpoints
    const services = await sql`
      SELECT 
        s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'name', e.name,
              'monitoringType', COALESCE(e.monitoring_type, 'pull'),
              'status', e.status,
              'responseTime', e.response_time,
              'lastCheck', e.last_check,
              'lastPing', e.last_ping
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) as endpoints
      FROM services s
      LEFT JOIN endpoints e ON s.id = e.service_id
      WHERE s.id = ANY(${serviceIds}::text[])
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
      endpoints: page.show_endpoint_details ? s.endpoints || [] : [],
    }))

    return NextResponse.json({
      page: {
        title: page.title,
        description: page.description,
        logoUrl: page.logo_url,
        primaryColor: page.primary_color,
        showEndpointDetails: page.show_endpoint_details,
      },
      services: formattedServices,
    })
  } catch (error) {
    console.error("Failed to fetch public status:", error)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }
}
