import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
})

export interface UserRecord {
  id: number
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  date_joined: string
  role: string | null
  assigned_cases: number
}

export async function fetchUsers(token: string): Promise<UserRecord[]> {
  const response = await apiClient.get<UserRecord[]>('/users/', {
    headers: { Authorization: `Token ${token}` },
  })
  return response.data
}

export async function deleteUser(token: string, userId: number): Promise<{ detail: string }> {
  const response = await apiClient.delete<{ detail: string }>(`/users/${userId}/`, {
    headers: { Authorization: `Token ${token}` },
  })
  return response.data
}
