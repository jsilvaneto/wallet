import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { AccountsService } from '../../application/accounts/accounts.service';
import { CreateAccountDto } from '../../application/accounts/dto/create-account.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Post()
    create(@Request() req: any, @Body() createDto: CreateAccountDto) {
        return this.accountsService.create(req.user.id, createDto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.accountsService.findAll(req.user.id);
    }

    @Patch(':id/pay')
    markAsPaid(@Request() req: any, @Param('id') id: string, @Body('payment_date') paymentDate: string) {
        return this.accountsService.markAsPaid(req.user.id, id, paymentDate);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.accountsService.softDelete(req.user.id, id);
    }
}
