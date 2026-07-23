# Air-Assist Agent Context

## Overview
Air-Assist is a claim management application for passenger compensation requests under European Regulation EC261/2004. It helps automate the end-to-end process of checking eligibility, managing documents, handling legal review, and closing compensation cases.

## Business Goal
The application aims to reduce manual work and processing time for flight compensation claims related to delays, cancellations, and denied boarding. Compensation is determined by flight distance and is typically 250 EUR, 400 EUR, or 600 EUR.

## Main Workflow
1. Case Entry: a passenger submits a claim through a public eligibility form, without creating an account first.
2. Eligibility Check: the system validates flight details, incident type, airline, and declared reason, then requests supporting documents.
3. Legal Proceeding: eligible or conditionally eligible cases can be prepared for legal review, and claim documents can be generated in Word or PDF.
4. Case Closure: after the airline responds, the case is closed; if compensation is approved, payment data is collected and the payout is processed.

## User Roles
- Passenger: creates claims, uploads documents, views personal cases, and communicates through comments.
- Colleague: manages cases, creates flights, links cases to flights, and assigns cases to attorneys.
- Attorney: reviews legal cases, adds documents, and communicates with colleagues.
- System Administrator: manages users, edits data, and configures application parameters such as SMTP and PDF templates.

## Technology Stack
- Backend: Django
- API: Django REST Framework
- Frontend: React
- Database: PostgreSQL
- Security: authentication and authorization for users and access control

## Registration Form Data
The dynamic registration form collects:
- full flight itinerary, including stopovers
- incident type: delay, cancellation, or denied boarding
- airline-reported reason
- email address and GDPR consent
- complete flight details
- passenger personal information

## Eligibility Logic
The system checks whether the case meets EC261/2004 conditions. If the passenger is not eligible, the application informs them and allows submission of another flight. If eligible, it creates the case automatically, generates the PDF contract, and sends notifications to the passenger and the company staff.

## Notes for Future Work
- Keep terminology consistent with claim management and EC261/2004.
- Preserve the four-stage workflow when adding features or changing business logic.
- Treat document generation, legal review, and payment as important downstream steps.