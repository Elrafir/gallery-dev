import { eventManager } from '$lib/managers/event-manager.svelte';

/**
 * @class SearchStore
 * Глобальное хранилище состояния для поиска.
 * Сохраняет историю поисковых запросов и статус доступности поиска (включен/выключен).
 * Очищается при выходе пользователя из системы.
 */
class SearchStore {
  savedSearchTerms = $state<string[]>([]);
  isSearchEnabled = $state(false);

  constructor() {
    eventManager.on({
      AuthLogout: () => this.clearCache(),
    });
  }

  clearCache() {
    this.savedSearchTerms = [];
    this.isSearchEnabled = false;
  }
}

export const searchStore = new SearchStore();
