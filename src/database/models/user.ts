import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  HasMany
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Account } from './account';
import { Category } from './category';
import { Transaction } from './transaction';
import { Budget } from './budget';

export type UserCreationAttributes = Optional<{
  id?: string;
  name: string;
  email: string;
  password: string;
}, 'id'>;

@Table({
  tableName: 'users',
  timestamps: true
})
export class User extends Model<User, UserCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string;

  @HasMany(() => Account)
  accounts?: Account[];

  @HasMany(() => Category)
  categories?: Category[];

  @HasMany(() => Transaction)
  transactions?: Transaction[];

  @HasMany(() => Budget)
  budgets?: Budget[];
}
