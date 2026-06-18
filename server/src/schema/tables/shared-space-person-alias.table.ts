import { Column, ForeignKeyColumn, Generated, Table } from '@immich/sql-tools';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { SharedSpacePersonTable } from 'src/schema/tables/shared-space-person.table';
import { UserTable } from 'src/schema/tables/user.table';

/**
 * Таблица пользовательских переопределений для лиц в пространстве.
 * Позволяет каждому пользователю задать свой alias, скрыть лицо,
 * установить свою дату рождения, описание и фото-представителя,
 * не влияя на глобальные настройки пространства.
 */
@Table('shared_space_person_alias')
export class SharedSpacePersonAliasTable {
  @ForeignKeyColumn(() => SharedSpacePersonTable, { onDelete: 'CASCADE', primary: true, index: false })
  personId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  userId!: string;

  /** Пользовательский алиас (имя) для лица */
  @Column({ type: 'character varying' })
  alias!: string;

  /** Скрыть это лицо для данного пользователя */
  @Column({ type: 'boolean', default: false })
  isHidden!: Generated<boolean>;

  /** Пользовательская дата рождения */
  @Column({ type: 'date', nullable: true })
  birthDate!: Date | null;

  /** Пользовательское описание */
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Пользовательское фото-представитель */
  @ForeignKeyColumn(() => AssetFaceTable, { nullable: true, onDelete: 'SET NULL', index: false })
  representativeFaceId!: string | null;
}
