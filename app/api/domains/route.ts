import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

async function vercelFetch(endpoint: string, options: RequestInit = {}) {
  const url = new URL(`https://api.vercel.com${endpoint}`)
  if (VERCEL_TEAM_ID) {
    url.searchParams.set("teamId", VERCEL_TEAM_ID)
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  return response
}

// Add a custom domain
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
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

    // Add domain to Vercel project
    const addResponse = await vercelFetch(`/v10/projects/${VERCEL_PROJECT_ID}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: domain }),
    })

    const addResult = await addResponse.json()

    if (!addResponse.ok) {
      // Check if domain already exists (not necessarily an error)
      if (addResult.error?.code === "domain_already_exists") {
        // Domain exists, check if it's verified
        const configResponse = await vercelFetch(`/v6/domains/${domain}/config`)
        const configResult = await configResponse.json()

        await sql`
          UPDATE public_pages 
          SET custom_domain = ${domain},
              domain_verified = ${configResult.configured || false},
              domain_verification_error = ${configResult.configured ? null : "Domain not yet configured. Please add the DNS records."}
          WHERE id = ${pageId}
        `

        return NextResponse.json({
          success: true,
          domain,
          verified: configResult.configured || false,
          message: configResult.configured ? "Domain is configured" : "Domain added. Please configure DNS records.",
        })
      }

      return NextResponse.json(
        { error: addResult.error?.message || "Failed to add domain" },
        { status: addResponse.status },
      )
    }

    // Update public page with domain info
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
      verification: addResult.verification,
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

    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
      return NextResponse.json({ error: "Vercel API not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const domain = searchParams.get("domain")

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    const projectDomainsResponse = await vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}/domains`)
    const projectDomainsResult = await projectDomainsResponse.json()

    let domainInfo = null
    if (projectDomainsResult.domains) {
      domainInfo = projectDomainsResult.domains.find((d: any) => d.name === domain)
    }

    // Also get config for DNS details
    const configResponse = await vercelFetch(`/v6/domains/${domain}/config`)
    const configResult = await configResponse.json()

    // Domain is verified if it exists in project and is not misconfigured
    const isVerified =
      domainInfo?.verified === true ||
      configResult.configured === true ||
      (configResult.misconfigured === false && !configResult.conflicts?.length)

    // Update verification status in database
    if (isVerified) {
      await sql`
        UPDATE public_pages 
        SET domain_verified = TRUE,
            domain_verification_error = NULL
        WHERE custom_domain = ${domain}
      `
    }

    return NextResponse.json({
      verified: isVerified,
      misconfigured: configResult.misconfigured || false,
      cnames: configResult.cnames || [],
      aValues: configResult.aValues || [],
      conflicts: configResult.conflicts || [],
      // Include raw info for debugging
      domainInfo: domainInfo ? { verified: domainInfo.verified, configured: domainInfo.configured } : null,
    })
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

    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
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

    // Remove domain from Vercel project
    await vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`, {
      method: "DELETE",
    })

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
