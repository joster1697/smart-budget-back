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
  HasMany,
} from "sequelize-typescript";
import { User } from "./user";
import { Transaction } from "./transaction";
import { Budget } from "./budget";
import { Optional } from "sequelize";

export type CategoryCreationAttributes = Optional<
  { 
    id?: string; 
    name: string; 
    user_id: string;
   },
  "id"
>;
@Table({
  tableName: "categories",
  timestamps: true,
})
export class Category extends Model<Category, CategoryCreationAttributes> {
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
