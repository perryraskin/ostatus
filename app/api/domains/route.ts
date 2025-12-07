import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { VercelCore as Vercel } from "@vercel/sdk/core.js"
import { projectsAddProjectDomain } from "@vercel/sdk/funcs/projectsAddProjectDomain.js"
import { projectsRemoveProjectDomain } from "@vercel/sdk/funcs/projectsRemoveProjectDomain.js"
import { projectsVerifyProjectDomain } from "@vercel/sdk/funcs/projectsVerifyProjectDomain.js"

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

function getVercelClient() {
  if (!VERCEL_TOKEN) return null
  return new Vercel({ bearerToken: VERCEL_TOKEN })
}

// Add a custom domain
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vercel = getVercelClient()
    if (!vercel || !VERCEL_PROJECT_ID) {
      return NextResponse.json(
        { error: "Vercel API not configured. Please add VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables." },
        { status: 500 },
      )
    }

    const { domain, pageId } = await request.json()

    if (!domain || !pageId) {
      return NextResponse.json({ error: "Domain and pageId are required" }, { status: 400 })
    }

    // Verify the user owns this public page
    const pages = await sql`
      SELECT pp.id FROM public_pages pp
      JOIN services s ON s.user_id = ${user.id}
      WHERE pp.id = ${pageId}
      LIMIT 1
    `

    if (pages.length === 0) {
      return NextResponse.json({ error: "Page not found or unauthorized" }, { status: 404 })
    }

    try {
      await projectsAddProjectDomain(vercel, {
        idOrName: VERCEL_PROJECT_ID,
        teamId: VERCEL_TEAM_ID || undefined,
        requestBody: { name: domain },
      })
    } catch (addError: any) {
      // Domain might already exist, which is fine - we'll check verification status
      if (!addError.message?.includes("already exists") && !addError.message?.includes("DOMAIN_ALREADY_EXISTS")) {
        return NextResponse.json({ error: addError.message || "Failed to add domain" }, { status: 400 })
      }
    }

    // Update public page with domain info (initially not verified)
    await sql`
      UPDATE public_pages 
      SET custom_domain = ${domain},
          domain_verified = FALSE,
          domain_verification_error = 'Pending DNS verification'
      WHERE id = ${pageId}
    `

    return NextResponse.json({
      success: true,
      domain,
      verified: false,
      message: "Domain added. Please configure your DNS records.",
    })
  } catch (error) {
    console.error("Error adding domain:", error)
    return NextResponse.json({ error: "Failed to add domain" }, { status: 500 })
  }
}

// Check domain verification status
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vercel = getVercelClient()
    if (!vercel || !VERCEL_PROJECT_ID) {
      return NextResponse.json({ error: "Vercel API not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const domain = searchParams.get("domain")

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    try {
      const verifyResponse = await projectsVerifyProjectDomain(vercel, {
        idOrName: VERCEL_PROJECT_ID,
        teamId: VERCEL_TEAM_ID || undefined,
        domain,
      })

      const isVerified = verifyResponse.verified === true

      // Update verification status in database
      if (isVerified) {
        await sql`
          UPDATE public_pages 
          SET domain_verified = TRUE,
              domain_verification_error = NULL
          WHERE custom_domain = ${domain}
        `
      } else {
        const verificationInfo = verifyResponse.verification
          ? `Verification required: ${verifyResponse.verification.map((v: any) => `${v.type} record for ${v.domain} with value ${v.value}`).join(", ")}`
          : "Pending DNS verification. Please add CNAME record pointing to cname.vercel-dns.com"

        await sql`
          UPDATE public_pages 
          SET domain_verified = FALSE,
              domain_verification_error = ${verificationInfo}
          WHERE custom_domain = ${domain}
        `
      }

      return NextResponse.json({
        verified: isVerified,
        verification: verifyResponse.verification || null,
      })
    } catch (error: any) {
      // Domain not found in project
      return NextResponse.json({
        verified: false,
        error: error.message || "Domain not found in project",
      })
    }
  } catch (error) {
    console.error("Error checking domain:", error)
    return NextResponse.json({ error: "Failed to check domain" }, { status: 500 })
  }
}

// Remove a custom domain
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vercel = getVercelClient()
    if (!vercel || !VERCEL_PROJECT_ID) {
      return NextResponse.json({ error: "Vercel API not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const domain = searchParams.get("domain")
    const pageId = searchParams.get("pageId")

    if (!domain || !pageId) {
      return NextResponse.json({ error: "Domain and pageId are required" }, { status: 400 })
    }

    // Verify the user owns this public page
    const pages = await sql`
      SELECT pp.id FROM public_pages pp
      JOIN services s ON s.user_id = ${user.id}
      WHERE pp.id = ${pageId} AND pp.custom_domain = ${domain}
      LIMIT 1
    `

    if (pages.length === 0) {
      return NextResponse.json({ error: "Page not found or unauthorized" }, { status: 404 })
    }

    try {
      await projectsRemoveProjectDomain(vercel, {
        idOrName: VERCEL_PROJECT_ID,
        teamId: VERCEL_TEAM_ID || undefined,
        domain,
      })
    } catch (error) {
      // Ignore errors if domain doesn't exist
    }

    // Clear domain from public page
    await sql`
      UPDATE public_pages 
      SET custom_domain = NULL,
          domain_verified = FALSE,
          domain_verification_error = NULL
      WHERE id = ${pageId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing domain:", error)
    return NextResponse.json({ error: "Failed to remove domain" }, { status: 500 })
  }
}
