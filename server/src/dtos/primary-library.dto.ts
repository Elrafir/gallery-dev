/**
 * DTO для настройки и управления системой базовой библиотеки (Primary Library).
 * Определяет схемы запросов и ответов для API администратора.
 */
import z from 'zod';

/** Схема настроек Primary Library */
export const PrimaryLibrarySettingsSchema = z.object({
  enabled: z.boolean().describe('Включена ли система базовой библиотеки'),
  spaceId: z.string().uuid().nullable().describe('ID системного пространства'),
  adminUserId: z.string().uuid().nullable().describe('ID пользователя-источника'),
  autoEnrollNewUsers: z.boolean().describe('Автоматически добавлять новых пользователей'),
  sharePeople: z.boolean().describe('Расшарить распознанные лица'),
  shareTags: z.boolean().describe('Расшарить теги'),
  defaultShowInTimeline: z.boolean().describe('По умолчанию показывать базу в таймлайне'),
  defaultShowInMap: z.boolean().describe('По умолчанию показывать базу на карте'),
  defaultShowInMemories: z.boolean().describe('По умолчанию показывать базу в воспоминаниях'),
});

export type PrimaryLibrarySettingsDto = z.infer<typeof PrimaryLibrarySettingsSchema>;

/** Схема обновления настроек (все поля опциональны) */
export const UpdatePrimaryLibrarySettingsSchema = z.object({
  enabled: z.boolean().optional().describe('Включить/выключить систему'),
  adminUserId: z.string().uuid().optional().describe('ID пользователя-источника'),
  autoEnrollNewUsers: z.boolean().optional().describe('Автоматически добавлять новых пользователей'),
  sharePeople: z.boolean().optional().describe('Расшарить распознанные лица'),
  shareTags: z.boolean().optional().describe('Расшарить теги'),
  defaultShowInTimeline: z.boolean().optional().describe('По умолчанию показывать базу в таймлайне'),
  defaultShowInMap: z.boolean().optional().describe('По умолчанию показывать базу на карте'),
  defaultShowInMemories: z.boolean().optional().describe('По умолчанию показывать базу в воспоминаниях'),
});

export type UpdatePrimaryLibrarySettingsDto = z.infer<typeof UpdatePrimaryLibrarySettingsSchema>;

/** Схема ответа с настройками Primary Library */
export const PrimaryLibrarySettingsResponseSchema = PrimaryLibrarySettingsSchema.extend({
  memberCount: z.number().describe('Количество участников'),
  libraryCount: z.number().describe('Количество привязанных библиотек'),
});

export type PrimaryLibrarySettingsResponseDto = z.infer<typeof PrimaryLibrarySettingsResponseSchema>;

/** Схема обновления настроек участника Primary Library */
export const UpdatePrimaryLibraryMemberSchema = z.object({
  showInTimeline: z.boolean().optional().describe('Показывать базу в таймлайне'),
  inheritPeople: z.boolean().optional().describe('Наследовать лица'),
  inheritTags: z.boolean().optional().describe('Наследовать теги'),
  showInMap: z.boolean().optional().describe('Показывать на карте'),
  showInMemories: z.boolean().optional().describe('Показывать в воспоминаниях'),
});

export type UpdatePrimaryLibraryMemberDto = z.infer<typeof UpdatePrimaryLibraryMemberSchema>;

/** Схема ответа участника */
export const PrimaryLibraryMemberResponseSchema = z.object({
  userId: z.string().uuid(),
  userName: z.string(),
  userEmail: z.string(),
  role: z.string(),
  showInTimeline: z.boolean(),
  inheritPeople: z.boolean(),
  inheritTags: z.boolean(),
  showInMap: z.boolean(),
  showInMemories: z.boolean(),
  joinedAt: z.string().datetime(),
});

export type PrimaryLibraryMemberResponseDto = z.infer<typeof PrimaryLibraryMemberResponseSchema>;

/** Схема для привязки/отвязки библиотек */
export const PrimaryLibraryLinkLibrarySchema = z.object({
  libraryIds: z.array(z.string().uuid()).describe('ID библиотек для привязки'),
});

export type PrimaryLibraryLinkLibraryDto = z.infer<typeof PrimaryLibraryLinkLibrarySchema>;
