import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { DestinationService } from '../services/destination.service.js';
import { DestinationQueryDto } from '../services/dto/destination/destination-query.dto.js';
import { DestinationSlugDto } from '../services/dto/destination/destination-slug.dto.js';
import { dtoValidation } from '../services/dto/validation.js';

@Controller('destinations')
export class DestinationController {
  constructor(
    @Inject(DestinationService)
    private readonly destinations: DestinationService,
  ) {}

  @Get()
  list(@Query(dtoValidation(DestinationQueryDto)) query: DestinationQueryDto) {
    return this.destinations.list(query);
  }

  @Get(':slug')
  detail(@Param(dtoValidation(DestinationSlugDto)) params: DestinationSlugDto) {
    return this.destinations.detail(params.slug);
  }
}
