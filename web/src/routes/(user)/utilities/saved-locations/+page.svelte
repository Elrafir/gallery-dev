<script lang="ts">
  import { flip } from 'svelte/animate';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import GeolocationPointPickerModal from '$lib/modals/GeolocationPointPickerModal.svelte';
  import SavedLocationEditModal from '$lib/modals/SavedLocationEditModal.svelte';
  import {
    createSavedLocation,
    deleteSavedLocation,
    getSavedLocations,
    updateSavedLocation,
    reverseGeocode,
    type SavedLocationResponseDto,
  } from '@immich/sdk';
  import { Button, Icon, modalManager, toastManager, Text } from '@immich/ui';
  import {
    mdiPlus,
    mdiStar,
    mdiStarOutline,
    mdiDeleteOutline,
    mdiPencilOutline,
    mdiMapMarkerOutline,
    mdiMagnify,
    mdiRefresh,
    mdiHome,
    mdiBriefcase,
    mdiSchool,
    mdiFoodForkDrink,
    mdiCar,
    mdiUmbrellaBeach,
    mdiBank,
    mdiAccount,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

  let locations = $state<SavedLocationResponseDto[]>([]);
  let isLoading = $state(true);

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
      case 'person':
      default:
        return mdiAccount;
    }
  };
  let showOnlyFavorites = $state(false);
  let searchQuery = $state('');
  let mapFocusPoint = $state<{ lat: number; lng: number } | null>(null);

  const loadLocations = async () => {
    try {
      const data = await getSavedLocations();
      locations = data;
    } catch (err) {
      toastManager.error('Не удалось загрузить список сохранённых мест');
    } finally {
      isLoading = false;
    }
  };

  $effect(() => {
    loadLocations();
  });

  const handleAddLocation = async () => {
    // Open Map Point Picker
    const point = await modalManager.show(GeolocationPointPickerModal, {
      point: mapFocusPoint ? { lat: mapFocusPoint.lat, lng: mapFocusPoint.lng } : undefined,
    });
    if (!point) {
      return;
    }

    // Geocode chosen coordinates
    isLoading = true;
    let defaultName = '';
    try {
      const res = await reverseGeocode({ lat: point.lat, lon: point.lng });
      if (res && res.length > 0) {
        const parts = [res[0].city, res[0].state, res[0].country].filter(Boolean);
        defaultName = parts.join(', ');
      }
    } catch {
      // ignore
    } finally {
      isLoading = false;
    }

    // Show saved location edit modal to enter label & description
    modalManager.show(SavedLocationEditModal, {
      latitude: point.lat,
      longitude: point.lng,
      defaultName,
      onSubmit: async (values) => {
        try {
          await createSavedLocation({ createSavedLocationDto: values });
          toastManager.success('Место успешно сохранено');
          await loadLocations();
        } catch (err: any) {
          const msg = err?.data?.message || err?.message || 'Не удалось сохранить место';
          toastManager.error(msg);
          throw err;
        }
      },
    });
  };

  const handleEditLocation = (loc: SavedLocationResponseDto) => {
    modalManager.show(SavedLocationEditModal, {
      initialData: loc,
      onSubmit: async (values) => {
        try {
          await updateSavedLocation({ id: loc.id, updateSavedLocationDto: values });
          toastManager.success('Место успешно обновлено');
          await loadLocations();
        } catch (err: any) {
          const msg = err?.data?.message || err?.message || 'Не удалось обновить место';
          toastManager.error(msg);
          throw err;
        }
      },
    });
  };

  const toggleFavorite = async (loc: SavedLocationResponseDto) => {
    try {
      // Optimistic update
      locations = locations.map((l) => (l.id === loc.id ? { ...l, isFavorite: !l.isFavorite } : l));
      await updateSavedLocation({
        id: loc.id,
        updateSavedLocationDto: { isFavorite: !loc.isFavorite },
      });
      toastManager.success(!loc.isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного');
    } catch (err) {
      toastManager.error('Не удалось изменить статус избранного');
      // Revert on error
      locations = locations.map((l) => (l.id === loc.id ? { ...l, isFavorite: loc.isFavorite } : l));
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это сохранённое место?')) {
      return;
    }
    try {
      await deleteSavedLocation({ id });
      toastManager.success('Место успешно удалено');
      await loadLocations();
    } catch (err) {
      toastManager.error('Не удалось удалить место');
    }
  };

  let filteredLocations = $derived(
    locations
      .filter((l) => {
        if (showOnlyFavorites && !l.isFavorite) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return (
            l.label.toLowerCase().includes(q) ||
            l.name.toLowerCase().includes(q) ||
            (l.description && l.description.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) {
          return -1;
        }
        if (!a.isFavorite && b.isFavorite) {
          return 1;
        }
        return a.label.localeCompare(b.label, 'ru');
      })
  );
</script>

<UserPageLayout title="Сохранённые места">
  {#snippet rightWindowButtons()}
    <Button leadingIcon={mdiPlus} size="small" onclick={handleAddLocation}>
      Добавить место
    </Button>
  {/snippet}

  <div class="flex flex-col gap-4 max-w-4xl mx-auto p-4 dark:text-white">
    <!-- Filters & Search Bar -->
    <div class="flex flex-col gap-3 bg-gray-50 dark:bg-immich-dark-gray p-4 rounded-2xl border border-gray-100 dark:border-none shadow-sm">
      <div class="flex flex-row gap-3 items-center justify-between w-full">
        <!-- Add Button on Left -->
        <Button leadingIcon={mdiPlus} size="small" onclick={handleAddLocation} class="shrink-0">
          Добавить
        </Button>

        <!-- Narrow Search Input in Middle -->
        <div class="flex items-center gap-2 flex-grow max-w-sm">
          <Icon icon={mdiMagnify} class="text-gray-400 shrink-0" size="18" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Фильтр..."
            class="w-full px-3 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary text-sm transition-all"
          />
        </div>

        <!-- Favorites Button on Right -->
        <button
          type="button"
          onclick={() => (showOnlyFavorites = !showOnlyFavorites)}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors shrink-0 {showOnlyFavorites ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' : 'bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700'}"
        >
          <Icon icon={showOnlyFavorites ? mdiStar : mdiStarOutline} class={showOnlyFavorites ? 'text-amber-500' : 'text-gray-400'} size="16" />
          Избранные
        </button>
      </div>

      <!-- Map Focus Coordinates Block -->
      <div 
        class="flex items-center gap-2 pt-2 border-t border-gray-200/60 dark:border-zinc-700/50 text-xs cursor-help"
        title="Стартовый фокус карты при открытии"
      >
        <span class="text-gray-500 dark:text-zinc-400 font-medium">Фокус:</span>
        <div class="flex items-center gap-1.5">
          <div class="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-2 py-0.5 rounded-md font-mono text-gray-700 dark:text-zinc-300">
            Широта: <span class="font-bold text-primary dark:text-primary-light">{mapFocusPoint ? mapFocusPoint.lat.toFixed(6) : '—'}</span>
          </div>
          <div class="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-2 py-0.5 rounded-md font-mono text-gray-700 dark:text-zinc-300">
            Долгота: <span class="font-bold text-primary dark:text-primary-light">{mapFocusPoint ? mapFocusPoint.lng.toFixed(6) : '—'}</span>
          </div>
          {#if mapFocusPoint}
            <button
              type="button"
              onclick={() => {
                mapFocusPoint = null;
                toastManager.success('Фокус карты сброшен к исходному');
              }}
              class="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              title="Сбросить фокус"
            >
              <Icon icon={mdiRefresh} size="16" />
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    {#if isLoading}
      <div class="flex justify-center items-center py-20">
        <LoadingSpinner size="giant" />
      </div>
    {:else if filteredLocations.length === 0}
      <div class="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 text-center">
        <EmptyPlaceholder
          text={searchQuery || showOnlyFavorites ? 'Ничего не найдено по выбранным фильтрам' : 'Вы пока не добавили ни одного сохранённого места'}
          onClick={handleAddLocation}
          actionText={searchQuery || showOnlyFavorites ? undefined : 'Добавить первое место'}
        />
      </div>
    {:else}
      <!-- Saved Locations List -->
      <div class="grid gap-3">
        {#each filteredLocations as loc (loc.id)}
          <div
            animate:flip={{ duration: 300 }}
            class="group relative flex items-center justify-between p-4 bg-white dark:bg-zinc-900 hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800/50 rounded-2xl shadow-sm hover:shadow transition-all duration-300"
          >
            <div class="flex items-start gap-3 w-full">
              <!-- Favorite Button -->
              <button
                type="button"
                onclick={() => toggleFavorite(loc)}
                class="mt-1 hover:scale-110 active:scale-95 transition-transform shrink-0"
                title={loc.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
              >
                <Icon
                  icon={loc.isFavorite ? mdiStar : mdiStarOutline}
                  class={loc.isFavorite ? 'text-amber-500' : 'text-gray-300 dark:text-zinc-600 hover:text-amber-400 dark:hover:text-amber-400'}
                  size="20"
                />
              </button>

              <div class="flex flex-col gap-0.5 w-full">
                <!-- User Label & Coordinates Badge Row -->
                <div class="flex items-center justify-between gap-2 w-full">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <Icon icon={getIconSvg(loc.icon)} class="text-gray-400 shrink-0" size="18" />
                    <Text fontWeight="bold" size="medium" class="text-gray-800 dark:text-zinc-100 truncate">
                      {loc.label}
                    </Text>
                  </div>

                  <!-- Coordinates Badge -->
                  <button
                    type="button"
                    onclick={() => {
                      mapFocusPoint = { lat: loc.latitude, lng: loc.longitude };
                      toastManager.success('Координаты установлены как стартовый фокус карты');
                    }}
                    class="flex items-center gap-1 text-[11px] text-primary dark:text-primary-light font-mono bg-primary/5 hover:bg-primary/10 dark:bg-primary-dark/20 dark:hover:bg-primary-dark/30 px-2 py-0.5 rounded-full border border-primary/10 transition-colors shrink-0 text-left"
                    title="Использовать как фокус для следующего открытия карты"
                  >
                    <Icon icon={mdiMapMarkerOutline} size="12" />
                    <span>{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</span>
                  </button>
                </div>

                <!-- Geocoded Address Name -->
                <Text size="small" color="muted" class="text-gray-500 dark:text-zinc-400 max-w-xl truncate">
                  {loc.name}
                </Text>

                <!-- Optional Description -->
                {#if loc.description}
                  <Text size="tiny" class="text-gray-400 dark:text-zinc-500 italic mt-0.5 bg-gray-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md inline-block max-w-max">
                    {loc.description}
                  </Text>
                {/if}
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 ml-3">
              <button
                type="button"
                onclick={() => handleEditLocation(loc)}
                class="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Редактировать"
              >
                <Icon icon={mdiPencilOutline} size="18" />
              </button>
              <button
                type="button"
                onclick={() => handleDeleteLocation(loc.id)}
                class="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                title="Удалить"
              >
                <Icon icon={mdiDeleteOutline} size="18" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</UserPageLayout>
