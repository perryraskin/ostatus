import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

// GET all public pages for the current user
export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pages = await sql`
      SELECT * FROM public_pages
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    const formattedPages = pages.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description || "",
      logoUrl: p.logo_url,
      customDomain: p.custom_domain,
      serviceIds: p.service_ids || [],
      isPublished: p.is_published,
      showEndpointDetails: p.show_endpoint_details,
      primaryColor: p.primary_color || "#3b82f6",
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }))

    return NextResponse.json(formattedPages)
  } catch (error) {
    console.error("Failed to fetch public pages:", error)
    return NextResponse.json({ error: "Failed to fetch public pages" }, { status: 500 })
  }
}

// POST create a new public page
export async function POST(request: Request) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      slug,
      title,
      description,
      logoUrl,
      customDomain,
      serviceIds,
      isPublished,
      showEndpointDetails,
      primaryColor,
    } = body

    // Check if slug is already taken
    const existing = await sql`SELECT id FROM public_pages WHERE slug = ${slug}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Slug is already taken" }, { status: 400 })
    }

    await sql`
      INSERT INTO public_pages (id, user_id, slug, title, description, logo_url, custom_domain, service_ids, is_published, show_endpoint_details, primary_color)
      VALUES (${id}, ${user.id}, ${slug}, ${title}, ${description || ""}, ${logoUrl || null}, ${customDomain || null}, ${serviceIds || []}, ${isPublished || false}, ${showEndpointDetails !== false}, ${primaryColor || "#3b82f6"})
    `

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Failed to create public page:", error)
    return NextResponse.json({ error: "Failed to create public page" }, { status: 500 })
  }
}
