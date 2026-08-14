1. React contains presentation and client-side interaction.
2. TanStack Query owns remote/server state.
3. NestJS owns business logic.
4. Controllers remain thin.
5. Business rules belong in application/domain services.
6. PostgreSQL/Prisma is persistence, not the domain model.
7. Do not put business logic inside Prisma repositories.
8. Do not expose Prisma models directly through API responses.
9. Booking and MentorshipRelationship remain separate concepts.
10. User remains separate from MentorProfile and ApprenticeProfile.
11. A user may eventually be both mentor and apprentice.
12. Payment state remains separate from booking state.
13. Every protected resource must enforce server-side authorization.
14. No real payment implementation in Validation Release A.
15. No AI recommendation engine in MVP.
