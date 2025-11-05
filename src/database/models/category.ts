import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany
} from 'sequelize-typescript';
import { User } from './user';
import { Transaction } from './transaction';
import { Budget } from './budget';

@Table({
  tableName: 'categories',
  timestamps: true
})
export class Category extends Model<Category> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  name?: string;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.UUID)
  user_id?: string;

  @BelongsTo(() => User)
  user?: User;

  @HasMany(() => Transaction)
  transactions?: Transaction[];

  @HasMany(() => Budget)
  budgets?: Budget[];
}
