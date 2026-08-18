import { Module } from '@nestjs/common';
import { LanguagesService } from './application/languages.service';
import { LanguagesController } from './languages.controller';
import { LanguagesRepository } from './persistence/languages.repository';

@Module({
  controllers: [LanguagesController],
  providers: [LanguagesService, LanguagesRepository],
  exports: [LanguagesService],
})
export class LanguagesModule {}
