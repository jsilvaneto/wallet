import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from '../../presentation/controllers/accounts.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
    imports: [AuditLogModule],
    controllers: [AccountsController],
    providers: [AccountsService],
    exports: [AccountsService],
})
export class AccountsModule { }
