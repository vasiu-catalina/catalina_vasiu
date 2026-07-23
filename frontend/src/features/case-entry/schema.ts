import { z } from 'zod'

const maxDocumentSize = 5 * 1024 * 1024
const acceptedFileTypes = ['pdf', 'jpg', 'jpeg']
const consentDecisionSchema = z.enum(['agree', 'disagree'])

const flightSchema = z
  .object({
    flightDate: z.string().min(1, 'Flight date is required.'),
    flightNumber: z.string().trim().min(1, 'Flight number is required.'),
    airline: z.string().trim().min(1, 'Airline is required.'),
    departingAirportCode: z.string().trim().min(3, 'Departing airport code is required.'),
    destinationAirportCode: z.string().trim().min(3, 'Destination airport code is required.'),
    plannedDepartureTime: z.string().min(1, 'Planned departure time is required.'),
    plannedArrivalTime: z.string().min(1, 'Planned arrival time is required.'),
  })
  .superRefine((value, ctx) => {
    if (
      value.plannedDepartureTime &&
      value.plannedArrivalTime &&
      new Date(value.plannedArrivalTime) <= new Date(value.plannedDepartureTime)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Planned arrival time must be after planned departure time.',
        path: ['plannedArrivalTime'],
      })
    }
  })

function documentSchema(label: string) {
  return z
    .custom<FileList | null>((value) => value instanceof FileList && value.length > 0, {
      message: `${label} is required.`,
    })
    .superRefine((value, ctx) => {
      const file = value?.item(0)
      if (!file) {
        return
      }

      const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!acceptedFileTypes.includes(extension)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Allowed file types are PDF, JPG, and JPEG.',
        })
      }

      if (file.size > maxDocumentSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Each uploaded document must be 5 MB or smaller.',
        })
      }
    })
}

export const CaseEntryFormSchema = z
  .object({
    reservationNumber: z.string().trim().min(1, 'Reservation number is required.'),
    flights: z.array(flightSchema).min(1).max(5, 'You can add up to 4 connecting flights.'),
    problemFlightIndex: z.coerce.number().int().min(0, 'Select the problem flight.'),
    privacyDecision: consentDecisionSchema,
    updatesDecision: consentDecisionSchema,
    passenger: z.object({
      firstName: z.string().trim().min(1, 'First name is required.'),
      lastName: z.string().trim().min(1, 'Last name is required.'),
      dateOfBirth: z.string().min(1, 'Date of birth is required.').refine((value) => new Date(value) < new Date(), {
        message: 'Date of birth must be earlier than today.',
      }),
      email: z.email('Enter a valid email address.'),
      phone: z.string().regex(/^\+?[0-9\-\s]{7,20}$/, 'Enter a valid phone number.'),
      address: z.string().trim().min(1, 'Address is required.'),
      postalCode: z.string().trim().min(1, 'Postal code is required.'),
    }),
    boardingPass: documentSchema('Boarding pass'),
    identityDocument: documentSchema('Identity document'),
  })
  .superRefine((value, ctx) => {
    if (value.privacyDecision !== 'agree') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'You must agree to the GDPR policy before submitting.',
        path: ['privacyDecision'],
      })
    }

    if (value.problemFlightIndex >= value.flights.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a valid problem flight.',
        path: ['problemFlightIndex'],
      })
    }
  })

export type CaseEntryFormValues = z.input<typeof CaseEntryFormSchema>

export const emptyFlight = {
  flightDate: '',
  flightNumber: '',
  airline: '',
  departingAirportCode: '',
  destinationAirportCode: '',
  plannedDepartureTime: '',
  plannedArrivalTime: '',
}