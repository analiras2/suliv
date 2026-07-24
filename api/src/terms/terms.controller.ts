import { Controller, Get } from '@nestjs/common';
import type { CurrentTermsDto } from './terms.service';
import { TermsService } from './terms.service';

@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Get('current')
  getCurrent(): CurrentTermsDto {
    return this.termsService.getCurrent();
  }
}
