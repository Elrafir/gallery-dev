<script lang="ts">
  /**
   * @component ActiveFiltersBar
   * Верхняя плашка ("чипсы"), отображающая текущие активные фильтры и поисковый запрос.
   * Позволяет пользователю сбрасывать отдельные фильтры или все сразу, а также
   * показывает общее количество найденных результатов.
   */
  import { locale } from '$lib/stores/preferences.store';
  import { get } from 'svelte/store';
  import { t } from 'svelte-i18n';
  import type { FilterState } from './filter-panel';

  interface Props {
    filters: FilterState;
    resultCount?: number;
    personNames?: Map<string, string>;
    tagNames?: Map<string, string>;
    onRemoveFilter: (type: string, id?: string) => void;
    onClearAll: () => void;
    searchQuery?: string;
    onClearSearch?: () => void;
  }

  let {
    filters,
    resultCount,
    personNames,
    tagNames,
    onRemoveFilter,
    onClearAll,
    searchQuery = '',
    onClearSearch,
  }: Props = $props();

  interface Chip {
    type: string;
    id?: string;
    label: string;
  }

  function resolveLocaleTag(raw: string | undefined): string {
    if (!raw || raw === 'default') {
      return 'en';
    }
    return raw;
  }

  let chips = $derived.by(() => {
    void $locale;
    const translate = get(t);
    const locTag = resolveLocaleTag($locale);
    const dateFormatter = new Intl.DateTimeFormat(locTag === 'ru' ? 'ru-RU' : 'en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const monthShortFormatter = new Intl.DateTimeFormat(locTag === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      timeZone: 'UTC',
    });

    const formatDateOnly = (value: string) => dateFormatter.format(new Date(`${value}T00:00:00.000Z`));

    const buildCustomDateLabel = (dateAfter: string | undefined, dateBefore: string | undefined): string | undefined => {
      if (dateAfter && dateBefore) {
        return `${formatDateOnly(dateAfter)} - ${formatDateOnly(dateBefore)}`;
      }
      if (dateAfter) {
        return translate('filter_active_date_after', { values: { date: formatDateOnly(dateAfter) } });
      }
      if (dateBefore) {
        return translate('filter_active_date_before', { values: { date: formatDateOnly(dateBefore) } });
      }
    };

    const result: Chip[] = [];

    for (const personId of filters.personIds) {
      const name = personNames?.get(personId) ?? personId;
      result.push({ type: 'person', id: personId, label: name });
    }

    if (filters.city && filters.country) {
      result.push({ type: 'location', label: `${filters.city}, ${filters.country}` });
    } else if (filters.city) {
      result.push({ type: 'location', label: filters.city });
    } else if (filters.country) {
      result.push({ type: 'location', label: filters.country });
    }

    if (filters.make && filters.model) {
      result.push({ type: 'camera', label: `${filters.make} ${filters.model}` });
    } else if (filters.make) {
      result.push({ type: 'camera', label: filters.make });
    }

    for (const tagId of filters.tagIds) {
      const name = tagNames?.get(tagId) ?? tagId;
      result.push({ type: 'tag', id: tagId, label: name });
    }

    if (filters.rating !== undefined) {
      result.push({ type: 'rating', label: `\u2605 ${filters.rating}+` });
    }

    if (filters.mediaType === 'image') {
      result.push({ type: 'mediaType', label: translate('filter_active_media_photos_only') });
    } else if (filters.mediaType === 'video') {
      result.push({ type: 'mediaType', label: translate('filter_active_media_videos_only') });
    }

    if (filters.isFavorite === true) {
      result.push({ type: 'favorites', label: translate('filter_active_favorites') });
    }

    if (filters.isNotInAlbum === true) {
      result.push({ type: 'albums', label: translate('filter_active_not_in_album') });
    }

    const customDateLabel = buildCustomDateLabel(filters.dateAfter, filters.dateBefore);
    if (customDateLabel) {
      result.push({ type: 'timeline', label: customDateLabel });
    } else if (filters.selectedYear !== undefined) {
      const y = filters.selectedYear;
      const label =
        filters.selectedMonth === undefined
          ? `${y}`
          : `${monthShortFormatter.format(new Date(Date.UTC(y, filters.selectedMonth - 1, 1)))} ${y}`;
      result.push({ type: 'timeline', label });
    }

    return result;
  });

  let hasActiveFilters = $derived(chips.length > 0 || searchQuery.trim().length > 0);
</script>

<div
  class="flex flex-wrap items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
  data-testid="active-filters-bar"
>
  {#if resultCount !== undefined}
    <span class="text-xs text-gray-400 dark:text-gray-500" data-testid="result-count">
      {$t('filter_results_count', { values: { count: resultCount } })}
    </span>
  {/if}

  {#if searchQuery.trim()}
    <span
      class="inline-flex items-center gap-1 rounded-full bg-immich-primary/10 px-2.5 py-0.5 text-xs text-immich-primary dark:bg-immich-dark-primary/10 dark:text-immich-dark-primary"
      data-testid="search-chip"
    >
      <span>{searchQuery}</span>
      <button
        type="button"
        class="flex h-4 w-4 items-center justify-center rounded-full text-immich-primary/60 hover:text-immich-primary dark:text-immich-dark-primary/60 dark:hover:text-immich-dark-primary"
        onclick={() => onClearSearch?.()}
        aria-label={$t('filter_clear_search_aria')}
        data-testid="search-chip-close"
      >
        &times;
      </button>
    </span>
  {/if}

  {#each chips as chip (`${chip.type}-${chip.id ?? chip.label}`)}
    <span
      class="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs dark:bg-gray-700"
      data-testid="active-chip"
    >
      <span>{chip.label}</span>
      <button
        type="button"
        class="flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        onclick={() => onRemoveFilter(chip.type, chip.id)}
        aria-label={$t('filter_remove_chip_aria', { values: { label: chip.label } })}
        data-testid="chip-close"
      >
        &times;
      </button>
    </span>
  {/each}

  {#if hasActiveFilters}
    <button
      type="button"
      class="ml-auto text-xs font-semibold text-immich-primary dark:text-immich-dark-primary"
      onclick={() => {
        onClearAll();
        if (searchQuery) {
          onClearSearch?.();
        }
      }}
      data-testid="clear-all-btn"
    >
      {$t('filter_clear_all')}
    </button>
  {/if}
</div>
