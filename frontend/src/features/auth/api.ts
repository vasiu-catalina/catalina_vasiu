import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
})

export interface LoginResponse {
  token: string
  must_change_password: boolean
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
  }
}

export interface ChangePasswordResponse {
  detail: string
  token: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login/', { email, password })
  return response.data
}

export async function changePassword(
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<ChangePasswordResponse> {
  const response = await apiClient.post<ChangePasswordResponse>(
    '/auth/change-password/',
    { new_password: newPassword, confirm_password: confirmPassword },
    { headers: { Authorization: `Token ${token}` } }
  )
  return response.data
}

export interface CreateColleaguePayload {
  first_name: string
  last_name: string
  email: string
  password: string
}

export interface CreateColleagueResponse {
  id: number
  email: string
  first_name: string
  last_name: string
  message: string
}

export async function createColleague(
  token: string,
  data: CreateColleaguePayload
): Promise<CreateColleagueResponse> {
  const response = await apiClient.post<CreateColleagueResponse>(
    '/admin/colleagues/',
    data,
    { headers: { Authorization: `Token ${token}` } }
  )
  return response.data
}

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (typeof data === 'object' && data !== null) {
      if ('non_field_errors' in data) {
        return (data as { non_field_errors: string[] }).non_field_errors[0]
      }
      if ('detail' in data) {
        return data.detail as string
      }
    }
    return 'An error occurred. Please try again.'
  }
  return 'An error occurred. Please try again.'
}
