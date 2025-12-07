"use client"

import { StatusPage } from "@/components/status-page"
import { ColorThemeProvider } from "@/components/color-theme-provider"

export default function Home() {
  return (
    <ColorThemeProvider>
      <StatusPage />
    </ColorThemeProvider>
  )
}
