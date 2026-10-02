import { Injectable } from '@nestjs/common';
import {
  BookingStatus,
  Prisma,
  SessionStatus,
  VideoProvider,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { createStubVideoRoom } from '../../sessions/providers/stub-video.provider';
import { Booking } from '../domain/booking';

const bookingInclude = {
  mentorProfile: {
    include: { user: { select: { id: true, displayName: true } } },
  },
  apprenticeProfile: {
    include: { user: { select: { id: true, displayName: true } } },
  },
  skill: { select: { id: true, name: true } },
} as const;

type BookingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    mentorProfileId: string;
    apprenticeProfileId: string;
    skillId: string;
    startAt: Date;
    endAt: Date;
    timezoneSnapshot: string;
    apprenticeMessage?: string;
    relationshipId?: string;
  }): Promise<Booking> {
    const row = await this.prisma.booking.create({
      data: {
        mentorProfileId: input.mentorProfileId,
        apprenticeProfileId: input.apprenticeProfileId,
        skillId: input.skillId,
        startAt: input.startAt,
        endAt: input.endAt,
        timezoneSnapshot: input.timezoneSnapshot,
        apprenticeMessage: input.apprenticeMessage,
        relationshipId: input.relationshipId,
        status: BookingStatus.REQUESTED,
      },
      include: bookingInclude,
    });
    return this.toDomain(row);
  }

  async findById(id: string): Promise<Booking | null> {
    const row = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    return row ? this.toDomain(row) : null;
  }

  async listForMentorUser(
    mentorUserId: string,
    options?: { upcoming?: boolean },
  ): Promise<Booking[]> {
    const now = new Date();
    const rows = await this.prisma.booking.findMany({
      where: {
        mentorProfile: { userId: mentorUserId },
        ...(options?.upcoming === true
          ? {
              endAt: { gte: now },
              status: {
                in: [BookingStatus.REQUESTED, BookingStatus.ACCEPTED],
              },
            }
          : options?.upcoming === false
            ? {
                OR: [
                  { endAt: { lt: now } },
                  {
                    status: {
                      in: [
                        BookingStatus.DECLINED,
                        BookingStatus.CANCELLED,
                        BookingStatus.COMPLETED,
                        BookingStatus.NO_SHOW,
                      ],
                    },
                  },
                ],
              }
            : {}),
      },
      include: bookingInclude,
      orderBy: { startAt: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async listForApprenticeUser(
    apprenticeUserId: string,
    options?: { upcoming?: boolean },
  ): Promise<Booking[]> {
    const now = new Date();
    const rows = await this.prisma.booking.findMany({
      where: {
        apprenticeProfile: { userId: apprenticeUserId },
        ...(options?.upcoming === true
          ? {
              endAt: { gte: now },
              status: {
                in: [BookingStatus.REQUESTED, BookingStatus.ACCEPTED],
              },
            }
          : options?.upcoming === false
            ? {
                OR: [
                  { endAt: { lt: now } },
                  {
                    status: {
                      in: [
                        BookingStatus.DECLINED,
                        BookingStatus.CANCELLED,
                        BookingStatus.COMPLETED,
                        BookingStatus.NO_SHOW,
                      ],
                    },
                  },
                ],
              }
            : {}),
      },
      include: bookingInclude,
      orderBy: { startAt: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findReservedOverlapping(
    mentorProfileId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<Booking[]> {
    const rows = await this.prisma.booking.findMany({
      where: {
        mentorProfileId,
        status: {
          in: [BookingStatus.ACCEPTED, BookingStatus.CONFIRMED],
        },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      include: bookingInclude,
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findRequestedOverlapping(
    mentorProfileId: string,
    startAt: Date,
    endAt: Date,
    excludeBookingId?: string,
  ): Promise<Booking[]> {
    const rows = await this.prisma.booking.findMany({
      where: {
        mentorProfileId,
        status: BookingStatus.REQUESTED,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      include: bookingInclude,
    });
    return rows.map((row) => this.toDomain(row));
  }

  async acceptWithConflictDecline(
    bookingId: string,
    conflictIds: string[],
  ): Promise<Booking> {
    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; status: string }>>`
        SELECT id, status FROM bookings
        WHERE id = ${bookingId}
        FOR UPDATE
      `;
      if (!locked[0] || locked[0].status !== BookingStatus.REQUESTED) {
        throw new Error('BOOKING_NOT_PENDING');
      }

      const overlaps = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM bookings
        WHERE "mentorProfileId" = (
          SELECT "mentorProfileId" FROM bookings WHERE id = ${bookingId}
        )
        AND status IN ('ACCEPTED', 'CONFIRMED')
        AND "startAt" < (SELECT "endAt" FROM bookings WHERE id = ${bookingId})
        AND "endAt" > (SELECT "startAt" FROM bookings WHERE id = ${bookingId})
        FOR UPDATE
      `;
      if (overlaps.length > 0) {
        throw new Error('BOOKING_SLOT_RESERVED');
      }

      const accepted = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.ACCEPTED },
        include: bookingInclude,
      });

      const room = createStubVideoRoom(bookingId);
      await tx.session.create({
        data: {
          bookingId,
          status: SessionStatus.READY,
          videoProvider: VideoProvider.STUB,
          externalRoomId: room.externalRoomId,
          joinUrl: room.joinUrl,
        },
      });

      if (conflictIds.length > 0) {
        await tx.booking.updateMany({
          where: {
            id: { in: conflictIds },
            status: BookingStatus.REQUESTED,
          },
          data: {
            status: BookingStatus.DECLINED,
            declineReason: 'CONFLICT',
          },
        });
      }

      return this.toDomain(accepted);
    });
  }

  async findOpenBetweenUsers(
    userAId: string,
    userBId: string,
  ): Promise<Booking[]> {
    const rows = await this.prisma.booking.findMany({
      where: {
        status: {
          in: [BookingStatus.REQUESTED, BookingStatus.ACCEPTED],
        },
        OR: [
          {
            mentorProfile: { userId: userAId },
            apprenticeProfile: { userId: userBId },
          },
          {
            mentorProfile: { userId: userBId },
            apprenticeProfile: { userId: userAId },
          },
        ],
      },
      include: bookingInclude,
    });
    return rows.map((row) => this.toDomain(row));
  }

  async updateStatus(
    id: string,
    data: {
      status: BookingStatus;
      declineReason?: string | null;
      cancelledByUserId?: string | null;
      cancelReason?: string | null;
    },
  ): Promise<Booking> {
    const row = await this.prisma.booking.update({
      where: { id },
      data,
      include: bookingInclude,
    });
    return this.toDomain(row);
  }

  private toDomain(row: BookingRow): Booking {
    return {
      id: row.id,
      mentorProfileId: row.mentorProfileId,
      apprenticeProfileId: row.apprenticeProfileId,
      skillId: row.skillId,
      relationshipId: row.relationshipId,
      startAt: row.startAt,
      endAt: row.endAt,
      timezoneSnapshot: row.timezoneSnapshot,
      status: row.status,
      apprenticeMessage: row.apprenticeMessage,
      declineReason: row.declineReason,
      cancelledByUserId: row.cancelledByUserId,
      cancelReason: row.cancelReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      mentorDisplayName: row.mentorProfile.user.displayName,
      apprenticeDisplayName: row.apprenticeProfile.user.displayName,
      skillName: row.skill.name,
      mentorUserId: row.mentorProfile.user.id,
      apprenticeUserId: row.apprenticeProfile.user.id,
    };
  }
}
