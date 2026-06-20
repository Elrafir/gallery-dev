<script lang="ts">
  /**
   * @component DetailPanelLocation
   * Компонент боковой панели, отвечающий за отображение местоположения медиафайла.
   * Выводит город, регион, страну, показывает привязку к сохранённым местам
   * (по GPS-proximity), а также позволяет владельцу изменять геолокацию.
   * 
   * @property {boolean} isOwner - Флаг, является ли текущий пользователь владельцем файла.
   * @property {AssetResponseDto} asset - Текущий медиафайл.
   */
  import GeolocationPointPickerModal from '$lib/modals/GeolocationPointPickerModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, findSavedLocationsByProximity, type AssetResponseDto, type SavedLocationResponseDto } from '@immich/sdk';
  import { Icon, modalManager } from '@immich/ui';
  import {
    mdiMapMarkerOutline,
    mdiPencil,
    mdiStar,
    mdiHome,
    mdiBriefcase,
    mdiSchool,
    mdiFoodForkDrink,
    mdiCar,
    mdiUmbrellaBeach,
    mdiBank,
    mdiAccount,
    mdiMapMarkerRadius,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    isOwner: boolean;
    asset: AssetResponseDto;
  };

  let { isOwner, asset = $bindable() }: Props = $props();

  let matchedLocations = $state<SavedLocationResponseDto[]>([]);

  const getIconSvg = (key: string | null | undefined): string => {
    switch (key) {
      case 'star': return mdiStar;
      case 'home': return mdiHome;
      case 'work': return mdiBriefcase;
      case 'school': return mdiSchool;
      case 'food': return mdiFoodForkDrink;
      case 'car': return mdiCar;
      case 'beach': return mdiUmbrellaBeach;
      case 'culture': return mdiBank;
      case 'person': return mdiAccount;
      default: return mdiMapMarkerRadius;
    }
  };

  // Загружаем saved locations по proximity при изменении asset
  $effect(() => {
    const lat = asset.exifInfo?.latitude;
    const lng = asset.exifInfo?.longitude;
    if (lat && lng) {
      findSavedLocationsByProximity({ latitude: lat, longitude: lng })
        .then((locations) => {
          matchedLocations = locations;
        })
        .catch(() => {
          matchedLocations = [];
        });
    } else {
      matchedLocations = [];
    }
  });

  const onAction = async () => {
    const point = await modalManager.show(GeolocationPointPickerModal, { asset });
    if (!point) {
      return;
    }

    try {
      asset = await updateAsset({
        id: asset.id,
        updateAssetDto: { latitude: point.lat, longitude: point.lng },
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_location'));
    }
  };
</script>

{#if asset.exifInfo?.city || asset.exifInfo?.state || asset.exifInfo?.country}
  <button
    type="button"
    class="flex w-full text-start justify-between place-items-start gap-4 py-4"
    onclick={isOwner ? onAction : undefined}
    title={isOwner ? $t('edit_location') : ''}
    class:hover:text-primary={isOwner}
    data-testid="detail-panel-location"
  >
    <div class="flex gap-4">
      <div><Icon icon={mdiMapMarkerOutline} size="24" /></div>

      <div>
        {#if asset.exifInfo?.city}
          <p>{asset.exifInfo.city}</p>
        {/if}
        {#if asset.exifInfo?.state}
          <div class="flex gap-2 text-sm">
            <p>{asset.exifInfo.state}</p>
          </div>
        {/if}
      </div>
    </div>

    {#if isOwner}
      <div>
        <Icon icon={mdiPencil} size="20" />
      </div>
    {/if}
  </button>
{:else if !asset.exifInfo?.city && isOwner}
  <button
    type="button"
    class="flex w-full text-start justify-between place-items-start gap-4 py-4 rounded-lg hover:text-primary"
    onclick={onAction}
    title={$t('add_location')}
    data-testid="detail-panel-location"
  >
    <div class="flex gap-4">
      <div><Icon icon={mdiMapMarkerOutline} size="24" /></div>
      <p>{$t('add_a_location')}</p>
    </div>
    <div class="focus:outline-none p-1">
      <Icon icon={mdiPencil} size="20" />
    </div>
  </button>
{/if}

{#if matchedLocations.length > 0}
  <div class="flex flex-col gap-1.5 py-2">
    {#each matchedLocations as loc (loc.id)}
      <div
        class="flex items-center gap-2.5 px-1 py-1.5 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 transition-colors"
        title="{loc.name} — радиус {loc.radius}м"
      >
        <div class="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 shrink-0">
          <Icon icon={getIconSvg(loc.icon)} size="16" class="text-primary dark:text-primary" />
        </div>
        <span class="text-sm font-medium text-primary dark:text-immich-dark-primary truncate">
          {loc.label}
        </span>
        <span class="text-[10px] text-gray-400 dark:text-zinc-500 ml-auto shrink-0 tabular-nums">
          {loc.radius}м
        </span>
      </div>
    {/each}
  </div>
{/if}
