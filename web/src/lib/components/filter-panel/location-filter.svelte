<script lang="ts">
  import type { FilterContext } from './filter-panel';

  import { getSavedLocations, type SavedLocationResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiMagnify, mdiStar } from '@mdi/js';
  import { onMount, untrack } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    states: string[];
    selectedState?: string;
    selectedCity?: string;
    selectedStreet?: string;
    context?: FilterContext;
    onCityFetch: (state: string, context?: FilterContext) => Promise<string[]>;
    onSelectionChange: (state?: string, city?: string, street?: string) => void;
    emptyText?: string;
  }

  let {
    states,
    selectedState,
    selectedCity,
    selectedStreet,
    context,
    onCityFetch,
    onSelectionChange,
    emptyText,
  }: Props = $props();

  let searchQuery = $state('');
  let showAll = $state(false);
  let expandedState = $state<string | undefined>(undefined);
  let expandedCity = $state<string | undefined>(undefined);

  let rawCitiesCache = $state<Record<string, string[]>>({});
  let loadingStates = $state<Record<string, boolean>>({});
  let stateFetchErrors = $state<Record<string, boolean>>({});
  let latestStateFetchIds = $state<Record<string, number>>({});
  let stateFetchSequence = 0;
  let cacheKey = $state('');

  const STATE_SHOW_COUNT = 10;

  let savedLocations = $state<SavedLocationResponseDto[]>([]);

  onMount(async () => {
    try {
      savedLocations = await getSavedLocations();
    } catch {
      // ignore
    }
  });

  let normalizedSearchQuery = $derived(searchQuery.trim().toLowerCase());

  // Saved locations parsing
  function getStateFromSaved(loc: SavedLocationResponseDto): string | undefined {
    const parts = loc.name.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      return parts[parts.length - 1]; // State/Region is always the last part since country is removed
    }
    return undefined;
  }

  function getCityFromSaved(loc: SavedLocationResponseDto): string | undefined {
    const parts = loc.name.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      return parts[parts.length - 2]; // City is second from last
    }
    if (parts.length === 1) {
      return parts[0];
    }
    return undefined;
  }

  function getStreetFromSaved(loc: SavedLocationResponseDto): string | undefined {
    const parts = loc.name.split(',').map((p) => p.trim());
    if (parts.length >= 3) {
      return parts.slice(0, parts.length - 2).join(', '); // Streets are everything before city
    }
    return undefined;
  }

  let filteredSavedLocations = $derived(
    savedLocations.filter(
      (loc) =>
        !normalizedSearchQuery ||
        loc.label.toLowerCase().includes(normalizedSearchQuery) ||
        loc.name.toLowerCase().includes(normalizedSearchQuery)
    )
  );

  function handleSavedLocationSelect(loc: SavedLocationResponseDto) {
    const state = getStateFromSaved(loc);
    const city = getCityFromSaved(loc);
    const street = getStreetFromSaved(loc);

    if (selectedState === state && selectedCity === city && selectedStreet === street) {
      onSelectionChange(undefined, undefined, undefined);
    } else {
      onSelectionChange(state, city, street);
    }
  }

  $effect(() => {
    const nextKey = JSON.stringify({ states, context });
    if (cacheKey && nextKey !== cacheKey) {
      stateFetchSequence += 1;
      rawCitiesCache = {};
      loadingStates = {};
      stateFetchErrors = {};
      latestStateFetchIds = {};
      expandedState = undefined;
      expandedCity = undefined;
    }
    cacheKey = nextKey;
  });

  // Filter states based on search query
  let filteredStates = $derived.by(() => {
    if (!normalizedSearchQuery) {
      return states;
    }

    return states.filter((state) => {
      const stateMatches = state.toLowerCase().includes(normalizedSearchQuery);
      const cityMatches = (rawCitiesCache[state] ?? []).some((val) =>
        val.toLowerCase().includes(normalizedSearchQuery)
      );
      return stateMatches || cityMatches || selectedState === state;
    });
  });

  let visibleStates = $derived(
    searchQuery.trim() || showAll ? filteredStates : filteredStates.slice(0, STATE_SHOW_COUNT),
  );

  let remainingCount = $derived(Math.max(0, filteredStates.length - STATE_SHOW_COUNT));

  // Fetch raw cities for a state
  function ensureStateData(state: string) {
    if (state in rawCitiesCache || loadingStates[state]) {
      return;
    }

    const requestedState = state;
    const _context = context;
    const requestId = ++stateFetchSequence;

    latestStateFetchIds = { ...latestStateFetchIds, [requestedState]: requestId };
    loadingStates = { ...loadingStates, [requestedState]: true };
    stateFetchErrors = { ...stateFetchErrors, [requestedState]: false };

    void onCityFetch(requestedState, _context)
      .then((result) => {
        if (latestStateFetchIds[requestedState] !== requestId) {
          return;
        }

        rawCitiesCache = { ...rawCitiesCache, [requestedState]: result };
        loadingStates = { ...loadingStates, [requestedState]: false };
        stateFetchErrors = { ...stateFetchErrors, [requestedState]: false };

        // Cascade auto-clear: if selected city/street no longer matches fetched data
        if (selectedState === requestedState) {
          const parsedCities = parseCitiesFromRaw(result);
          if (selectedCity && !parsedCities.includes(selectedCity)) {
            onSelectionChange(requestedState, undefined, undefined);
          } else if (selectedCity && selectedStreet) {
            const parsedStreets = parseStreetsFromRaw(result, selectedCity);
            if (!parsedStreets.includes(selectedStreet)) {
              onSelectionChange(requestedState, selectedCity, undefined);
            }
          }
        }
      })
      .catch(() => {
        if (latestStateFetchIds[requestedState] !== requestId) {
          return;
        }

        loadingStates = { ...loadingStates, [requestedState]: false };
        stateFetchErrors = { ...stateFetchErrors, [requestedState]: true };
      });
  }

  $effect(() => {
    if (expandedState) {
      untrack(() => ensureStateData(expandedState!));
    }
  });

  $effect(() => {
    if (selectedState) {
      untrack(() => ensureStateData(selectedState));
    }
  });

  // Pre-fetch search results if search query is entered
  $effect(() => {
    if (normalizedSearchQuery.length < 2 || !cacheKey) {
      return;
    }

    const currentStates = states;
    const timeout = setTimeout(() => {
      untrack(() => {
        for (const state of currentStates) {
          ensureStateData(state);
        }
      });
    }, 150);

    return () => clearTimeout(timeout);
  });

  // Parsed arrays for rendering
  function getCitiesForState(state: string): string[] {
    const raw = rawCitiesCache[state] ?? [];
    const cities = parseCitiesFromRaw(raw);
    if (!normalizedSearchQuery) {
      return cities;
    }
    return cities.filter(c => c.toLowerCase().includes(normalizedSearchQuery));
  }

  function getStreetsForCity(state: string, city: string): string[] {
    const raw = rawCitiesCache[state] ?? [];
    const streets = parseStreetsFromRaw(raw, city);
    if (!normalizedSearchQuery) {
      return streets;
    }
    return streets.filter(s => s.toLowerCase().includes(normalizedSearchQuery));
  }

  function parseCitiesFromRaw(rawValues: string[]): string[] {
    const citiesCountMap: Record<string, number> = {};
    for (const val of rawValues) {
      if (!val) continue;

      let rawCity = val;
      let count = 1;

      const lastColonIndex = val.lastIndexOf(':');
      if (lastColonIndex !== -1) {
        const potentialCount = parseInt(val.slice(lastColonIndex + 1), 10);
        if (!isNaN(potentialCount)) {
          rawCity = val.slice(0, lastColonIndex);
          count = potentialCount;
        }
      }

      const parts = rawCity.split(',').map((p) => p.trim());
      const city = parts[parts.length - 1];
      if (city) {
        citiesCountMap[city] = (citiesCountMap[city] || 0) + count;
      }
    }
    return Object.keys(citiesCountMap).sort((a, b) => {
      const diff = citiesCountMap[b] - citiesCountMap[a];
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });
  }

  function parseStreetsFromRaw(rawValues: string[], selectedCityName: string): string[] {
    const streetsCountMap: Record<string, number> = {};
    for (const val of rawValues) {
      if (!val) continue;

      let rawCity = val;
      let count = 1;

      const lastColonIndex = val.lastIndexOf(':');
      if (lastColonIndex !== -1) {
        const potentialCount = parseInt(val.slice(lastColonIndex + 1), 10);
        if (!isNaN(potentialCount)) {
          rawCity = val.slice(0, lastColonIndex);
          count = potentialCount;
        }
      }

      const parts = rawCity.split(',').map((p) => p.trim());
      const city = parts[parts.length - 1];
      if (city === selectedCityName && parts.length > 1) {
        const street = parts.slice(0, parts.length - 1).join(', ');
        if (street) {
          streetsCountMap[street] = (streetsCountMap[street] || 0) + count;
        }
      }
    }
    return Object.keys(streetsCountMap).sort((a, b) => {
      const diff = streetsCountMap[b] - streetsCountMap[a];
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });
  }

  // Click Handlers
  function handleStateClick(state: string) {
    if (selectedState === state && !selectedCity) {
      expandedState = undefined;
      onSelectionChange(undefined, undefined, undefined);
    } else {
      expandedState = state;
      expandedCity = undefined;
      onSelectionChange(state, undefined, undefined);
    }
  }

  function handleCityClick(state: string, city: string) {
    if (selectedState === state && selectedCity === city && !selectedStreet) {
      expandedCity = undefined;
      onSelectionChange(state, undefined, undefined);
    } else {
      expandedState = state;
      expandedCity = city;
      onSelectionChange(state, city, undefined);
    }
  }

  function handleStreetClick(state: string, city: string, street: string) {
    if (selectedState === state && selectedCity === city && selectedStreet === street) {
      onSelectionChange(state, city, undefined);
    } else {
      onSelectionChange(state, city, street);
    }
  }
</script>

<div data-testid="location-filter">
  <!-- Saved Locations List -->
  {#if filteredSavedLocations.length > 0}
    <div class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 mt-1">
      {$t('saved_locations') ?? 'Сохранённые места'}
    </div>
    <div class="max-h-[160px] overflow-y-auto pr-1 flex flex-col gap-0.5 mb-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
      {#each filteredSavedLocations as loc (loc.id)}
        {@const state = getStateFromSaved(loc)}
        {@const city = getCityFromSaved(loc)}
        {@const street = getStreetFromSaved(loc)}
        {@const isSelected = selectedState === state && selectedCity === city && selectedStreet === street}
        <button
          type="button"
          class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-subtle {isSelected ? 'font-semibold text-primary dark:text-primary-light bg-primary/5' : 'text-gray-600 dark:text-gray-300'}"
          onclick={() => handleSavedLocationSelect(loc)}
        >
          <Icon icon={mdiStar} class="text-amber-500 shrink-0" size="14" />
          <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">{loc.label}</span>
        </button>
      {/each}
    </div>
  {/if}

  {#if states.length === 0}
    <p class="text-sm text-gray-400 dark:text-gray-500" data-testid="location-empty">
      {emptyText ?? $t('filter_no_locations_found')}
    </p>
  {:else}
    <!-- Search input -->
    <div class="relative mb-2">
      <div class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        <Icon icon={mdiMagnify} size="14" />
      </div>
      <input
        type="text"
        class="immich-form-input h-8 w-full rounded-lg pl-7 pr-2 text-sm"
        placeholder={$t('filter_search_locations_placeholder')}
        bind:value={searchQuery}
        oninput={() => {
          showAll = false;
        }}
        data-testid="location-search-input"
      />
    </div>

    <!-- Empty search results -->
    {#if filteredStates.length === 0 && searchQuery.trim()}
      <p class="text-sm text-gray-400 dark:text-gray-500" data-testid="location-no-results">
        {$t('filter_no_matching_locations')}
      </p>
    {/if}

    {#each visibleStates as state (state)}
      {@const isStateSelected = selectedState === state}
      <!-- State row -->
      <button
        type="button"
        class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-subtle {isStateSelected
          ? 'font-medium'
          : 'text-gray-500 dark:text-gray-300'}"
        onclick={() => handleStateClick(state)}
        data-testid="location-state-{state}"
      >
        <!-- Radio indicator -->
        <div
          class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 {isStateSelected &&
          !selectedCity
            ? 'border-immich-primary bg-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary'
            : 'border-gray-300 dark:border-gray-600'}"
        >
          {#if isStateSelected && !selectedCity}
            <div class="h-1.5 w-1.5 rounded-full bg-white dark:bg-black"></div>
          {/if}
        </div>

        <!-- Label -->
        <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">{state}</span>
      </button>

      <!-- Cities (indented when state is expanded) -->
      {#if (expandedState === state || (normalizedSearchQuery && getCitiesForState(state).length > 0)) && !loadingStates[state]}
        {#each getCitiesForState(state) as city (city)}
          {@const isCitySelected = selectedState === state && selectedCity === city}
          <button
            type="button"
            class="-mx-2 ml-5 flex w-[calc(100%-1.25rem+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-subtle {isCitySelected
              ? 'font-medium'
              : 'text-gray-500 dark:text-gray-300'}"
            onclick={() => handleCityClick(state, city)}
            data-testid="location-city-{city}"
          >
            <!-- Radio indicator -->
            <div
              class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 {isCitySelected && !selectedStreet
                ? 'border-immich-primary bg-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary'
                : 'border-gray-300 dark:border-gray-600'}"
            >
              {#if isCitySelected && !selectedStreet}
                <div class="h-1.5 w-1.5 rounded-full bg-white dark:bg-black"></div>
              {/if}
            </div>

            <!-- Label -->
            <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">{city}</span>
          </button>

          <!-- Streets (indented when city is expanded) -->
          {#if (expandedCity === city || (normalizedSearchQuery && getStreetsForCity(state, city).length > 0)) && isCitySelected}
            {#each getStreetsForCity(state, city) as street (street)}
              {@const isStreetSelected = selectedState === state && selectedCity === city && selectedStreet === street}
              <button
                type="button"
                class="-mx-2 ml-10 flex w-[calc(100%-2.5rem+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-subtle {isStreetSelected
                  ? 'font-medium'
                  : 'text-gray-500 dark:text-gray-300'}"
                onclick={() => handleStreetClick(state, city, street)}
                data-testid="location-street-{street}"
              >
                <!-- Radio indicator -->
                <div
                  class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 {isStreetSelected
                    ? 'border-immich-primary bg-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary'
                    : 'border-gray-300 dark:border-gray-600'}"
                >
                  {#if isStreetSelected}
                    <div class="h-1.5 w-1.5 rounded-full bg-white dark:bg-black"></div>
                  {/if}
                </div>

                <!-- Label -->
                <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">{street}</span>
              </button>
            {/each}
          {/if}
        {/each}
      {/if}
    {/each}

    <!-- Show more link -->
    {#if !showAll && remainingCount > 0 && !searchQuery.trim()}
      <button
        type="button"
        class="py-1 text-xs font-medium text-immich-primary dark:text-immich-dark-primary"
        onclick={() => (showAll = true)}
        data-testid="location-show-more"
      >
        {$t('filter_show_more_count', { values: { count: remainingCount } })}
      </button>
    {/if}
  {/if}
</div>
