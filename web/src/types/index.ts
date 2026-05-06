export interface User {
  id: string
  email: string
  name: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  document_count: number
  chunk_count: number
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  kb_id: string
  filename: string
  chunk_count: number
  source: string
  status: string
  created_at: string
}

export interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used?: string
}

export interface QueryRecord {
  id: string
  kb_id: string
  kb_name?: string
  question: string
  answer?: string
  latency_ms: number
  created_at: string
}

export interface DashboardStats {
  kb_count: number
  total_queries: number
  avg_latency_ms: number
  today_queries: number
}

export interface UsageStats {
  daily: { date: string; queries: number }[]
  total: number
}

export interface QueryResponse {
  answer: string
  sources?: { content: string; score: number }[]
  latency_ms: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: { content: string; score: number }[]
  latency_ms?: number
}
