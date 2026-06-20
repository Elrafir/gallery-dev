<script lang="ts">
  /**
   * @component HiddenAssetsPage
   * Страница скрытых фото из базовой библиотеки.
   * Показывает список ассетов, скрытых текущим пользователем,
   * с возможностью показать обратно (unhide).
   */
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { Button, Container } from '@immich/ui';
  import { mdiEye, mdiEyeOff } from '@mdi/js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  let assets = $state<Array<{ id: string; thumbhash?: string | null; originalFileName?: string }>>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let page = $state(1);
  let hasMore = $state(true);
  const pageSize = 50;

  async function loadHidden(reset = false) {
    if (reset) {
      page = 1;
      hasMore = true;
    }
    loading = true;
    error = null;
    try {
      const res = await fetch(`/api/assets/hidden?page=${page}&size=${pageSize}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const items = data.items ?? data;
      if (reset) {
        assets = items;
      } else {
        assets = [...assets, ...items];
      }
      hasMore = items.length === pageSize;
    } catch (e: any) {
      error = `Ошибка загрузки: ${e.message}`;
    } finally {
      loading = false;
    }
  }

  async function unhide(assetId: string) {
    try {
      await fetch(`/api/assets/${assetId}/hide`, { method: 'DELETE', credentials: 'include' });
      assets = assets.filter((a) => a.id !== assetId);
    } catch (e: any) {
      error = `Ошибка: ${e.message}`;
    }
  }

  onMount(() => {
    void loadHidden(true);
  });
</script>

<UserPageLayout title={data.meta.title}>
  <Container size="large" center>
    {#if error}
      <div class="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 mb-4 text-red-700 dark:text-red-300">{error}</div>
    {/if}

    {#if loading && assets.length === 0}
      <div class="flex items-center justify-center py-16">
        <p class="text-gray-500 dark:text-gray-400">Загрузка скрытых фото...</p>
      </div>
    {:else if assets.length === 0}
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="text-6xl mb-4">👁️</div>
        <h2 class="text-xl font-semibold mb-2">Нет скрытых фото</h2>
        <p class="text-gray-500 dark:text-gray-400">Вы ещё не скрыли ни одного фото из базовой библиотеки</p>
      </div>
    {:else}
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {#each assets as asset (asset.id)}
          <div class="group relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
            <img
              src={`/api/assets/${asset.id}/thumbnail`}
              alt={asset.originalFileName ?? 'Скрытое фото'}
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <button
                class="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700"
                title="Показать обратно"
                onclick={() => unhide(asset.id)}
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d={mdiEye} /></svg>
              </button>
            </div>
          </div>
        {/each}
      </div>

      {#if hasMore}
        <div class="flex justify-center py-6">
          <Button color="secondary" size="small" disabled={loading} onclick={() => { page++; void loadHidden(); }}>
            {loading ? 'Загрузка...' : 'Загрузить ещё'}
          </Button>
        </div>
      {/if}
    {/if}
  </Container>
</UserPageLayout>
