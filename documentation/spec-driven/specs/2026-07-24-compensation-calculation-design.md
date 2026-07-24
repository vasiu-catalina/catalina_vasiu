# Compensation Calculation — Design Spec

## Overview

Add flight distance calculation and EC261/2004 compensation level determination to the Air-Assist case management system. When a case is created (or airports change), the system calculates the orthodromic (great-circle) distance between the **starting airport** and the **final destination airport** (connecting flights are not considered for distance), then applies EU regulation compensation thresholds.

## Requirements (from Case 02 ticket)

1. The system calculates the orthodromic distance between starting and final destination (connecting flights are not considered).
2. Compensation levels based on distance:
   - <1500 km → €250
   - 1500–3500 km → €400
   - >3500 km → €600
3. The calculated compensation level is displayed to the user and stored with the case.

## Architecture

### Backend

- **Distance Service**: New function in `cases/services/airportgap.py` that calls `POST /api/airports/distance` with `from` and `to` IATA codes. Returns distance in kilometers.
- **Compensation Logic**: Pure function that takes a distance (km) and returns the compensation amount (€) based on EC261 thresholds.
- **API Endpoint**: New endpoint `POST /api/cases/{id}/calculate-compensation/` that:
  1. Reads the case's first flight segment's departing airport and the last flight segment's destination airport
  2. Calls the distance API
  3. Stores the result (distance_km, compensation_amount) on the Case model
  4. Returns the result

### Database

- Add fields to the `Case` model:
  - `distance_km` (DecimalField, nullable) — orthodromic distance in km
  - `compensation_amount` (DecimalField, nullable) — calculated compensation in EUR

### Frontend

- After case creation, call the compensation calculation endpoint
- Display the calculated distance and compensation amount to the user
- Trigger recalculation when airports change (re-submit triggers recalc)

## Data Flow

1. User submits case → case created (existing flow)
2. Backend automatically calculates compensation after case creation
3. Response includes `distance_km` and `compensation_amount`
4. Frontend displays the results

## Error Handling

- If the AirportGap API is unavailable, the case is still created but compensation fields remain null
- The calculation can be retried via the dedicated endpoint
- Invalid airport codes return a 400 error on the calculation endpoint

## Testing

- Unit tests for compensation threshold logic
- Integration test for the distance API call (mocked)
- API endpoint test for the full calculation flow
