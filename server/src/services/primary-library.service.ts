/**
 * Сервис управления базовой библиотекой (Primary Library).
 * Обеспечивает создание и управление системным пространством,
 * автоматическое зачисление пользователей, синхронизацию библиотек админа.
 */
import { OnEvent } from 'src/decorators';
import { JobName, SharedSpaceRole, SystemMetadataKey } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { PrimaryLibrarySettings } from 'src/types';

/** Настройки по умолчанию для Primary Library */
const DEFAULT_SETTINGS: Omit<PrimaryLibrarySettings, 'spaceId' | 'adminUserId' | 'sharedUserIds'> = {
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
        sharedUserIds: [],
        ...dto,
      };
    } else {
      // Миграция: добавляем sharedUserIds если их нет (обратная совместимость)
      if (!settings.sharedUserIds) {
        settings.sharedUserIds = settings.adminUserId ? [settings.adminUserId] : [];
      }
      settings = { ...settings, ...dto };
    }

    // Создаём системное пространство, если его ещё нет
    if (settings.enabled && !settings.spaceId && settings.adminUserId) {
      const spaceId = await this.createSystemSpace(settings.adminUserId);
      settings.spaceId = spaceId;

      // Автоматически добавляем админа как расшаренного пользователя
      if (!settings.sharedUserIds.includes(settings.adminUserId)) {
        settings.sharedUserIds.push(settings.adminUserId);
      }
      await this.sharedSpaceRepository.addOwner(spaceId, settings.adminUserId, settings.adminUserId);
    }

    await this.systemMetadataRepository.set(SystemMetadataKey.PrimaryLibrarySpaceId, settings);

    this.logger.log(`Primary Library settings updated: enabled=${settings.enabled}, sharedUsers=${settings.sharedUserIds.length}`);

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
   * Добавляет как editor с настройками по умолчанию.
   */
  async enrollUser(userId: string, role: string = SharedSpaceRole.Editor): Promise<void> {
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

  // ==========================================
  // Multi-Admin: Shared Users (shared_space_owner)
  // ==========================================

  /**
   * Добавить пользователя как источник фото в PL.
   * Все его фото станут видны участникам.
   */
  async addSharedUser(userId: string, addedById: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      throw new Error('Primary Library is not enabled');
    }

    await this.sharedSpaceRepository.addOwner(settings.spaceId, userId, addedById);

    // Обновляем список в settings
    if (!settings.sharedUserIds) {
      settings.sharedUserIds = [];
    }
    if (!settings.sharedUserIds.includes(userId)) {
      settings.sharedUserIds.push(userId);
      await this.systemMetadataRepository.set(SystemMetadataKey.PrimaryLibrarySpaceId, settings);
    }

    // Запускаем синхронизацию лиц для пространства PL,
    // чтобы лица из фото нового shared user появились у участников
    const space = await this.sharedSpaceRepository.getById(settings.spaceId);
    if (space?.faceRecognitionEnabled) {
      await this.jobRepository.queue({
        name: JobName.SharedSpaceFaceMatchAll,
        data: { spaceId: settings.spaceId },
      });
    }

    this.logger.log(`Added shared user ${userId} to Primary Library`);
  }

  /**
   * Убрать пользователя из источников фото.
   */
  async removeSharedUser(userId: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      throw new Error('Primary Library is not enabled');
    }

    await this.sharedSpaceRepository.removeOwner(settings.spaceId, userId);

    // Обновляем список в settings
    if (settings.sharedUserIds) {
      settings.sharedUserIds = settings.sharedUserIds.filter((id) => id !== userId);
      await this.systemMetadataRepository.set(SystemMetadataKey.PrimaryLibrarySpaceId, settings);
    }

    this.logger.log(`Removed shared user ${userId} from Primary Library`);
  }

  /**
   * Получить список расшаренных пользователей.
   */
  async getSharedUsers() {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      return [];
    }

    return this.sharedSpaceRepository.getLinkedOwners(settings.spaceId);
  }

  /**
   * Привязать библиотеки к системному пространству (legacy, для external libraries).
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
  }

  /**
   * Отвязать библиотеки от системного пространства (legacy).
   */
  async unlinkLibraries(libraryIds: string[]): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      throw new Error('Primary Library is not enabled');
    }

    for (const libraryId of libraryIds) {
      await this.sharedSpaceRepository.removeLibrary(settings.spaceId, libraryId);
    }
  }

  /**
   * Получить список привязанных библиотек (legacy).
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

  // ==========================================
  // Phase 3.3: Space Tag Management (admin)
  // ==========================================

  /**
   * Привязать теги к системному пространству.
   */
  async addSpaceTags(tagIds: string[]): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      throw new Error('Primary Library is not enabled');
    }

    await this.sharedSpaceRepository.addSpaceTags(settings.spaceId, tagIds);
    this.logger.log(`Linked ${tagIds.length} tags to Primary Library`);
  }

  /**
   * Отвязать теги от системного пространства.
   */
  async removeSpaceTags(tagIds: string[]): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      throw new Error('Primary Library is not enabled');
    }

    await this.sharedSpaceRepository.removeSpaceTags(settings.spaceId, tagIds);
    this.logger.log(`Unlinked ${tagIds.length} tags from Primary Library`);
  }

  /**
   * Получить список привязанных тегов.
   */
  async getSpaceTags() {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      return [];
    }

    return this.sharedSpaceRepository.getSpaceTags(settings.spaceId);
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
    const sharedUserIds = settings.sharedUserIds || [settings.adminUserId];
    let enrolled = 0;

    for (const user of users) {
      // Пропускаем пользователей-источников (они уже owner/shared)
      if (sharedUserIds.includes(user.id)) {
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
  async onUserCreate(user: ArgOf<'UserCreate'>) {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.autoEnrollNewUsers || !settings.spaceId) {
      return;
    }

    const sharedUserIds = settings.sharedUserIds || [settings.adminUserId];
    if (sharedUserIds.includes(user.id)) {
      return;
    }

    await this.enrollUser(user.id);
    this.logger.log(`Auto-enrolled new user ${user.email} into Primary Library`);
  }

  /**
   * Обработчик события восстановления пользователя из корзины.
   * Ре-enrollит пользователя, если autoEnrollNewUsers = true.
   */
  @OnEvent({ name: 'UserRestore' })
  async onUserRestore(user: ArgOf<'UserRestore'>) {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.autoEnrollNewUsers || !settings.spaceId) {
      return;
    }

    const sharedUserIds = settings.sharedUserIds || [settings.adminUserId];
    if (sharedUserIds.includes(user.id)) {
      return;
    }

    await this.enrollUser(user.id);
    this.logger.log(`Re-enrolled restored user ${user.email} into Primary Library`);
  }

  /**
   * Вручную запустить синхронизацию распознанных лиц для PL-пространства.
   * Полезно после добавления shared users, если лица ещё не синхронизированы.
   */
  async syncFaces(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enabled || !settings.spaceId) {
      throw new Error('Primary Library is not enabled');
    }

    const space = await this.sharedSpaceRepository.getById(settings.spaceId);
    if (!space?.faceRecognitionEnabled) {
      throw new Error('Face recognition is not enabled for Primary Library space');
    }

    await this.jobRepository.queue({
      name: JobName.SharedSpaceFaceMatchAll,
      data: { spaceId: settings.spaceId },
    });

    this.logger.log('Queued face sync for Primary Library');
  }
}
