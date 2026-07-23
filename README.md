# Air-Assist Case 01

This repository contains the initial implementation for Air-Assist Case_01, the public passenger case-entry flow for EC261/2004 compensation requests.

## Structure

- `backend/`: Django + Django REST Framework API, PostgreSQL configuration, airport proxy integration, and backend tests.
- `frontend/`: React + Vite + TypeScript case-entry interface with Vitest coverage.

## Local database setup

1. Install PostgreSQL locally.
2. Create a database and user, for example:
	- database: `air_assist`
	- user: `postgres`
	- password: `postgres`
3. Copy values from `backend/env.sample` into a local `backend/.env` file.
4. Adjust the PostgreSQL credentials in `backend/.env` to match your local instance.

## Backend setup

1. Create and activate the virtual environment if needed:
	- Windows PowerShell: `backend\.venv\Scripts\Activate.ps1`
2. Install dependencies:
	- `backend\.venv\Scripts\python -m pip install -r backend/requirements.txt`
3. Apply migrations:
	- `cd backend`
	- `.\.venv\Scripts\python manage.py migrate`
4. Run backend tests:
	- `.\.venv\Scripts\python manage.py test cases.tests`
5. Start the API:
	- `.\.venv\Scripts\python manage.py runserver`

The backend serves:

- `POST /api/cases/`
- `GET /api/airports/?query=OTP`

## Frontend setup

1. Install dependencies:
	- `cd frontend`
	- `npm install`
2. Run frontend tests:
	- `npm test`
3. Start the dev server:
	- `npm run dev`

The frontend expects the backend API at `http://localhost:8000/api` by default. Override it with `VITE_API_BASE_URL` if needed.

## Implemented Case_01 scope

- Public case-entry form with six-part structure, including Case_03 placeholders for disruption details and motives.
- Required-field validation across itinerary, contact, passenger, GDPR, and document inputs.
- Up to four connecting flights and one mandatory problem-flight selection.
- Airport code lookup through a backend proxy for AirportGap.
- Boarding pass and ID/passport upload validation for PDF/JPG/JPEG up to 5 MB.
- Initial case status set to `NEW`.
- Automated backend and frontend test suites.
"# catalina_vasiu" 
