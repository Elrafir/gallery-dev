import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  CreateSavedLocationDto,
  mapSavedLocation,
  SavedLocationResponseDto,
  UpdateSavedLocationDto,
} from 'src/dtos/saved-location.dto';
import { ApiTag } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { SavedLocationService } from 'src/services/saved-location.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.SavedLocations)
@Controller('saved-locations')
export class SavedLocationController {
  constructor(private service: SavedLocationService) {}

  @Post()
  @Authenticated()
  @Endpoint({
    summary: 'Create a saved location',
    description: 'Create a new saved location for the authenticated user.',
    history: new HistoryBuilder().added('v1'),
  })
  async create(@Auth() auth: AuthDto, @Body() dto: CreateSavedLocationDto): Promise<SavedLocationResponseDto> {
    const res = await this.service.create(auth.user.id, dto);
    return mapSavedLocation(res);
  }

  @Get()
  @Authenticated()
  @Endpoint({
    summary: 'Get all saved locations',
    description: 'Retrieve all saved locations for the authenticated user.',
    history: new HistoryBuilder().added('v1'),
  })
  async getAll(@Auth() auth: AuthDto): Promise<SavedLocationResponseDto[]> {
    const list = await this.service.getAll(auth.user.id);
    return list.map(mapSavedLocation);
  }

  @Put(':id')
  @Authenticated()
  @Endpoint({
    summary: 'Update a saved location',
    description: 'Update an existing saved location by ID.',
    history: new HistoryBuilder().added('v1'),
  })
  async update(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateSavedLocationDto,
  ): Promise<SavedLocationResponseDto> {
    const res = await this.service.update(id, auth.user.id, dto);
    return mapSavedLocation(res);
  }

  @Delete(':id')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a saved location',
    description: 'Delete a saved location by ID.',
    history: new HistoryBuilder().added('v1'),
  })
  delete(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(id, auth.user.id);
  }
}
