import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

// GET a single public page
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pages = await sql`
      SELECT * FROM public_pages
      WHERE id = ${id} AND user_id = ${user.id}
    `

    if (pages.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const p = pages[0]
    return NextResponse.json({
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
    })
  } catch (error) {
    console.error("Failed to fetch public page:", error)
    return NextResponse.json({ error: "Failed to fetch public page" }, { status: 500 })
  }
}

// PUT update a public page
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
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

    // Check ownership
    const existing = await sql`SELECT id FROM public_pages WHERE id = ${id} AND user_id = ${user.id}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Check if new slug is already taken by another page
    const slugCheck = await sql`SELECT id FROM public_pages WHERE slug = ${slug} AND id != ${id}`
    if (slugCheck.length > 0) {
      return NextResponse.json({ error: "Slug is already taken" }, { status: 400 })
    }

    await sql`
      UPDATE public_pages
      SET 
        slug = ${slug},
        title = ${title},
        description = ${description || ""},
        logo_url = ${logoUrl || null},
        custom_domain = ${customDomain || null},
        service_ids = ${serviceIds || []},
        is_published = ${isPublished || false},
        show_endpoint_details = ${showEndpointDetails !== false},
        primary_color = ${primaryColor || "#3b82f6"},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update public page:", error)
    return NextResponse.json({ error: "Failed to update public page" }, { status: 500 })
  }
}

// DELETE a public page
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existing = await sql`SELECT id FROM public_pages WHERE id = ${id} AND user_id = ${user.id}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await sql`DELETE FROM public_pages WHERE id = ${id} AND user_id = ${user.id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete public page:", error)
    return NextResponse.json({ error: "Failed to delete public page" }, { status: 500 })
  }
}
