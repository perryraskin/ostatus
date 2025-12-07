import { cn } from "@/lib/utils"

type StatusType = "operational" | "degraded" | "outage" | "unknown"

interface StatusBadgeProps {
  status: StatusType
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

const statusConfig: Record<StatusType, { label: string; bgColor: string; textColor: string; dotColor: string }> = {
  operational: {
    label: "Operational",
    bgColor: "bg-emerald-500",
    textColor: "text-white",
    dotColor: "bg-emerald-500",
  },
  degraded: {
    label: "Degraded",
    bgColor: "bg-amber-400",
    textColor: "text-black",
    dotColor: "bg-amber-400",
  },
  outage: {
    label: "Outage",
    bgColor: "bg-red-500",
    textColor: "text-white",
    dotColor: "bg-red-500",
  },
  unknown: {
    label: "Unknown",
    bgColor: "bg-muted",
    textColor: "text-muted-foreground",
    dotColor: "bg-muted-foreground",
  },
}

export function StatusBadge({ status, size = "md", showLabel = true }: StatusBadgeProps) {
  const config = statusConfig[status]

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  }

  const dotSizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 font-bold border-2 border-black shadow-[4px_4px_0px_0px_#000]",
        config.bgColor,
        config.textColor,
        sizeClasses[size],
      )}
    >
      <span className={cn("rounded-full animate-pulse", config.dotColor, dotSizes[size])} />
      {showLabel && <span className="uppercase tracking-wide">{config.label}</span>}
    </div>
  )
}

export function StatusDot({ status, size = "md" }: { status: StatusType; size?: "sm" | "md" | "lg" }) {
  const config = statusConfig[status]

  const dotSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  return <span className={cn("inline-block rounded-full border-2 border-black", config.dotColor, dotSizes[size])} />
}
