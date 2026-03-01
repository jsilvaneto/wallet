import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FinancialAccountsService } from '../../application/financial-accounts/financial-accounts.service';
import { CreateFinancialAccountDto } from '../../application/financial-accounts/dto/create-financial-account.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('financial-accounts')
export class FinancialAccountsController {
    constructor(private readonly financialAccountsService: FinancialAccountsService) { }

    @Post()
    create(@Request() req: any, @Body() createDto: CreateFinancialAccountDto) {
        return this.financialAccountsService.create(req.user.id, createDto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.financialAccountsService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.financialAccountsService.findOne(req.user.id, id);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.financialAccountsService.softDelete(req.user.id, id);
    }
}
