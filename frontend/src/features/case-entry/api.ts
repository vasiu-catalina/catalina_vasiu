import axios from 'axios'

import type { AirportOption, CreatedCaseResponse } from './types'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
})

export async function searchAirports(query: string): Promise<AirportOption[]> {
  const response = await apiClient.get<{ results: AirportOption[] }>('/airports/', {
    params: { query },
  })

  return response.data.results
}

export async function createCase(formData: FormData): Promise<CreatedCaseResponse> {
  const response = await apiClient.post<CreatedCaseResponse>('/cases/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data
}

export interface CompensationResult {
  distance_km: number
  compensation_amount: number
  from_airport: string
  to_airport: string
}

export async function calculateCompensation(caseId: number): Promise<CompensationResult> {
  const response = await apiClient.post<CompensationResult>(`/cases/${caseId}/calculate-compensation/`)
  return response.data
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail ?? 'We could not submit the case right now.'
  }

  return 'We could not submit the case right now.'
}