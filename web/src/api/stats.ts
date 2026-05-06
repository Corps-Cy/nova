import { client } from './client'
import type { DashboardStats, UsageStats, QueryResponse, ApiKey } from '@/types'

export const statsApi = {
  getDashboard: () => client.get<DashboardStats[]>('/api/v1/stats/dashboard'),

  getUsage: () => client.get<UsageStats>('/api/v1/stats/usage'),

  query: (kbId: string, question: string) =>
    client.post<QueryResponse>(`/api/v1/dashboard/query`, { kb_id: kbId, question }),
}

export const apiKeyApi = {
  list: () => client.get<ApiKey[]>('/api/v1/api-keys'),

  create: (name: string) => client.post<ApiKey>('/api/v1/api-keys', { name }),

  delete: (id: string) => client.delete(`/api/v1/api-keys/${id}`),
}
