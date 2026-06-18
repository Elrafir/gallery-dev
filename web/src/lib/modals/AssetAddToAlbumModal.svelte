<script lang="ts">
  /**
   * @component AssetAddToAlbumModal
   * Модальное окно для добавления выбранных медиафайлов (Asset) в альбом(ы).
   * Под капотом использует AlbumPickerModal для выбора списка альбомов,
   * а затем вызывает API (addAssetsToAlbums) для связывания.
   */
  import AlbumPickerModal from '$lib/modals/AlbumPickerModal.svelte';
  import { addAssetsToAlbums } from '$lib/services/album.service';
  import { type AlbumResponseDto } from '@immich/sdk';

  type Props = {
    assetIds: string[];
    onClose: () => void;
  };

  const { assetIds, onClose }: Props = $props();

  const handleClose = async (albums?: AlbumResponseDto[]) => {
    const albumIds = (albums ?? []).map(({ id }) => id);
    if (albumIds.length === 0) {
      onClose();
      return;
    }

    const success = await addAssetsToAlbums(albumIds, assetIds, { notify: true });
    if (success) {
      onClose();
    }
  };
</script>

<AlbumPickerModal onClose={handleClose} />
