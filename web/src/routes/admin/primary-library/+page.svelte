<script lang="ts">
  /**
   * @component PrimaryLibraryPage
   * Страница управления базовой библиотекой (Primary Library).
   * Позволяет админу: включить/выключить PL, настроить auto-enrollment,
   * управлять расшаренными пользователями и участниками.
   */
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { Container, Alert, Icon } from '@immich/ui';
  import {
    mdiAccountMultiplePlus,
    mdiAccountPlus,
    mdiAccountRemove,
    mdiCheck,
    mdiRefresh,
    mdiShareVariant,
    mdiShareOff,
  } from '@mdi/js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  // =====================
  // Типы
  // =====================

  type PLSettings = {
    enabled: boolean;
    sharedUserIds: string[];
    autoEnrollNewUsers: boolean;
    sharePeople: boolean;
    shareTags: boolean;
    defaultShowInTimeline: boolean;
    defaultShowInMap: boolean;
    defaultShowInMemories: boolean;
    spaceId?: string;
    adminUserId?: string;
  };

  type Member = { userId: string; email?: string; name?: string; role: string; showInTimeline: boolean };
  type SharedUser = { ownerId: string; name: string; email: string };
  type SystemUser = { id: string; name: string; email: string; isAdmin: boolean };

  // =====================
  // Состояние
  // =====================

  let settings = $state<PLSettings | null>(null);
  let members = $state<Member[]>([]);
  let sharedUsers = $state<SharedUser[]>([]);
  let allUsers = $state<SystemUser[]>([]);

  let loading = $state(true);
  let saving = $state(false);
  let enrollingAll = $state(false);
  let error = $state<string | null>(null);
  let successMessage = $state<string | null>(null);

  // Computed: пользователи, доступные для расшаривания
  let availableUsersToShare = $derived(
    allUsers.filter((u) => !sharedUsers.some((su) => su.ownerId === u.id)),
  );

  // =====================
  // API helpers
  // =====================

  async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`/api${path}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async function apiPut<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`/api${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  async function apiDelete(path: string, body?: unknown): Promise<void> {
    const res = await fetch(`/api${path}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
  }

  // =====================
  // Загрузка данных
  // =====================

  async function loadData() {
    loading = true;
    error = null;
    try {
      settings = await apiGet('/primary-library/settings');
      if (settings?.enabled) {
        [members, sharedUsers, allUsers] = await Promise.all([
          apiGet<Member[]>('/primary-library/members'),
          apiGet<SharedUser[]>('/primary-library/shared-users'),
          apiGet<SystemUser[]>('/admin/users'),
        ]);
      }
    } catch (e: any) {
      error = `Ошибка загрузки: ${e.message}`;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void loadData();
  });

  function showSuccess(msg: string) {
    successMessage = msg;
    setTimeout(() => (successMessage = null), 3000);
  }

  // =====================
  // Действия: Настройки
  // =====================

  async function saveSettings() {
    if (!settings) return;
    saving = true;
    error = null;
    successMessage = null;
    try {
      settings = await apiPut('/primary-library/settings', {
        enabled: settings.enabled,
        autoEnrollNewUsers: settings.autoEnrollNewUsers,
        sharePeople: settings.sharePeople,
        shareTags: settings.shareTags,
        defaultShowInTimeline: settings.defaultShowInTimeline,
        defaultShowInMap: settings.defaultShowInMap,
        defaultShowInMemories: settings.defaultShowInMemories,
      });
      showSuccess('Настройки сохранены');
      await loadData();
    } catch (e: any) {
      error = `Ошибка сохранения: ${e.message}`;
    } finally {
      saving = false;
    }
  }

  // =====================
  // Действия: Расшаренные пользователи
  // =====================

  async function addSharedUser(userId: string) {
    try {
      await apiPut(`/primary-library/shared-users/${userId}`);
      sharedUsers = await apiGet('/primary-library/shared-users');
      showSuccess('Пользователь добавлен как источник фото');
    } catch (e: any) {
      error = `Ошибка: ${e.message}`;
    }
  }

  async function removeSharedUser(userId: string) {
    try {
      await apiDelete(`/primary-library/shared-users/${userId}`);
      sharedUsers = sharedUsers.filter((su) => su.ownerId !== userId);
      showSuccess('Пользователь убран из источников');
    } catch (e: any) {
      error = `Ошибка: ${e.message}`;
    }
  }

  // =====================
  // Действия: Участники
  // =====================

  async function enrollAll() {
    enrollingAll = true;
    error = null;
    try {
      const result = await apiPut<number>('/primary-library/members/enroll-all');
      showSuccess(`Зачислено пользователей: ${result ?? 0}`);
      members = await apiGet('/primary-library/members');
    } catch (e: any) {
      error = `Ошибка зачисления: ${e.message}`;
    } finally {
      enrollingAll = false;
    }
  }

  async function removeMember(userId: string) {
    try {
      await apiDelete(`/primary-library/members/${userId}`);
      members = members.filter((m) => m.userId !== userId);
      showSuccess('Участник удалён');
    } catch (e: any) {
      error = `Ошибка: ${e.message}`;
    }
  }
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]}>
  <Container size="large" center>
    {#if error}
      <Alert color="danger" class="mb-4" title={error} />
    {/if}

    {#if successMessage}
      <Alert color="success" class="mb-4" title={successMessage} />
    {/if}

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <p class="text-gray-500 dark:text-gray-400">Загрузка настроек...</p>
      </div>
    {:else if settings}
      <!-- ===== НАСТРОЙКИ ===== -->
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Настройки базовой библиотеки</h2>

        <div class="space-y-4">
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <p class="font-medium">Включить базовую библиотеку</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Расшарить фото выбранных пользователей всем участникам</p>
            </div>
            <input type="checkbox" bind:checked={settings.enabled} class="w-5 h-5 accent-indigo-600" />
          </label>

          {#if settings.enabled}
            <hr class="border-gray-200 dark:border-gray-700" />

            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="font-medium">Авто-зачисление новых пользователей</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Новые пользователи автоматически получат доступ</p>
              </div>
              <input type="checkbox" bind:checked={settings.autoEnrollNewUsers} class="w-5 h-5 accent-indigo-600" />
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="font-medium">Показывать в таймлайне по умолчанию</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Расшаренные фото появятся в ленте пользователей</p>
              </div>
              <input type="checkbox" bind:checked={settings.defaultShowInTimeline} class="w-5 h-5 accent-indigo-600" />
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="font-medium">Показывать на карте по умолчанию</p>
              </div>
              <input type="checkbox" bind:checked={settings.defaultShowInMap} class="w-5 h-5 accent-indigo-600" />
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="font-medium">Показывать в воспоминаниях по умолчанию</p>
              </div>
              <input type="checkbox" bind:checked={settings.defaultShowInMemories} class="w-5 h-5 accent-indigo-600" />
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="font-medium">Расшарить распознанные лица</p>
              </div>
              <input type="checkbox" bind:checked={settings.sharePeople} class="w-5 h-5 accent-indigo-600" />
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="font-medium">Расшарить теги</p>
              </div>
              <input type="checkbox" bind:checked={settings.shareTags} class="w-5 h-5 accent-indigo-600" />
            </label>
          {/if}
        </div>

        <div class="mt-6 flex gap-3">
          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            disabled={saving}
            onclick={saveSettings}
          >
            <Icon icon={mdiCheck} size="18" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {#if settings.enabled}
        <!-- ===== РАСШАРЕННЫЕ ПОЛЬЗОВАТЕЛИ (Multi-Admin) ===== -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 mb-6">
          <h2 class="text-lg font-semibold mb-2">Источники фото ({sharedUsers.length})</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Все фото этих пользователей будут видны участникам базовой библиотеки.
          </p>

          {#if sharedUsers.length > 0}
            <div class="space-y-2 mb-4">
              {#each sharedUsers as user (user.ownerId)}
                <div
                  class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                >
                  <div class="flex items-center gap-3">
                    <Icon icon={mdiShareVariant} size="20" class="text-indigo-500" />
                    <div>
                      <p class="font-medium">{user.name}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                    onclick={() => removeSharedUser(user.ownerId)}
                  >
                    <Icon icon={mdiShareOff} size="14" />
                    Убрать
                  </button>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-gray-500 dark:text-gray-400 text-center py-4 mb-4">
              Нет расшаренных пользователей. Добавьте пользователей, чьи фото будут видны участникам.
            </p>
          {/if}

          {#if availableUsersToShare.length > 0}
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Добавить пользователя:</h3>
              <div class="space-y-1">
                {#each availableUsersToShare as user (user.id)}
                  <div
                    class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <div>
                      <p class="text-sm font-medium">{user.name}</p>
                      <p class="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <button
                      class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                        bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-colors"
                      onclick={() => addSharedUser(user.id)}
                    >
                      <Icon icon={mdiAccountPlus} size="14" />
                      Расшарить
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- ===== УЧАСТНИКИ ===== -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Участники ({members.length})</h2>
            <div class="flex gap-2">
              <button
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                onclick={loadData}
              >
                <Icon icon={mdiRefresh} size="16" />
                Обновить
              </button>
              <button
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                disabled={enrollingAll}
                onclick={enrollAll}
              >
                <Icon icon={mdiAccountMultiplePlus} size="16" />
                {enrollingAll ? 'Зачисление...' : 'Зачислить всех'}
              </button>
            </div>
          </div>

          {#if members.length === 0}
            <p class="text-gray-500 dark:text-gray-400 text-center py-8">
              Нет участников. Нажмите «Зачислить всех» для добавления существующих пользователей.
            </p>
          {:else}
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700 text-left">
                    <th class="py-2 px-3 font-medium">Пользователь</th>
                    <th class="py-2 px-3 font-medium">Роль</th>
                    <th class="py-2 px-3 font-medium">В таймлайне</th>
                    <th class="py-2 px-3 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {#each members as member (member.userId)}
                    <tr
                      class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td class="py-2 px-3">{member.name ?? member.email ?? member.userId}</td>
                      <td class="py-2 px-3">
                        <span
                          class="inline-block px-2 py-0.5 rounded text-xs font-medium
                          {member.role === 'owner'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                            : member.role === 'editor'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
                        >
                          {member.role}
                        </span>
                      </td>
                      <td class="py-2 px-3">
                        {member.showInTimeline ? '✓' : '—'}
                      </td>
                      <td class="py-2 px-3 text-right">
                        {#if member.role !== 'owner'}
                          <button
                            class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                              bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 transition-colors"
                            onclick={() => removeMember(member.userId)}
                          >
                            <Icon icon={mdiAccountRemove} size="14" />
                            Удалить
                          </button>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </Container>
</AdminPageLayout>
