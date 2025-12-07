import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

export type DbService = {
  id: string
  name: string
  description: string | null
  category: string | null
  aggregated_status: string
  last_updated: Date
  created_at: Date
  user_id: string
}

export type DbEndpoint = {
  id: string
  service_id: string
  name: string
  description: string | null
  push_token: string
  expected_interval: number
  grace_period: number
  status: string
  error_message: string | null
  is_degraded: boolean
  last_ping: Date | null
  created_at: Date
}
