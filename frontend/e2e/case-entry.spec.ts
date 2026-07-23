import { expect, type Page, request as playwrightRequest, test } from '@playwright/test'

const backendOrigin = process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:8000'

function uniqueReservationNumber() {
  return `PW${Date.now()}${Math.floor(Math.random() * 1000)}`
}

async function fillAirportAutocomplete(page: Page, label: string, query: string) {
  const input = page.getByLabel(label)

  await input.fill(query)
  await expect(page.getByRole('button', { name: new RegExp(`^${query} -`) }).first()).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: new RegExp(`^${query} -`) }).first().click()
  await expect(input).toHaveValue(query)
}

async function fillValidCase(page: Page) {
  const reservationNumber = uniqueReservationNumber()

  await page.getByLabel('Reservation number').fill(reservationNumber)
  await page.getByLabel('Flight date').fill('2026-08-20')
  await page.getByLabel('Flight number').fill('RO101')
  await page.getByLabel('Airline').fill('Tarom')
  await fillAirportAutocomplete(page, 'Departing airport code', 'OTP')
  await fillAirportAutocomplete(page, 'Destination airport code', 'FRA')
  await page.getByLabel('Planned departure time').fill('2026-08-20T08:30')
  await page.getByLabel('Planned arrival time').fill('2026-08-20T11:15')

  await page.getByRole('radio', { name: 'Mark segment 1 as the problem flight' }).check()

  await page.getByLabel('Email').fill('playwright.case01@example.com')
  await page.getByRole('group', { name: 'GDPR policy decision' }).getByLabel('Agree', { exact: true }).check()
  await page.getByRole('group', { name: 'Receive case updates by email' }).getByLabel('Agree', { exact: true }).check()

  await page.getByLabel('First name').fill('Ana')
  await page.getByLabel('Last name').fill('Ionescu')
  await page.getByLabel('Date of birth').fill('1990-05-12')
  await page.getByLabel('Phone').fill('+40123456789')
  await page.getByLabel('Address').fill('123 Main Street')
  await page.getByLabel('Postal code').fill('400001')

  await page.getByLabel('Boarding pass').setInputFiles({
    name: 'boarding-pass.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n% Playwright fixture\n'),
  })
  await page.getByLabel('ID or passport').setInputFiles({
    name: 'passport.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake-jpeg-content'),
  })

  return reservationNumber
}

test.beforeAll(async () => {
  const api = await playwrightRequest.newContext()
  const response = await api.get(`${backendOrigin}/api/health/`)

  expect(response.ok(), 'Backend health endpoint must be reachable before e2e runs.').toBeTruthy()

  const payload = await response.json()

  expect(payload).toMatchObject({
    status: 'ok',
    backend: 'ok',
    database: 'ok',
  })

  await api.dispose()
})

test('shows browser validation when required fields are missing', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Create compensation case' }).click()

  await expect(page.getByText('Reservation number is required.')).toBeVisible()
  await expect(page.getByText('Boarding pass is required.')).toBeVisible()
  await expect(page.getByText('Identity document is required.')).toBeVisible()
})

test('adds and removes connecting flights up to the supported limit', async ({ page }) => {
  await page.goto('/')

  const addButton = page.getByRole('button', { name: 'Add connecting flight' })

  await addButton.click()
  await addButton.click()
  await addButton.click()
  await addButton.click()

  await expect(page.getByText('5 flight segments')).toBeVisible()
  await expect(addButton).toBeDisabled()

  await page.getByRole('button', { name: 'Remove segment' }).first().click()

  await expect(page.getByText('4 flight segments')).toBeVisible()
  await expect(addButton).toBeEnabled()
})

test('submits a valid case against the live backend', async ({ page }) => {
  await page.goto('/')

  const reservationNumber = await fillValidCase(page)

  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) => candidate.url() === `${backendOrigin}/api/cases/` && candidate.request().method() === 'POST' && candidate.status() === 201,
      { timeout: 30000 },
    ),
    page.getByRole('button', { name: 'Create compensation case' }).click(),
  ])

  const payload = await response.json()

  expect(payload).toMatchObject({
    status: 'NEW',
    reservation_number: reservationNumber,
  })
  expect(typeof payload.id).toBe('number')

  await expect(page.getByRole('status')).toContainText(`Case #${payload.id} was created successfully with status NEW.`)
})