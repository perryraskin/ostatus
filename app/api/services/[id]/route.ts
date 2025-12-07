import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

// PUT update a service
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, category } = body

    await sql`
      UPDATE services 
      SET name = ${name}, description = ${description || ""}, category = ${category || "Uncategorized"}, last_updated = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update service:", error)
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
  }
}

// DELETE a service
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await sql`DELETE FROM services WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete service:", error)
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
  }
}
