/**
 * Таблица пользовательских переопределений для тегов в пространстве.
 * Каждый пользователь может скрыть тег, переименовать его или изменить цвет,
 * не влияя на глобальные настройки пространства или других пользователей.
 */
import { Column, ForeignKeyColumn, Generated, Table } from '@immich/sql-tools';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { TagTable } from 'src/schema/tables/tag.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('shared_space_tag_override')
export class SharedSpaceTagOverrideTable {
  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', primary: true })
  spaceId!: string;

  @ForeignKeyColumn(() => TagTable, { onDelete: 'CASCADE', primary: true, index: false })
  tagId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  userId!: string;

  /** Скрыть тег для данного пользователя */
  @Column({ type: 'boolean', default: false })
  isHidden!: Generated<boolean>;

  /** Пользовательский цвет тега */
  @Column({ type: 'character varying', nullable: true })
  color!: string | null;

  /** Пользовательский алиас (название) тега */
  @Column({ type: 'character varying', nullable: true })
  alias!: string | null;
}
