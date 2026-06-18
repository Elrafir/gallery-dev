/**
 * Репозиторий для управления пользовательскими переопределениями медиафайлов.
 * Обеспечивает скрытие конкретных фото/видео из таймлайна пользователя,
 * не влияя на глобальную видимость или доступ других пользователей.
 */
import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { UserAssetOverrideTable } from 'src/schema/tables/user-asset-override.table';

@Injectable()
export class UserAssetOverrideRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  /**
   * Скрыть медиафайл для пользователя.
   */
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async hideAsset(userId: string, assetId: string): Promise<void> {
    await this.db
      .insertInto('user_asset_override')
      .values({ userId, assetId, isHidden: true })
      .onConflict((oc) =>
        oc.columns(['userId', 'assetId']).doUpdateSet({ isHidden: true }),
      )
      .execute();
  }

  /**
   * Показать (убрать скрытие) медиафайл для пользователя.
   */
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async unhideAsset(userId: string, assetId: string): Promise<void> {
    await this.db
      .deleteFrom('user_asset_override')
      .where('userId', '=', userId)
      .where('assetId', '=', assetId)
      .execute();
  }

  /**
   * Скрыть несколько медиафайлов за раз.
   */
  async hideAssets(userId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) return;

    const values: Insertable<UserAssetOverrideTable>[] = assetIds.map((assetId) => ({
      userId,
      assetId,
      isHidden: true,
    }));

    await this.db
      .insertInto('user_asset_override')
      .values(values)
      .onConflict((oc) =>
        oc.columns(['userId', 'assetId']).doUpdateSet({ isHidden: true }),
      )
      .execute();
  }

  /**
   * Убрать скрытие для нескольких медиафайлов.
   */
  async unhideAssets(userId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) return;

    await this.db
      .deleteFrom('user_asset_override')
      .where('userId', '=', userId)
      .where('assetId', 'in', assetIds)
      .execute();
  }

  /**
   * Проверить, скрыт ли медиафайл для пользователя.
   */
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async isHidden(userId: string, assetId: string): Promise<boolean> {
    const row = await this.db
      .selectFrom('user_asset_override')
      .select('isHidden')
      .where('userId', '=', userId)
      .where('assetId', '=', assetId)
      .executeTakeFirst();

    return row?.isHidden ?? false;
  }

  /**
   * Получить набор ID скрытых медиафайлов для пользователя.
   */
  @GenerateSql({ params: [DummyValue.UUID] })
  async getHiddenAssetIds(userId: string): Promise<Set<string>> {
    const rows = await this.db
      .selectFrom('user_asset_override')
      .select('assetId')
      .where('userId', '=', userId)
      .where('isHidden', '=', true)
      .execute();

    return new Set(rows.map((r) => r.assetId));
  }

  /**
   * Получить количество скрытых медиафайлов.
   */
  @GenerateSql({ params: [DummyValue.UUID] })
  async getHiddenCount(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('user_asset_override')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('userId', '=', userId)
      .where('isHidden', '=', true)
      .executeTakeFirstOrThrow();

    return result.count;
  }
}
