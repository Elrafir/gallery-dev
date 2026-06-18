<script lang="ts">
  /**
   * @component GeolocationPointPickerModal
   * Модальное окно для выбора или изменения координат (геолокации) объекта.
   * Позволяет выбрать точку на карте кликом, ввести координаты вручную или найти место через поиск.
   * 
   * @property {AssetResponseDto} [asset] - Медиафайл, для которого меняется геопозиция.
   * @property {LatLng} [point] - Начальные координаты (широта и долгота).
   * @property {Function} onClose - Функция, вызываемая при закрытии окна (передает новые координаты или undefined).
   */
  import { isDefined } from '$lib';
  import { clickOutside } from '$lib/actions/click-outside';
  import { listNavigation } from '$lib/actions/list-navigation';
  import CoordinatesInput from '$lib/components/shared-components/coordinates-input.svelte';
  import type Map from '$lib/components/shared-components/map/map.svelte';
  import { timeDebounceOnSearch, timeToLoadTheMap } from '$lib/constants';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { geolocationManager } from '$lib/managers/geolocation.manager.svelte';
  import type { LatLng } from '$lib/types';
  import { delay } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { searchPlaces, getSavedLocations, reverseGeocode, type AssetResponseDto, type PlacesResponseDto, type SavedLocationResponseDto } from '@immich/sdk';
  import { ConfirmModal, Icon, LoadingSpinner, Tooltip } from '@immich/ui';
  import { mdiMapMarkerMultipleOutline, mdiMapMarker, mdiCrosshairsGps } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    asset?: AssetResponseDto;
    point?: LatLng;
    onClose: (point?: LatLng) => void;
  };

  let { asset, point: initialPoint, onClose }: Props = $props();

  let places: PlacesResponseDto[] = $state([]);
  let suggestedPlaces: PlacesResponseDto[] = $derived(places.slice(0, 5));
  let searchWord: string = $state('');
  let latestSearchTimeout: number;
  let showLoadingSpinner = $state(false);
  let suggestionContainer: HTMLDivElement | undefined = $state();
  let hideSuggestion = $state(false);
  let mapElement = $state<ReturnType<typeof Map>>();

  let assetPoint = $derived.by<LatLng | undefined>(() => {
    if (!asset || !asset.exifInfo) {
      return;
    }

    const { latitude, longitude } = asset.exifInfo;
    if (!isDefined(latitude) || !isDefined(longitude)) {
      return;
    }

    return { lat: latitude, lng: longitude };
  });

  let point = $state<LatLng | undefined>(initialPoint ?? assetPoint);
  let zoom = $state(point ? 12.5 : 1);
  let center = $state(point ?? geolocationManager.lastPoint);
  let savedLocations = $state<SavedLocationResponseDto[]>([]);
  let locationAddress = $state<string>('');

  $effect(() => {
    if (!point) {
      locationAddress = '';
      return;
    }

    const currentPoint = point;
    void (async () => {
      try {
        const res = await reverseGeocode({ lat: currentPoint.lat, lon: currentPoint.lng });
        if (res && res.length > 0) {
          const parts = [res[0].city, res[0].state].filter(Boolean);
          locationAddress = parts.join(', ');
        } else {
          locationAddress = `${currentPoint.lat.toFixed(6)}, ${currentPoint.lng.toFixed(6)}`;
        }
      } catch {
        locationAddress = `${currentPoint.lat.toFixed(6)}, ${currentPoint.lng.toFixed(6)}`;
      }
    })();
  });

  onMount(async () => {
    try {
      savedLocations = await getSavedLocations();
    } catch {
      // ignore
    }
  });

  $effect(() => {
    if (mapElement && initialPoint) {
      mapElement.addClipMapMarker(initialPoint.lng, initialPoint.lat);
    }
  });

  const handleConfirm = (confirmed?: boolean) => {
    if (point && confirmed) {
      geolocationManager.onSelected(point);
      onClose(point);
    } else {
      onClose();
    }
  };

  const getLocation = (name: string, admin1Name?: string, admin2Name?: string): string => {
    const parts = [name, admin1Name, admin2Name !== name ? admin2Name : undefined].filter(Boolean);
    return parts.join(', ');
  };

  const handleSearchPlaces = () => {
    if (latestSearchTimeout) {
      clearTimeout(latestSearchTimeout);
    }
    showLoadingSpinner = true;

    // eslint-disable-next-line unicorn/prefer-global-this
    const searchTimeout = window.setTimeout(() => {
      if (searchWord === '') {
        places = [];
        showLoadingSpinner = false;
        return;
      }

      // Try to parse coordinate pair from search input in the format `LATITUDE, LONGITUDE` as floats
      const coordinateParts = searchWord.split(',').map((part) => part.trim());
      if (coordinateParts.length === 2) {
        const coordinateLat = Number.parseFloat(coordinateParts[0]);
        const coordinateLng = Number.parseFloat(coordinateParts[1]);

        if (
          !Number.isNaN(coordinateLat) &&
          !Number.isNaN(coordinateLng) &&
          coordinateLat >= -90 &&
          coordinateLat <= 90 &&
          coordinateLng >= -180 &&
          coordinateLng <= 180
        ) {
          places = [];
          showLoadingSpinner = false;
          handleUseSuggested(coordinateLat, coordinateLng);
          return;
        }
      }

      searchPlaces({ name: searchWord })
        .then((searchResult) => {
          // skip result when a newer search is happening
          if (latestSearchTimeout === searchTimeout) {
            const query = searchWord.toLowerCase();
            const localMatches = savedLocations
              .filter(
                (loc) =>
                  loc.label.toLowerCase().includes(query) ||
                  loc.name.toLowerCase().includes(query)
              )
              .map((loc) => ({
                name: `⭐ ${loc.label}`,
                admin1name: loc.name,
                admin2name: '',
                latitude: loc.latitude,
                longitude: loc.longitude,
              }));
            places = [...localMatches, ...searchResult];
            showLoadingSpinner = false;
          }
        })
        .catch((error) => {
          // skip error when a newer search is happening
          if (latestSearchTimeout === searchTimeout) {
            const query = searchWord.toLowerCase();
            const localMatches = savedLocations
              .filter(
                (loc) =>
                  loc.label.toLowerCase().includes(query) ||
                  loc.name.toLowerCase().includes(query)
              )
              .map((loc) => ({
                name: `⭐ ${loc.label}`,
                admin1name: loc.name,
                admin2name: '',
                latitude: loc.latitude,
                longitude: loc.longitude,
              }));
            places = localMatches;
            handleError(error, $t('errors.cant_search_places'));
            showLoadingSpinner = false;
          }
        });
    }, timeDebounceOnSearch);
    latestSearchTimeout = searchTimeout;
  };

  const handleUseSuggested = (latitude: number, longitude: number) => {
    hideSuggestion = true;
    point = { lng: longitude, lat: latitude };
    mapElement?.addClipMapMarker(longitude, latitude);
  };

  const onUpdate = (lat: number, lng: number) => {
    point = { lat, lng };
    mapElement?.addClipMapMarker(lng, lat);
  };
</script>

<ConfirmModal
  confirmColor="primary"
  title={$t('change_location')}
  icon={mdiMapMarkerMultipleOutline}
  size="medium"
  onClose={handleConfirm}
>
  {#snippet prompt()}
    <div class="flex flex-col w-full h-full gap-2">
      <div class="relative w-64 sm:w-96 z-1" use:clickOutside={{ onOutclick: () => (hideSuggestion = true) }}>
        {#if suggestionContainer}
          <div use:listNavigation={suggestionContainer}>
            <button type="button" class="w-full" onclick={() => (hideSuggestion = false)}>
              <SearchBar
                placeholder={$t('search_places')}
                bind:name={searchWord}
                {showLoadingSpinner}
                onReset={() => (suggestedPlaces = [])}
                onSearch={handleSearchPlaces}
                roundedBottom={suggestedPlaces.length === 0 || hideSuggestion}
              />
            </button>
          </div>
        {/if}

        <div
          class="absolute w-full bg-gray-200 dark:bg-gray-700 rounded-b-lg"
          id="suggestion"
          bind:this={suggestionContainer}
        >
          {#if !hideSuggestion}
            {#each suggestedPlaces as place (place.latitude + place.longitude)}
              <button
                type="button"
                class="flex w-full border-t border-gray-400 dark:border-immich-dark-gray h-12 place-items-center px-5 hover:bg-gray-300 hover:dark:bg-[#232932] focus:bg-gray-300 focus:dark:bg-[#232932] last:rounded-b-lg last:border-b"
                onclick={() => handleUseSuggested(place.latitude, place.longitude)}
              >
                <p class="text-sm text-gray-700 dark:text-gray-100 truncate">
                  {getLocation(place.name, place.admin1name, place.admin2name)}
                </p>
              </button>
            {/each}
          {/if}
        </div>
      </div>

      <span>{locationAddress || $t('pick_a_location')}</span>
      <div class="relative h-125 min-h-75 w-full z-0">
        {#await import('$lib/components/shared-components/map/map.svelte')}
          {#await delay(timeToLoadTheMap) then}
            <!-- show the loading spinner only if loading the map takes too much time -->
            <div class="flex items-center justify-center h-full w-full">
              <LoadingSpinner />
            </div>
          {/await}
        {:then { default: Map }}
          <Map
            bind:this={mapElement}
            mapMarkers={asset && assetPoint
              ? [
                  {
                    id: asset.id,
                    lat: assetPoint.lat,
                    lon: assetPoint.lng,
                    city: asset.exifInfo?.city ?? null,
                    state: asset.exifInfo?.state ?? null,
                    country: asset.exifInfo?.country ?? null,
                  },
                ]
              : []}
            bind:zoom={zoom}
            bind:center={center}
            simplified={true}
            clickable={true}
            onClickPoint={(selected) => (point = selected)}
            showSettings={false}
            rounded
          />

          {#if point}
            <div class="absolute bottom-4 right-4 z-10">
              <Tooltip text={$t('map_recenter_to_marked')}>
                {#snippet child({ props })}
                  <button
                    {...props}
                    type="button"
                    class="w-[29px] h-[29px] flex items-center justify-center bg-white dark:bg-zinc-800 text-immich-primary dark:text-immich-dark-primary rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none transition-all cursor-pointer"
                    onclick={() => {
                      if (point) {
                        center = { lat: point.lat, lng: point.lng };
                        zoom = 15;
                        mapElement?.addClipMapMarker(point.lng, point.lat);
                      }
                    }}
                  >
                    <div class="relative w-6 h-6 flex items-center justify-center">
                      <Icon icon={mdiCrosshairsGps} size="20" class="absolute text-gray-500 dark:text-gray-400" />
                      <Icon icon={mdiMapMarker} size="10" class="absolute text-immich-primary dark:text-immich-dark-primary -translate-y-[1px]" />
                    </div>
                  </button>
                {/snippet}
              </Tooltip>
            </div>
          {/if}
        {/await}
      </div>

      <div class="grid sm:grid-cols-2 gap-4 text-sm text-start mt-4">
        <CoordinatesInput lat={point?.lat} lng={point?.lng} {onUpdate} />
      </div>
    </div>
  {/snippet}
</ConfirmModal>
