import { client } from './client'
import type { AuthResponse, User } from '@/types'

export const authApi = {
  login: (email: string, password: string) =>
    client.post<AuthResponse>('/api/v1/auth/login', { email, password }),

  register: (email: string, password: string) =>
    client.post<AuthResponse>('/api/v1/auth/register', { email, password }),

  getProfile: () => client.get<User>('/api/v1/auth/profile'),

  updateProfile: (name: string) =>
    client.put<User>('/api/v1/auth/profile', { name }),

  changePassword: (oldPassword: string, newPassword: string) =>
    client.put('/api/v1/auth/password', { old_password: oldPassword, new_password: newPassword }),
}
