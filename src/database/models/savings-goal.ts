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
import { Optional } from "sequelize";
import { User } from "./user";
import { Account } from "./account";
import { Transaction } from "./transaction";
import { SavingsSchedule } from "./savings-schedule";

export type SavingsGoalCreationAttributes = Optional<
  {
    id?: string;
    user_id: string;
    account_id?: string | null;
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date?: Date;
    status?: "ACTIVE" | "COMPLETED" | "PAUSED";
    category?: string;
  },
  "id" | "account_id" | "current_amount" | "target_date" | "status" | "category"
>;

@Table({
  tableName: "savings_goals",
  timestamps: true,
})
export class SavingsGoal extends Model<SavingsGoal, SavingsGoalCreationAttributes> {
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
  account_id?: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 2))
  target_amount!: number;

  @AllowNull(false)
  @Default(0.00)
  @Column(DataType.DECIMAL(15, 2))
  current_amount!: number;

  @AllowNull(true)
  @Column(DataType.DATE)
  target_date?: Date;

  @AllowNull(false)
  @Default("ACTIVE")
  @Column(DataType.STRING)
  status!: "ACTIVE" | "COMPLETED" | "PAUSED";

  @AllowNull(true)
  @Column(DataType.STRING)
  category?: string;

  @BelongsTo(() => User)
  user?: User;

  @BelongsTo(() => Account)
  account?: Account;

  @HasMany(() => Transaction, { onDelete: "SET NULL" })
  transactions?: Transaction[];

  @HasMany(() => SavingsSchedule, { onDelete: "CASCADE" })
  schedules?: SavingsSchedule[];
}
