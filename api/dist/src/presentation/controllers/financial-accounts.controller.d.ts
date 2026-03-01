import { FinancialAccountsService } from './financial-accounts.service';
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
export declare class FinancialAccountsController {
    private readonly financialAccountsService;
    constructor(financialAccountsService: FinancialAccountsService);
    create(req: any, createDto: CreateFinancialAccountDto): any;
    findAll(req: any): any;
    findOne(req: any, id: string): any;
    remove(req: any, id: string): any;
}
