"use server"
import { signOut } from "@root/auth"
import { redirect } from "next/navigation"

export const SignOutAction = async () => {
  const signout = await signOut()
  if (signout) redirect('/')
}