"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAccountsModule = void 0;
const common_1 = require("@nestjs/common");
const financial_accounts_service_1 = require("./financial-accounts.service");
const financial_accounts_controller_1 = require("../../presentation/controllers/financial-accounts.controller");
let FinancialAccountsModule = class FinancialAccountsModule {
};
exports.FinancialAccountsModule = FinancialAccountsModule;
exports.FinancialAccountsModule = FinancialAccountsModule = __decorate([
    (0, common_1.Module)({
        controllers: [financial_accounts_controller_1.FinancialAccountsController],
        providers: [financial_accounts_service_1.FinancialAccountsService],
        exports: [financial_accounts_service_1.FinancialAccountsService],
    })
], FinancialAccountsModule);
//# sourceMappingURL=financial-accounts.module.js.map