<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { Route } from '$lib/route';
  import { getAssetActions } from '$lib/services/asset.service';
  import { removeTag } from '$lib/utils/asset-utils';
  import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
  import { Badge, IconButton, Link, Text } from '@immich/ui';
  import { mdiClose, mdiEyeOff, mdiPencilOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
    spaceId?: string;
  }

  let { asset = $bindable(), isOwner, spaceId }: Props = $props();
  let effectiveSpaceId = $derived(spaceId || asset.resolvedSpaceId);
  let isSpaceMember = $derived(!!effectiveSpaceId);
  let canOverride = $derived(isSpaceMember && !isOwner);

  let tags = $derived(asset.tags || []);

  // Override editing state
  let editingTagId = $state<string | null>(null);
  let editingAlias = $state('');

  const handleRemove = async (tagId: string) => {
    const ids = await removeTag({ tagIds: [tagId], assetIds: [asset.id], showNotification: false });
    if (ids) {
      asset = await getAssetInfo({ id: asset.id, spaceId: effectiveSpaceId });
    }
  };

  const onAssetsTag = async (ids: string[]) => {
    if (ids.includes(asset.id)) {
      asset = await getAssetInfo({ id: asset.id, spaceId: effectiveSpaceId });
    }
  };

  // Tag override actions (for space members)
  async function startEditTag(tagId: string, currentName: string) {
    editingTagId = tagId;
    editingAlias = currentName;
  }

  async function saveTagAlias(tagId: string) {
    if (!effectiveSpaceId) return;
    try {
      await fetch(`/api/shared-spaces/${effectiveSpaceId}/tags/${tagId}/overrides`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: editingAlias }),
      });
      asset = await getAssetInfo({ id: asset.id, spaceId: effectiveSpaceId });
    } catch {
      /* ignore */
    }
    editingTagId = null;
  }

  async function hideTag(tagId: string) {
    if (!effectiveSpaceId) return;
    try {
      await fetch(`/api/shared-spaces/${effectiveSpaceId}/tags/${tagId}/overrides`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: true }),
      });
      asset = await getAssetInfo({ id: asset.id, spaceId: effectiveSpaceId });
    } catch {
      /* ignore */
    }
  }

  const { Tag } = $derived(getAssetActions($t, asset));
</script>

<OnEvents {onAssetsTag} />

{#if (isOwner || isSpaceMember) && !authManager.isSharedLink}
  <section class="px-4 mt-4">
    <div class="flex h-10 w-full items-center justify-between text-sm">
      <Text color="muted">{$t('tags')}</Text>
    </div>
    <section class="flex flex-wrap pt-2 gap-1" data-testid="detail-panel-tags">
      {#each tags as tag (tag.id)}
        {#if editingTagId === tag.id}
          <!-- Inline rename mode -->
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
            <input
              type="text"
              bind:value={editingAlias}
              class="w-24 text-xs bg-transparent border-none outline-none"
              onkeydown={(e) => {
                if (e.key === 'Enter') void saveTagAlias(tag.id);
                if (e.key === 'Escape') (editingTagId = null);
              }}
            />
            <button
              class="text-xs text-green-600 font-medium hover:underline"
              onclick={() => void saveTagAlias(tag.id)}>✓</button
            >
            <button
              class="text-xs text-gray-400 hover:underline"
              onclick={() => (editingTagId = null)}>✕</button
            >
          </div>
        {:else}
          <Badge size="small" class="items-center px-0" shape="round">
            <Link
              href={Route.tags({ path: tag.value })}
              class="text-light no-underline rounded-full hover:bg-primary-400 px-2"
            >
              {tag.value}
            </Link>
            {#if isOwner}
              <IconButton
                aria-label={$t('remove_tag')}
                icon={mdiClose}
                onclick={() => handleRemove(tag.id)}
                size="tiny"
                class="hover:bg-primary-400"
                shape="round"
              />
            {:else if canOverride}
              <IconButton
                aria-label="Переименовать тег"
                icon={mdiPencilOutline}
                onclick={() => startEditTag(tag.id, tag.value)}
                size="tiny"
                class="hover:bg-primary-400"
                shape="round"
              />
              <IconButton
                aria-label="Скрыть тег"
                icon={mdiEyeOff}
                onclick={() => void hideTag(tag.id)}
                size="tiny"
                class="hover:bg-primary-400"
                shape="round"
              />
            {/if}
          </Badge>
        {/if}
      {/each}
      {#if isOwner}
        <HeaderActionButton action={Tag} />
      {/if}
    </section>
  </section>
{/if}
