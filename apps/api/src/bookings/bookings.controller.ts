import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BookingsService } from './application/bookings.service';
import { BookingResponseDto, CreateBookingDto } from './dto/booking.dto';
import { toBookingResponse } from './mappers/booking.mapper';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.APPRENTICE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingsService.create(user, dto);
    return toBookingResponse(booking);
  }

  @Get('me')
  async listMine(
    @CurrentUser() user: AuthUser,
    @Query('upcoming') upcoming?: string,
  ): Promise<BookingResponseDto[]> {
    const parsed =
      upcoming === 'true' ? true : upcoming === 'false' ? false : undefined;
    const bookings = await this.bookingsService.listMine(user, {
      upcoming: parsed,
    });
    return bookings.map(toBookingResponse);
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingsService.getById(user, id);
    return toBookingResponse(booking);
  }

  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(Role.MENTOR)
  @HttpCode(HttpStatus.OK)
  async accept(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingsService.accept(user, id);
    return toBookingResponse(booking);
  }

  @Post(':id/decline')
  @UseGuards(RolesGuard)
  @Roles(Role.MENTOR)
  @HttpCode(HttpStatus.OK)
  async decline(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingsService.decline(user, id);
    return toBookingResponse(booking);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingsService.cancel(user, id);
    return toBookingResponse(booking);
  }
}
