"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const user_1 = require("./user");
const transaction_1 = require("./transaction");
const budget_1 = require("./budget");
let Category = class Category extends sequelize_typescript_1.Model {
};
exports.Category = Category;
__decorate([
    sequelize_typescript_1.PrimaryKey,
    (0, sequelize_typescript_1.Default)(sequelize_typescript_1.DataType.UUIDV4),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], Category.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(true),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], Category.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_1.User),
    (0, sequelize_typescript_1.AllowNull)(true),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], Category.prototype, "user_id", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_1.User),
    __metadata("design:type", user_1.User)
], Category.prototype, "user", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => transaction_1.Transaction),
    __metadata("design:type", Array)
], Category.prototype, "transactions", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => budget_1.Budget),
    __metadata("design:type", Array)
], Category.prototype, "budgets", void 0);
exports.Category = Category = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: "categories",
        timestamps: true,
    })
], Category);
