import { Module } from '@nestjs/common';
import { FinancialAccountsService } from './financial-accounts.service';
import { FinancialAccountsController } from '../../presentation/controllers/financial-accounts.controller';

@Module({
    controllers: [FinancialAccountsController],
    providers: [FinancialAccountsService],
    exports: [FinancialAccountsService],
})
export class FinancialAccountsModule { }
