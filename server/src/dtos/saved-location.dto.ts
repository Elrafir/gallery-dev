import { createZodDto } from 'nestjs-zod';
import { SavedLocation } from 'src/database';
import { asDateString } from 'src/utils/date';
import { latitudeSchema, longitudeSchema } from 'src/validation';
import { ApiProperty } from '@nestjs/swagger';
import z from 'zod';

export const CreateSavedLocationSchema = z
  .object({
    name: z.string().min(1).describe('Resolved geodata address name'),
    label: z.string().min(1).describe('User signature label'),
    description: z.string().nullable().optional().describe('Optional description'),
    latitude: z.coerce.number().meta({ format: 'double' }).pipe(latitudeSchema).describe('Latitude (-90 to 90)'),
    longitude: z.coerce.number().meta({ format: 'double' }).pipe(longitudeSchema).describe('Longitude (-180 to 180)'),
    radius: z.coerce.number().int().min(10).max(5000).optional().describe('Radius in meters (10-5000, default 50)'),
    icon: z.string().nullable().optional().describe('Icon identifier'),
  })
  .meta({ id: 'CreateSavedLocationDto' });

export const UpdateSavedLocationSchema = z
  .object({
    name: z.string().min(1).optional().describe('Resolved geodata address name'),
    label: z.string().min(1).optional().describe('User signature label'),
    description: z.string().nullable().optional().describe('Optional description'),
    latitude: z.coerce.number().meta({ format: 'double' }).pipe(latitudeSchema).optional().describe('Latitude (-90 to 90)'),
    longitude: z.coerce.number().meta({ format: 'double' }).pipe(longitudeSchema).optional().describe('Longitude (-180 to 180)'),
    isFavorite: z.boolean().optional().describe('Favorite status flag'),
    radius: z.coerce.number().int().min(10).max(5000).optional().describe('Radius in meters (10-5000)'),
    icon: z.string().nullable().optional().describe('Icon identifier'),
  })
  .meta({ id: 'UpdateSavedLocationDto' });

export const SavedLocationResponseSchema = z
  .object({
    id: z.string().uuid().describe('Saved location ID'),
    userId: z.string().uuid().describe('User ID'),
    name: z.string().describe('Resolved geodata address name'),
    label: z.string().describe('User signature label'),
    description: z.string().nullable().describe('Optional description'),
    latitude: z.number().describe('Latitude'),
    longitude: z.number().describe('Longitude'),
    radius: z.number().int().describe('Radius in meters'),
    isFavorite: z.boolean().describe('Favorite status flag'),
    icon: z.string().nullable().describe('Icon identifier'),
    createdAt: z.string().meta({ format: 'date-time' }).describe('Creation timestamp'),
    updatedAt: z.string().meta({ format: 'date-time' }).describe('Update timestamp'),
  })
  .meta({ id: 'SavedLocationResponseDto' });

export class CreateSavedLocationDto extends createZodDto(CreateSavedLocationSchema) {}
export class UpdateSavedLocationDto extends createZodDto(UpdateSavedLocationSchema) {}
export class SavedLocationResponseDto extends createZodDto(SavedLocationResponseSchema) {}

export function mapSavedLocation(entity: SavedLocation): SavedLocationResponseDto {
  return {
    id: entity.id,
    userId: entity.userId,
    name: entity.name,
    label: entity.label,
    description: entity.description,
    latitude: Number(entity.latitude),
    longitude: Number(entity.longitude),
    radius: entity.radius,
    isFavorite: entity.isFavorite,
    icon: entity.icon,
    createdAt: asDateString(entity.createdAt),
    updatedAt: asDateString(entity.updatedAt),
  };
}

export const ProximityQuerySchema = z
  .object({
    latitude: z.coerce.number().meta({ format: 'double' }).pipe(latitudeSchema).describe('Asset latitude'),
    longitude: z.coerce.number().meta({ format: 'double' }).pipe(longitudeSchema).describe('Asset longitude'),
  })
  .meta({ id: 'ProximityQueryDto' });

export class ProximityQueryDto extends createZodDto(ProximityQuerySchema) {}

