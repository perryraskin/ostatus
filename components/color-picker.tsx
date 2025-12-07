"use client"

import { useThemeStore, primaryColors } from "@/lib/theme-store"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Palette, Check } from "lucide-react"

export function ColorPicker() {
  const { primaryColor, setPrimaryColor } = useThemeStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-transparent"
        >
          <Palette className="w-4 h-4 mr-2" />
          <span className="w-4 h-4 border-2 border-black" style={{ backgroundColor: primaryColor.value }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-4 border-black bg-card shadow-[8px_8px_0px_0px_#000] p-2">
        <div className="grid grid-cols-4 gap-2 p-2">
          {primaryColors.map((color) => (
            <button
              key={color.name}
              onClick={() => setPrimaryColor(color)}
              className="relative w-10 h-10 border-4 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center justify-center"
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {primaryColor.value === color.value && <Check className="w-5 h-5" style={{ color: color.foreground }} />}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
