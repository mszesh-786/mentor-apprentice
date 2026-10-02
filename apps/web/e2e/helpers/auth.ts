import type { Page } from '@playwright/test'

export type StubPersona = 'mentor' | 'apprentice' | 'dual'

export function uniqueEmail(prefix: string): string {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${prefix}+${stamp}@example.com`
}

/** Stub register via /register. Default persona Mentor. */
export async function registerStub(
  page: Page,
  input: {
    displayName: string
    email: string
    persona?: StubPersona
  },
): Promise<void> {
  const persona = input.persona ?? 'mentor'
  await page.goto('/register')
  await page.getByLabel('Display name').fill(input.displayName)
  await page.getByLabel('Email').fill(input.email)

  if (persona !== 'mentor') {
    await page.getByTestId('register-persona-select').click()
    const option =
      persona === 'apprentice' ? 'Apprentice' : 'Both'
    await page.getByRole('option', { name: option, exact: true }).click()
  }

  await page.getByRole('button', { name: 'Create account' }).click()
}
