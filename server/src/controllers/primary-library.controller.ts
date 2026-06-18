/**
 * Контроллер API для управления базовой библиотекой (Primary Library).
 * Предоставляет эндпоинты для настройки системного пространства,
 * управления участниками и привязки библиотек.
 * Доступен только администраторам.
 */
import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import {
  PrimaryLibraryLinkLibraryDto,
  PrimaryLibraryTagsDto,
  UpdatePrimaryLibraryMemberDto,
  UpdatePrimaryLibrarySettingsDto,
} from 'src/dtos/primary-library.dto';
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { PrimaryLibraryService } from 'src/services/primary-library.service';

@ApiTags(ApiTag.SystemConfig)
@Controller('primary-library')
export class PrimaryLibraryController {
  constructor(private service: PrimaryLibraryService) {}

  @Get('settings')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @Endpoint({
    summary: 'Get Primary Library settings',
    description: 'Получить текущие настройки базовой библиотеки.',
    history: new HistoryBuilder().added('v1'),
  })
  getSettings() {
    return this.service.getSettings();
  }

  @Put('settings')
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @Endpoint({
    summary: 'Update Primary Library settings',
    description: 'Обновить настройки базовой библиотеки. Создаёт системное пространство при первом включении.',
    history: new HistoryBuilder().added('v1'),
  })
  updateSettings(@Body() dto: UpdatePrimaryLibrarySettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Get('members')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @Endpoint({
    summary: 'Get Primary Library members',
    description: 'Получить список участников базовой библиотеки.',
    history: new HistoryBuilder().added('v1'),
  })
  getMembers() {
    return this.service.getMembers();
  }

  @Put('members/:userId')
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @Endpoint({
    summary: 'Update Primary Library member settings',
    description: 'Обновить настройки участника базовой библиотеки.',
    history: new HistoryBuilder().added('v1'),
  })
  updateMember(@Param('userId') userId: string, @Body() dto: UpdatePrimaryLibraryMemberDto) {
    return this.service.updateMember(userId, dto);
  }

  @Delete('members/:userId')
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @Endpoint({
    summary: 'Remove user from Primary Library',
    description: 'Удалить пользователя из базовой библиотеки.',
    history: new HistoryBuilder().added('v1'),
  })
  removeMember(@Param('userId') userId: string) {
    return this.service.removeUser(userId);
  }

  @Put('members/enroll-all')
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @Endpoint({
    summary: 'Enroll all existing users',
    description: 'Зачислить всех существующих пользователей в базовую библиотеку.',
    history: new HistoryBuilder().added('v1'),
  })
  enrollAllUsers() {
    return this.service.enrollAllUsers();
  }

  @Get('libraries')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @Endpoint({
    summary: 'Get linked libraries',
    description: 'Получить список привязанных библиотек.',
    history: new HistoryBuilder().added('v1'),
  })
  getLinkedLibraries() {
    return this.service.getLinkedLibraries();
  }

  @Put('libraries')
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @Endpoint({
    summary: 'Link libraries to Primary Library',
    description: 'Привязать библиотеки администратора к базовой библиотеке.',
    history: new HistoryBuilder().added('v1'),
  })
  linkLibraries(@Body() dto: PrimaryLibraryLinkLibraryDto) {
    return this.service.linkLibraries(dto.libraryIds);
  }

  @Delete('libraries')
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @Endpoint({
    summary: 'Unlink libraries from Primary Library',
    description: 'Отвязать библиотеки от базовой библиотеки.',
    history: new HistoryBuilder().added('v1'),
  })
  unlinkLibraries(@Body() dto: PrimaryLibraryLinkLibraryDto) {
    return this.service.unlinkLibraries(dto.libraryIds);
  }

  // ─── Phase 3.3: Space Tag Management ───────────────────────────────────

  @Get('tags')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @Endpoint({
    summary: 'Get linked tags',
    description: 'Получить список тегов, привязанных к базовой библиотеке.',
    history: new HistoryBuilder().added('v1'),
  })
  getSpaceTags() {
    return this.service.getSpaceTags();
  }

  @Put('tags')
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @Endpoint({
    summary: 'Link tags to Primary Library',
    description: 'Привязать теги к базовой библиотеке.',
    history: new HistoryBuilder().added('v1'),
  })
  addSpaceTags(@Body() dto: PrimaryLibraryTagsDto) {
    return this.service.addSpaceTags(dto.tagIds);
  }

  @Delete('tags')
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @Endpoint({
    summary: 'Unlink tags from Primary Library',
    description: 'Отвязать теги от базовой библиотеки.',
    history: new HistoryBuilder().added('v1'),
  })
  unlinkSpaceTags(@Body() dto: PrimaryLibraryTagsDto) {
    return this.service.removeSpaceTags(dto.tagIds);
  }
}
