<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  interface UpstreamReleaseItem {
    id: string;
    source: 'immich' | 'noodle-gallery';
    tagName: string;
    name: string;
    publishedAt: string;
    htmlUrl: string;
    body: string;
    summaryRu: string;
    isCurrent: boolean;
  }

  interface UpstreamUpdatesResponse {
    currentVersion: string;
    checkedAt: string;
    immich: UpstreamReleaseItem[];
    noodleGallery: UpstreamReleaseItem[];
  }

  let loading = $state(false);
  let activeTab: 'immich' | 'noodle' = $state('immich');
  let data: UpstreamUpdatesResponse | null = $state(null);
  let error: string | null = $state(null);
  let currentList = $derived(activeTab === 'immich' ? data?.immich : data?.noodleGallery);

  async function fetchUpdates(force = false) {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/server/upstream-updates' + (force ? '?force=true' : ''));
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      data = await res.json();
    } catch (e: any) {
      error = e?.message || 'Не удалось получить данные об обновлениях';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchUpdates();
  });
</script>

<div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800" in:fade={{ duration: 400 }}>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h3 class="text-lg font-semibold text-immich-primary dark:text-immich-dark-primary">
        Центр обновлений Upstream (Immich & Noodle Gallery)
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Отслеживание свежих релизов и коммитов в исходных репозиториях с описанием на русском языке.
      </p>
    </div>
    <button
      type="button"
      onclick={() => fetchUpdates(true)}
      disabled={loading}
      class="rounded-lg bg-immich-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-immich-primary/90 disabled:opacity-50 dark:bg-immich-dark-primary dark:text-gray-900"
    >
      {loading ? 'Проверка...' : '🔄 Проверить обновления'}
    </button>
  </div>

  {#if data}
    <div class="mt-4 flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
      <span class="font-bold">Текущая версия сервера:</span>
      <code class="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs dark:bg-blue-900">{data.currentVersion}</code>
      {#if data.checkedAt}
        <span class="ml-auto text-xs opacity-75">Проверено: {new Date(data.checkedAt).toLocaleString('ru-RU')}</span>
      {/if}
    </div>

    <!-- Tabs -->
    <div class="mt-4 flex border-b border-gray-200 dark:border-gray-800">
      <button
        type="button"
        onclick={() => (activeTab = 'immich')}
        class="border-b-2 px-4 py-2 text-sm font-medium transition {activeTab === 'immich'
          ? 'border-immich-primary text-immich-primary dark:border-immich-dark-primary dark:text-immich-dark-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
      >
        Оригинальный Immich ({data.immich?.length || 0})
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'noodle')}
        class="border-b-2 px-4 py-2 text-sm font-medium transition {activeTab === 'noodle'
          ? 'border-immich-primary text-immich-primary dark:border-immich-dark-primary dark:text-immich-dark-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
      >
        Форк Noodle Gallery ({data.noodleGallery?.length || 0})
      </button>
    </div>

    <!-- Content list -->
    <div class="mt-4 space-y-3">
      {#if currentList && currentList.length > 0}
        {#each currentList as release}
          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {release.tagName}
                </span>
                <span class="font-medium text-gray-900 dark:text-gray-100">{release.name}</span>
                {#if release.isCurrent}
                  <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                    Текущая база
                  </span>
                {/if}
              </div>
              <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>{new Date(release.publishedAt).toLocaleDateString('ru-RU')}</span>
                <a
                  href={release.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  class="font-medium text-immich-primary underline dark:text-immich-dark-primary"
                >
                  GitHub ↗
                </a>
              </div>
            </div>

            <!-- Summary in Russian -->
            <div class="mt-3 whitespace-pre-line rounded bg-gray-50 p-3 text-xs leading-relaxed text-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
              {release.summaryRu}
            </div>
          </div>
        {/each}
      {:else}
        <p class="py-4 text-center text-sm text-gray-500">Нет доступных релизов или лимит GitHub API.</p>
      {/if}
    </div>
  {:else if error}
    <div class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
      {error}
    </div>
  {/if}
</div>
