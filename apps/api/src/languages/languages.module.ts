import { Module } from '@nestjs/common';
import {LanguagesController} from './languages.controller';
import {LanguageService} from './application/languages.service';
import {LanguagesRepository} from './persistence/languages.repository';import {PrismaService} from '../database/prisma.service';

@Module({
    controllers: [LanguagesController],
    providers: [LanguageService, LanguagesRepository],
    exports: [LanguageService],
})
export class LanguagesModule {}