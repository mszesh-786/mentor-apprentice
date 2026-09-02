import { expect, test } from '@playwright/test'
import { registerStub, uniqueEmail } from './helpers/auth'

test.describe('scaffold smoke', () => {
  test('registers a mentor and lands on mentor home', async ({ page }) => {
    const email = uniqueEmail('e2e-mentor')
    await registerStub(page, {
      displayName: 'E2E Mentor',
      email,
      persona: 'mentor',
    })

    await expect(page).toHaveURL(/\/mentor\/?$/)
    await expect(
      page.getByRole('heading', { name: 'Mentor home' }),
    ).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()
  })
})
