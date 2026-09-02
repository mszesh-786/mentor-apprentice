import { expect, test } from '@playwright/test'
import {
  acceptLatestBooking,
  bookFirstSlotWithMentor,
  completeApprenticeProfile,
  completeMentorSetup,
  completeSession,
  continueMentorshipWithGoal,
  joinSession,
  openFirstApprenticeSession,
  registerApprentice,
  registerMentor,
  submitApprenticeFeedback,
  submitMentorFeedback,
  upsertMentorshipGoal,
} from './helpers/journey'

test.describe('happy path', () => {
  test('mentor publish → apprentice book → session → mentorship + goal', async ({
    browser,
  }) => {
    test.setTimeout(180_000)

    const stamp = `${Date.now()}`
    const mentorContext = await browser.newContext()
    const apprenticeContext = await browser.newContext()
    const mentorPage = await mentorContext.newPage()
    const apprenticePage = await apprenticeContext.newPage()

    try {
      const mentor = await registerMentor(mentorPage, stamp)
      await completeMentorSetup(mentorPage, mentor.displayName)

      await registerApprentice(apprenticePage, stamp)
      await completeApprenticeProfile(apprenticePage)
      await bookFirstSlotWithMentor(apprenticePage, mentor.displayName)

      await acceptLatestBooking(mentorPage)
      await joinSession(mentorPage)

      await openFirstApprenticeSession(apprenticePage)
      await joinSession(apprenticePage)
      await completeSession(apprenticePage)
      await submitApprenticeFeedback(apprenticePage)

      await mentorPage.reload()
      await expect(
        mentorPage.getByText('COMPLETED', { exact: true }),
      ).toBeVisible()
      await submitMentorFeedback(mentorPage)

      const goalFromContinue = `Continue goal ${stamp}`
      await continueMentorshipWithGoal(apprenticePage, goalFromContinue)

      const goalTitle = `Shared goal ${stamp}`
      await upsertMentorshipGoal(apprenticePage, goalTitle)
      await expect(apprenticePage.getByText(goalTitle)).toBeVisible()
    } finally {
      await mentorContext.close()
      await apprenticeContext.close()
    }
  })
})
