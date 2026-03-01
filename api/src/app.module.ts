import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuditLogModule } from './application/audit-log/audit-log.module';
import { UsersModule } from './application/users/users.module';
import { AuthModule } from './application/auth/auth.module';
import { FinancialAccountsModule } from './application/financial-accounts/financial-accounts.module';
import { CategoriesModule } from './application/categories/categories.module';
import { CostCentersModule } from './application/cost-centers/cost-centers.module';
import { AccountsModule } from './application/accounts/accounts.module';
import { DashboardModule } from './application/dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    UsersModule,
    AuthModule,
    FinancialAccountsModule,
    CategoriesModule,
    CostCentersModule,
    AccountsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
