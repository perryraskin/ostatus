"use client"

import type React from "react"

import { useEffect } from "react"
import { useThemeStore } from "@/lib/theme-store"

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const { primaryColor } = useThemeStore()

  useEffect(() => {
    // Apply the primary color to CSS custom properties
    document.documentElement.style.setProperty("--primary", primaryColor.value)
    document.documentElement.style.setProperty("--primary-foreground", primaryColor.foreground)
    document.documentElement.style.setProperty("--ring", primaryColor.value)
    document.documentElement.style.setProperty("--chart-1", primaryColor.value)
  }, [primaryColor])

  return <>{children}</>
}
