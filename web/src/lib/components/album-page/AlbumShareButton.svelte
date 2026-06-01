<script lang="ts">
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import { mdiAccountMultiple } from '@mdi/js';
  import Avatar from '$lib/components/shared-components/user-avatar.svelte';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import { modalManager } from '@immich/ui';
  import AlbumOptionsModal from '$lib/modals/AlbumOptionsModal.svelte';

  interface Props {
    album: AlbumResponseDto;
  }

  const { album }: Props = $props();

  const sharedCount = (album.albumUsers?.length ?? 0) + 1;

  async function openSharedOptions() {
    await modalManager.show(AlbumOptionsModal, { album });
  }

  // Prevent parent link navigation when clicking anywhere inside the button
  function handleContainerClick(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
  }
</script>

{#if album.shared || (album.albumUsers && album.albumUsers.length > 0)}
  <!-- We wrap the ButtonContextMenu in a container, but to make the ENTIRE block act as the button trigger,
       we position the ButtonContextMenu to cover 100% width and height of the wrapper with z-index,
       and place the label text inside the button container so that it's also clickable. -->
  <div 
    class="absolute end-4 bottom-4 flex items-center justify-center rounded-full bg-immich-primary hover:bg-green-600 transition-colors duration-250 z-10 h-8 cursor-pointer shadow-md select-none overflow-hidden"
    onclick={handleContainerClick}
    onkeydown={(e) => e.stopPropagation()}
    role="presentation"
  >
    <ButtonContextMenu
      icon={mdiAccountMultiple}
      title={$t('shared_with_count', { values: { count: sharedCount } })}
      buttonClass="w-full h-full px-2.5 flex items-center justify-center gap-1.5 text-white"
    >
      <!-- We render the count text directly inside the ButtonContextMenu's trigger button by slotting it or letting the layout flow.
           Since ButtonContextMenu only expects to render <Icon />, we can overlay the span as absolute but pointer-events-none inside the same relative container. -->
      <ul class="bg-white dark:bg-gray-800 rounded-md shadow-lg p-2 min-w-[220px]" role="menu">
        {#if album.owner}
          <li class="flex items-center gap-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer" role="menuitem">
            <button class="flex items-center gap-3 w-full text-left font-medium text-black dark:text-white" onclick={openSharedOptions}>
              <Avatar user={album.owner} size="sm" />
              <div class="flex flex-col">
                <span class="text-sm font-semibold">{album.owner.name}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{$t('owner')}</span>
              </div>
            </button>
          </li>
        {/if}
        {#each album.albumUsers as albumUser (albumUser.user.id)}
          <li class="flex items-center gap-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer" role="menuitem">
            <button class="flex items-center gap-3 w-full text-left text-black dark:text-white" onclick={openSharedOptions}>
              <Avatar user={albumUser.user} size="sm" />
              <span class="text-sm font-semibold">{albumUser.user.name}</span>
            </button>
          </li>
        {/each}
      </ul>
    </ButtonContextMenu>
    <span class="text-xs font-semibold text-white pe-3 select-none pointer-events-none -ms-1">{sharedCount}</span>
  </div>
{/if}
