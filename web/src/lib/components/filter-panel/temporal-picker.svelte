<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { get } from 'svelte/store';
  import { t } from 'svelte-i18n';
  import { aggregateYears, getMonthsForYear } from './temporal-utils';
  import type { ViewportTopMonth } from '$lib/managers/timeline-manager/types';
  import { SvelteSet } from 'svelte/reactivity';
  import { slide } from 'svelte/transition';
  import { Icon } from '@immich/ui';
  import { mdiChevronDown } from '@mdi/js';

  const tLocal = get(t);
  const CUSTOM_RANGE_ERROR_ID = 'custom-date-range-error';

  interface Props {
    timeBuckets: Array<{ timeBucket: string; count: number }>;
    dateAfter?: string;
    dateBefore?: string;
    selectedYear?: number;
    selectedMonth?: number;
    onCustomRangeChange?: (dateAfter?: string, dateBefore?: string) => void;
    onYearSelect?: (year: number | undefined) => void;
    onMonthSelect?: (year: number, month: number | undefined) => void;
    activeTimelineMonth?: ViewportTopMonth;
  }

  let {
    timeBuckets,
    dateAfter,
    dateBefore,
    selectedYear,
    selectedMonth,
    onCustomRangeChange,
    onYearSelect,
    onMonthSelect,
    activeTimelineMonth = undefined,
  }: Props = $props();

  let years = $derived(aggregateYears(timeBuckets));
  let monthListLocale = $derived(!$locale || $locale === 'default' ? 'en' : $locale);
  let months = $derived(
    selectedYear === undefined ? [] : getMonthsForYear(timeBuckets, selectedYear, monthListLocale),
  );
  let fromValue = $state('');
  let toValue = $state('');
  let customRangeError = $state<string | undefined>();
  let customRangeErrorTarget = $state<'from' | 'to' | 'range' | undefined>();

  interface YearGroup {
    label: string;
    years: typeof years;
    minYear: number;
    maxYear: number;
  }

  let groups = $derived.by<YearGroup[]>(() => {
    if (years.length === 0) return [];
    
    const res: YearGroup[] = [];
    
    // до 1980
    const before1980 = years.filter(y => y.year < 1980);
    if (before1980.length > 0) {
      res.push({
        label: 'до 1980',
        years: before1980,
        minYear: -Infinity,
        maxYear: 1979
      });
    }
    
    // С 1980 по 2000, с 2000 по 2020 и т.д.
    const maxYearInTimeline = Math.max(...years.map(y => y.year), 1980);
    let start = 1980;
    while (start <= maxYearInTimeline) {
      const end = start + 20;
      const intervalYears = years.filter(y => y.year >= start && y.year < end);
      if (intervalYears.length > 0) {
        res.push({
          label: `${start} - ${end}`,
          years: intervalYears,
          minYear: start,
          maxYear: end - 1
        });
      }
      start = end;
    }
    
    return res;
  });

  let expandedGroups = $state(new SvelteSet<string>());
  let lastAutoOpenedGroup = $state<string | null>(null);

  // Автоматически раскрываем нужную группу лет при скролле таймлайна
  $effect(() => {
    if (activeTimelineMonth && typeof activeTimelineMonth === 'object' && 'year' in activeTimelineMonth) {
      const activeYear = activeTimelineMonth.year;
      const matchingGroup = groups.find(
        (g) => activeYear >= g.minYear && activeYear <= g.maxYear
      );
      if (matchingGroup) {
        if (matchingGroup.label !== lastAutoOpenedGroup) {
          expandedGroups.clear();
          expandedGroups.add(matchingGroup.label);
          lastAutoOpenedGroup = matchingGroup.label;
        }
      }
    }
  });

  $effect(() => {
    fromValue = dateAfter ?? '';
    toValue = dateBefore ?? '';
    clearCustomRangeError();
  });

  function parseDateOnly(value: string): { valid: true; value?: string } | { valid: false } {
    if (value === '') {
      return { valid: true };
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return { valid: false };
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return { valid: false };
    }

    return { valid: true, value };
  }

  function clearCustomRangeError() {
    customRangeError = undefined;
    customRangeErrorTarget = undefined;
  }

  function clearCustomRangeState() {
    fromValue = '';
    toValue = '';
    clearCustomRangeError();
  }

  function validateAndEmitCustomRange() {
    const parsedFrom = parseDateOnly(fromValue);
    if (!parsedFrom.valid) {
      customRangeError = tLocal('filter_custom_date_invalid_from');
      customRangeErrorTarget = 'from';
      return;
    }

    const parsedTo = parseDateOnly(toValue);
    if (!parsedTo.valid) {
      customRangeError = tLocal('filter_custom_date_invalid_to');
      customRangeErrorTarget = 'to';
      return;
    }

    if (parsedFrom.value && parsedTo.value && parsedFrom.value > parsedTo.value) {
      customRangeError = tLocal('filter_custom_date_order_error');
      customRangeErrorTarget = 'range';
      return;
    }

    clearCustomRangeError();
    onCustomRangeChange?.(parsedFrom.value, parsedTo.value);
  }

  function handleYearClick(year: number, count: number) {
    if (count === 0) {
      return;
    }
    clearCustomRangeState();
    onYearSelect?.(year);
  }

  function handleMonthClick(year: number, month: number, count: number) {
    if (count === 0) {
      return;
    }
    clearCustomRangeState();
    if (selectedMonth === month) {
      onMonthSelect?.(year, undefined);
    } else {
      onMonthSelect?.(year, month);
    }
  }

  function handleBackToAll() {
    clearCustomRangeState();
    onYearSelect?.(undefined);
  }

  let breadcrumbMonthLabel = $derived(
    selectedMonth === undefined ? '' : (months.find((m) => m.month === selectedMonth)?.label ?? ''),
  );
</script>

<div data-testid="temporal-picker">
  <div class="mb-4 space-y-2" data-testid="custom-date-range">
    <div class="grid grid-cols-2 gap-2.5">
      <label class="flex flex-col gap-1.5 text-[11px] font-medium leading-none text-gray-600 dark:text-gray-300">
        <span class="px-0.5">{tLocal('filter_custom_date_from')}</span>
        <input
          bind:value={fromValue}
          oninput={validateAndEmitCustomRange}
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder={tLocal('filter_date_placeholder_iso')}
          pattern={String.raw`\d{4}-\d{2}-\d{2}`}
          aria-invalid={customRangeErrorTarget === 'from' || customRangeErrorTarget === 'range' ? 'true' : undefined}
          aria-describedby={customRangeErrorTarget === 'from' || customRangeErrorTarget === 'range'
            ? CUSTOM_RANGE_ERROR_ID
            : undefined}
          class="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-immich-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-immich-dark-primary"
          data-testid="custom-date-from-input"
        />
      </label>
      <label class="flex flex-col gap-1.5 text-[11px] font-medium leading-none text-gray-600 dark:text-gray-300">
        <span class="px-0.5">{tLocal('filter_custom_date_to')}</span>
        <input
          bind:value={toValue}
          oninput={validateAndEmitCustomRange}
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder={tLocal('filter_date_placeholder_iso')}
          pattern={String.raw`\d{4}-\d{2}-\d{2}`}
          aria-invalid={customRangeErrorTarget === 'to' || customRangeErrorTarget === 'range' ? 'true' : undefined}
          aria-describedby={customRangeErrorTarget === 'to' || customRangeErrorTarget === 'range'
            ? CUSTOM_RANGE_ERROR_ID
            : undefined}
          class="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-immich-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-immich-dark-primary"
          data-testid="custom-date-to-input"
        />
      </label>
    </div>
    {#if customRangeError}
      <p id={CUSTOM_RANGE_ERROR_ID} role="alert" class="text-xs text-red-600 dark:text-red-400">{customRangeError}</p>
    {/if}
  </div>

  {#if selectedYear !== undefined}
    <div class="mb-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
      <button
        type="button"
        class="font-medium text-immich-primary hover:underline dark:text-immich-dark-primary"
        onclick={handleBackToAll}
        data-testid="temporal-breadcrumb-all"
      >
        {tLocal('filter_temporal_breadcrumb_all')}
      </button>
      <span class="opacity-50">/</span>
      <span class="font-semibold">{selectedYear}</span>
      {#if selectedMonth !== undefined}
        <span class="opacity-50">/</span>
        <span data-testid="temporal-breadcrumb-month" class="font-semibold">{breadcrumbMonthLabel}</span>
      {/if}
    </div>

    <div class="grid grid-cols-4 gap-1.5" data-testid="month-grid">
      {#each months as m (m.month)}
        {@const maxMonthCount = Math.max(...months.map((mo) => mo.count), 1)}
        {@const monthVolume = Math.round((m.count / maxMonthCount) * 100)}
        {@const isSelected = selectedMonth === m.month}
        <button
          type="button"
          class="flex flex-col items-center rounded-lg border px-2 py-2 transition-all duration-100
            {isSelected
            ? 'border-immich-primary bg-immich-primary text-white dark:border-immich-dark-primary dark:bg-immich-dark-primary'
            : m.count === 0
              ? 'cursor-default border-gray-200 opacity-30 dark:border-gray-700'
              : 'cursor-pointer border-gray-200 hover:border-immich-primary hover:bg-immich-primary/5 dark:border-gray-700 dark:hover:border-immich-dark-primary dark:hover:bg-immich-dark-primary/5'}"
          onclick={() => handleMonthClick(selectedYear!, m.month, m.count)}
          data-testid="month-btn-{m.month}"
        >
          <span class="text-xs font-semibold">{m.label}</span>
          <span class="text-xs {isSelected ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}">{m.count}</span>
          <div
            class="mt-1 h-[3px] w-full overflow-hidden rounded-sm {isSelected
              ? 'bg-white/30'
              : 'bg-gray-200 dark:bg-gray-700'}"
          >
            <div
              class="h-full rounded-sm transition-[width] duration-300 {isSelected
                ? 'bg-white'
                : 'bg-immich-primary dark:bg-immich-dark-primary'}"
              style="width: {m.count === 0 ? 0 : monthVolume}%"
            ></div>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="space-y-1" data-testid="year-grid">
      {#each groups as group (group.label)}
        {@const isExpanded = expandedGroups.has(group.label)}
        <div class="border-b border-gray-100 dark:border-zinc-800 last:border-0 pb-1">
          <button
            type="button"
            class="flex w-full items-center justify-between py-1.5 text-xs font-medium hover:text-immich-primary dark:hover:text-immich-dark-primary"
            onclick={() => {
              if (expandedGroups.has(group.label)) {
                expandedGroups.delete(group.label);
              } else {
                expandedGroups.clear();
                expandedGroups.add(group.label);
              }
            }}
          >
            <span>{group.label}</span>
            <Icon
              icon={mdiChevronDown}
              size="16"
              class="text-gray-500 transition-transform dark:text-gray-400 {isExpanded ? '' : '-rotate-90'}"
            />
          </button>
          
          {#if isExpanded}
            <div class="flex flex-wrap gap-1.5 pt-1" transition:slide={{ duration: 250 }}>
              {#each group.years as y (y.year)}
                <button
                  type="button"
                  class="year-chip flex min-w-[54px] flex-1 basis-[calc(25%-5px)] flex-col items-center rounded-lg border px-2 py-1.5 transition-all duration-100
                    {y.count === 0
                    ? 'cursor-default border-gray-200 opacity-30 dark:border-gray-700'
                    : 'cursor-pointer border-gray-200 hover:border-immich-primary hover:bg-immich-primary/5 dark:border-gray-700 dark:hover:border-immich-dark-primary dark:hover:bg-immich-dark-primary/5'}"
                  onclick={() => handleYearClick(y.year, y.count)}
                  data-testid="year-btn-{y.year}"
                >
                  <span class="text-xs font-semibold leading-tight">{y.year}</span>
                  <span class="text-xs leading-tight text-gray-400 opacity-60 dark:text-gray-500">{y.count}</span>
                  <div class="mt-0.5 h-[2px] w-full overflow-hidden rounded-sm bg-gray-200 dark:bg-gray-700">
                    <div
                      class="h-full rounded-sm bg-immich-primary transition-[width] duration-300 dark:bg-immich-dark-primary"
                      style="width: {y.volumePercent}%"
                    ></div>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

