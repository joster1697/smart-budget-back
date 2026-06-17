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
import { User } from "./user";
import { Category } from "./category";

export interface DebtAttributes {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  interest_rate: number;
  total_installment: number;
  insurance_cost: number;
  other_fees: number;
  remaining_terms: number;
  currency: string;
  operation_number_encrypted: string;
  sync_budget?: boolean;
  planned_extra_payment?: number;
  category_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DebtCreationAttributes = Optional<
  DebtAttributes,
  "id" | "insurance_cost" | "other_fees" | "currency" | "sync_budget" | "planned_extra_payment" | "category_id"
>;

@Table({
  tableName: "debts",
  timestamps: true,
})
export class Debt extends Model<Debt, DebtCreationAttributes> implements DebtAttributes {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  user_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 2))
  get balance(): number {
    return Number(this.getDataValue("balance"));
  }
  set balance(value: number) {
    this.setDataValue("balance", value);
  }

  @AllowNull(false)
  @Column(DataType.DECIMAL(5, 2))
  get interest_rate(): number {
    return Number(this.getDataValue("interest_rate"));
  }
  set interest_rate(value: number) {
    this.setDataValue("interest_rate", value);
  }

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 2))
  get total_installment(): number {
    return Number(this.getDataValue("total_installment"));
  }
  set total_installment(value: number) {
    this.setDataValue("total_installment", value);
  }

  @AllowNull(false)
  @Default(0.00)
  @Column(DataType.DECIMAL(15, 2))
  get insurance_cost(): number {
    return Number(this.getDataValue("insurance_cost"));
  }
  set insurance_cost(value: number) {
    this.setDataValue("insurance_cost", value);
  }

  @AllowNull(false)
  @Default(0.00)
  @Column(DataType.DECIMAL(15, 2))
  get other_fees(): number {
    return Number(this.getDataValue("other_fees"));
  }
  set other_fees(value: number) {
    this.setDataValue("other_fees", value);
  }

  @AllowNull(false)
  @Column(DataType.INTEGER)
  remaining_terms!: number;

  @AllowNull(false)
  @Default("CRC")
  @Column(DataType.STRING(3))
  currency!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  operation_number_encrypted!: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  sync_budget!: boolean;

  @AllowNull(false)
  @Default(0.00)
  @Column(DataType.DECIMAL(15, 2))
  get planned_extra_payment(): number {
    return Number(this.getDataValue("planned_extra_payment"));
  }
  set planned_extra_payment(value: number) {
    this.setDataValue("planned_extra_payment", value);
  }

  @BelongsTo(() => User)
  user?: User;

  @ForeignKey(() => Category)
  @AllowNull(true)
  @Column(DataType.UUID)
  category_id?: string;

  @BelongsTo(() => Category)
  category?: Category;
}
