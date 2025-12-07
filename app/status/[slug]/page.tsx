import { PublicStatusView } from "@/components/public-status-view"

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PublicStatusView slug={slug} />
}
