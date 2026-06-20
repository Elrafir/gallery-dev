<script lang="ts">
  /**
   * @component SavedLocationEditModal
   * Модальное окно для создания и редактирования сохранённых мест (избранных локаций).
   * Позволяет задать имя, подпись, описание, выбрать иконку и указать координаты.
   * 
   * @property {Function} onClose - Функция закрытия модального окна.
   * @property {Function} onSubmit - Функция сохранения данных (принимает name, label, description, latitude, longitude, icon).
   * @property {SavedLocationResponseDto} [initialData] - Исходные данные при редактировании (опционально).
   * @property {number} [latitude] - Предустановленная широта.
   * @property {number} [longitude] - Предустановленная долгота.
   * @property {string} [defaultName] - Имя по умолчанию (если нет initialData).
   */
  import type { SavedLocationResponseDto } from '@immich/sdk';
  import { reverseGeocode } from '@immich/sdk';
  import { Field, FormModal, Input, Text, modalManager, Icon } from '@immich/ui';
  import GeolocationPointPickerModal from '$lib/modals/GeolocationPointPickerModal.svelte';
  import {
    mdiMapMarker,
    mdiHome,
    mdiBriefcase,
    mdiSchool,
    mdiFoodForkDrink,
    mdiCar,
    mdiUmbrellaBeach,
    mdiBank,
    mdiAccount,
    mdiStar,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
    onSubmit: (values: {
      name: string;
      label: string;
      description: string | null;
      latitude: number;
      longitude: number;
      radius: number;
      icon: string | null;
    }) => Promise<void>;
    initialData?: SavedLocationResponseDto;
    latitude?: number;
    longitude?: number;
    defaultName?: string;
  };

  const { onClose, onSubmit, initialData, latitude, longitude, defaultName }: Props = $props();

  let label = $state(initialData?.label ?? '');
  let description = $state(initialData?.description ?? '');
  let name = $state(initialData?.name ?? defaultName ?? '');
  let lat = $state(initialData?.latitude ?? latitude ?? 0);
  let lng = $state(initialData?.longitude ?? longitude ?? 0);
  let icon = $state(initialData?.icon ?? 'star');
  let radius = $state(initialData?.radius ?? 50);

  let isSubmitting = $state(false);

  const iconMap: Record<string, string> = {
    star: mdiStar,
    home: mdiHome,
    work: mdiBriefcase,
    school: mdiSchool,
    food: mdiFoodForkDrink,
    car: mdiCar,
    beach: mdiUmbrellaBeach,
    culture: mdiBank,
    person: mdiAccount,
  };

  const getIconTitle = (key: string) => {
    switch (key) {
      case 'star': return $t('icon_star');
      case 'home': return $t('icon_home');
      case 'work': return $t('icon_work');
      case 'school': return $t('icon_school');
      case 'food': return $t('icon_food');
      case 'car': return $t('icon_car');
      case 'beach': return $t('icon_beach');
      case 'culture': return $t('icon_culture');
      case 'person': return $t('icon_person');
      default: return '';
    }
  };

  const handlePickCoordinates = async () => {
    const point = await modalManager.show(GeolocationPointPickerModal, {
      point: { lat, lng },
    });
    if (!point) {
      return;
    }
    lat = point.lat;
    lng = point.lng;

    // Geocode new coordinates to update default name
    try {
      const res = await reverseGeocode({ lat: point.lat, lon: point.lng });
      if (res && res.length > 0) {
        const parts = [res[0].city, res[0].state].filter(Boolean);
        name = parts.join(', ');
      }
    } catch {
      // ignore
    }
  };

  const handleFormSubmit = async () => {
    isSubmitting = true;
    try {
      await onSubmit({
        name,
        label,
        description: description.trim() || null,
        latitude: lat,
        longitude: lng,
        radius,
        icon,
      });
      onClose();
    } catch {
      // Errors are handled by caller / toasts
    } finally {
      isSubmitting = false;
    }
  };
</script>

<FormModal
  size="small"
  title={initialData ? $t('edit') : $t('create')}
  submitText={initialData ? $t('save') : $t('create')}
  icon={mdiMapMarker}
  {onClose}
  onSubmit={handleFormSubmit}
  disabled={isSubmitting}
>
  <Field label={$t('name')} required>
    <Input bind:value={name} placeholder={$t('name')} />
  </Field>

  <Field label={$t('saved_location_label')} required>
    <Input autofocus bind:value={label} placeholder={$t('saved_location_label_placeholder')} />
  </Field>

  <Field label={$t('saved_location_description')}>
    <Input bind:value={description} placeholder={$t('saved_location_description_placeholder')} />
  </Field>

  <Field label={$t('saved_location_icon')}>
    <div class="flex flex-wrap gap-2 pt-1 pb-2">
      {#each Object.keys(iconMap) as key}
        <button
          type="button"
          onclick={() => (icon = key)}
          class="p-2 rounded-full border transition-all hover:scale-110 active:scale-95 {icon === key ? 'border-primary bg-primary/10 text-primary dark:border-primary-light dark:bg-primary-light/10 dark:text-primary-light' : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}"
          title={getIconTitle(key)}
        >
          <Icon icon={iconMap[key]} size="20" />
        </button>
      {/each}
    </div>
  </Field>

  <Field label={$t('saved_location_radius')}>
    <div class="flex items-center gap-3 pt-1 pb-2">
      <input
        type="range"
        min="10"
        max="5000"
        step="10"
        bind:value={radius}
        class="flex-grow accent-primary h-2 rounded-full cursor-pointer"
      />
      <div class="flex items-center gap-1 shrink-0 min-w-[4.5rem]">
        <input
          type="number"
          min="10"
          max="5000"
          bind:value={radius}
          class="w-16 px-2 py-1 text-sm text-center border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span class="text-xs text-gray-500 dark:text-zinc-400">м</span>
      </div>
    </div>
  </Field>

  <div
    role="button"
    tabindex="0"
    onclick={handlePickCoordinates}
    onkeydown={(e) => e.key === 'Enter' && handlePickCoordinates()}
    class="grid grid-cols-2 gap-4 cursor-pointer group focus:outline-none"
    title={$t('saved_location_click_to_change')}
  >
    <Field label={$t('latitude')}>
      <Input
        type="number"
        value={String(lat)}
        readonly
        class="bg-gray-100 group-hover:bg-gray-200/80 dark:bg-zinc-800 dark:group-hover:bg-zinc-700/60 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 cursor-pointer transition-colors"
      />
    </Field>
    <Field label={$t('longitude')}>
      <Input
        type="number"
        value={String(lng)}
        readonly
        class="bg-gray-100 group-hover:bg-gray-200/80 dark:bg-zinc-800 dark:group-hover:bg-zinc-700/60 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 cursor-pointer transition-colors"
      />
    </Field>
  </div>
</FormModal>
