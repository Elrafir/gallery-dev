<script lang="ts">
  /**
   * @component DetailPanel
   * Боковая панель с детальной информацией о фото/видео (Asset Viewer).
   * Отображает метаданные (EXIF), местоположение (карту), людей на фото,
   * информацию о владельце, альбомах и тегах.
   * 
   * @property {AssetResponseDto} asset - Текущий отображаемый медиафайл.
   * @property {AlbumResponseDto|null} [currentAlbum] - Текущий альбом (если просмотр из альбома).
   * @property {string} [spaceId] - Идентификатор пространства (если применимо).
   */
  import { goto } from '$app/navigation';
  import DetailPanelDate from '$lib/components/asset-viewer/detail-panel-date.svelte';
  import DetailPanelDescription from '$lib/components/asset-viewer/detail-panel-description.svelte';
  import DetailPanelLocation from '$lib/components/asset-viewer/detail-panel-location.svelte';
  import DetailPanelRating from '$lib/components/asset-viewer/detail-panel-star-rating.svelte';
  import DetailPanelTags from '$lib/components/asset-viewer/detail-panel-tags.svelte';
  import { timeToLoadTheMap } from '$lib/constants';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { locale } from '$lib/stores/preferences.store';
  import { createUrl, getAssetMediaUrl, getPeopleThumbnailUrl } from '$lib/utils';
  import { delay, getDimensions } from '$lib/utils/asset-utils';
  import { getParentPath } from '$lib/utils/tree-utils';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { getMapProviderLinks } from '$lib/utils/exif-utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    AssetMediaSize,
    getAllAlbums,
    getAssetInfo,
    getPerson,
    getSpacePerson,
    type AlbumResponseDto,
    type AssetResponseDto,
  } from '@immich/sdk';
  import { SvelteMap } from 'svelte/reactivity';
  import { Icon, IconButton, Text, Tooltip } from '@immich/ui';
  import PersonTooltip from '$lib/components/people/PersonTooltip.svelte';
  import {
    mdiCamera,
    mdiCameraIris,
    mdiChevronDown,
    mdiClose,
    mdiEye,
    mdiEyeOff,
    mdiImageOutline,
    mdiInformationOutline,
    mdiPencil,
    mdiPlus,
  } from '@mdi/js';
  import { slide } from 'svelte/transition';
  import { DateTime } from 'luxon';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import PersonSidePanel from '../faces-page/person-side-panel.svelte';
  import OnEvents from '../OnEvents.svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import AlbumListItemDetails from './album-list-item-details.svelte';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';

  interface Props {
    asset: AssetResponseDto;
    currentAlbum?: AlbumResponseDto | null;
    spaceId?: string;
  }

  let { asset, currentAlbum = null, spaceId }: Props = $props();
  let effectiveSpaceId = $derived(spaceId || asset.resolvedSpaceId);
  let isSpaceMember = $derived(!!effectiveSpaceId);

  let isOwner = $derived(authManager.authenticated && authManager.user.id === asset.ownerId);
  let isAlbumViewer = $derived(!!currentAlbum && !isOwner && !isSpaceMember);
  let canViewPeople = $derived(isOwner || isSpaceMember || isAlbumViewer);
  let people = $derived(asset.people || []);
  let unassignedFaces = $derived(asset.unassignedFaces || []);
  let showingHiddenPeople = $state(false);
  let showExtendedInfo = $state(false);


  let latlng = $derived(
    (() => {
      const lat = asset.exifInfo?.latitude;
      const lng = asset.exifInfo?.longitude;

      if (lat && lng) {
        return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
      }
    })(),
  );
  let previousId: string | undefined = $state();
  let previousRoute = $derived(currentAlbum?.id ? Route.viewAlbum(currentAlbum) : Route.photos());

  let peopleDescriptions = $state(new SvelteMap<string, string>());

  $effect(() => {
    const currentPeople = people;
    const spaceIdForDescriptions = effectiveSpaceId;
    
    const loadDescriptions = async () => {
      const newDescriptions = new SvelteMap<string, string>();
      await Promise.all(
        currentPeople.map(async (person) => {
          try {
            if (spaceIdForDescriptions && person.spacePersonId) {
              // Загружаем из space person (включая alias overlay)
              const spacePersonDto = await getSpacePerson({ id: spaceIdForDescriptions, personId: person.spacePersonId });
              if (spacePersonDto.description) {
                newDescriptions.set(person.id, spacePersonDto.description);
              }
            } else if (!spaceIdForDescriptions || isOwner) {
              // Только owner или вне space context может вызывать getPerson напрямую
              const personDto = await getPerson({ id: person.id });
              if (personDto.description) {
                newDescriptions.set(person.id, personDto.description);
              }
            }
          } catch (e) {
            // Silently ignore — space member может не иметь person.read доступа
          }
        })
      );
      peopleDescriptions = newDescriptions;
    };
    
    loadDescriptions();
  });

  const refreshAlbums = async () => {
    if (authManager.isSharedLink) {
      return [];
    }

    try {
      return await getAllAlbums({ assetId: asset.id });
    } catch (error) {
      handleError(error, $t('error_getting_asset_album_membership'));
      return [];
    }
  };

  let albums = $derived(refreshAlbums());

  $effect(() => {
    if (!previousId) {
      previousId = asset.id;
      return;
    }

    if (asset.id === previousId) {
      return;
    }

    assetViewerManager.closeEditFacesPanel();
    previousId = asset.id;
  });

  const handleRefreshPeople = async () => {
    asset = await getAssetInfo({ id: asset.id, spaceId: effectiveSpaceId });
    assetViewerManager.closeEditFacesPanel();
  };

  const getMegapixel = (width: number, height: number): number | undefined => {
    const megapixel = Math.round((height * width) / 1_000_000);
    return megapixel || undefined;
  };

  const getAssetFolderHref = (asset: AssetResponseDto) => Route.folders({ path: getParentPath(asset.originalPath) });

  type AssetPerson = NonNullable<AssetResponseDto['people']>[number];

  const getPersonThumbnailUrl = (person: AssetPerson) =>
    effectiveSpaceId && person.spacePersonId
      ? createUrl(`/shared-spaces/${effectiveSpaceId}/people/${person.spacePersonId}/thumbnail`, {
          updatedAt: person.updatedAt,
        })
      : getPeopleThumbnailUrl(person);

  onDestroy(() => {
    assetViewerManager.closeEditFacesPanel();
  });
</script>

<OnEvents onAlbumAddAssets={() => (albums = refreshAlbums())} />

{#if !assetViewerManager.isEditFacesPanelOpen}
  <section class="relative p-2">
    <div class="flex place-items-center gap-2">
      <IconButton
        icon={mdiClose}
        aria-label={$t('close')}
        onclick={() => assetViewerManager.closeDetailPanel()}
        shape="round"
        color="secondary"
        variant="ghost"
      />
      <p class="text-lg text-immich-fg dark:text-immich-dark-fg">{$t('info')}</p>
    </div>

    {#if asset.isOffline}
      <section class="px-4 py-4">
        <div role="alert">
          <div class="rounded-t bg-red-500 px-4 py-2 font-bold text-white">
            {$t('asset_offline')}
          </div>
          <div class="border border-t-0 border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <p>
              {#if authManager.authenticated && authManager.user.isAdmin}
                {$t('admin.asset_offline_description')}
              {:else}
                {$t('asset_offline_description')}
              {/if}
            </p>
          </div>
          <div class="rounded-b bg-red-500 px-4 py-2 text-white text-sm">
            <p>{asset.originalPath}</p>
          </div>
        </div>
      </section>
    {/if}

    <DetailPanelDescription {asset} {isOwner} />
    <DetailPanelRating {asset} {isOwner} />

    {#if !authManager.isSharedLink && canViewPeople}
      <section class="px-4 pt-4 text-sm">
        <div class="flex h-10 w-full items-center justify-between">
          <Text size="small" color="muted">{$t('people')}</Text>
          <div class="flex gap-2 items-center">
            {#if isOwner}
              {#if people.some((person) => person.isHidden)}
                <IconButton
                  aria-label={$t('show_hidden_people')}
                  icon={showingHiddenPeople ? mdiEyeOff : mdiEye}
                  size="medium"
                  shape="round"
                  color="secondary"
                  variant="ghost"
                  onclick={() => (showingHiddenPeople = !showingHiddenPeople)}
                />
              {/if}
              <IconButton
                aria-label={$t('tag_people')}
                icon={mdiPlus}
                size="medium"
                shape="round"
                color="secondary"
                variant="ghost"
                onclick={() => assetViewerManager.toggleFaceEditMode()}
              />

              {#if people.length > 0 || unassignedFaces.length > 0}
                <IconButton
                  aria-label={$t('edit_people')}
                  icon={mdiPencil}
                  size="medium"
                  shape="round"
                  color="secondary"
                  variant="ghost"
                  onclick={() => assetViewerManager.openEditFacesPanel()}
                />
              {/if}
            {/if}
          </div>
        </div>

        <div class="mt-2 flex flex-wrap gap-2">
          {#each people as person, index (person.id)}
            {#if showingHiddenPeople || !person.isHidden}
              {@const isHighlighted = people[index].faces.some((f) => $boundingBoxesArray.some((b) => b.id === f.id))}
              {@const personThumbnailUrl = getPersonThumbnailUrl(person)}
              <PersonTooltip name={person.name} description={peopleDescriptions.get(person.id)} class="inline-block w-22 text-center">
                {#snippet child()}
                  <a
                    class="group w-22 outline-none"
                    href={Route.viewPerson({ id: person.spacePersonId || person.id }, { previousRoute })}
                    onfocus={() => ($boundingBoxesArray = people[index].faces)}
                    onblur={() => ($boundingBoxesArray = [])}
                    onmouseover={() => ($boundingBoxesArray = people[index].faces)}
                    onmouseleave={() => ($boundingBoxesArray = [])}
                  >
                    <div class="relative">
                      <ImageThumbnail
                        curve
                        shadow
                        url={personThumbnailUrl}
                        altText={person.name}
                        widthStyle="90px"
                        heightStyle="90px"
                        hidden={person.isHidden}
                        highlighted={isHighlighted}
                        class="group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-immich-primary dark:group-focus-visible:outline-immich-dark-primary"
                      />
                    </div>
                      <p class="mt-1 truncate font-medium">{person.name}</p>
                    {#if person.birthDate}
                      {@const personBirthDate = DateTime.fromISO(person.birthDate)}
                      {@const age = Math.floor(DateTime.fromISO(asset.localDateTime).diff(personBirthDate, 'years').years)}
                      {@const ageInMonths = Math.floor(
                        DateTime.fromISO(asset.localDateTime).diff(personBirthDate, 'months').months,
                      )}
                      {#if age >= 0}
                        <p
                          class="font-light"
                          title={personBirthDate.toLocaleString(
                            {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            },
                            { locale: $locale },
                          )}
                        >
                          {#if ageInMonths <= 11}
                            {$t('age_months', { values: { months: ageInMonths } })}
                          {:else if ageInMonths > 12 && ageInMonths <= 23}
                            {$t('age_year_months', { values: { months: ageInMonths - 12 } })}
                          {:else}
                            {$t('age_years', { values: { years: age } })}
                          {/if}
                        </p>
                      {/if}
                    {/if}
                  </a>
                {/snippet}
              </PersonTooltip>
            {/if}
          {/each}
        </div>
      </section>
    {/if}

    <div class="px-4 py-4">
      {#if asset.exifInfo}
        <div class="flex h-10 w-full items-center justify-between text-sm">
          <Text size="small" color="muted">{$t('details')}</Text>
        </div>
      {:else}
        <Text size="small" color="muted">{$t('no_exif_info_available')}</Text>
      {/if}

      <DetailPanelDate {asset} />

      <DetailPanelLocation {isOwner} {asset} />
    </div>

    {#if latlng && featureFlagsManager.value.map}
      <div class="h-90">
        {#await import('$lib/components/shared-components/map/map.svelte')}
          {#await delay(timeToLoadTheMap) then}
            <!-- show the loading spinner only if loading the map takes too much time -->
            <div class="flex items-center justify-center h-full w-full">
              <LoadingSpinner />
            </div>
          {/await}
        {:then { default: Map }}
          <Map
            mapMarkers={[
              {
                lat: latlng.lat,
                lon: latlng.lng,
                id: asset.id,
                city: asset.exifInfo?.city ?? null,
                state: asset.exifInfo?.state ?? null,
                country: asset.exifInfo?.country ?? null,
              },
            ]}
            center={latlng}
            showSettings={false}
            zoom={12.5}
            simplified
            useLocationPin
            showSimpleControls={!assetViewerManager.isEditFacesPanelOpen}
            onOpenInMapView={() => goto(Route.map({ ...latlng, zoom: 12.5 }))}
            showSavedLocationsByDefault={false}
          >
            {#snippet popup({ marker })}
              {@const { lat, lon } = marker}
              {@const mapProviderLinks = getMapProviderLinks(lat, lon)}
              <div class="flex flex-col items-center gap-1">
                <p class="font-bold">{lat.toPrecision(6)}, {lon.toPrecision(6)}</p>
                <div class="flex flex-col items-center gap-1">
                  {#each mapProviderLinks as link (link.key)}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="font-medium text-primary underline focus:outline-none"
                    >
                      {$t(link.label)}
                    </a>
                  {/each}
                </div>
              </div>
            {/snippet}
          </Map>
        {/await}
      </div>
    {/if}

    {#if currentAlbum && currentAlbum.albumUsers.length > 0 && asset.owner}
      <section class="px-6 dark:text-immich-dark-fg mt-4">
        <Text size="small" color="muted">{$t('shared_by')}</Text>
        <div class="flex gap-4 pt-4">
          <div>
            <UserAvatar user={asset.owner} size="md" />
          </div>

          <div class="mb-auto mt-auto">
            <p>
              {asset.owner.name}
            </p>
          </div>
        </div>
      </section>
    {/if}

    {#await albums then albums}
      {#if albums.length > 0}
        <section class="px-6 py-6 dark:text-immich-dark-fg">
          <div class="pb-4">
            <Text size="small" color="muted">{$t('appears_in')}</Text>
          </div>
          {#each albums as album (album.id)}
            <a href={Route.viewAlbum(album)}>
              <div class="flex gap-4 pt-2 hover:cursor-pointer items-center">
                <div>
                  <img
                    alt={album.albumName}
                    class="h-12.5 w-12.5 rounded object-cover"
                    src={album.albumThumbnailAssetId &&
                      getAssetMediaUrl({ id: album.albumThumbnailAssetId, size: AssetMediaSize.Preview })}
                    draggable="false"
                  />
                </div>

                <div class="mb-auto mt-auto">
                  <p class="dark:text-immich-dark-primary">{album.albumName}</p>
                  <div class="flex flex-col gap-0 text-sm">
                    <div>
                      <AlbumListItemDetails {album} />
                    </div>
                  </div>
                </div>
              </div>
            </a>
          {/each}
        </section>
      {/if}
    {/await}

    {#if authManager.authenticated && authManager.preferences.tags.enabled}
      <section class="relative px-2 pb-4 dark:bg-immich-dark-bg dark:text-immich-dark-fg">
        <DetailPanelTags {asset} {isOwner} spaceId={effectiveSpaceId} />
      </section>
    {/if}

    <div class="px-4 pb-4">
      <button
        type="button"
        class="flex w-full items-center justify-between py-2 text-sm font-medium text-immich-fg dark:text-immich-dark-fg hover:text-primary dark:hover:text-immich-dark-primary transition-colors"
        onclick={() => (showExtendedInfo = !showExtendedInfo)}
      >
        <Text size="small" color="muted">{$t('extended_info') ?? 'Расширенная информация'}</Text>
        <Icon icon={mdiChevronDown} size="24" class="transition-transform duration-200 {showExtendedInfo ? 'rotate-180' : ''}" />
      </button>

      {#if showExtendedInfo}
        <div transition:slide={{ duration: 200 }}>
          <div class="flex gap-4 py-4" data-testid="detail-panel-filename">
            <div><Icon icon={mdiImageOutline} size="24" /></div>

            <div>
              <p class="break-all flex place-items-center gap-2 whitespace-pre-wrap">
                {asset.originalFileName}
                {#if isOwner}
                  <IconButton
                    icon={mdiInformationOutline}
                    aria-label={$t('show_file_location')}
                    size="small"
                    shape="round"
                    color="secondary"
                    variant="ghost"
                    onclick={() => assetViewerManager.toggleAssetPath()}
                  />
                {/if}
              </p>
              {#if assetViewerManager.isShowAssetPath}
                <p class="text-xs opacity-50 break-all pb-2 hover:text-primary" transition:slide={{ duration: 250 }}>
                  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve this is supposed to be treated as an absolute/external link -->
                  <a href={getAssetFolderHref(asset)} title={$t('go_to_folder')} class="whitespace-pre-wrap">
                    {asset.originalPath}
                  </a>
                </p>
              {/if}
              {#if (asset.exifInfo?.exifImageHeight && asset.exifInfo?.exifImageWidth) || asset.exifInfo?.fileSizeInByte}
                <div class="flex gap-2 text-sm">
                  {#if asset.exifInfo?.exifImageHeight && asset.exifInfo?.exifImageWidth}
                    {#if getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)}
                      <p>
                        {getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)} MP
                      </p>
                    {/if}
                    {@const { width, height } = getDimensions(asset.exifInfo)}
                    <p>{width} x {height}</p>
                  {/if}
                  {#if asset.exifInfo?.fileSizeInByte}
                    <p>{getByteUnitString(asset.exifInfo.fileSizeInByte, $locale)}</p>
                  {/if}
                </div>
              {/if}
            </div>
          </div>

          {#if asset.exifInfo?.make || asset.exifInfo?.model || asset.exifInfo?.exposureTime || asset.exifInfo?.iso}
            <div class="flex gap-4 py-4" data-testid="detail-panel-camera">
              <div><Icon icon={mdiCamera} size="24" /></div>

              <div>
                {#if asset.exifInfo?.make || asset.exifInfo?.model}
                  <p>
                    <a
                      href={Route.search({
                        make: asset.exifInfo?.make ?? undefined,
                        model: asset.exifInfo?.model ?? undefined,
                      })}
                      title="{$t('search_for')} {asset.exifInfo.make || ''} {asset.exifInfo.model || ''}"
                      class="hover:text-primary"
                    >
                      {asset.exifInfo.make || ''}
                      {asset.exifInfo.model || ''}
                    </a>
                  </p>
                {/if}

                <div class="flex gap-2 text-sm">
                  {#if asset.exifInfo.exposureTime}
                    <p>{`${asset.exifInfo.exposureTime} s`}</p>
                  {/if}

                  {#if asset.exifInfo.iso}
                    <p>{`ISO ${asset.exifInfo.iso}`}</p>
                  {/if}
                </div>
              </div>
            </div>
          {/if}

          {#if asset.exifInfo?.lensModel || asset.exifInfo?.fNumber || asset.exifInfo?.focalLength}
            <div class="flex gap-4 py-4" data-testid="detail-panel-lens">
              <div><Icon icon={mdiCameraIris} size="24" /></div>

              <div>
                {#if asset.exifInfo?.lensModel}
                  <p>
                    <a
                      href={Route.search({ lensModel: asset.exifInfo.lensModel })}
                      title="{$t('search_for')} {asset.exifInfo.lensModel}"
                      class="hover:text-primary line-clamp-1"
                    >
                      {asset.exifInfo.lensModel}
                    </a>
                  </p>
                {/if}

                <div class="flex gap-2 text-sm">
                  {#if asset.exifInfo?.fNumber}
                    <p>ƒ/{asset.exifInfo.fNumber.toLocaleString($locale)}</p>
                  {/if}

                  {#if asset.exifInfo.focalLength}
                    <p>{`${asset.exifInfo.focalLength.toLocaleString($locale)} mm`}</p>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </section>
{/if}

{#if assetViewerManager.isEditFacesPanelOpen}
  <PersonSidePanel
    assetId={asset.id}
    assetType={asset.type}
    {isOwner}
    onClose={() => assetViewerManager.closeEditFacesPanel()}
    onRefresh={handleRefreshPeople}
  />
{/if}
