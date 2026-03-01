import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    create(req: any, createDto: CreateAccountDto): any;
    findAll(req: any): any;
    markAsPaid(req: any, id: string, paymentDate: string): any;
    remove(req: any, id: string): any;
}
