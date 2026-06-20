<script lang="ts">
  /**
   * @component PrimaryLibraryPage
   * Страница управления базовой библиотекой (Primary Library).
   * Позволяет админу: включить/выключить PL, настроить auto-enrollment,
   * управлять участниками, привязать библиотеки.
   */
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { Container, Alert, Button } from '@immich/ui';
  import {
    mdiAccountPlus,
    mdiAccountRemove,
    mdiCheck,
    mdiRefresh,
  } from '@mdi/js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  // =====================
  // Состояние
  // =====================

  /** Настройки PL с сервера */
  let settings = $state<{
    enabled: boolean;
    autoEnrollNewUsers: boolean;
    sharePeople: boolean;
    shareTags: boolean;
    defaultShowInTimeline: boolean;
    defaultShowInMap: boolean;
    defaultShowInMemories: boolean;
    spaceId?: string;
    adminUserId?: string;
  } | null>(null);

  /** Участники PL */
  let members = $state<Array<{ userId: string; email?: string; role: string; showInTimeline: boolean }>>([]);

  /** Статус загрузки */
  let loading = $state(true);
  let saving = $state(false);
  let enrollingAll = $state(false);
  let error = $state<string | null>(null);
  let successMessage = $state<string | null>(null);

  // =====================
  // API вызовы (прямые fetch — SDK функции не принимают body корректно)
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

  async function apiDelete(path: string): Promise<void> {
    const res = await fetch(`/api${path}`, { method: 'DELETE', credentials: 'include' });
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
        members = await apiGet('/primary-library/members');
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

  // =====================
  // Действия
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
      successMessage = 'Настройки сохранены';
      setTimeout(() => (successMessage = null), 3000);
    } catch (e: any) {
      error = `Ошибка сохранения: ${e.message}`;
    } finally {
      saving = false;
    }
  }

  async function enrollAll() {
    enrollingAll = true;
    error = null;
    try {
      const result = await apiPut<{ enrolled: number }>('/primary-library/members/enroll-all');
      successMessage = `Зачислено пользователей: ${result.enrolled ?? 0}`;
      setTimeout(() => (successMessage = null), 5000);
      members = await apiGet('/primary-library/members');
    } catch (e: any) {
      error = `Ошибка зачисления: ${e.message}`;
    } finally {
      enrollingAll = false;
    }
  }

  async function removeMember(userId: string) {
    error = null;
    try {
      await apiDelete(`/primary-library/members/${userId}`);
      members = members.filter((m) => m.userId !== userId);
      successMessage = 'Участник удалён';
      setTimeout(() => (successMessage = null), 3000);
    } catch (e: any) {
      error = `Ошибка удаления: ${e.message}`;
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
              <p class="text-sm text-gray-500 dark:text-gray-400">Расшарить библиотеки админа всем пользователям</p>
            </div>
            <input type="checkbox" bind:checked={settings.enabled} class="toggle toggle-primary w-12 h-6 accent-indigo-600" />
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
                <p class="text-sm text-gray-500 dark:text-gray-400">Фото админа появятся в ленте пользователей</p>
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
          <Button color="primary" size="small" icon={mdiCheck} disabled={saving} onclick={saveSettings}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      <!-- ===== УЧАСТНИКИ ===== -->
      {#if settings.enabled}
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Участники ({members.length})</h2>
            <div class="flex gap-2">
              <Button color="secondary" size="small" icon={mdiRefresh} onclick={loadData}>Обновить</Button>
              <Button color="primary" size="small" icon={mdiAccountPlus} disabled={enrollingAll} onclick={enrollAll}>
                {enrollingAll ? 'Зачисление...' : 'Зачислить всех'}
              </Button>
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
                    <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td class="py-2 px-3">{member.email ?? member.userId}</td>
                      <td class="py-2 px-3">
                        <span class="inline-block px-2 py-0.5 rounded text-xs font-medium
                          {member.role === 'owner' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                           member.role === 'editor' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                           'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}">
                          {member.role}
                        </span>
                      </td>
                      <td class="py-2 px-3">
                        {member.showInTimeline ? '✓' : '—'}
                      </td>
                      <td class="py-2 px-3 text-right">
                        {#if member.role !== 'owner'}
                          <Button color="danger" size="tiny" icon={mdiAccountRemove} onclick={() => removeMember(member.userId)}>
                            Удалить
                          </Button>
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
