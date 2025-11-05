import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import { User } from './user';
import { Category } from './category';

@Table({
  tableName: 'budgets',
  timestamps: true
})
export class Budget extends Model<Budget> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @ForeignKey(() => Category)
  @AllowNull(false)
  @Column(DataType.UUID)
  category_id!: string;

  @AllowNull(true)
  @Column(DataType.DECIMAL)
  amount?: number;

  @BelongsTo(() => User)
  user?: User;

  @BelongsTo(() => Category)
  category?: Category;
}
