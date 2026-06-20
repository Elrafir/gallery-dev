import { Column, CreateDateColumn, ForeignKeyColumn, Table } from 'src/sql-tools';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { UserTable } from 'src/schema/tables/user.table';
import type { Timestamp } from 'src/types';
import type { Generated } from 'kysely';

/**
 * Связь пространства с владельцами ассетов.
 * Все фото пользователя (ownerId) автоматически доступны участникам пространства.
 * Используется для Primary Library (Multi-Admin).
 */
@Table('shared_space_owner')
export class SharedSpaceOwnerTable {
  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true, index: false })
  spaceId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  ownerId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'SET NULL', nullable: true })
  addedById!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
