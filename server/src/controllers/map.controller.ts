import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  MapMarkerDto,
  MapMarkerResponseDto,
  MapReverseGeocodeDto,
  MapReverseGeocodeResponseDto,
} from 'src/dtos/map.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { MapService } from 'src/services/map.service';

@ApiTags(ApiTag.Map)
@Controller('map')
export class MapController {
  constructor(private service: MapService) {}

  @Get('markers')
  @Authenticated({ permission: Permission.MapRead })
  @Endpoint({
    summary: 'Retrieve map markers',
    description: 'Retrieve a list of latitude and longitude coordinates for every asset with location data.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getMapMarkers(@Auth() auth: AuthDto, @Query() options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.service.getMapMarkers(auth, options);
  }

  @Get('reverse-geocode')
  @Authenticated({ permission: Permission.MapSearch })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Reverse geocode coordinates',
    description: 'Retrieve location information (e.g., city, country) for given latitude and longitude coordinates.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  reverseGeocode(@Query() dto: MapReverseGeocodeDto): Promise<MapReverseGeocodeResponseDto[]> {
    return this.service.reverseGeocode(dto);
  }

  @Get('countries')
  @Authenticated({ admin: true })
  @Endpoint({
    summary: 'Get unique countries from geodata',
    description: 'Retrieve list of all unique countries available in database metadata.',
    history: new HistoryBuilder().added('v1'),
  })
  getUniqueCountries(): Promise<string[]> {
    return this.service.getUniqueCountries();
  }

  @Get('states')
  @Authenticated({ admin: true })
  @Endpoint({
    summary: 'Get unique states from geodata',
    description: 'Retrieve list of all unique states/regions available in database metadata, optionally filtered by country.',
    history: new HistoryBuilder().added('v1'),
  })
  getUniqueStates(@Query('country') country?: string): Promise<string[]> {
    return this.service.getUniqueStates(country);
  }
}
