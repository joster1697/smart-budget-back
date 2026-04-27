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
import { Account } from './account';
import { Category } from './category';
import { Optional } from 'sequelize';

export type TransactionCreationAttributes = Optional<{
  id?: string;
  user_id: string;
  account_id: string;
  amount: number;
  category_id?: string;
  type: string;
  description?: string;
  merchant?: string;
  date?: Date;
  notes?: string;
}, 'id' | 'category_id'>;

@Table({
  tableName: 'transactions',
  timestamps: true
})
export class Transaction extends Model<Transaction, TransactionCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @ForeignKey(() => Account)
  @AllowNull(true)
  @Column(DataType.UUID)
  account_id?: string;

  @ForeignKey(() => Category)
  @AllowNull(true)
  @Column(DataType.UUID)
  category_id?: string;

  @AllowNull(true)
  @Column(DataType.DECIMAL)
  amount?: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  type?: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  date?: Date;

  @AllowNull(true)
  @Column(DataType.STRING)
  description?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  merchant?: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  notes?: string;

  @BelongsTo(() => User)
  user?: User;

  @BelongsTo(() => Account)
  account?: Account;

  @BelongsTo(() => Category)
  category?: Category;
}
