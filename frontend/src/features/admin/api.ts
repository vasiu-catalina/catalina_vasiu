import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
})

export interface NavigationSection {
  key: string
  label: string
  description: string
  path: string
}

export interface NavigationResponse {
  sections: NavigationSection[]
}

export interface SystemInfo {
  total_cases: number
  total_users: number
  total_colleagues: number
}

export async function fetchAdminNavigation(token: string): Promise<NavigationResponse> {
  const response = await apiClient.get<NavigationResponse>('/admin/navigation/', {
    headers: { Authorization: `Token ${token}` },
  })
  return response.data
}

export async function fetchSystemInfo(token: string): Promise<SystemInfo> {
  const response = await apiClient.get<SystemInfo>('/admin/system-info/', {
    headers: { Authorization: `Token ${token}` },
  })
  return response.data
}
