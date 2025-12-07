"use client"

import { useUser, UserButton } from "@stackframe/stack"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import Link from "next/link"

export function UserMenu() {
  const user = useUser()

  if (!user) {
    return (
      <Link href="/handler/sign-in">
        <Button
          variant="outline"
          className="border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-transparent"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-sm hidden sm:inline">{user.displayName || user.primaryEmail || "User"}</span>
      <UserButton />
    </div>
  )
}
