# Disruption Motives — Design Spec

## Purpose

Allow passengers to provide information about the type of disruption they experienced and the airline's stated motive, so that their case can be accurately assessed for EC261/2004 compensation eligibility.

## Architecture

Add a `Disruption` model (one-to-one with `Case`) that stores disruption type, conditional answers, airline motive details, and a free-text incident description. The frontend renders a new "Disruption Information" section in the case entry form with conditional fields driven by the disruption type selection.

## Data Model

### Disruption (new model, one-to-one with Case)

| Field | Type | Constraints |
|-------|------|------------|
| case | OneToOneField(Case) | CASCADE |
| disruption_type | CharField | choices: cancellation, delay, denied_boarding |
| cancellation_notice | CharField, nullable | choices: more_than_14_days, less_than_14_days, on_flight_day |
| delay_arrival | CharField, nullable | choices: less_than_3h, more_than_3h, connection_lost |
| voluntary_give_up | CharField, nullable | choices: yes, no |
| denial_reason | CharField, nullable | choices: overbooked, aggressive_behavior, intoxication, unspecified |
| airline_mentioned_motive | CharField, nullable | choices: yes, no, dont_know |
| airline_motive | CharField, nullable | choices: technical, meteorological, strike, airport_problems, crew_problems, other |
| incident_description | TextField, blank |

### Validation Rules

- **No validation on answers**: The system does not enforce validation on the specific disruption-detail answers (any combination is acceptable).
- **Disruption presence required**: A case cannot be submitted without a disruption_type selected.
- Conditional fields are stored as-is; null means the field was not applicable.

## API Changes

### POST /api/cases/ — Updated payload

Add a `disruption` object to the case creation payload:

```json
{
  "disruption": {
    "disruption_type": "cancellation",
    "cancellation_notice": "less_than_14_days",
    "airline_mentioned_motive": "yes",
    "airline_motive": "technical",
    "incident_description": "Flight was cancelled 5 days before departure..."
  }
}
```

### GET /api/cases/{id}/ — Updated response

Include disruption data in the case detail response.

## Frontend Behavior

### Disruption Type Dropdown

A select field with options: Cancellation, Delay, Denied Boarding.

### Conditional Fields

Based on disruption_type selection:

**If "Cancellation":**
- "How many days before cancellation has the airline informed?" — radio: >14 days, <14 days, on flight day

**If "Delay":**
- "How late did you arrive at your final destination?" — radio: <3h, >3h, connection flight lost

**If "Denied Boarding":**
- "Did you give up your seat voluntarily?" — radio: Yes, No
- If "No": "Reason behind denial of boarding" — radio: Flight overbooked, Aggressive behavior with staff, Intoxication, Unspecified reason

**If "Delay" or "Cancellation":**
- "Did the airline mention a disruption motive?" — radio: Yes, No, I don't know
- If "Yes": "What was the motive communicated by the airline?" — radio: Technical problem, Meteorological conditions, Strike, Problems with airport, Crew problems, Other motives

**If "Delay" or "Cancellation" or "Denied Boarding":**
- "Please describe in short what happened" — textarea (large, generous character limit)

### Form Section Placement

Replace the two placeholder sections ("Part 2: Disruption details" and "Part 3: Disruption motives") with a single "Part 2: Disruption Information" section.

## Testing

- Backend: Unit test for model creation, serializer validation (disruption required, no answer validation), API integration test
- Frontend: Component test for conditional rendering, form submission with disruption data
