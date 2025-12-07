"use client"

import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DemoModeBannerProps {
  onExit: () => void
}

export function DemoModeBanner({ onExit }: DemoModeBannerProps) {
  return (
    <div className="bg-amber-400 border-b-4 border-black px-4 py-3">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-black flex-shrink-0" />
          <p className="font-bold text-black text-sm md:text-base">
            <span className="uppercase">Demo Mode Active</span>
            <span className="hidden md:inline"> — </span>
            <span className="block md:inline font-normal">
              Sample data is loaded in memory only. All changes will be lost when you navigate away or refresh.
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onExit}
          className="border-2 border-black bg-white hover:bg-black hover:text-white flex-shrink-0"
        >
          <X className="w-4 h-4 mr-1" />
          Exit Demo
        </Button>
      </div>
    </div>
  )
}
