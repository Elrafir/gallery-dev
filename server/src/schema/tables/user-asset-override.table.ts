import { Column, ForeignKeyColumn, Generated, Table, Timestamp, CreateDateColumn } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';
import { UserTable } from 'src/schema/tables/user.table';

/**
 * Таблица пользовательских переопределений для медиафайлов.
 * Позволяет пользователям скрывать конкретные фото/видео из своего таймлайна,
 * не влияя на глобальные настройки или видимость для других пользователей.
 */
@Table('user_asset_override')
export class UserAssetOverrideTable {
  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  userId!: string;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', primary: true, index: false })
  assetId!: string;

  /** Скрыть медиафайл из таймлайна пользователя */
  @Column({ type: 'boolean', default: false })
  isHidden!: Generated<boolean>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
