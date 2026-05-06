import { useAuth } from '@/hooks/useAuth'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { token } = useAuth()
  // We can't use hooks outside components, so read from localStorage directly
  const tk = localStorage.getItem('nova_token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (tk) {
    headers['Authorization'] = `Bearer ${tk}`
  }

  const res = await fetch(path, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('nova_token')
    localStorage.removeItem('nova_user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || body.message || res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const client = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
