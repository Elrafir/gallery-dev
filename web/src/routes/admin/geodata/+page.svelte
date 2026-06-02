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

  type RuleState = {
    id: string;
    country: string;
    state: string;
    replacementCountry?: string;
    replacementState?: string;
    replacement?: string;
    startYear?: number;
    endYear?: number;
    status: 'unchanged' | 'added' | 'edited' | 'deleted';
    originalValue?: any;
  };

  // Локальный список правил с отслеживанием статусов изменений
  let ruleItems = $state<RuleState[]>([]);

  // Заполнение локального списка при монтировании или сбросе
  const initRuleItems = () => {
    const subs = configToEdit.reverseGeocoding?.substitutions || [];
    ruleItems = subs.map((rule, idx) => ({
      id: `rule-${idx}-${Date.now()}`,
      ...rule,
      status: 'unchanged',
      originalValue: { ...rule }
    }));
  };

  // Состояние формы
  let countryInput = $state('');
  let stateInput = $state('');
  let replacementCountryInput = $state('');
  let replacementStateInput = $state('');
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

  // Автодополнение для поля "Новая страна (Замена)"
  let showReplacementCountryDropdown = $state(false);
  let isOverReplacementCountryDropdown = $state(false);
  let replacementCountryNominatimSuggestions = $state<Array<{ country: string }>>([]);
  let isReplacementCountryNominatimLoading = $state(false);

  // Автодополнение для поля "Новый регион (Замена)"
  let showReplacementStateDropdown = $state(false);
  let isOverReplacementStateDropdown = $state(false);
  let replacementStateNominatimSuggestions = $state<Array<{ country: string; state: string }>>([]);
  let isReplacementStateNominatimLoading = $state(false);

  // Справочная система
  let activeHelpField = $state<string | null>(null);
  let showFullManualModal = $state(false);

  // Состояние модального окна подтверждения перед сохранением
  let showConfirmSaveModal = $state(false);

  // Отчетность о несохраненных изменениях
  let addedCount = $derived(ruleItems.filter(item => item.status === 'added').length);
  let editedCount = $derived(ruleItems.filter(item => item.status === 'edited').length);
  let deletedCount = $derived(ruleItems.filter(item => item.status === 'deleted').length);
  let hasChanges = $derived(addedCount > 0 || editedCount > 0 || deletedCount > 0);

  // Стили для кнопки "Сохранить настройки"
  let hasAddedOrEdited = $derived(addedCount > 0 || editedCount > 0);
  let hasDeleted = $derived(deletedCount > 0);

  let saveBtnStyle = $derived.by(() => {
    if (hasAddedOrEdited && hasDeleted) {
      // background green, border red
      return 'background-color: rgb(22 163 74) !important; border: 2px solid rgb(220 38 38) !important; color: white !important;';
    } else if (hasAddedOrEdited) {
      return 'background-color: rgb(22 163 74) !important; border-color: transparent !important; color: white !important;';
    } else if (hasDeleted) {
      return 'background-color: rgb(220 38 38) !important; border-color: transparent !important; color: white !important;';
    }
    return '';
  });

  const fieldsHelp = {
    country: {
      title: 'Исходная страна',
      short: 'Страна, определенная сервером геокодирования (Nominatim), которую вы хотите заменить. Должна быть выбрана из списка подсказок.',
      detail: 'Используется как исходное условие для поиска фотографий. Поиск ищет точное совпадение (без учета регистра и лишних пробелов). Если Nominatim вернул некорректную страну, укажите её здесь, чтобы применить исправление.'
    },
    state: {
      title: 'Область / Регион / Республика',
      short: 'Регион или область, определенная сервером геокодирования, для которой настраивается правило.',
      detail: 'Является вторым ключевым полем для точечной замены. Если для одной страны правила должны отличаться по регионам, укажите конкретный регион.'
    },
    replacementCountry: {
      title: 'Новая страна (Замена)',
      short: 'Значение страны, которое запишется в метаданные фотографий вместо исходной страны.',
      detail: 'Если оставить это поле пустым, при сохранении автоматически подставится значение из поля «Исходная страна». Вы можете выбрать страну из автодополнения или ввести любой произвольный вариант.'
    },
    replacementState: {
      title: 'Новый регион (Замена)',
      short: 'Значение региона, которое запишется в метаданные фотографий вместо исходного региона.',
      detail: 'Если оставить это поле пустым, при сохранении автоматически подставится значение из поля «Область / Регион / Республика». Допускается ручной ввод любого значения.'
    },
    startYear: {
      title: 'С года съёмки',
      short: 'Год начала действия правила (включительно).',
      detail: 'Если поле пустое, то правило действует «от начала времён» (без ограничения снизу). При совпадении локации система автоматически предложит следующий год на основе существующих интервалов.'
    },
    endYear: {
      title: 'По год съёмки',
      short: 'Год окончания действия правила (включительно).',
      detail: 'Если поле пустое, то подразумевается, что правило действует по сей день и далее. Используется для разделения исторических названий регионов.'
    }
  };

  // Svelte action для закрытия окон при клике вне элемента
  function clickOutside(node: HTMLElement, handler: () => void) {
    const onClick = (event: MouseEvent) => {
      if (node && !node.contains(event.target as Node)) {
        handler();
      }
    };
    document.addEventListener('click', onClick, true);
    return {
      destroy() {
        document.removeEventListener('click', onClick, true);
      }
    };
  }

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
      const countriesRes = await fetch(url, initOpts);
      if (countriesRes.ok) {
        dbCountries = await countriesRes.json();
      }
      
      const statesUrl = `${getBaseUrl()}/map/states`;
      const statesRes = await fetch(statesUrl, initOpts);
      if (statesRes.ok) {
        dbStates = await statesRes.json();
      }
    } catch (e) {
      console.error('[Geodata Editor] Ошибка загрузки данных локаций из БД', e);
    }
  };

  onMount(() => {
    loadDbData();
    initRuleItems();
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
        const res = await fetch(searchUrl, initOpts);
        if (res.ok) {
          const data = await res.json();
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

  // Уникальные подсказки из Nominatim (исключая те, что уже есть в БД секции)
  let uniqueCountryNominatimSuggestions = $derived(
    nominatimSuggestions.filter(item => 
      !filteredCountries.some(c => c.toLowerCase() === item.country.toLowerCase())
    )
  );

  let uniqueStateNominatimSuggestions = $derived(
    nominatimSuggestions.filter(item => 
      !filteredStates.some(s => s.toLowerCase() === item.state.toLowerCase())
    )
  );

  // Автодополнение для Новой страны (Замена)
  let filteredReplacementCountries = $derived(
    dbCountries.filter(c => c.toLowerCase().includes(replacementCountryInput.toLowerCase()))
  );

  let uniqueReplacementCountryNominatimSuggestions = $derived(
    replacementCountryNominatimSuggestions.filter(item => 
      !filteredReplacementCountries.some(c => c.toLowerCase() === item.country.toLowerCase())
    )
  );

  // Автодополнение для Нового региона (Замена)
  let filteredReplacementStates = $derived(
    dbStates.filter(s => s.toLowerCase().includes(replacementStateInput.toLowerCase()))
  );

  let uniqueReplacementStateNominatimSuggestions = $derived(
    replacementStateNominatimSuggestions.filter(item => 
      !filteredReplacementStates.some(s => s.toLowerCase() === item.state.toLowerCase())
    )
  );

  // Автоматическое предложение годов для новых правил при совпадении локации
  $effect(() => {
    if (editingIndex !== null) return;
    const country = countryInput.trim();
    const state = stateInput.trim();
    if (!country || !state) return;

    const matches = ruleItems.filter(
      r => r.status !== 'deleted' &&
           r.country.toLowerCase() === country.toLowerCase() &&
           r.state.toLowerCase() === state.toLowerCase()
    );

    if (matches.length > 0 && startYearInput === null && endYearInput === null) {
      const intervals = matches.map(m => ({
        start: m.startYear ?? -Infinity,
        end: m.endYear ?? Infinity
      })).sort((a, b) => a.start - b.start);

      let maxEnd = -Infinity;
      let hasInfinityEnd = false;
      for (const m of intervals) {
        if (m.end === Infinity) {
          hasInfinityEnd = true;
        } else if (m.end > maxEnd) {
          maxEnd = m.end;
        }
      }

      if (!hasInfinityEnd && maxEnd !== -Infinity) {
        startYearInput = maxEnd + 1;
      } else {
        const infinityInterval = intervals.find(i => i.end === Infinity);
        if (infinityInterval && infinityInterval.start !== -Infinity) {
          const idx = intervals.indexOf(infinityInterval);
          if (idx > 0) {
            const prev = intervals[idx - 1];
            if (prev.end !== Infinity && prev.end < infinityInterval.start - 1) {
              startYearInput = prev.end + 1;
              endYearInput = infinityInterval.start - 1;
              return;
            }
          }
          endYearInput = infinityInterval.start - 1;
        }
      }
    }
  });

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
    const sugMatch = uniqueCountryNominatimSuggestions.find(s => s.country.toLowerCase() === val);
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
    const sugMatch = uniqueStateNominatimSuggestions.find(s => s.state.toLowerCase() === val);
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

  // Поиск страны замены через Nominatim
  let replacementCountrySearchTimeout: NodeJS.Timeout;
  const searchReplacementCountryNominatim = (query: string) => {
    clearTimeout(replacementCountrySearchTimeout);
    if (!query || query.trim().length < 2) {
      replacementCountryNominatimSuggestions = [];
      return;
    }

    replacementCountrySearchTimeout = setTimeout(async () => {
      isReplacementCountryNominatimLoading = true;
      try {
        const initOpts = await getAuthFetchInit();
        const searchUrl = `${getBaseUrl()}/search/places?name=${encodeURIComponent(query)}&featuretype=country`;
        const res = await fetch(searchUrl, initOpts);
        if (res.ok) {
          const data = await res.json();
          const unique = new Set<string>();
          const tempSuggestions: Array<{ country: string }> = [];

          for (const item of data) {
            const country = item.country?.trim() || '';
            if (country && !unique.has(country.toLowerCase())) {
              unique.add(country.toLowerCase());
              tempSuggestions.push({ country });
            }
          }
          replacementCountryNominatimSuggestions = tempSuggestions;
        }
      } catch (e) {
        console.error('Ошибка поиска страны замены в Nominatim', e);
      } finally {
        isReplacementCountryNominatimLoading = false;
      }
    }, 400);
  };

  const handleReplacementCountryBlur = () => {
    setTimeout(() => {
      if (!isOverReplacementCountryDropdown) {
        showReplacementCountryDropdown = false;
      }
    }, 150);
  };

  // Поиск региона замены через Nominatim
  let replacementStateSearchTimeout: NodeJS.Timeout;
  const searchReplacementStateNominatim = (query: string) => {
    clearTimeout(replacementStateSearchTimeout);
    if (!query || query.trim().length < 2) {
      replacementStateNominatimSuggestions = [];
      return;
    }

    replacementStateSearchTimeout = setTimeout(async () => {
      isReplacementStateNominatimLoading = true;
      try {
        const initOpts = await getAuthFetchInit();
        const searchUrl = `${getBaseUrl()}/search/places?name=${encodeURIComponent(query)}&featuretype=state`;
        const res = await fetch(searchUrl, initOpts);
        if (res.ok) {
          const data = await res.json();
          const unique = new Set<string>();
          const tempSuggestions: Array<{ country: string; state: string }> = [];

          for (const item of data) {
            const country = item.country?.trim() || '';
            const state = item.admin1name?.trim() || '';
            if (state) {
              const key = `${country.toLowerCase()}|${state.toLowerCase()}`;
              if (!unique.has(key)) {
                unique.add(key);
                tempSuggestions.push({ country, state });
              }
            }
          }
          replacementStateNominatimSuggestions = tempSuggestions;
        }
      } catch (e) {
        console.error('Ошибка поиска региона замены в Nominatim', e);
      } finally {
        isReplacementStateNominatimLoading = false;
      }
    }, 400);
  };

  const handleReplacementStateBlur = () => {
    setTimeout(() => {
      if (!isOverReplacementStateDropdown) {
        showReplacementStateDropdown = false;
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

    for (let i = 0; i < ruleItems.length; i++) {
      if (ruleItems[i].status === 'deleted') continue;
      if (excludeIndex !== null && i === excludeIndex) continue;
      const rule = ruleItems[i];

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

    // Если одно из полей пользователь не заполнил то автоматически подставляется значение из поля поиска
    const finalReplacementCountry = replacementCountryInput.trim() || countryInput.trim();
    const finalReplacementState = replacementStateInput.trim() || stateInput.trim();

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

    if (editingIndex !== null) {
      // Редактирование
      const item = ruleItems[editingIndex];
      item.country = countryInput.trim();
      item.state = stateInput.trim();
      item.replacementCountry = finalReplacementCountry;
      item.replacementState = finalReplacementState;
      item.replacement = finalReplacementCountry;
      item.startYear = startYearInput || undefined;
      item.endYear = endYearInput || undefined;

      // Если поле добавлено, но не сохранено и подверглось редактированию то оно остаётся в статусе просто добавленного
      if (item.status !== 'added') {
        item.status = 'edited';
      }
      editingIndex = null;
      toastManager.info('Правило изменено локально');
    } else {
      // Добавление
      ruleItems.push({
        id: `rule-new-${Date.now()}`,
        country: countryInput.trim(),
        state: stateInput.trim(),
        replacementCountry: finalReplacementCountry,
        replacementState: finalReplacementState,
        replacement: finalReplacementCountry,
        startYear: startYearInput || undefined,
        endYear: endYearInput || undefined,
        status: 'added'
      });
      toastManager.info('Правило добавлено локально');
    }

    // Очистка формы
    countryInput = '';
    stateInput = '';
    replacementCountryInput = '';
    replacementStateInput = '';
    startYearInput = null;
    endYearInput = null;
    lastValidCountry = '';
    lastValidState = '';
    nominatimSuggestions = [];
  };

  // Удаление правила
  const removeRule = (index: number) => {
    const item = ruleItems[index];
    if (item.status === 'added') {
      // Если поле было добавлено, но не было ещё сохранено - удаляем без подтверждений
      ruleItems = ruleItems.filter((_, i) => i !== index);
      toastManager.info('Новое правило удалено');
    } else {
      // Иначе помечаем как удаленное (не скрываем до подтверждения/сохранения)
      item.status = 'deleted';
      toastManager.info('Правило помечено на удаление');
    }
  };

  // Запуск редактирования
  const startEdit = (index: number) => {
    const rule = ruleItems[index];
    if (rule.status === 'deleted') {
      toastManager.warning('Нельзя редактировать правило, помеченное на удаление');
      return;
    }
    countryInput = rule.country;
    stateInput = rule.state;
    lastValidCountry = rule.country;
    lastValidState = rule.state;
    replacementCountryInput = rule.replacementCountry ?? rule.replacement ?? '';
    replacementStateInput = rule.replacementState ?? '';
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
    replacementCountryInput = '';
    replacementStateInput = '';
    startYearInput = null;
    endYearInput = null;
    editingIndex = null;
  };

  // Удаление конкретного изменения из списка изменений в модальном окне
  const revertChange = (id: string) => {
    const index = ruleItems.findIndex(item => item.id === id);
    if (index === -1) return;
    const item = ruleItems[index];

    if (item.status === 'added') {
      // Удаляем новое правило из списка
      ruleItems = ruleItems.filter(item => item.id !== id);
    } else if (item.status === 'edited' || item.status === 'deleted') {
      // Возвращаем к исходному сохраненному значению
      ruleItems[index] = {
        ...item.originalValue,
        id: item.id,
        status: 'unchanged',
        originalValue: item.originalValue
      };
    }

    // Если изменений больше нет, закрываем модальное окно
    if (!hasChanges) {
      showConfirmSaveModal = false;
    }
  };

  // Сохранение всей конфигурации на сервер
  const handleSaveConfig = async () => {
    // Формируем список правил, отсекая помеченные на удаление
    const finalSubstitutions = ruleItems
      .filter(item => item.status !== 'deleted')
      .map(item => ({
        country: item.country,
        state: item.state,
        replacementCountry: item.replacementCountry,
        replacementState: item.replacementState,
        replacement: item.replacementCountry,
        startYear: item.startYear,
        endYear: item.endYear
      }));

    configToEdit.reverseGeocoding.substitutions = finalSubstitutions;

    try {
      await handleSystemConfigSave({
        reverseGeocoding: configToEdit.reverseGeocoding
      });
      
      // В хинте показываем отчёт о внесенных изменениях
      let msg = 'Изменения успешно сохранены.';
      const parts = [];
      if (addedCount > 0) parts.push(`добавлено: ${addedCount}`);
      if (editedCount > 0) parts.push(`отредактировано: ${editedCount}`);
      if (deletedCount > 0) parts.push(`удалено: ${deletedCount}`);
      if (parts.length > 0) {
        msg += ` (${parts.join(', ')})`;
      }
      toastManager.success(msg);

      // Обновляем локальные списки стран/регионов из БД
      loadDbData();
      initRuleItems();
      showConfirmSaveModal = false;
    } catch (e) {
      console.error(e);
    }
  };

  // Сброс к последней сохраненной конфигурации
  const handleResetConfig = () => {
    configToEdit = systemConfigManager.cloneValue();
    initRuleItems();
    cancelEdit();
    toastManager.info('Изменения сброшены к последним сохраненным');
  };

  // Выбор подсказки из Nominatim
  const selectNominatimSuggestion = (item: { country: string; state: string }, type: 'country' | 'state') => {
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
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Редактор геоданных</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Настройка правил подмены стран и регионов для комбинаций «Страна + Регион» с привязкой к периодам съемки.
        </p>
      </div>
      <button 
        type="button" 
        class="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors flex items-center gap-1.5"
        onclick={() => showFullManualModal = true}
      >
        📖 Полное руководство
      </button>
    </div>

    <!-- Блок формы добавления / редактирования -->
    <div class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm mb-8 transition-colors">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-zinc-200 mb-4">
        {editingIndex !== null ? 'Редактировать правило подмены' : 'Добавить новое правило подмены'}
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <!-- Поле: Исходная страна (Поиск) -->
        <div class="relative">
          <div class="flex items-center gap-1.5 mb-2">
            <label class="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Исходная страна <span class="text-red-500">*</span>
            </label>
            <div class="relative inline-block leading-none">
              <button
                type="button"
                class="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none group"
                onclick={(e) => { e.stopPropagation(); activeHelpField = activeHelpField === 'country' ? null : 'country'; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 text-white text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 font-normal">
                  Исходная страна и Нажмите для инструкции
                </div>
              </button>

              {#if activeHelpField === 'country'}
                <div 
                  class="absolute left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl p-4 z-45 text-left font-normal"
                  use:clickOutside={() => activeHelpField = null}
                >
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span class="p-1 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded">💡</span>
                      {fieldsHelp.country.title}
                    </h4>
                    <button
                      type="button"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onclick={(e) => { e.stopPropagation(); activeHelpField = null; }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                    {fieldsHelp.country.short}
                  </p>
                  <div class="p-2.5 bg-gray-50 dark:bg-zinc-950 rounded-lg text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3 border border-gray-100 dark:border-zinc-850">
                    {fieldsHelp.country.detail}
                  </div>
                  <button
                    type="button"
                    class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    onclick={() => { showFullManualModal = true; activeHelpField = null; }}
                  >
                    Читать полную инструкцию ↗
                  </button>
                </div>
              {/if}
            </div>
          </div>
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

              <div class="p-2 border-b border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex justify-between items-center">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Поиск на сервере геокодирования</span>
                {#if isNominatimLoading}
                  <span class="text-[10px] text-blue-500 animate-pulse">поиск...</span>
                {/if}
              </div>
              {#if uniqueCountryNominatimSuggestions.length > 0}
                {#each uniqueCountryNominatimSuggestions as item}
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-700 dark:text-zinc-300"
                    onclick={() => selectNominatimSuggestion(item, 'country')}
                  >
                    <span class="font-semibold text-gray-900 dark:text-white">{item.country}</span>
                  </button>
                {/each}
              {:else if countryInput.length >= 2 && !isNominatimLoading}
                <div class="px-4 py-2 text-xs italic text-gray-400">Ничего не найдено в Nominatim</div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Поле: Область/Регион (Поиск) -->
        <div class="relative">
          <div class="flex items-center gap-1.5 mb-2">
            <label class="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Область / Регион / Республика <span class="text-red-500">*</span>
            </label>
            <div class="relative inline-block leading-none">
              <button
                type="button"
                class="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none group"
                onclick={(e) => { e.stopPropagation(); activeHelpField = activeHelpField === 'state' ? null : 'state'; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 text-white text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 font-normal">
                  Область / Регион / Республика и Нажмите для инструкции
                </div>
              </button>

              {#if activeHelpField === 'state'}
                <div 
                  class="absolute left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl p-4 z-45 text-left font-normal"
                  use:clickOutside={() => activeHelpField = null}
                >
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span class="p-1 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded">💡</span>
                      {fieldsHelp.state.title}
                    </h4>
                    <button
                      type="button"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onclick={(e) => { e.stopPropagation(); activeHelpField = null; }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                    {fieldsHelp.state.short}
                  </p>
                  <div class="p-2.5 bg-gray-50 dark:bg-zinc-950 rounded-lg text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3 border border-gray-100 dark:border-zinc-850">
                    {fieldsHelp.state.detail}
                  </div>
                  <button
                    type="button"
                    class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    onclick={() => { showFullManualModal = true; activeHelpField = null; }}
                  >
                    Читать полную инструкцию ↗
                  </button>
                </div>
              {/if}
            </div>
          </div>
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

              <div class="p-2 border-b border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex justify-between items-center">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Поиск на сервере геокодирования</span>
                {#if isNominatimLoading}
                  <span class="text-[10px] text-blue-500 animate-pulse">поиск...</span>
                {/if}
              </div>
              {#if uniqueStateNominatimSuggestions.length > 0}
                {#each uniqueStateNominatimSuggestions as item}
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
              {:else if stateInput.length >= 2 && !isNominatimLoading}
                <div class="px-4 py-2 text-xs italic text-gray-400">Ничего не найдено в Nominatim</div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Ввод замены и дат -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <!-- Поле: Новая страна (Замена) -->
        <div class="relative">
          <div class="flex items-center gap-1.5 mb-2">
            <label class="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Новая страна (Замена)
            </label>
            <div class="relative inline-block leading-none">
              <button
                type="button"
                class="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none group"
                onclick={(e) => { e.stopPropagation(); activeHelpField = activeHelpField === 'replacementCountry' ? null : 'replacementCountry'; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 text-white text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 font-normal">
                  Новая страна (Замена) и Нажмите для инструкции
                </div>
              </button>

              {#if activeHelpField === 'replacementCountry'}
                <div 
                  class="absolute left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl p-4 z-45 text-left font-normal"
                  use:clickOutside={() => activeHelpField = null}
                >
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span class="p-1 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded">💡</span>
                      {fieldsHelp.replacementCountry.title}
                    </h4>
                    <button
                      type="button"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onclick={(e) => { e.stopPropagation(); activeHelpField = null; }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                    {fieldsHelp.replacementCountry.short}
                  </p>
                  <div class="p-2.5 bg-gray-50 dark:bg-zinc-950 rounded-lg text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3 border border-gray-100 dark:border-zinc-850">
                    {fieldsHelp.replacementCountry.detail}
                  </div>
                  <button
                    type="button"
                    class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    onclick={() => { showFullManualModal = true; activeHelpField = null; }}
                  >
                    Читать полную инструкцию ↗
                  </button>
                </div>
              {/if}
            </div>
          </div>
          <input
            type="text"
            placeholder="Оставьте пустым для сохранения исходной страны"
            bind:value={replacementCountryInput}
            onfocus={() => { showReplacementCountryDropdown = true; searchReplacementCountryNominatim(replacementCountryInput); }}
            onblur={handleReplacementCountryBlur}
            oninput={() => { showReplacementCountryDropdown = true; searchReplacementCountryNominatim(replacementCountryInput); }}
            class="w-full text-sm p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />

          {#if showReplacementCountryDropdown}
            <div 
              class="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              onmouseenter={() => isOverReplacementCountryDropdown = true}
              onmouseleave={() => isOverReplacementCountryDropdown = false}
            >
              <div class="p-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Существующие в БД</span>
              </div>
              {#if filteredReplacementCountries.length > 0}
                {#each filteredReplacementCountries as c}
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-800 dark:text-zinc-200"
                    onclick={() => { replacementCountryInput = c; showReplacementCountryDropdown = false; }}
                  >
                    {c}
                  </button>
                {/each}
              {:else}
                <div class="px-4 py-2 text-xs italic text-gray-400">Нет совпадений в БД</div>
              {/if}

              <div class="p-2 border-b border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex justify-between items-center">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Поиск на сервере геокодирования</span>
                {#if isReplacementCountryNominatimLoading}
                  <span class="text-[10px] text-blue-500 animate-pulse">поиск...</span>
                {/if}
              </div>
              {#if uniqueReplacementCountryNominatimSuggestions.length > 0}
                {#each uniqueReplacementCountryNominatimSuggestions as item}
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-700 dark:text-zinc-300"
                    onclick={() => { replacementCountryInput = item.country; showReplacementCountryDropdown = false; }}
                  >
                    <span class="font-semibold text-gray-900 dark:text-white">{item.country}</span>
                  </button>
                {/each}
              {:else if replacementCountryInput.length >= 2 && !isReplacementCountryNominatimLoading}
                <div class="px-4 py-2 text-xs italic text-gray-400">Ничего не найдено в Nominatim</div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Поле: Новый регион (Замена) -->
        <div class="relative">
          <div class="flex items-center gap-1.5 mb-2">
            <label class="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Новый регион (Замена)
            </label>
            <div class="relative inline-block leading-none">
              <button
                type="button"
                class="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none group"
                onclick={(e) => { e.stopPropagation(); activeHelpField = activeHelpField === 'replacementState' ? null : 'replacementState'; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 text-white text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 font-normal">
                  Новый регион (Замена) и Нажмите для инструкции
                </div>
              </button>

              {#if activeHelpField === 'replacementState'}
                <div 
                  class="absolute left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl p-4 z-45 text-left font-normal"
                  use:clickOutside={() => activeHelpField = null}
                >
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span class="p-1 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded">💡</span>
                      {fieldsHelp.replacementState.title}
                    </h4>
                    <button
                      type="button"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onclick={(e) => { e.stopPropagation(); activeHelpField = null; }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                    {fieldsHelp.replacementState.short}
                  </p>
                  <div class="p-2.5 bg-gray-50 dark:bg-zinc-950 rounded-lg text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3 border border-gray-100 dark:border-zinc-850">
                    {fieldsHelp.replacementState.detail}
                  </div>
                  <button
                    type="button"
                    class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    onclick={() => { showFullManualModal = true; activeHelpField = null; }}
                  >
                    Читать полную инструкцию ↗
                  </button>
                </div>
              {/if}
            </div>
          </div>
          <input
            type="text"
            placeholder="Оставьте пустым для сохранения исходного региона"
            bind:value={replacementStateInput}
            onfocus={() => { showReplacementStateDropdown = true; searchReplacementStateNominatim(replacementStateInput); }}
            onblur={handleReplacementStateBlur}
            oninput={() => { showReplacementStateDropdown = true; searchReplacementStateNominatim(replacementStateInput); }}
            class="w-full text-sm p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />

          {#if showReplacementStateDropdown}
            <div 
              class="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              onmouseenter={() => isOverReplacementStateDropdown = true}
              onmouseleave={() => isOverReplacementStateDropdown = false}
            >
              <div class="p-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Существующие в БД</span>
              </div>
              {#if filteredReplacementStates.length > 0}
                {#each filteredReplacementStates as s}
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-800 dark:text-zinc-200"
                    onclick={() => { replacementStateInput = s; showReplacementStateDropdown = false; }}
                  >
                    {s}
                  </button>
                {/each}
              {:else}
                <div class="px-4 py-2 text-xs italic text-gray-400">Нет совпадений в БД</div>
              {/if}

              <div class="p-2 border-b border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex justify-between items-center">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Поиск на сервере геокодирования</span>
                {#if isReplacementStateNominatimLoading}
                  <span class="text-[10px] text-blue-500 animate-pulse">поиск...</span>
                {/if}
              </div>
              {#if uniqueReplacementStateNominatimSuggestions.length > 0}
                {#each uniqueReplacementStateNominatimSuggestions as item}
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-700 dark:text-zinc-300"
                    onclick={() => { replacementStateInput = item.state; showReplacementStateDropdown = false; }}
                  >
                    {#if item.country}
                      {item.country} – <span class="font-semibold text-gray-900 dark:text-white">{item.state}</span>
                    {:else}
                      <span class="font-semibold text-gray-900 dark:text-white">{item.state}</span>
                    {/if}
                  </button>
                {/each}
              {:else if replacementStateInput.length >= 2 && !isReplacementStateNominatimLoading}
                <div class="px-4 py-2 text-xs italic text-gray-400">Ничего не найдено в Nominatim</div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <!-- Поле: С года съёмки -->
        <div class="relative">
          <div class="flex items-center gap-1.5 mb-2">
            <label class="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              С года съёмки (включительно)
            </label>
            <div class="relative inline-block leading-none">
              <button
                type="button"
                class="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none group"
                onclick={(e) => { e.stopPropagation(); activeHelpField = activeHelpField === 'startYear' ? null : 'startYear'; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 text-white text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 font-normal">
                  С года съёмки и Нажмите для инструкции
                </div>
              </button>

              {#if activeHelpField === 'startYear'}
                <div 
                  class="absolute left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl p-4 z-45 text-left font-normal"
                  use:clickOutside={() => activeHelpField = null}
                >
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span class="p-1 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded">💡</span>
                      {fieldsHelp.startYear.title}
                    </h4>
                    <button
                      type="button"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onclick={(e) => { e.stopPropagation(); activeHelpField = null; }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                    {fieldsHelp.startYear.short}
                  </p>
                  <div class="p-2.5 bg-gray-50 dark:bg-zinc-950 rounded-lg text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3 border border-gray-100 dark:border-zinc-850">
                    {fieldsHelp.startYear.detail}
                  </div>
                  <button
                    type="button"
                    class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    onclick={() => { showFullManualModal = true; activeHelpField = null; }}
                  >
                    Читать полную инструкцию ↗
                  </button>
                </div>
              {/if}
            </div>
          </div>
          <input
            type="number"
            placeholder="Все года"
            bind:value={startYearInput}
            class="w-full text-sm p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <!-- Поле: По год съёмки -->
        <div class="relative">
          <div class="flex items-center gap-1.5 mb-2">
            <label class="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              По год съёмки (включительно)
            </label>
            <div class="relative inline-block leading-none">
              <button
                type="button"
                class="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none group"
                onclick={(e) => { e.stopPropagation(); activeHelpField = activeHelpField === 'endYear' ? null : 'endYear'; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 text-white text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 font-normal">
                  По год съёмки и Нажмите для инструкции
                </div>
              </button>

              {#if activeHelpField === 'endYear'}
                <div 
                  class="absolute left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl p-4 z-45 text-left font-normal"
                  use:clickOutside={() => activeHelpField = null}
                >
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span class="p-1 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded">💡</span>
                      {fieldsHelp.endYear.title}
                    </h4>
                    <button
                      type="button"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onclick={(e) => { e.stopPropagation(); activeHelpField = null; }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                    {fieldsHelp.endYear.short}
                  </p>
                  <div class="p-2.5 bg-gray-50 dark:bg-zinc-950 rounded-lg text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3 border border-gray-100 dark:border-zinc-850">
                    {fieldsHelp.endYear.detail}
                  </div>
                  <button
                    type="button"
                    class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    onclick={() => { showFullManualModal = true; activeHelpField = null; }}
                  >
                    Читать полную инструкцию ↗
                  </button>
                </div>
              {/if}
            </div>
          </div>
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
        <Button shape="round" onclick={saveRule} disabled={!countryInput || !stateInput}>
          {editingIndex !== null ? 'Применить изменения' : 'Добавить в список'}
        </Button>
      </div>
    </div>

    <!-- Таблица существующих правил -->
    <div class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-8 transition-colors">
      <div class="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-zinc-200">Таблица настроенных замен</h2>
          
          {#if hasChanges}
            <div class="text-xs px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700">
              Несохранённых изменений: 
              {#if addedCount > 0}
                <span class="text-green-600 dark:text-green-400 font-bold ml-1.5">добавлено: {addedCount}</span>
              {/if}
              {#if editedCount > 0}
                <span class="text-yellow-600 dark:text-yellow-500 font-bold ml-1.5">отредактировано: {editedCount}</span>
              {/if}
              {#if deletedCount > 0}
                <span class="text-red-600 dark:text-red-400 font-bold ml-1.5">удалено: {deletedCount}</span>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      {#if ruleItems.length > 0}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
            <thead class="bg-gray-50 dark:bg-zinc-950">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Исходная страна</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Область / Регион</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Новая страна (Замена)</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Новый регион (Замена)</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Период лет</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {#each ruleItems as rule, idx}
                <tr 
                  class="hover:bg-gray-50 dark:hover:bg-zinc-850/30 transition-colors"
                  class:bg-green-50={rule.status === 'added'}
                  class:dark:bg-green-950/20={rule.status === 'added'}
                  class:bg-yellow-50={rule.status === 'edited'}
                  class:dark:bg-yellow-950/20={rule.status === 'edited'}
                  class:bg-red-50={rule.status === 'deleted'}
                  class:dark:bg-red-950/20={rule.status === 'deleted'}
                >
                  <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{rule.country}</td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-zinc-300">{rule.state}</td>
                  <td class="px-6 py-4 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {rule.replacementCountry || rule.replacement || rule.country}
                  </td>
                  <td class="px-6 py-4 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {rule.replacementState || rule.state}
                  </td>
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
                    {#if rule.status !== 'deleted'}
                      <Button size="small" variant="secondary" shape="round" onclick={() => startEdit(idx)}>
                        Редактировать
                      </Button>
                      <Button size="small" variant="ghost" shape="round" onclick={() => removeRule(idx)}>
                        Удалить
                      </Button>
                    {:else}
                      <span class="text-xs text-red-500 italic font-semibold flex items-center pr-2">Помечено на удаление</span>
                      <Button size="small" variant="secondary" shape="round" onclick={() => { rule.status = 'unchanged'; toastManager.info('Удаление отменено'); }}>
                        Вернуть
                      </Button>
                    {/if}
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
      
      <!-- Кастомизированная кнопка с динамическими стилями в зависимости от статуса изменений -->
      <button
        type="button"
        class="px-5 py-2.5 text-sm font-semibold rounded-full shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center"
        style={saveBtnStyle || 'background-color: var(--primary); color: white;'}
        onclick={() => {
          if (hasChanges) {
            showConfirmSaveModal = true;
          } else {
            toastManager.warning('Нет изменений для сохранения');
          }
        }}
      >
        Сохранить настройки
      </button>
    </div>
  </div>
</AdminPageLayout>

<!-- Всплывающее окно подтверждения изменений перед отправкой на сервер -->
{#if showConfirmSaveModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" transition:fade={{ duration: 150 }}>
    <div 
      class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden text-left"
      use:clickOutside={() => showConfirmSaveModal = false}
    >
      <div class="p-6 border-b border-gray-150 dark:border-zinc-850 flex justify-between items-center bg-gray-50 dark:bg-zinc-950">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          📝 Проверка вносимых изменений
        </h3>
        <button 
          type="button" 
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-150 dark:hover:bg-zinc-850"
          onclick={() => showConfirmSaveModal = false}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <div class="p-6 overflow-y-auto space-y-4 max-h-[50vh]">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
          <thead class="bg-gray-50 dark:bg-zinc-950">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">Действие</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">Локация</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">Новые значения</th>
              <th class="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase w-16">Отмена</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
            {#each ruleItems.filter(item => item.status !== 'unchanged') as item}
              <tr class="hover:bg-gray-50 dark:hover:bg-zinc-850/30">
                <td class="px-4 py-3 text-xs font-semibold">
                  {#if item.status === 'added'}
                    <span class="px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 rounded">Добавление</span>
                  {:else if item.status === 'edited'}
                    <span class="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 rounded">Изменение</span>
                  {:else if item.status === 'deleted'}
                    <span class="px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 rounded">Удаление</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-xs font-medium text-gray-900 dark:text-white">
                  {item.country} – {item.state}
                </td>
                <td class="px-4 py-3 text-xs text-gray-600 dark:text-zinc-300">
                  {#if item.status !== 'deleted'}
                    <div>Страна: <span class="font-bold text-blue-600 dark:text-blue-400">{item.replacementCountry || item.country}</span></div>
                    <div>Регион: <span class="font-bold text-blue-600 dark:text-blue-400">{item.replacementState || item.state}</span></div>
                  {:else}
                    <span class="italic text-gray-400">Правило будет удалено</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-center">
                  <button 
                    type="button" 
                    class="text-gray-400 hover:text-red-500 transition-colors p-1"
                    onclick={() => revertChange(item.id)}
                    title="Убрать из списка изменений"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="p-4 border-t border-gray-150 dark:border-zinc-850 bg-gray-50 dark:bg-zinc-950 flex justify-end gap-3">
        <Button variant="secondary" shape="round" onclick={() => showConfirmSaveModal = false}>
          Продолжить редактирование
        </Button>
        <button 
          type="button" 
          class="px-5 py-2 text-sm font-semibold rounded-full text-white bg-green-600 hover:bg-green-700 transition-colors shadow"
          onclick={handleSaveConfig}
        >
          Сохранить
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showFullManualModal}
  <!-- Модальное окно полной инструкции -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" transition:fade={{ duration: 150 }}>
    <div 
      class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left"
      use:clickOutside={() => showFullManualModal = false}
    >
      <!-- Шапка -->
      <div class="p-6 border-b border-gray-150 dark:border-zinc-850 flex justify-between items-center bg-gray-50 dark:bg-zinc-950">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          📖 Руководство пользователя: Редактор геоданных
        </h3>
        <button 
          type="button" 
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-150 dark:hover:bg-zinc-850"
          onclick={() => showFullManualModal = false}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Содержимое -->
      <div class="p-6 overflow-y-auto space-y-5 text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
        <section>
          <h4 class="font-bold text-gray-900 dark:text-white text-base mb-1.5">1. Общая концепция</h4>
          <p>
            Редактор геоданных предназначен для исправления некорректных или неточных метаданных стран и регионов на ваших фотографиях. Когда вы загружаете фотографии с GPS-координатами, система обращается к серверу геокодирования (Nominatim) для определения текстового адреса (страна, область, регион). Иногда Nominatim возвращает устаревшие, некорректные или дублирующиеся названия. Настоящий инструмент решает эту проблему путем настройки правил автоматической подмены.
          </p>
        </section>

        <section>
          <h4 class="font-bold text-gray-900 dark:text-white text-base mb-1.5">2. Как работает подмена</h4>
          <p>
            Каждое правило состоит из двух частей:
          </p>
          <ul class="list-disc pl-5 mt-1 space-y-1">
            <li><strong>Условие поиска:</strong> точное совпадение пары «Исходная страна» и «Область / Регион» из исходных метаданных фотографии.</li>
            <li><strong>Подставляемые значения:</strong> «Новая страна (Замена)» и/или «Новый регион (Замена)».</li>
          </ul>
        </section>

        <section class="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <h4 class="font-bold text-blue-900 dark:text-blue-400 text-sm mb-1">💡 Умное автозаполнение при пустых полях замены:</h4>
          <p class="text-xs text-blue-800 dark:text-blue-300">
            Если вы хотите изменить <strong>только регион</strong>, оставьте поле «Новая страна (Замена)» пустым. Система автоматически скопирует оригинальную страну из поля поиска. Аналогично, если вы хотите изменить <strong>только страну</strong>, оставьте поле региона замены пустым.
          </p>
        </section>

        <section>
          <h4 class="font-bold text-gray-900 dark:text-white text-base mb-1.5">3. Временные диапазоны и стыковка годов</h4>
          <p>
            Вы можете ограничить период действия правила с помощью полей «С года» и «По год»:
          </p>
          <ul class="list-disc pl-5 mt-1 space-y-1">
            <li>Если поле <strong>«По год» пустое</strong>, правило действует по сей день и дальше.</li>
            <li>Если поле <strong>«С года» пустое</strong>, то правило действует с начала времен.</li>
            <li><strong>Защита от пересечений:</strong> Система не позволит сохранить два правила для одной и той же локации, если их временные периоды пересекаются.</li>
            <li><strong>Автоматический расчёт:</strong> Если для локации уже настроены правила, при вводе этой же локации в форму, поля годов автоматически заполнят свободные интервалы на стыке существующих правил.</li>
          </ul>
        </section>

        <section>
          <h4 class="font-bold text-gray-900 dark:text-white text-base mb-1.5">4. Пошаговая инструкция по созданию правила</h4>
          <ol class="list-decimal pl-5 mt-1 space-y-1">
            <li>Начните вводить название страны и региона в поля поиска и <strong>обязательно</strong> выберите значения из выпадающего списка (БД или Nominatim).</li>
            <li>Введите желаемые новые значения в поля замены. Если замена для какого-то поля не требуется, оставьте его пустым.</li>
            <li>При необходимости настройте года съёмки для ограничения периода действия.</li>
            <li>Нажмите <strong>«Добавить в список»</strong>. Правило появится в таблице ниже.</li>
            <li>После настройки всех нужных правил нажмите кнопку <strong>«Сохранить настройки»</strong> в самом низу страницы, чтобы применить их ко всей вашей галерее.</li>
          </ol>
        </section>
      </div>

      <!-- Подвал -->
      <div class="p-4 border-t border-gray-150 dark:border-zinc-850 bg-gray-50 dark:bg-zinc-950 flex justify-end">
        <Button shape="round" onclick={() => showFullManualModal = false}>Понятно</Button>
      </div>
    </div>
  </div>
{/if}
