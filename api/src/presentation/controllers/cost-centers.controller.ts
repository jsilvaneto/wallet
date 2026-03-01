import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CostCentersService } from '../../application/cost-centers/cost-centers.service';
import { CreateCostCenterDto } from '../../application/cost-centers/dto/create-cost-center.dto';
import { JwtAuthGuard } from '../../presentation/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cost-centers')
export class CostCentersController {
    constructor(private readonly costCentersService: CostCentersService) { }

    @Post()
    create(@Request() req, @Body() createDto: CreateCostCenterDto) {
        return this.costCentersService.create(req.user.id, createDto);
    }

    @Get()
    findAll(@Request() req) {
        return this.costCentersService.findAll(req.user.id);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.costCentersService.softDelete(req.user.id, id);
    }
}
