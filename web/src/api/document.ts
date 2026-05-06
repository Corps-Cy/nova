import { client } from './client'
import type { Document } from '@/types'

export const documentApi = {
  list: (kbId: string) => client.get<Document[]>(`/api/v1/knowledge-bases/${kbId}/documents`),

  upload: (kbId: string, file: File) => {
    const tk = localStorage.getItem('nova_token')
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`/api/v1/knowledge-bases/${kbId}/documents`, {
      method: 'POST',
      headers: tk ? { Authorization: `Bearer ${tk}` } : {},
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error('Upload failed')
      return res.json()
    })
  },

  importUrl: (kbId: string, url: string) =>
    client.post(`/api/v1/knowledge-bases/${kbId}/documents/import`, { url }),

  delete: (kbId: string, docId: string) =>
    client.delete(`/api/v1/knowledge-bases/${kbId}/documents/${docId}`),
}
