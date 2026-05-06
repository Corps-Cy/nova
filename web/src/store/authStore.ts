import type { User } from '@/types'

export function getToken(): string | null {
  return localStorage.getItem('nova_token')
}

export function getUser(): User | null {
  const u = localStorage.getItem('nova_user')
  return u ? JSON.parse(u) : null
}

export function setAuth(token: string, user: User) {
  localStorage.setItem('nova_token', token)
  localStorage.setItem('nova_user', JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem('nova_token')
  localStorage.removeItem('nova_user')
}
