<script lang="ts">
  /**
   * @component PrimaryLibraryPage
   * Страница управления базовой библиотекой (Primary Library).
   * Позволяет админу: включить/выключить PL, настроить auto-enrollment,
   * управлять участниками, привязать библиотеки и теги.
   */
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { Container, Alert, Button } from '@immich/ui';
  import {
    mdiAccountPlus,
    mdiAccountRemove,
    mdiBookshelf,
    mdiCheck,
    mdiLink,
    mdiLinkOff,
    mdiRefresh,
    mdiTagPlus,
    mdiTagRemove,
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
    autoEnrollNewUsers: boolean;
    sharePeople: boolean;
    shareTags: boolean;
    defaultShowInTimeline: boolean;
    defaultShowInMap: boolean;
    defaultShowInMemories: boolean;
    spaceId?: string;
    adminUserId?: string;
  };

  type Member = { userId: string; email?: string; role: string; showInTimeline: boolean };
  type Library = { id: string; name: string; ownerId: string; importPaths: string[]; assetCount?: number };
  type Tag = { id: string; value: string; color?: string };

  // =====================
  // Состояние
  // =====================

  let settings = $state<PLSettings | null>(null);
  let members = $state<Member[]>([]);
  let linkedLibraries = $state<Library[]>([]);
  let allLibraries = $state<Library[]>([]);
  let linkedTags = $state<Tag[]>([]);
  let allTags = $state<Tag[]>([]);

  let loading = $state(true);
  let saving = $state(false);
  let enrollingAll = $state(false);
  let error = $state<string | null>(null);
  let successMessage = $state<string | null>(null);

  // Computed: доступные для привязки (ещё не привязанные)
  let availableLibraries = $derived(
    allLibraries.filter((lib) => !linkedLibraries.some((linked) => linked.id === lib.id)),
  );
  let availableTags = $derived(allTags.filter((tag) => !linkedTags.some((linked) => linked.id === tag.id)));

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
        [members, linkedLibraries, allLibraries, linkedTags, allTags] = await Promise.all([
          apiGet<Member[]>('/primary-library/members'),
          apiGet<Library[]>('/primary-library/libraries'),
          apiGet<Library[]>('/libraries'),
          apiGet<Tag[]>('/primary-library/tags'),
          apiGet<Tag[]>('/tags'),
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
      // Перезагрузить всё при включении/выключении
      await loadData();
    } catch (e: any) {
      error = `Ошибка сохранения: ${e.message}`;
    } finally {
      saving = false;
    }
  }

  // =====================
  // Действия: Участники
  // =====================

  async function enrollAll() {
    enrollingAll = true;
    error = null;
    try {
      const result = await apiPut<{ enrolled: number }>('/primary-library/members/enroll-all');
      showSuccess(`Зачислено пользователей: ${result.enrolled ?? 0}`);
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

  // =====================
  // Действия: Библиотеки
  // =====================

  async function linkLibrary(libraryId: string) {
    try {
      await apiPut('/primary-library/libraries', { libraryIds: [libraryId] });
      linkedLibraries = await apiGet('/primary-library/libraries');
      showSuccess('Библиотека привязана');
    } catch (e: any) {
      error = `Ошибка: ${e.message}`;
    }
  }

  async function unlinkLibrary(libraryId: string) {
    try {
      await apiDelete('/primary-library/libraries', { libraryIds: [libraryId] });
      linkedLibraries = linkedLibraries.filter((l) => l.id !== libraryId);
      showSuccess('Библиотека отвязана');
    } catch (e: any) {
      error = `Ошибка: ${e.message}`;
    }
  }

  // =====================
  // Действия: Теги
  // =====================

  async function linkTag(tagId: string) {
    try {
      await apiPut('/primary-library/tags', { tagIds: [tagId] });
      linkedTags = await apiGet('/primary-library/tags');
      showSuccess('Тег привязан');
    } catch (e: any) {
      error = `Ошибка: ${e.message}`;
    }
  }

  async function unlinkTag(tagId: string) {
    try {
      await apiDelete('/primary-library/tags', { tagIds: [tagId] });
      linkedTags = linkedTags.filter((t) => t.id !== tagId);
      showSuccess('Тег отвязан');
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
              <p class="text-sm text-gray-500 dark:text-gray-400">Расшарить библиотеки админа всем пользователям</p>
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

      {#if settings.enabled}
        <!-- ===== БИБЛИОТЕКИ ===== -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Привязанные библиотеки ({linkedLibraries.length})</h2>

          {#if linkedLibraries.length > 0}
            <div class="space-y-2 mb-4">
              {#each linkedLibraries as lib (lib.id)}
                <div
                  class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                >
                  <div>
                    <p class="font-medium">{lib.name}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {lib.importPaths?.join(', ') ?? 'Загрузка'}
                      {#if lib.assetCount != null}
                        · {lib.assetCount} фото
                      {/if}
                    </p>
                  </div>
                  <Button color="danger" size="tiny" icon={mdiLinkOff} onclick={() => unlinkLibrary(lib.id)}>
                    Отвязать
                  </Button>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-gray-500 dark:text-gray-400 text-center py-4 mb-4">
              Нет привязанных библиотек. Привяжите библиотеки, чтобы фото стали доступны пользователям.
            </p>
          {/if}

          {#if availableLibraries.length > 0}
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Доступные для привязки:</h3>
              <div class="space-y-1">
                {#each availableLibraries as lib (lib.id)}
                  <div
                    class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <div>
                      <p class="text-sm">{lib.name}</p>
                      <p class="text-xs text-gray-400">{lib.importPaths?.join(', ') ?? ''}</p>
                    </div>
                    <Button color="primary" size="tiny" icon={mdiLink} onclick={() => linkLibrary(lib.id)}>
                      Привязать
                    </Button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- ===== ТЕГИ ===== -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Привязанные теги ({linkedTags.length})</h2>

          {#if linkedTags.length > 0}
            <div class="flex flex-wrap gap-2 mb-4">
              {#each linkedTags as tag (tag.id)}
                <span
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  {tag.value}
                  <button
                    class="ml-1 hover:text-red-500 transition-colors"
                    title="Отвязать тег"
                    onclick={() => unlinkTag(tag.id)}
                  >
                    ✕
                  </button>
                </span>
              {/each}
            </div>
          {:else}
            <p class="text-gray-500 dark:text-gray-400 text-center py-4 mb-4">
              Нет привязанных тегов.
            </p>
          {/if}

          {#if availableTags.length > 0}
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Доступные теги:</h3>
              <div class="flex flex-wrap gap-1">
                {#each availableTags as tag (tag.id)}
                  <button
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
                    onclick={() => linkTag(tag.id)}
                  >
                    + {tag.value}
                  </button>
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
                    <tr
                      class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td class="py-2 px-3">{member.email ?? member.userId}</td>
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
                          <Button
                            color="danger"
                            size="tiny"
                            icon={mdiAccountRemove}
                            onclick={() => removeMember(member.userId)}
                          >
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
