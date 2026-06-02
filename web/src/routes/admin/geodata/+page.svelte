<script lang="ts">
  import { onMount } from 'svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { handleSystemConfigSave } from '$lib/services/system-config.service';
  import { getBaseUrl, defaults } from '@immich/sdk';
  import { Button, toastManager } from '@immich/ui';
  import { fade } from 'svelte/transition';

  // Состояние конфигурации
  let configToEdit = $state(systemConfigManager.cloneValue());
  let substitutions = $derived(configToEdit.reverseGeocoding?.substitutions || []);

  // Состояние формы
  let countryInput = $state('');
  let stateInput = $state('');
  let replacementInput = $state('');
  let startYearInput = $state<number | null>(null);
  let endYearInput = $state<number | null>(null);

  // Сохранение последних валидных выбранных значений
  let lastValidCountry = $state('');
  let lastValidState = $state('');

  // Режим редактирования
  let editingIndex = $state<number | null>(null);

  // Списки для автодополнения
  let dbCountries = $state<string[]>([]);
  let dbStates = $state<string[]>([]);
  let nominatimSuggestions = $state<Array<{ country: string; state: string }>>([]);

  // Отслеживание фокуса/активности выпадающих списков
  let showCountryDropdown = $state(false);
  let showStateDropdown = $state(false);
  let isNominatimLoading = $state(false);

  // Флаги нахождения мыши над выпадающими списками (для предотвращения гонки при blur)
  let isOverCountryDropdown = $state(false);
  let isOverStateDropdown = $state(false);

  // Конфигурирование заголовков авторизации для fetch
  const getAuthFetchInit = async (): Promise<RequestInit> => {
    const headers = typeof defaults.headers === 'function' ? await defaults.headers() : defaults.headers;
    return {
      headers: {
        ...headers,
      },
      credentials: 'include'
    };
  };

  // Загрузка уникальных стран и регионов из БД
  const loadDbData = async () => {
    try {
      const initOpts = await getAuthFetchInit();
      const url = `${getBaseUrl()}/map/countries`;
      console.log('[Geodata Editor] Загрузка стран из БД:', url);
      const countriesRes = await fetch(url, initOpts);
      console.log('[Geodata Editor] Статус ответа стран:', countriesRes.status);
      if (countriesRes.ok) {
        dbCountries = await countriesRes.json();
        console.log('[Geodata Editor] Получено стран из БД:', dbCountries.length, dbCountries);
      }
      
      const statesUrl = `${getBaseUrl()}/map/states`;
      console.log('[Geodata Editor] Загрузка регионов из БД:', statesUrl);
      const statesRes = await fetch(statesUrl, initOpts);
      console.log('[Geodata Editor] Статус ответа регионов:', statesRes.status);
      if (statesRes.ok) {
        dbStates = await statesRes.json();
        console.log('[Geodata Editor] Получено регионов из БД:', dbStates.length, dbStates);
      }
    } catch (e) {
      console.error('[Geodata Editor] Ошибка загрузки данных локаций из БД', e);
    }
  };

  onMount(() => {
    loadDbData();
  });

  // Поиск через Nominatim с ограничением по featuretype
  let searchTimeout: NodeJS.Timeout;
  const searchNominatim = (query: string, type: 'country' | 'state') => {
    clearTimeout(searchTimeout);
    if (!query || query.trim().length < 2) {
      nominatimSuggestions = [];
      return;
    }

    searchTimeout = setTimeout(async () => {
      isNominatimLoading = true;
      try {
        const initOpts = await getAuthFetchInit();
        const searchUrl = `${getBaseUrl()}/search/places?name=${encodeURIComponent(query)}&featuretype=${type}`;
        console.log('[Geodata Editor] Поиск в Nominatim:', searchUrl);
        const res = await fetch(searchUrl, initOpts);
        console.log('[Geodata Editor] Статус ответа Nominatim:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('[Geodata Editor] Ответ Nominatim:', data);
          const unique = new Set<string>();
          const tempSuggestions: Array<{ country: string; state: string }> = [];

          for (const item of data) {
            const country = item.country?.trim() || '';
            const state = item.admin1name?.trim() || '';
            
            if (type === 'country' && country) {
              if (!unique.has(country.toLowerCase())) {
                unique.add(country.toLowerCase());
                tempSuggestions.push({ country, state: '' });
              }
            } else if (type === 'state' && state) {
              const key = `${country.toLowerCase()}|${state.toLowerCase()}`;
              if (!unique.has(key)) {
                unique.add(key);
                tempSuggestions.push({ country, state });
              }
            }
          }
          nominatimSuggestions = tempSuggestions;
          console.log('[Geodata Editor] Сформированные подсказки:', nominatimSuggestions);
        }
      } catch (e) {
        console.error('[Geodata Editor] Ошибка поиска в Nominatim', e);
      } finally {
        isNominatimLoading = false;
      }
    }, 400);
  };

  // Фильтруемые списки стран/регионов из БД по вводу
  let filteredCountries = $derived(
    dbCountries.filter(c => c.toLowerCase().includes(countryInput.toLowerCase()))
  );

  let filteredStates = $derived(
    dbStates.filter(s => s.toLowerCase().includes(stateInput.toLowerCase()))
  );

  // Валидация ввода при потере фокуса (блокировка произвольного ручного ввода)
  const validateCountryInput = () => {
    const val = countryInput.trim().toLowerCase();
    if (!val) {
      countryInput = '';
      lastValidCountry = '';
      return;
    }
    // Проверяем БД
    const dbMatch = dbCountries.find(c => c.toLowerCase() === val);
    if (dbMatch) {
      countryInput = dbMatch;
      lastValidCountry = dbMatch;
      return;
    }
    // Проверяем Nominatim подсказки
    const sugMatch = nominatimSuggestions.find(s => s.country.toLowerCase() === val);
    if (sugMatch) {
      countryInput = sugMatch.country;
      lastValidCountry = sugMatch.country;
      return;
    }
    // Если нет совпадений - откатываем к последнему валидному значению
    countryInput = lastValidCountry;
    if (!lastValidCountry) {
      toastManager.warning('Пожалуйста, выберите исходную страну из списка автодополнения');
    }
  };

  const validateStateInput = () => {
    const val = stateInput.trim().toLowerCase();
    if (!val) {
      stateInput = '';
      lastValidState = '';
      return;
    }
    // Проверяем БД
    const dbMatch = dbStates.find(s => s.toLowerCase() === val);
    if (dbMatch) {
      stateInput = dbMatch;
      lastValidState = dbMatch;
      return;
    }
    // Проверяем Nominatim подсказки
    const sugMatch = nominatimSuggestions.find(s => s.state.toLowerCase() === val);
    if (sugMatch) {
      stateInput = sugMatch.state;
      lastValidState = sugMatch.state;
      // Если в подсказке указана страна, и поле страны пустое или отличается - подставим ее
      if (sugMatch.country && countryInput !== sugMatch.country) {
        countryInput = sugMatch.country;
        lastValidCountry = sugMatch.country;
      }
      return;
    }
    // Если нет совпадений - откатываем
    stateInput = lastValidState;
    if (!lastValidState) {
      toastManager.warning('Пожалуйста, выберите область/регион из списка автодополнения');
    }
  };

  const handleCountryBlur = () => {
    setTimeout(() => {
      if (!isOverCountryDropdown) {
        validateCountryInput();
        showCountryDropdown = false;
      }
    }, 150);
  };

  const handleStateBlur = () => {
    setTimeout(() => {
      if (!isOverStateDropdown) {
        validateStateInput();
        showStateDropdown = false;
      }
    }, 150);
  };

  // Валидация диапазонов годов на пересечения
  const checkOverlaps = (
    country: string,
    state: string,
    startYear: number | null,
    endYear: number | null,
    excludeIndex: number | null = null
  ): boolean => {
    const s1 = startYear ?? -Infinity;
    const e1 = endYear ?? Infinity;

    for (let i = 0; i < substitutions.length; i++) {
      if (excludeIndex !== null && i === excludeIndex) continue;
      const rule = substitutions[i];

      if (
        rule.country.trim().toLowerCase() === country.trim().toLowerCase() &&
        rule.state.trim().toLowerCase() === state.trim().toLowerCase()
      ) {
        const s2 = rule.startYear ?? -Infinity;
        const e2 = rule.endYear ?? Infinity;

        if (s1 <= e2 && s2 <= e1) {
          return true; // Пересечение!
        }
      }
    }
    return false;
  };

  // Добавление или изменение правила
  const saveRule = () => {
    if (!countryInput.trim()) {
      toastManager.error('Укажите исходную страну');
      return;
    }
    if (!stateInput.trim()) {
      toastManager.error('Укажите область/регион/республику');
      return;
    }
    if (!replacementInput.trim()) {
      toastManager.error('Укажите желаемое значение замены');
      return;
    }

    // Проверка корректности годов
    if (startYearInput !== null && endYearInput !== null && startYearInput > endYearInput) {
      toastManager.error('Год начала не может быть больше года окончания');
      return;
    }

    // Проверка на пересечение диапазонов дат
    if (checkOverlaps(countryInput, stateInput, startYearInput, endYearInput, editingIndex)) {
      toastManager.error('Обнаружено пересечение периодов лет для этой локации с уже существующим правилом');
      return;
    }

    const newRule = {
      country: countryInput.trim(),
      state: stateInput.trim(),
      replacement: replacementInput.trim(),
      startYear: startYearInput || undefined,
      endYear: endYearInput || undefined,
    };

    let updatedRules = [...substitutions];
    if (editingIndex !== null) {
      updatedRules[editingIndex] = newRule;
      editingIndex = null;
      toastManager.info('Правило обновлено в списке');
    } else {
      updatedRules.push(newRule);
      toastManager.info('Правило добавлено в список');
    }

    configToEdit.reverseGeocoding.substitutions = updatedRules;

    // Очистка формы
    countryInput = '';
    stateInput = '';
    replacementInput = '';
    startYearInput = null;
    endYearInput = null;
    lastValidCountry = '';
    lastValidState = '';
    nominatimSuggestions = [];
  };

  // Удаление правила
  const removeRule = (index: number) => {
    configToEdit.reverseGeocoding.substitutions = substitutions.filter((_, i) => i !== index);
    toastManager.info('Правило удалено из списка');
  };

  // Запуск редактирования
  const startEdit = (index: number) => {
    const rule = substitutions[index];
    countryInput = rule.country;
    stateInput = rule.state;
    lastValidCountry = rule.country;
    lastValidState = rule.state;
    replacementInput = rule.replacement;
    startYearInput = rule.startYear ?? null;
    endYearInput = rule.endYear ?? null;
    editingIndex = index;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Отмена редактирования
  const cancelEdit = () => {
    countryInput = '';
    stateInput = '';
    lastValidCountry = '';
    lastValidState = '';
    replacementInput = '';
    startYearInput = null;
    endYearInput = null;
    editingIndex = null;
  };

  // Сохранение всей конфигурации на сервер
  const handleSaveConfig = async () => {
    try {
      await handleSystemConfigSave({
        reverseGeocoding: configToEdit.reverseGeocoding
      });
      // Обновляем локальные списки стран/регионов из БД
      loadDbData();
    } catch (e) {
      console.error(e);
    }
  };

  // Сброс к последней сохраненной конфигурации
  const handleResetConfig = () => {
    configToEdit = systemConfigManager.cloneValue();
    cancelEdit();
    toastManager.info('Изменения сброшены к последним сохраненным');
  };

  // Выбор подсказки из Nominatim
  const selectNominatimSuggestion = (item: { country: string; state: string }, type: 'country' | 'state') => {
    console.log('[Geodata Editor] Выбрана подсказка Nominatim:', item, 'Тип:', type);
    if (type === 'country') {
      countryInput = item.country;
      lastValidCountry = item.country;
    } else {
      stateInput = item.state;
      lastValidState = item.state;
      if (item.country) {
        countryInput = item.country;
        lastValidCountry = item.country;
      }
    }
    showCountryDropdown = false;
    showStateDropdown = false;
    nominatimSuggestions = [];
  };
</script>

<AdminPageLayout breadcrumbs={[{ title: 'Администрирование', href: '/admin' }, { title: 'Редактор геоданных' }]}>
  <div class="p-6 max-w-6xl mx-auto dark:text-zinc-100" in:fade={{ duration: 300 }}>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Редактор геоданных</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Настройка правил подмены стран для комбинаций «Страна + Регион» с привязкой к периодам съемки (годам).
      </p>
    </div>

    <!-- Блок формы добавления / редактирования -->
    <div class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm mb-8 transition-colors">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-zinc-200 mb-4">
        {editingIndex !== null ? 'Редактировать правило подмены' : 'Добавить новое правило подмены'}
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <!-- Поле: Исходная страна (Поиск) -->
        <div class="relative">
          <label class="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Исходная страна <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Введите для поиска страны..."
            bind:value={countryInput}
            onfocus={() => { showCountryDropdown = true; searchNominatim(countryInput, 'country'); }}
            onblur={handleCountryBlur}
            oninput={() => { showCountryDropdown = true; searchNominatim(countryInput, 'country'); }}
            class="w-full text-sm p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />

          {#if showCountryDropdown}
            <div 
              class="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              onmouseenter={() => isOverCountryDropdown = true}
              onmouseleave={() => isOverCountryDropdown = false}
            >
              <!-- Секция БД -->
              <div class="p-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Существующие в БД</span>
              </div>
              {#if filteredCountries.length > 0}
                {#each filteredCountries as c}
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-800 dark:text-zinc-200"
                    onclick={() => { countryInput = c; lastValidCountry = c; showCountryDropdown = false; }}
                  >
                    {c}
                  </button>
                {/each}
              {:else}
                <div class="px-4 py-2 text-xs italic text-gray-400">Нет совпадений в БД</div>
              {/if}

              <!-- Секция Nominatim -->
              <div class="p-2 border-b border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex justify-between items-center">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Поиск на сервере геокодирования</span>
                {#if isNominatimLoading}
                  <span class="text-[10px] text-blue-500 animate-pulse">поиск...</span>
                {/if}
              </div>
              {#if nominatimSuggestions.length > 0}
                {#each nominatimSuggestions as item}
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-700 dark:text-zinc-300"
                    onclick={() => selectNominatimSuggestion(item, 'country')}
                  >
                    <span class="font-semibold text-gray-900 dark:text-white">{item.country}</span>
                  </button>
                {/each}
              {:else if countryInput.length >= 2}
                <div class="px-4 py-2 text-xs italic text-gray-400">Ничего не найдено в Nominatim</div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Поле: Область/Регион (Поиск) -->
        <div class="relative">
          <label class="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Область / Регион / Республика <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Введите для поиска региона..."
            bind:value={stateInput}
            onfocus={() => { showStateDropdown = true; searchNominatim(stateInput, 'state'); }}
            onblur={handleStateBlur}
            oninput={() => { showStateDropdown = true; searchNominatim(stateInput, 'state'); }}
            class="w-full text-sm p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />

          {#if showStateDropdown}
            <div 
              class="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              onmouseenter={() => isOverStateDropdown = true}
              onmouseleave={() => isOverStateDropdown = false}
            >
              <!-- Секция БД -->
              <div class="p-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Существующие в БД</span>
              </div>
              {#if filteredStates.length > 0}
                {#each filteredStates as s}
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-800 dark:text-zinc-200"
                    onclick={() => { stateInput = s; lastValidState = s; showStateDropdown = false; }}
                  >
                    {s}
                  </button>
                {/each}
              {:else}
                <div class="px-4 py-2 text-xs italic text-gray-400">Нет совпадений в БД</div>
              {/if}

              <!-- Секция Nominatim -->
              <div class="p-2 border-b border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex justify-between items-center">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Поиск на сервере геокодирования</span>
                {#if isNominatimLoading}
                  <span class="text-[10px] text-blue-500 animate-pulse">поиск...</span>
                {/if}
              </div>
              {#if nominatimSuggestions.length > 0}
                {#each nominatimSuggestions as item}
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-700 dark:text-zinc-300"
                    onclick={() => selectNominatimSuggestion(item, 'state')}
                  >
                    {#if item.country}
                      {item.country} – <span class="font-semibold text-gray-900 dark:text-white">{item.state}</span>
                    {:else}
                      <span class="font-semibold text-gray-900 dark:text-white">{item.state}</span>
                    {/if}
                  </button>
                {/each}
              {:else if stateInput.length >= 2}
                <div class="px-4 py-2 text-xs italic text-gray-400">Ничего не найдено в Nominatim</div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Ввод замены и дат -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Желаемое значение (Замена) <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Например, Россия"
            bind:value={replacementInput}
            class="w-full text-sm p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            С года съёмки (включительно)
          </label>
          <input
            type="number"
            placeholder="Все года"
            bind:value={startYearInput}
            class="w-full text-sm p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            По год съёмки (включительно)
          </label>
          <input
            type="number"
            placeholder="Все года"
            bind:value={endYearInput}
            class="w-full text-sm p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <!-- Действия формы -->
      <div class="flex justify-end gap-3 border-t border-gray-150 dark:border-zinc-850 pt-4">
        {#if editingIndex !== null}
          <Button variant="secondary" shape="round" onclick={cancelEdit}>Отмена</Button>
        {/if}
        <Button shape="round" onclick={saveRule} disabled={!countryInput || !stateInput || !replacementInput}>
          {editingIndex !== null ? 'Применить изменения' : 'Добавить в список'}
        </Button>
      </div>
    </div>

    <!-- Таблица существующих правил -->
    <div class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-8 transition-colors">
      <div class="p-6 border-b border-gray-200 dark:border-zinc-800">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-zinc-200">Таблица настроенных замен</h2>
      </div>

      {#if substitutions.length > 0}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
            <thead class="bg-gray-50 dark:bg-zinc-950">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Исходная страна</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Область / Регион</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Новая страна (Замена)</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Период лет</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {#each substitutions as rule, idx}
                <tr class="hover:bg-gray-50 dark:hover:bg-zinc-850/30 transition-colors">
                  <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{rule.country}</td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-zinc-300">{rule.state}</td>
                  <td class="px-6 py-4 text-sm font-semibold text-blue-600 dark:text-blue-400">{rule.replacement}</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-zinc-400">
                    {#if rule.startYear && rule.endYear}
                      с {rule.startYear} по {rule.endYear}
                    {:else if rule.startYear}
                      с {rule.startYear}
                    {:else if rule.endYear}
                      до {rule.endYear}
                    {:else}
                      <span class="italic text-gray-400 dark:text-zinc-600">Все года</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-right text-sm font-medium flex justify-end gap-2">
                    <Button size="small" variant="secondary" shape="round" onclick={() => startEdit(idx)}>
                      Редактировать
                    </Button>
                    <Button size="small" variant="ghost" shape="round" onclick={() => removeRule(idx)}>
                      Удалить
                    </Button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="p-8 text-center text-gray-500 dark:text-zinc-500 italic">
          Список правил пуст. Заполните форму выше для создания первого правила.
        </div>
      {/if}
    </div>

    <!-- Кнопки сохранения всей конфигурации -->
    <div class="flex justify-end gap-3 mt-4 border-t border-gray-200 dark:border-zinc-800 pt-6">
      <Button shape="round" color="secondary" onclick={handleResetConfig}>
        Сбросить изменения
      </Button>
      <Button shape="round" onclick={handleSaveConfig}>
        Сохранить настройки
      </Button>
    </div>
  </div>
</AdminPageLayout>
