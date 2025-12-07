import { PublicStatusView } from "@/components/public-status-view"

export default async function CustomDomainStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>
}) {
  const { domain } = await searchParams

  // Pass domain to the view - it will fetch by domain instead of slug
  return <PublicStatusView domain={domain} />
}
