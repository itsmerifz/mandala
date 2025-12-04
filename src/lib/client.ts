import { edenTreaty } from "@elysiajs/eden"
import type { App } from "@/server"

const url = process.env.NEXT_PUBLIC_API_URL || 'localhost:3000'
export const api = edenTreaty<App>(url)