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
} from "sequelize-typescript";
import { Optional } from "sequelize";
import { SavingsGoal } from "./savings-goal";
import { Account } from "./account";

export type SavingsScheduleCreationAttributes = Optional<
  {
    id?: string;
    savings_goal_id: string;
    source_account_id: string;
    amount: number;
    frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    day_of_week?: number;
    day_of_month?: number;
    next_run_date: Date;
    status?: "ACTIVE" | "PAUSED";
  },
  "id" | "day_of_week" | "day_of_month" | "status"
>;

@Table({
  tableName: "savings_schedules",
  timestamps: true,
})
export class SavingsSchedule extends Model<SavingsSchedule, SavingsScheduleCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => SavingsGoal)
  @AllowNull(false)
  @Column(DataType.UUID)
  savings_goal_id!: string;

  @ForeignKey(() => Account)
  @AllowNull(false)
  @Column(DataType.UUID)
  source_account_id!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 2))
  amount!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  frequency!: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

  @AllowNull(true)
  @Column(DataType.INTEGER)
  day_of_week?: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  day_of_month?: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  next_run_date!: Date;

  @AllowNull(false)
  @Default("ACTIVE")
  @Column(DataType.STRING)
  status!: "ACTIVE" | "PAUSED";

  @BelongsTo(() => SavingsGoal)
  goal?: SavingsGoal;

  @BelongsTo(() => Account)
  sourceAccount?: Account;
}
