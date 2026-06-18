/**
 * Таблица привязки тегов к системному пространству.
 * Позволяет админу расшарить конкретные теги из своей библиотеки
 * через Primary Library для всех пользователей.
 */
import { CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp } from '@immich/sql-tools';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { TagTable } from 'src/schema/tables/tag.table';

@Table('shared_space_tag')
export class SharedSpaceTagTable {
  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', primary: true })
  spaceId!: string;

  @ForeignKeyColumn(() => TagTable, { onDelete: 'CASCADE', primary: true, index: false })
  tagId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
