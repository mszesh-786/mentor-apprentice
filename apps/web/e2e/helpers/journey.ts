import { expect, type Page } from '@playwright/test'
import { SEEDED } from './catalogue'
import { registerStub, uniqueEmail } from './auth'

const DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

export async function registerMentor(page: Page, stamp: string) {
  const email = uniqueEmail(`e2e-mentor-${stamp}`)
  const displayName = `E2E Mentor ${stamp}`
  await registerStub(page, { displayName, email, persona: 'mentor' })
  await expect(page).toHaveURL(/\/mentor\/?$/)
  return { email, displayName }
}

export async function registerApprentice(page: Page, stamp: string) {
  const email = uniqueEmail(`e2e-apprentice-${stamp}`)
  const displayName = `E2E Apprentice ${stamp}`
  await registerStub(page, { displayName, email, persona: 'apprentice' })
  await expect(page).toHaveURL(/\/apprentice\/?$/)
  return { email, displayName }
}

export async function completeMentorSetup(page: Page, displayName: string) {
  await page.goto('/mentor/profile')
  await page.getByLabel('Headline').fill(`${displayName} — e2e mentor`)
  await page
    .getByLabel('Biography')
    .fill(
      'Experienced mentor for Playwright happy-path coverage of the full journey.',
    )
  await page.getByLabel('General location').fill('Helsinki')
  await page.getByLabel('Timezone (IANA)').fill('Europe/Helsinki')
  await page.getByRole('button', { name: 'Create profile' }).click()
  await expect(page.getByText('Profile created')).toBeVisible()

  await page.goto('/mentor/languages')
  await page.getByRole('button', { name: SEEDED.languageName }).click()
  await page.getByRole('button', { name: 'Save languages' }).click()
  await expect(page.getByText('Languages updated')).toBeVisible()

  await page.goto('/mentor/expertise')
  await page.getByTestId('expertise-skill-select').click()
  await page.getByRole('option', { name: SEEDED.skillName }).click()
  await page.getByRole('button', { name: 'Add expertise' }).click()
  await expect(page.getByText('Expertise added')).toBeVisible()

  await page.goto('/mentor/verification')
  await page.getByRole('button', { name: 'Start verification' }).click()
  await expect(page.getByText('Identity verification started')).toBeVisible()
  await page.getByRole('button', { name: 'Stub: VERIFIED' }).click()
  await expect(page.getByText('Stub result applied: VERIFIED')).toBeVisible()

  await page.goto('/mentor/availability')
  for (let i = 0; i < DAYS.length; i += 1) {
    await page.getByRole('button', { name: 'Add rule' }).click()
  }
  const ruleCards = page.locator('div.grid.gap-3.rounded-md.border.p-3')
  await expect(ruleCards).toHaveCount(DAYS.length)
  for (let i = 0; i < DAYS.length; i += 1) {
    const card = ruleCards.nth(i)
    await card.getByRole('combobox').click()
    await page.getByRole('option', { name: DAYS[i], exact: true }).click()
    const inputs = card.locator('input')
    await inputs.nth(0).fill('08:00')
    await inputs.nth(1).fill('20:00')
  }
  await page.getByRole('button', { name: 'Save availability' }).click()
  await expect(page.getByText('Availability saved')).toBeVisible()

  await page.goto('/mentor/publish')
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(page.getByText('Profile published')).toBeVisible()
  await expect(page.getByText('Bookable', { exact: true })).toBeVisible()
}

export async function completeApprenticeProfile(page: Page) {
  await page.goto('/apprentice/profile')
  await page.getByLabel('Short bio').fill('Learning car maintenance via e2e')
  await page.getByLabel('General location').fill('Helsinki')
  await page.getByRole('button', { name: 'Create profile' }).click()
  await expect(page.getByText('Profile created')).toBeVisible()
}

export async function bookFirstSlotWithMentor(
  page: Page,
  mentorDisplayName: string,
) {
  await page.goto('/apprentice/discover')
  await page.getByTestId('discover-skill-select').click()
  await page.getByRole('option', { name: SEEDED.skillName }).click()
  await expect(page.getByTestId('discover-skill-select')).toContainText(
    SEEDED.skillName,
  )
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page.getByText(/^[1-9]\d* mentors? found$/)).toBeVisible({
    timeout: 20_000,
  })

  await page
    .getByRole('heading', { name: mentorDisplayName })
    .locator('xpath=ancestor::div[contains(@class,\"rounded-lg\")][1]')
    .getByRole('link', { name: 'View' })
    .click()

  await expect(page).toHaveURL(/\/apprentice\/discover\//)
  await expect(
    page.getByRole('heading', { name: mentorDisplayName }),
  ).toBeVisible()

  const slot = page.getByTestId('booking-slot').first()
  await expect(slot).toBeVisible({ timeout: 30_000 })
  await slot.click()
  await page.getByRole('button', { name: 'Request booking' }).click()
  await expect(page).toHaveURL(/\/apprentice\/bookings/)
}

export async function acceptLatestBooking(page: Page) {
  await page.goto('/mentor/bookings')
  await expect(page.getByText('REQUESTED').first()).toBeVisible()
  await page.getByRole('button', { name: 'Accept' }).first().click()
  await expect(page.getByText('Booking accepted')).toBeVisible()
  await page.getByRole('link', { name: 'Open session' }).first().click()
  await expect(page).toHaveURL(/\/mentor\/sessions\//)
}

export async function openFirstApprenticeSession(page: Page) {
  await page.goto('/apprentice/sessions')
  await page.getByRole('link', { name: 'Open' }).first().click()
  await expect(page).toHaveURL(/\/apprentice\/sessions\//)
}

export async function joinSession(page: Page) {
  await page.getByRole('button', { name: 'Join', exact: true }).click()
  await expect(page.getByText('Joined session')).toBeVisible()
}

export async function completeSession(page: Page) {
  await page.getByRole('button', { name: 'Complete', exact: true }).click()
  await expect(page.getByText('Session completed')).toBeVisible()
  await expect(page.getByText('COMPLETED', { exact: true })).toBeVisible()
}

async function answerYes(page: Page, label: string) {
  await page.getByLabel(label).click()
  await page.getByRole('option', { name: 'Yes' }).click()
}

export async function submitApprenticeFeedback(page: Page) {
  await answerYes(page, 'Was the session useful?')
  await answerYes(page, 'Were explanations clear?')
  await answerYes(page, 'Did you make progress toward your goal?')
  await answerYes(page, 'Would you book this mentor again?')
  await page.getByRole('button', { name: 'Submit feedback' }).click()
  await expect(page.getByText('Feedback submitted')).toBeVisible()
}

export async function submitMentorFeedback(page: Page) {
  await answerYes(page, 'Was the apprentice respectful?')
  await answerYes(page, 'Was the learning goal clear?')
  await answerYes(page, 'Would you mentor this apprentice again?')
  await page.getByRole('button', { name: 'Submit feedback' }).click()
  await expect(page.getByText('Feedback submitted')).toBeVisible()
}

export async function continueMentorshipWithGoal(page: Page, goalTitle: string) {
  await page.getByLabel('Goal title (optional)').fill(goalTitle)
  await page
    .getByLabel('Goal description (optional)')
    .fill('E2E continued learning path')
  await page.getByRole('button', { name: 'Continue with this mentor' }).click()
  await expect(page).toHaveURL(/\/mentorships\//)
}

export async function upsertMentorshipGoal(page: Page, title: string) {
  await page.getByLabel('Goal title').fill(title)
  await page.getByLabel('Description (optional)').fill('Track e2e progress')
  await page.getByRole('button', { name: 'Save goal' }).click()
  await expect(page.getByText(title)).toBeVisible()
}
