import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FinancialAccountsService } from './financial-accounts.service';
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
import { JwtAuthGuard } from '../../presentation/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('financial-accounts')
export class FinancialAccountsController {
    constructor(private readonly financialAccountsService: FinancialAccountsService) { }

    @Post()
    create(@Request() req, @Body() createDto: CreateFinancialAccountDto) {
        return this.financialAccountsService.create(req.user.id, createDto);
    }

    @Get()
    findAll(@Request() req) {
        return this.financialAccountsService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.financialAccountsService.findOne(req.user.id, id);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.financialAccountsService.softDelete(req.user.id, id);
    }
}
