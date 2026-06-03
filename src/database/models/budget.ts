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
import { Optional } from 'sequelize';
import { User } from './user';
import { BudgetCategory } from './budget-category';

export type BudgetCreationAttributes = Optional<{
  id?: string;
  user_id: string;
  period?: string;
  status: string;
  planned_income?: number;
}, 'id' | 'period' | 'planned_income'>;

@Table({
  tableName: 'budgets',
  timestamps: true
})
export class Budget extends Model<Budget, BudgetCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  period?: string; // Format: 'YYYY-MM'

  @AllowNull(false)
  @Default('DRAFT')
  @Column(DataType.STRING)
  status!: string; // 'DRAFT', 'LOCKED', 'CLOSED'

  @AllowNull(true)
  @Default(0)
  @Column(DataType.DECIMAL)
  planned_income?: number;

  @BelongsTo(() => User)
  user?: User;

  @HasMany(() => BudgetCategory, { onDelete: 'CASCADE' })
  categories?: BudgetCategory[];
}
