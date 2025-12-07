import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

// PUT update a service
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, category } = body

    const result = await sql`
      UPDATE services 
      SET name = ${name}, description = ${description || ""}, category = ${category || "Uncategorized"}, last_updated = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update service:", error)
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
  }
}

// DELETE a service
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const result = await sql`DELETE FROM services WHERE id = ${id} AND user_id = ${user.id} RETURNING id`

    if (result.length === 0) {
      return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete service:", error)
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
  }
}
