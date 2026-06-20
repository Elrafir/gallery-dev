import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserTable } from 'src/schema/tables/user.table';

@Table('saved_location')
@UpdatedAtTrigger('saved_location_updatedAt')
export class SavedLocationTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    index: true,
  })
  userId!: string;

  @Column()
  name!: string;

  @Column()
  label!: string;

  @Column({ type: 'text', nullable: true, default: null })
  description!: string | null;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ type: 'integer', default: 50 })
  radius!: Generated<number>;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @Column({ type: 'text', nullable: true, default: null })
  icon!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
