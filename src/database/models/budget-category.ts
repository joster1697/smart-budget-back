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
import { Optional } from 'sequelize';
import { Budget } from './budget';
import { Category } from './category';

export type BudgetCategoryCreationAttributes = Optional<{
  id?: string;
  budget_id: string;
  category_id: string;
  allocated_amount: number;
}, 'id'>;

@Table({
  tableName: 'budget_categories',
  timestamps: true
})
export class BudgetCategory extends Model<BudgetCategory, BudgetCategoryCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Budget)
  @AllowNull(false)
  @Column(DataType.UUID)
  budget_id!: string;

  @ForeignKey(() => Category)
  @AllowNull(false)
  @Column(DataType.UUID)
  category_id!: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL)
  allocated_amount!: number;

  @BelongsTo(() => Budget)
  budget?: Budget;

  @BelongsTo(() => Category)
  category?: Category;
}
