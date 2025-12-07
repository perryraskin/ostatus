import { stackServerApp } from "@/stack"

export async function getCurrentUser() {
  return await stackServerApp.getUser()
}

export async function requireUser() {
  const user = await stackServerApp.getUser({ or: "redirect" })
  return user
}
