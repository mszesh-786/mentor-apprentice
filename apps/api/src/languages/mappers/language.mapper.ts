import { Language } from "../domain/language";
import {LanguageResponseDto} from "../dto/language-response.dto";

export function toLanguageResponse(language: Language): LanguageResponseDto {
    return {
        id: language.id,
        code: language.code,
        name: language.name,
        sortOrder: language.sortOrder,
    };
}