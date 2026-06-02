<script lang="ts">
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
  let icon = $state(initialData?.icon ?? 'person');

  let isSubmitting = $state(false);

  const iconMap: Record<string, string> = {
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
      case 'home': return 'Дом';
      case 'work': return 'Работа';
      case 'school': return 'Учебное заведение';
      case 'food': return 'Место где поесть';
      case 'car': return 'Машина';
      case 'beach': return 'Пляж';
      case 'culture': return 'Культурное место';
      case 'person': return 'Человечек';
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
        const parts = [res[0].city, res[0].state, res[0].country].filter(Boolean);
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

  <Field label="Подпись (Краткое название)" required>
    <Input autofocus bind:value={label} placeholder="Например: Дом, Дача, Работа" />
  </Field>

  <Field label="Описание">
    <Input bind:value={description} placeholder="Опциональное описание или адрес" />
  </Field>

  <Field label="Иконка места">
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

  <div
    role="button"
    tabindex="0"
    onclick={handlePickCoordinates}
    onkeydown={(e) => e.key === 'Enter' && handlePickCoordinates()}
    class="grid grid-cols-2 gap-4 cursor-pointer group focus:outline-none"
    title="Нажмите, чтобы изменить координаты на карте"
  >
    <Field label={$t('latitude')}>
      <Input
        type="number"
        value={lat}
        readonly
        class="bg-gray-100 group-hover:bg-gray-200/80 dark:bg-zinc-800 dark:group-hover:bg-zinc-700/60 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 cursor-pointer transition-colors"
      />
    </Field>
    <Field label={$t('longitude')}>
      <Input
        type="number"
        value={lng}
        readonly
        class="bg-gray-100 group-hover:bg-gray-200/80 dark:bg-zinc-800 dark:group-hover:bg-zinc-700/60 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 cursor-pointer transition-colors"
      />
    </Field>
  </div>
</FormModal>
