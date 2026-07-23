# Case_01 Implementation Checklist

This checklist is based on `c:\AIHackathon\case01` and is intended to determine whether the Case_01 user story is implemented in the current codebase.

## Status Key

- [x] Implemented
- [~] Implemented with note or ticket ambiguity
- [ ] Not implemented

## User Story

- [x] A passenger can fill out a form with personal and flight information to create a new compensation case.

## View

- [x] A public Case Entry Form exists in the frontend.

## Required Data Fields

### Flight itinerary

- [x] Flight date
- [x] Flight number
- [x] Airline
- [x] Reservation number
- [x] Departing airport via API-backed input
- [x] Destination airport via API-backed input
- [x] Connecting flights via dynamic UI and backend payload support
- [x] Planned departure time
- [x] Planned arrival time

### Passenger details

- [x] First name
- [x] Last name
- [x] Date of birth
- [x] Email
- [x] Phone
- [x] Address
- [x] Postal code

### Documents

- [x] Boarding pass upload field
- [x] ID/passport upload field
- [x] File types are validated as PDF/PNG/JPG/JPEG up to 5 MB.

### GDPR details

- [x] GDPR consent field exists and must be accepted before submit is enabled.
- [x] Updates-consent Agree/Disagree field exists.

## Acceptance Criteria

### Form structure

- [x] The case entry form contains 6 distinct parts.
- [x] Part 1: flight itinerary
- [x] Part 2: disruption details placeholder only
- [x] Part 3: disruption motives placeholder only
- [x] Part 4: email & compliance request
- [x] Part 5: flight details
- [x] Part 6: passenger details
- [x] Parts 2 and 3 are not implemented functionally and are clearly deferred to Case_03.

### Access and validation

- [x] Users can access the case entry form.
- [x] All required fields are validated before submission.
- [x] Airport codes are loaded automatically from the backend airport lookup.
- [x] Airport selections are validated against lookup results in both frontend and backend.

### Flight and connection behavior

- [x] The user may add up to 4 connecting flights.
- [x] The user must mark a problem flight.
- [x] Each flight, including connecting flights, captures flight number, flight date, and airline.
- [x] Backend validation enforces a valid itinerary shape: primary leg first, later legs marked as connections, and at most 4 connections.

### GDPR and submit behavior

- [x] GDPR consent is represented as a checkbox-style gate.
- [x] Users must consent before they are able to submit.

### Document behavior

- [x] An upload field is displayed for Boarding Pass.
- [x] An upload field is displayed for ID/Passport.
- [x] File size is limited to 5 MB.
- [x] Allowed upload types are PDF, PNG, JPEG, and JPG.

### Status workflow

- [x] A `status` field exists on the case.
- [x] New cases are created with status `NEW`.
- [x] The other defined statuses exist: `VALID`, `ASSIGNED`, `INVALID`.

## Task Categorisation Coverage

### Backend

- [x] Case creation API
- [x] Airport code lookup integration
- [x] Connecting-flight logic
- [x] Problem-flight validation
- [x] File upload validation
- [x] GDPR consent enforcement
- [x] Case status workflow

### Frontend

- [x] Case entry form
- [x] Passenger details section
- [x] Flight details section
- [x] Connecting flights UI
- [x] Document upload UI
- [x] GDPR checkbox UI
- [x] Required-field validation

### Database

- [x] Case table/model
- [x] Passenger data fields
- [x] Flight/connection records
- [x] Uploaded document metadata
- [x] GDPR consent fields
- [x] Case status field

## Verification Coverage

- [x] Backend automated tests exist for API, serializers, models, and airport lookup service.
- [x] Frontend automated tests exist for form behavior and itinerary interactions.
- [x] Playwright end-to-end tests exist for required validation, connection handling, and successful live submission.

## Current Conclusion

- [x] Case_01 is implemented in the current repository.
- [x] No partial implementation items remain in the checklist.