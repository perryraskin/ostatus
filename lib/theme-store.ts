"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type PrimaryColor = {
  name: string
  value: string
  foreground: string
}

export const primaryColors: PrimaryColor[] = [
  { name: "Red", value: "#ff3333", foreground: "#ffffff" },
  { name: "Blue", value: "#0066ff", foreground: "#ffffff" },
  { name: "Green", value: "#00cc00", foreground: "#000000" },
  { name: "Orange", value: "#ff6600", foreground: "#000000" },
  { name: "Pink", value: "#ff3399", foreground: "#ffffff" },
  { name: "Cyan", value: "#00cccc", foreground: "#000000" },
  { name: "Yellow", value: "#ffcc00", foreground: "#000000" },
  { name: "Purple", value: "#9933ff", foreground: "#ffffff" },
]

interface ThemeState {
  primaryColor: PrimaryColor
  setPrimaryColor: (color: PrimaryColor) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      primaryColor: primaryColors[1], // Default to Blue
      setPrimaryColor: (color) => set({ primaryColor: color }),
    }),
    {
      name: "status-page-theme",
    },
  ),
)
