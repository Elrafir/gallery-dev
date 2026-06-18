import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import type { TagOverrideResponseDto, TagOverrideUpsertDto } from 'src/dtos/primary-library.dto';
import {
  TagBulkAssetsDto,
  TagBulkAssetsResponseDto,
  TagCreateDto,
  TagResponseDto,
  TagUpdateDto,
  TagUpsertDto,
} from 'src/dtos/tag.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { TagService } from 'src/services/tag.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Tags)
@Controller('tags')
export class TagController {
  constructor(private service: TagService) {}

  @Post()
  @Authenticated({ permission: Permission.TagCreate })
  @Endpoint({
    summary: 'Create a tag',
    description: 'Create a new tag by providing a name and optional color.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createTag(@Auth() auth: AuthDto, @Body() dto: TagCreateDto): Promise<TagResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.TagRead })
  @Endpoint({
    summary: 'Retrieve tags',
    description: 'Retrieve a list of all tags.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAllTags(@Auth() auth: AuthDto): Promise<TagResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Put()
  @Authenticated({ permission: Permission.TagCreate })
  @Endpoint({
    summary: 'Upsert tags',
    description: 'Create or update multiple tags in a single request.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  upsertTags(@Auth() auth: AuthDto, @Body() dto: TagUpsertDto): Promise<TagResponseDto[]> {
    return this.service.upsert(auth, dto);
  }

  @Put('assets')
  @Authenticated({ permission: Permission.TagAsset })
  @Endpoint({
    summary: 'Tag assets',
    description: 'Add multiple tags to multiple assets in a single request.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  bulkTagAssets(@Auth() auth: AuthDto, @Body() dto: TagBulkAssetsDto): Promise<TagBulkAssetsResponseDto> {
    return this.service.bulkTagAssets(auth, dto);
  }

  // ─── Phase 3.3: User Tag Overrides ──────────────────────────────────────

  @Get('overrides')
  @Authenticated({ permission: Permission.TagRead })
  @Endpoint({
    summary: 'Get my tag overrides',
    description: 'Retrieve all tag overrides for the authenticated user.',
    history: new HistoryBuilder().added('v1'),
  })
  getOverrides(@Auth() auth: AuthDto): Promise<TagOverrideResponseDto[]> {
    return this.service.getOverrides(auth);
  }

  @Put(':id/override')
  @Authenticated({ permission: Permission.TagRead })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Upsert tag override',
    description: 'Create or update a personal tag override (hide, alias, color).',
    history: new HistoryBuilder().added('v1'),
  })
  upsertOverride(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: TagOverrideUpsertDto,
  ): Promise<void> {
    return this.service.upsertOverride(auth, id, dto);
  }

  @Delete(':id/override')
  @Authenticated({ permission: Permission.TagRead })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete tag override',
    description: 'Remove a personal tag override.',
    history: new HistoryBuilder().added('v1'),
  })
  deleteOverride(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.deleteOverride(auth, id);
  }

  // ─────────────────────────────────────────────────────────────────────────

  @Get(':id')
  @Authenticated({ permission: Permission.TagRead })
  @Endpoint({
    summary: 'Retrieve a tag',
    description: 'Retrieve a specific tag by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getTagById(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<TagResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.TagUpdate })
  @Endpoint({
    summary: 'Update a tag',
    description: 'Update an existing tag identified by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateTag(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: TagUpdateDto): Promise<TagResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.TagDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a tag',
    description: 'Delete a specific tag by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteTag(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ permission: Permission.TagAsset })
  @Endpoint({
    summary: 'Tag assets',
    description: 'Add a tag to all the specified assets.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  tagAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ permission: Permission.TagAsset })
  @Endpoint({
    summary: 'Untag assets',
    description: 'Remove a tag from all the specified assets.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  untagAssets(
    @Auth() auth: AuthDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
