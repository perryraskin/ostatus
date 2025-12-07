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
}

export type DbEndpoint = {
  id: string
  service_id: string
  name: string
  url: string
  method: string
  headers: Record<string, string> | null
  body: string | null
  interval_seconds: number
  timeout_ms: number
  success_criteria: Array<{ type: string; operator: string; value: string }>
  failure_criteria: Array<{ type: string; operator: string; value: string }>
  status: string
  response_time: number | null
  error_message: string | null
  last_check: Date | null
  created_at: Date
}
