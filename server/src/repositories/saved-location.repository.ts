import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { SavedLocation } from 'src/database';
import { CreateSavedLocationDto, UpdateSavedLocationDto } from 'src/dtos/saved-location.dto';
import { DB } from 'src/schema';

@Injectable()
export class SavedLocationRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async create(userId: string, dto: CreateSavedLocationDto): Promise<SavedLocation> {
    const res = await this.db
      .insertInto('saved_location')
      .values({
        userId,
        name: dto.name,
        label: dto.label,
        description: dto.description ?? null,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radius: dto.radius ?? 50,
        isFavorite: false,
        icon: dto.icon ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return res as any;
  }

  async getAll(userId: string): Promise<SavedLocation[]> {
    const res = await this.db
      .selectFrom('saved_location')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('isFavorite', 'desc')
      .orderBy('label', 'asc')
      .execute();
    return res as any[];
  }

  async getById(id: string, userId: string): Promise<SavedLocation | null> {
    const res = await this.db
      .selectFrom('saved_location')
      .selectAll()
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return res ? (res as any) : null;
  }

  async update(id: string, userId: string, dto: UpdateSavedLocationDto): Promise<SavedLocation> {
    const res = await this.db
      .updateTable('saved_location')
      .set({
        name: dto.name,
        label: dto.label,
        description: dto.description !== undefined ? dto.description : undefined,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radius: dto.radius,
        isFavorite: dto.isFavorite,
        icon: dto.icon !== undefined ? dto.icon : undefined,
        updatedAt: sql`now()`,
      })
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return res as any;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .deleteFrom('saved_location')
      .where('id', '=', id)
      .where('userId', '=', userId)
      .execute();
  }

  async findDuplicateLocation(userId: string, latitude: number, longitude: number, excludeId?: string): Promise<SavedLocation | null> {
    const threshold = 0.0001; // ~11 meters tolerance
    let query = this.db
      .selectFrom('saved_location')
      .selectAll()
      .where('userId', '=', userId)
      .where(sql`abs(latitude - ${latitude})`, '<', threshold)
      .where(sql`abs(longitude - ${longitude})`, '<', threshold);

    if (excludeId) {
      query = query.where('id', '!=', excludeId);
    }

    const res = await query.executeTakeFirst();
    return res ? (res as any) : null;
  }

  async findByLabel(userId: string, label: string, excludeId?: string): Promise<SavedLocation | null> {
    let query = this.db
      .selectFrom('saved_location')
      .selectAll()
      .where('userId', '=', userId)
      .where(sql`lower(trim(label))`, '=', label.trim().toLowerCase());

    if (excludeId) {
      query = query.where('id', '!=', excludeId);
    }

    const res = await query.executeTakeFirst();
    return res ? (res as any) : null;
  }

  /**
   * Найти все saved locations, в радиусе которых находится заданная точка.
   * Использует GiST-индекс через earth_box для быстрой pre-фильтрации,
   * затем точная проверка earth_distance <= radius.
   */
  async findByProximity(userId: string, latitude: number, longitude: number): Promise<SavedLocation[]> {
    const res = await this.db
      .selectFrom('saved_location')
      .selectAll()
      .where('userId', '=', userId)
      .where(
        sql`earth_box(ll_to_earth_public(saved_location.latitude, saved_location.longitude), saved_location.radius)`,
        '@>',
        sql`ll_to_earth_public(${latitude}, ${longitude})`,
      )
      .where(
        sql`earth_distance(ll_to_earth_public(saved_location.latitude, saved_location.longitude), ll_to_earth_public(${latitude}, ${longitude}))`,
        '<=',
        sql`saved_location.radius`,
      )
      .orderBy('isFavorite', 'desc')
      .orderBy('label', 'asc')
      .execute();
    return res as any[];
  }

  /**
   * Получить ID ассетов пользователя, которые попадают в радиус заданного saved location.
   * Использует GiST-индекс на asset_exif для быстрой фильтрации.
   */
  async getAssetIdsInRadius(
    savedLocationId: string,
    userId: string,
    limit = 1000,
  ): Promise<string[]> {
    const location = await this.getById(savedLocationId, userId);
    if (!location) {
      return [];
    }

    const res = await this.db
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .select('asset.id')
      .where('asset.ownerId', '=', userId)
      .where('asset.deletedAt', 'is', null)
      .where('asset_exif.latitude', 'is not', null)
      .where('asset_exif.longitude', 'is not', null)
      .where(
        sql`earth_box(ll_to_earth_public(${location.latitude}, ${location.longitude}), ${location.radius})`,
        '@>',
        sql`ll_to_earth_public(asset_exif.latitude, asset_exif.longitude)`,
      )
      .where(
        sql`earth_distance(ll_to_earth_public(${location.latitude}, ${location.longitude}), ll_to_earth_public(asset_exif.latitude, asset_exif.longitude))`,
        '<=',
        sql.lit(location.radius),
      )
      .limit(limit)
      .execute();
    return res.map((r) => r.id);
  }
}
