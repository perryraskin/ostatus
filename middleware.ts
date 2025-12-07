import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of known app routes that should NOT be treated as custom domains
const APP_ROUTES = ["/api", "/handler", "/status", "/_next", "/favicon.ico"]

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const pathname = request.nextUrl.pathname

  // Extract the domain without port
  const domain = hostname.split(":")[0]

  const isMainDomain =
    domain === "localhost" ||
    domain.endsWith(".vercel.app") ||
    domain.endsWith(".v0.dev") ||
    domain.endsWith(".vercel.sh")

  if (isMainDomain) {
    return NextResponse.next()
  }

  // Check if this is an app route that shouldn't be rewritten
  const isAppRoute = APP_ROUTES.some((route) => pathname.startsWith(route))
  if (isAppRoute) {
    return NextResponse.next()
  }

  // This is a custom domain - rewrite to the public status page
  // The API will look up the page by custom_domain
  const url = request.nextUrl.clone()
  url.pathname = `/status/_domain`
  url.searchParams.set("domain", domain)

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
