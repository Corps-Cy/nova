import { client } from './client'
import type { KnowledgeBase } from '@/types'

export const knowledgeApi = {
  list: () => client.get<KnowledgeBase[]>('/api/v1/knowledge-bases'),

  get: (id: string) => client.get<KnowledgeBase>(`/api/v1/knowledge-bases/${id}`),

  create: (name: string, description: string) =>
    client.post<KnowledgeBase>('/api/v1/knowledge-bases', { name, description }),

  delete: (id: string) =>
    client.delete(`/api/v1/knowledge-bases/${id}`),

  listDashboard: () => client.get<KnowledgeBase[]>('/api/v1/dashboard/kb'),
}
