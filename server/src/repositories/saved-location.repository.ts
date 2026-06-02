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
        isFavorite: false,
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
        isFavorite: dto.isFavorite,
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
}
