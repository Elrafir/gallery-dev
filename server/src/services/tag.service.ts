import { BadRequestException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { OnJob } from 'src/decorators';
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
  mapTag,
} from 'src/dtos/tag.dto';
import { JobName, JobStatus, Permission, QueueName, SystemMetadataKey } from 'src/enum';
import { TagAssetTable } from 'src/schema/tables/tag-asset.table';
import { BaseService } from 'src/services/base.service';
import { addAssets, removeAssets } from 'src/utils/asset.util';
import { updateLockedColumns } from 'src/utils/database';
import { upsertTags } from 'src/utils/tag';
import type { PrimaryLibrarySettings } from 'src/types';

@Injectable()
export class TagService extends BaseService {
  async getAll(auth: AuthDto) {
    const tags = await this.tagRepository.getAll(auth.user.id);
    return tags.map((tag) => mapTag(tag));
  }

  async get(auth: AuthDto, id: string): Promise<TagResponseDto> {
    await this.requireAccess({ auth, permission: Permission.TagRead, ids: [id] });
    const tag = await this.findOrFail(id);
    return mapTag(tag);
  }

  async create(auth: AuthDto, dto: TagCreateDto) {
    let parent;
    if (dto.parentId) {
      await this.requireAccess({ auth, permission: Permission.TagRead, ids: [dto.parentId] });
      parent = await this.tagRepository.get(dto.parentId);
      if (!parent) {
        throw new BadRequestException('Tag not found');
      }
    }

    const userId = auth.user.id;
    const value = parent ? `${parent.value}/${dto.name}` : dto.name;
    const duplicate = await this.tagRepository.getByValue(userId, value);
    if (duplicate) {
      throw new BadRequestException(`A tag with that name already exists`);
    }

    const { color } = dto;
    const tag = await this.tagRepository.create({ userId, value, color, parentId: parent?.id });

    return mapTag(tag);
  }

  async update(auth: AuthDto, id: string, dto: TagUpdateDto): Promise<TagResponseDto> {
    await this.requireAccess({ auth, permission: Permission.TagUpdate, ids: [id] });

    const { color } = dto;
    const tag = await this.tagRepository.update(id, { color });
    return mapTag(tag);
  }

  async upsert(auth: AuthDto, dto: TagUpsertDto) {
    const tags = await upsertTags(this.tagRepository, { userId: auth.user.id, tags: dto.tags });
    return tags.map((tag) => mapTag(tag));
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.TagDelete, ids: [id] });

    // TODO sync tag changes for affected assets

    await this.tagRepository.delete(id);
  }

  async bulkTagAssets(auth: AuthDto, dto: TagBulkAssetsDto): Promise<TagBulkAssetsResponseDto> {
    const [tagIds, assetIds] = await Promise.all([
      this.checkAccess({ auth, permission: Permission.TagAsset, ids: dto.tagIds }),
      this.checkAccess({ auth, permission: Permission.AssetUpdate, ids: dto.assetIds }),
    ]);

    const items: Insertable<TagAssetTable>[] = [];
    for (const tagId of tagIds) {
      for (const assetId of assetIds) {
        items.push({ tagId, assetId });
      }
    }

    const results = await this.tagRepository.upsertAssetIds(items);
    for (const assetId of new Set(results.map((item) => item.assetId))) {
      await this.updateTags(assetId);
      await this.eventRepository.emit('AssetTag', { assetId });
    }

    return { count: results.length };
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.TagAsset, ids: [id] });

    const results = await addAssets(
      auth,
      { access: this.accessRepository, bulk: this.tagRepository },
      { parentId: id, assetIds: dto.ids },
    );

    for (const { id: assetId, success } of results) {
      if (success) {
        await this.updateTags(assetId);
        await this.eventRepository.emit('AssetTag', { assetId });
      }
    }

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.TagAsset, ids: [id] });

    const results = await removeAssets(
      auth,
      { access: this.accessRepository, bulk: this.tagRepository },
      { parentId: id, assetIds: dto.ids, canAlwaysRemove: Permission.TagDelete },
    );

    for (const { id: assetId, success } of results) {
      if (success) {
        await this.updateTags(assetId);
        await this.eventRepository.emit('AssetUntag', { assetId });
      }
    }

    return results;
  }

  @OnJob({ name: JobName.TagCleanup, queue: QueueName.BackgroundTask })
  async handleTagCleanup() {
    await this.tagRepository.deleteEmptyTags();
    return JobStatus.Success;
  }

  // ==========================================
  // Phase 3.3: Tag Overrides (user-facing)
  // ==========================================

  /**
   * Создать или обновить пользовательский override для тега.
   */
  async upsertOverride(auth: AuthDto, tagId: string, dto: TagOverrideUpsertDto): Promise<void> {
    const spaceId = await this.getSystemSpaceId();
    if (!spaceId) {
      throw new BadRequestException('Primary Library is not enabled');
    }

    await this.sharedSpaceRepository.upsertTagOverride(spaceId, tagId, auth.user.id, dto);
  }

  /**
   * Удалить пользовательский override для тега.
   */
  async deleteOverride(auth: AuthDto, tagId: string): Promise<void> {
    const spaceId = await this.getSystemSpaceId();
    if (!spaceId) {
      throw new BadRequestException('Primary Library is not enabled');
    }

    await this.sharedSpaceRepository.deleteTagOverride(spaceId, tagId, auth.user.id);
  }

  /**
   * Получить все overrides текущего пользователя.
   */
  async getOverrides(auth: AuthDto): Promise<TagOverrideResponseDto[]> {
    const spaceId = await this.getSystemSpaceId();
    if (!spaceId) {
      return [];
    }

    const overrides = await this.sharedSpaceRepository.getTagOverridesForUser(spaceId, auth.user.id);
    return overrides.map((o) => ({
      tagId: o.tagId,
      isHidden: o.isHidden,
      alias: o.alias,
      color: o.color,
    }));
  }

  private async findOrFail(id: string) {
    const tag = await this.tagRepository.get(id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    return tag;
  }

  /**
   * Получить ID системного пространства из настроек Primary Library.
   */
  private async getSystemSpaceId(): Promise<string | null> {
    const settings = await this.systemMetadataRepository.get(SystemMetadataKey.PrimaryLibrarySpaceId) as PrimaryLibrarySettings | null;
    if (!settings?.enabled || !settings.spaceId) {
      return null;
    }
    return settings.spaceId;
  }

  private async updateTags(assetId: string) {
    const { tags } = await this.assetRepository.getForUpdateTags(assetId);
    await this.assetRepository.upsertExif(updateLockedColumns({ assetId, tags: tags.map(({ value }) => value) }), {
      lockedPropertiesBehavior: 'append',
    });
  }
}
