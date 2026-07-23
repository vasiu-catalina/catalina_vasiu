export interface AirportOption {
  code: string
  name: string
  city: string
  country: string
  label: string
}

export interface FlightSegmentFormValues {
  flightDate: string
  flightNumber: string
  airline: string
  departingAirportCode: string
  destinationAirportCode: string
  plannedDepartureTime: string
  plannedArrivalTime: string
}

export interface PassengerFormValues {
  firstName: string
  lastName: string
  dateOfBirth: string
  email: string
  phone: string
  address: string
  postalCode: string
}

export type { CaseEntryFormValues } from './schema'

export interface CreatedCaseResponse {
  id: number
  status: string
  reservation_number: string
}