import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AllergensService } from './allergens.service';
import { AllergenDto, ListAllergensQueryDto } from './dto';

@Controller('allergens')
@UseGuards(SupabaseAuthGuard)
export class AllergensController {
  constructor(private readonly allergensService: AllergensService) {}

  @Get()
  list(@Query() query: ListAllergensQueryDto): Promise<AllergenDto[]> {
    return this.allergensService.findByStatus(query.status);
  }
}
