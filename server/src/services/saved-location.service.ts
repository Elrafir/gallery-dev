import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SavedLocation } from 'src/database';
import { CreateSavedLocationDto, UpdateSavedLocationDto } from 'src/dtos/saved-location.dto';
import { SavedLocationRepository } from 'src/repositories/saved-location.repository';

@Injectable()
export class SavedLocationService {
  constructor(private repository: SavedLocationRepository) {}

  async create(userId: string, dto: CreateSavedLocationDto): Promise<SavedLocation> {
    // 1. Проверка на дубликат по названию/подписи (label)
    const duplicateLabel = await this.repository.findByLabel(userId, dto.label);
    if (duplicateLabel) {
      throw new BadRequestException('Место съёмки с такой подписью уже сохранено.');
    }

    // 2. Проверка на дубликат по координатам
    const duplicateCoords = await this.repository.findDuplicateLocation(userId, dto.latitude, dto.longitude);
    if (duplicateCoords) {
      throw new BadRequestException(`Эта геопозиция уже сохранена под именем "${duplicateCoords.label}".`);
    }

    return this.repository.create(userId, dto);
  }

  async getAll(userId: string): Promise<SavedLocation[]> {
    return this.repository.getAll(userId);
  }

  async update(id: string, userId: string, dto: UpdateSavedLocationDto): Promise<SavedLocation> {
    const existing = await this.repository.getById(id, userId);
    if (!existing) {
      throw new NotFoundException('Сохраненное место не найдено.');
    }

    // 1. Проверка на дубликат по названию/подписи (если меняется)
    if (dto.label !== undefined) {
      const duplicateLabel = await this.repository.findByLabel(userId, dto.label, id);
      if (duplicateLabel) {
        throw new BadRequestException('Место съёмки с такой подписью уже сохранено.');
      }
    }

    // 2. Проверка на дубликат по координатам (если меняются)
    const lat = dto.latitude !== undefined ? dto.latitude : existing.latitude;
    const lon = dto.longitude !== undefined ? dto.longitude : existing.longitude;
    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      const duplicateCoords = await this.repository.findDuplicateLocation(userId, lat, lon, id);
      if (duplicateCoords) {
        throw new BadRequestException(`Эта геопозиция уже сохранена под именем "${duplicateCoords.label}".`);
      }
    }

    return this.repository.update(id, userId, dto);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repository.getById(id, userId);
    if (!existing) {
      throw new NotFoundException('Сохраненное место не найдено.');
    }
    await this.repository.delete(id, userId);
  }
}
