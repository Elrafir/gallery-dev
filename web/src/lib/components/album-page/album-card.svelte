<script lang="ts">
  import AlbumCover from '$lib/components/album-page/album-cover.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { getContextMenuPositionFromEvent, type ContextMenuPosition } from '$lib/utils/context-menu';
  import { getShortDateRange } from '$lib/utils/date-time';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { getFilterSuggestions } from '@immich/sdk';
  import { getPhotosPersonFilterThumbnailUrl } from '$lib/utils/photos-filter-options';
  import { IconButton } from '@immich/ui';
  import AlbumShareButton from '$lib/components/album-page/AlbumShareButton.svelte';
  import { mdiDotsVertical } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { Route } from '$lib/route';
  import { fade } from 'svelte/transition';

  interface Props {
    album: AlbumResponseDto;
    showOwner?: boolean;
    showDateRange?: boolean;
    showItemCount?: boolean;
    preload?: boolean;
    onShowContextMenu?: ((position: ContextMenuPosition) => unknown) | undefined;
  }
  let {
    album,
    showOwner = false,
    showDateRange = false,
    showItemCount = false,
    preload = false,
    onShowContextMenu = undefined,
  }: Props = $props();

  const showAlbumContextMenu = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onShowContextMenu?.(getContextMenuPositionFromEvent(e));
  };

  // Элемент контейнера карточки для замера позиции на экране
  let cardElement = $state<HTMLDivElement>();
  let hoverBelow = $state(false);

  // Состояние всплывающего окна при наведении
  let showHoverCard = $state(false);
  let hoverPeople = $state<Array<{ id: string; name: string; thumbnailUrl: string }>>([]);
  let hoverCardTimeout: NodeJS.Timeout | null = null;
  let hideCardTimeout: NodeJS.Timeout | null = null;
  let isLoadingPeople = $state(false);

  const handleMouseEnter = () => {
    if (hideCardTimeout) {
      clearTimeout(hideCardTimeout);
      hideCardTimeout = null;
    }

    if (hoverCardTimeout) {
      clearTimeout(hoverCardTimeout);
    }

    // Время для срабатывания снижено до 0.7 секунды
    hoverCardTimeout = setTimeout(async () => {
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        // Если верхняя граница карточки ближе чем 280px к верху экрана, выводим окно снизу
        hoverBelow = rect.top < 280;
      }
      
      isLoadingPeople = true;
      try {
        const suggestions = await getFilterSuggestions({ albumId: album.id });
        hoverPeople = suggestions.people.slice(0, 5).map(person => ({
          id: person.id,
          name: person.name,
          thumbnailUrl: getPhotosPersonFilterThumbnailUrl(person)
        }));
        showHoverCard = true;
      } catch (e) {
        console.error('Error fetching album people for hover card', e);
      } finally {
        isLoadingPeople = false;
      }
    }, 700);
  };

  const handleMouseLeave = () => {
    if (hoverCardTimeout) {
      clearTimeout(hoverCardTimeout);
      hoverCardTimeout = null;
    }

    hideCardTimeout = setTimeout(() => {
      showHoverCard = false;
    }, 500);
  };

  const handleHoverCardMouseEnter = () => {
    if (hideCardTimeout) {
      clearTimeout(hideCardTimeout);
      hideCardTimeout = null;
    }
  };

  const handleHoverCardMouseLeave = () => {
    hideCardTimeout = setTimeout(() => {
      showHoverCard = false;
    }, 500);
  };
</script>

<div
  bind:this={cardElement}
  class="group relative rounded-2xl border border-transparent p-5 hover:bg-gray-100 hover:border-gray-200 dark:hover:border-gray-800 dark:hover:bg-gray-900"
  data-testid="album-card"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  role="presentation"
>
  {#if onShowContextMenu}
    <div
      id="icon-{album.id}"
      class="absolute end-6 top-6 opacity-0 group-hover:opacity-100 focus-within:opacity-100 z-10"
      data-testid="context-button-parent"
    >
      <IconButton
        color="secondary"
        aria-label={$t('show_album_options')}
        icon={mdiDotsVertical}
        shape="round"
        variant="filled"
        size="medium"
        class="icon-white-drop-shadow"
        onclick={showAlbumContextMenu}
      />
    </div>
  {/if}

  <div class="relative">
    <AlbumCover {album} {preload} class="transition-all duration-300 hover:shadow-lg" />
    <AlbumShareButton {album} />
  </div>

  <div class="mt-4">
    <p
      class="w-full leading-6 text-lg line-clamp-2 font-semibold text-black dark:text-white group-hover:text-primary"
      data-testid="album-name"
      title={album.albumName}
    >
      {album.albumName}
    </p>

    {#if showDateRange && album.startDate && album.endDate}
      <p class="flex text-sm dark:text-immich-dark-fg capitalize">
        {getShortDateRange(album.startDate, album.endDate)}
      </p>
    {/if}

    <span class="flex gap-2 text-sm dark:text-immich-dark-fg" data-testid="album-details">
      {#if showItemCount}
        <p>
          {$t('items_count', { values: { count: album.assetCount } })}
        </p>
      {/if}

      {#if (showOwner || album.shared) && showItemCount}
        <p>•</p>
      {/if}

      {#if showOwner}
        {#if authManager.user.id === album.ownerId}
          <p>{$t('owned')}</p>
        {:else if album.owner}
          <p>{$t('shared_by_user', { values: { user: album.owner.name } })}</p>
        {:else}
          <p>{$t('shared')}</p>
        {/if}
      {:else if album.shared}
        <p>{$t('shared')}</p>
      {/if}
    </span>
  </div>

  <!-- Всплывающее информационное окно о деталях альбома -->
  {#if showHoverCard}
    <div
      class={[
        "absolute left-1/2 transform -translate-x-1/2 w-80 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 z-40 text-left cursor-default transition-all",
        hoverBelow ? "top-full mt-3" : "bottom-full mb-3"
      ]}
      transition:fade={{ duration: 150 }}
      onmouseenter={handleHoverCardMouseEnter}
      onmouseleave={handleHoverCardMouseLeave}
      role="presentation"
    >
      <h4 class="text-sm font-bold text-gray-900 dark:text-white truncate mb-1">
        {album.albumName || 'Без названия'}
      </h4>

      {#if hoverPeople.length > 0}
        <div class="mt-3">
          <span class="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
            Часто отмеченные люди
          </span>
          <div class="flex items-center gap-1.5 flex-wrap">
            {#each hoverPeople as person}
              <div class="flex items-center gap-1 bg-gray-50 dark:bg-zinc-950 px-2 py-0.5 rounded-full border border-gray-150 dark:border-zinc-850">
                {#if person.thumbnailUrl}
                  <img src={person.thumbnailUrl} alt={person.name} class="w-5 h-5 rounded-full object-cover" />
                {/if}
                <span class="text-[11px] font-medium text-gray-700 dark:text-zinc-300 max-w-20 truncate">
                  {person.name}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if album.description}
        <div class="mt-3">
          <span class="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
            Описание
          </span>
          <p class="text-xs text-gray-600 dark:text-zinc-400 line-clamp-3 italic">
            {album.description}
          </p>
        </div>
      {/if}

      <div class="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
        <a
          href={Route.viewAlbum(album)}
          class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Открыть альбом ↗
        </a>
      </div>
    </div>
  {/if}
</div>
