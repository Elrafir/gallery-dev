/**
 * Сервис управления базовой библиотекой (Primary Library).
 * Обеспечивает создание и управление системным пространством,
 * автоматическое зачисление пользователей, синхронизацию библиотек админа.
 */
import { OnEvent } from 'src/decorators';
import { SharedSpaceRole, SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { PrimaryLibrarySettings } from 'src/types';

/** Настройки по умолчанию для Primary Library */
const DEFAULT_SETTINGS: Omit<PrimaryLibrarySettings, 'spaceId' | 'adminUserId'> = {
  enabled: false,
  autoEnrollNewUsers: true,
  sharePeople: true,
  shareTags: true,
  defaultShowInTimeline: true,
  defaultShowInMap: true,
  defaultShowInMemories: true,
};

export class PrimaryLibraryService extends BaseService {
  /**
   * Получить текущие настройки Primary Library.
   * Возвращает null, если система не настроена.
   */
  async getSettings(): Promise<PrimaryLibrarySettings | null> {
    return this.systemMetadataRepository.get(SystemMetadataKey.PrimaryLibrarySpaceId);
  }

  /**
   * Получить ID системного пространства для пользователя.
   * Проверяет, что Primary Library включена и пользователь является участником.
   * Возвращает spaceId или null.
   */
  async getPrimarySpaceIdForUser(userId: string): Promise<string | null> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      return null;
    }

    // Проверяем, является ли пользователь участником
    const member = await this.sharedSpaceRepository.getMember(settings.spaceId, userId);
    if (!member) {
      return null;
    }

    return settings.spaceId;
  }

  /**
   * Получить настройки участника Primary Library.
   * Возвращает membership-запись с полями showInTimeline, inheritPeople и т.д.
   */
  async getMemberSettings(userId: string) {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      return null;
    }

    return this.sharedSpaceRepository.getMember(settings.spaceId, userId);
  }

  /**
   * Инициализировать или обновить настройки Primary Library.
   * Создаёт системное пространство при первом включении.
   */
  async updateSettings(dto: Partial<PrimaryLibrarySettings>): Promise<PrimaryLibrarySettings> {
    let settings = await this.getSettings();

    if (!settings) {
      // Первая инициализация
      settings = {
        ...DEFAULT_SETTINGS,
        spaceId: '',
        adminUserId: '',
        ...dto,
      };
    } else {
      settings = { ...settings, ...dto };
    }

    // Создаём системное пространство, если его ещё нет
    if (settings.enabled && !settings.spaceId && settings.adminUserId) {
      const spaceId = await this.createSystemSpace(settings.adminUserId);
      settings.spaceId = spaceId;
    }

    await this.systemMetadataRepository.set(SystemMetadataKey.PrimaryLibrarySpaceId, settings);

    this.logger.log(`Primary Library settings updated: enabled=${settings.enabled}, adminUserId=${settings.adminUserId}`);

    return settings;
  }

  /**
   * Создать системное SharedSpace.
   * Помечается флагом isSystemSpace = true (уникальный constraint в БД).
   */
  private async createSystemSpace(adminUserId: string): Promise<string> {
    const space = await this.sharedSpaceRepository.create({
      name: 'Базовая библиотека',
      description: 'Системное пространство с базовым контентом для всех пользователей',
      createdById: adminUserId,
      isSystemSpace: true,
      faceRecognitionEnabled: true,
      petsEnabled: true,
    });

    // Добавляем админа как owner
    await this.sharedSpaceRepository.addMember({
      spaceId: space.id,
      userId: adminUserId,
      role: SharedSpaceRole.Owner,
      showInTimeline: true,
      inheritPeople: true,
      inheritTags: true,
      showInMap: true,
      showInMemories: true,
    });

    this.logger.log(`Created system space: ${space.id} for admin: ${adminUserId}`);

    return space.id;
  }

  /**
   * Зачислить пользователя в Primary Library.
   * Добавляет как viewer с настройками по умолчанию.
   */
  async enrollUser(userId: string, role: string = SharedSpaceRole.Viewer): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      return;
    }

    // Проверяем, не зачислен ли уже
    const existing = await this.sharedSpaceRepository.getMember(settings.spaceId, userId);
    if (existing) {
      this.logger.debug(`User ${userId} already enrolled in Primary Library`);
      return;
    }

    await this.sharedSpaceRepository.addMember({
      spaceId: settings.spaceId,
      userId,
      role,
      showInTimeline: settings.defaultShowInTimeline,
      inheritPeople: settings.sharePeople,
      inheritTags: settings.shareTags,
      showInMap: settings.defaultShowInMap,
      showInMemories: settings.defaultShowInMemories,
    });

    this.logger.log(`Enrolled user ${userId} in Primary Library`);
  }

  /**
   * Удалить пользователя из Primary Library.
   */
  async removeUser(userId: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      return;
    }

    await this.sharedSpaceRepository.removeMember(settings.spaceId, userId);
    this.logger.log(`Removed user ${userId} from Primary Library`);
  }

  /**
   * Привязать библиотеки админа к системному пространству.
   */
  async linkLibraries(libraryIds: string[]): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      throw new Error('Primary Library is not enabled');
    }

    for (const libraryId of libraryIds) {
      await this.sharedSpaceRepository.addLibrary({
        spaceId: settings.spaceId,
        libraryId,
        addedById: settings.adminUserId,
      });
    }

    this.logger.log(`Linked ${libraryIds.length} libraries to Primary Library`);
  }

  /**
   * Отвязать библиотеки от системного пространства.
   */
  async unlinkLibraries(libraryIds: string[]): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      throw new Error('Primary Library is not enabled');
    }

    for (const libraryId of libraryIds) {
      await this.sharedSpaceRepository.removeLibrary(settings.spaceId, libraryId);
    }

    this.logger.log(`Unlinked ${libraryIds.length} libraries from Primary Library`);
  }

  /**
   * Получить список привязанных библиотек.
   */
  async getLinkedLibraries(): Promise<Array<{ libraryId: string; addedById: string | null }>> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      return [];
    }

    return this.sharedSpaceRepository.getLinkedLibraries(settings.spaceId);
  }

  /**
   * Получить список участников Primary Library.
   */
  async getMembers() {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      return [];
    }

    return this.sharedSpaceRepository.getMembers(settings.spaceId);
  }

  /**
   * Обновить настройки участника (showInTimeline, inheritPeople и т.д.)
   */
  async updateMember(userId: string, dto: Record<string, any>): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      throw new Error('Primary Library is not enabled');
    }

    await this.sharedSpaceRepository.updateMember(settings.spaceId, userId, dto);
  }

  /**
   * Зачислить всех существующих пользователей в Primary Library.
   * Используется при первом включении системы.
   */
  async enrollAllUsers(): Promise<number> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      return 0;
    }

    const users = await this.userRepository.getList({ withDeleted: false });
    let enrolled = 0;

    for (const user of users) {
      // Пропускаем админа-источника (он уже owner)
      if (user.id === settings.adminUserId) {
        continue;
      }

      const existing = await this.sharedSpaceRepository.getMember(settings.spaceId, user.id);
      if (!existing) {
        await this.enrollUser(user.id);
        enrolled++;
      }
    }

    this.logger.log(`Enrolled ${enrolled} existing users in Primary Library`);
    return enrolled;
  }

  /**
   * Обработчик события создания пользователя.
   * Автоматически зачисляет нового пользователя, если autoEnrollNewUsers = true.
   */
  @OnEvent({ name: 'UserCreate' })
  async onUserCreate() {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.autoEnrollNewUsers || !settings.spaceId) {
      return;
    }

    // Получаем последнего созданного пользователя
    // UserCreate event не передаёт данные, поэтому берём из БД
    const users = await this.userRepository.getList({ withDeleted: false });
    if (users.length === 0) {
      return;
    }

    // Зачисляем всех незачисленных пользователей (безопасный подход)
    for (const user of users) {
      if (user.id === settings.adminUserId) {
        continue;
      }

      const existing = await this.sharedSpaceRepository.getMember(settings.spaceId, user.id);
      if (!existing) {
        await this.enrollUser(user.id);
      }
    }
  }
}
