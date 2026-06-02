import { BadRequestException, Injectable } from '@nestjs/common';
import _ from 'lodash';
import { defaults } from 'src/config';
import { OnEvent } from 'src/decorators';
import { mapConfig, SystemConfigDto } from 'src/dtos/system-config.dto';
import { BootstrapEventPriority } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { clearConfigCache } from 'src/utils/config';
import { toPlainObject } from 'src/utils/object';

@Injectable()
export class SystemConfigService extends BaseService {
  @OnEvent({ name: 'AppBootstrap', priority: BootstrapEventPriority.SystemConfig })
  async onBootstrap() {
    const config = await this.getConfig({ withCache: false });
    await this.eventRepository.emit('ConfigInit', { newConfig: config });
  }

  @OnEvent({ name: 'AppShutdown' })
  onShutdown() {
    this.machineLearningRepository.teardown();
  }

  async getSystemConfig(): Promise<SystemConfigDto> {
    const config = await this.getConfig({ withCache: false });
    return mapConfig(config);
  }

  getDefaults(): SystemConfigDto {
    return mapConfig(defaults);
  }

  @OnEvent({ name: 'ConfigInit', priority: -100 })
  onConfigInit({ newConfig: { logging, machineLearning } }: ArgOf<'ConfigInit'>) {
    const { logLevel: envLevel } = this.configRepository.getEnv();
    const configLevel = logging.enabled ? logging.level : false;
    const level = envLevel ?? configLevel;
    this.logger.setLogLevel(level);
    this.logger.log(`LogLevel=${level} ${envLevel ? '(set via IMMICH_LOG_LEVEL)' : '(set via system config)'}`);

    this.machineLearningRepository.setup(machineLearning);
  }

  @OnEvent({ name: 'ConfigUpdate', server: true })
  onConfigUpdate({ newConfig }: ArgOf<'ConfigUpdate'>) {
    this.onConfigInit({ newConfig });
    clearConfigCache();
  }

  @OnEvent({ name: 'ConfigValidate' })
  onConfigValidate({ newConfig, oldConfig }: ArgOf<'ConfigValidate'>) {
    const { logLevel } = this.configRepository.getEnv();
    if (!_.isEqual(toPlainObject(newConfig.logging), oldConfig.logging) && logLevel) {
      throw new Error('Logging cannot be changed while the environment variable IMMICH_LOG_LEVEL is set.');
    }

    const substitutions = newConfig.reverseGeocoding?.substitutions;
    if (Array.isArray(substitutions)) {
      for (let i = 0; i < substitutions.length; i++) {
        const r1 = substitutions[i];
        if (!r1.country || !r1.country.trim()) {
          throw new Error('Поле Исходная страна должно быть заполнено');
        }
        if (!r1.state || !r1.state.trim()) {
          throw new Error('Поле Область/Регион должно быть заполнено');
        }
        if (!r1.replacement || !r1.replacement.trim()) {
          throw new Error('Поле Желаемое значение должно быть заполнено');
        }
        if (r1.startYear !== undefined && r1.endYear !== undefined && r1.startYear > r1.endYear) {
          throw new Error(`Некорректный диапазон лет: год начала (${r1.startYear}) не может быть больше года окончания (${r1.endYear})`);
        }
        for (let j = i + 1; j < substitutions.length; j++) {
          const r2 = substitutions[j];
          if (
            r1.country.trim().toLowerCase() === r2.country.trim().toLowerCase() &&
            r1.state.trim().toLowerCase() === r2.state.trim().toLowerCase()
          ) {
            const s1 = r1.startYear ?? -Infinity;
            const e1 = r1.endYear ?? Infinity;
            const s2 = r2.startYear ?? -Infinity;
            const e2 = r2.endYear ?? Infinity;
            if (s1 <= e2 && s2 <= e1) {
              throw new Error(`Обнаружено пересечение диапазонов дат для локации "${r1.country.trim()} - ${r1.state.trim()}"`);
            }
          }
        }
      }
    }
  }

  async updateSystemConfig(dto: SystemConfigDto): Promise<SystemConfigDto> {
    const { configFile } = this.configRepository.getEnv();
    if (configFile) {
      throw new BadRequestException('Cannot update configuration while IMMICH_CONFIG_FILE is in use');
    }

    const oldConfig = await this.getConfig({ withCache: false });

    try {
      await this.eventRepository.emit('ConfigValidate', { newConfig: toPlainObject(dto), oldConfig });
    } catch (error) {
      this.logger.warn(`Unable to save system config due to a validation error: ${error}`);
      throw new BadRequestException(error instanceof Error ? error.message : error);
    }

    const newConfig = await this.updateConfig(dto);

    await this.eventRepository.emit('ConfigUpdate', { newConfig, oldConfig });

    return mapConfig(newConfig);
  }

  async getCustomCss(): Promise<string> {
    const { theme } = await this.getConfig({ withCache: false });
    return theme.customCss;
  }
}
