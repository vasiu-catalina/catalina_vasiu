import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
})

export interface CaseRecord {
  id: number
  status: string
  created_at: string
  flight_number: string | null
  flight_date: string | null
}

export async function fetchCases(token: string): Promise<CaseRecord[]> {
  const response = await apiClient.get<CaseRecord[]>('/cases/list/', {
    headers: { Authorization: `Token ${token}` },
  })
  return response.data
}

export async function deleteCase(token: string, caseId: number): Promise<{ detail: string }> {
  const response = await apiClient.delete<{ detail: string }>(`/cases/${caseId}/`, {
    headers: { Authorization: `Token ${token}` },
  })
  return response.data
}
