<script lang="ts">
  import { handleUpdatePersonType } from '$lib/services/person.service';
  import { type PersonResponseDto } from '@immich/sdk';
  import { Field, FormModal, Input, Text } from '@immich/ui';
  import { mdiPaw } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    onClose: () => void;
  };

  let { person, onClose }: Props = $props();

  let personType = $state<'person' | 'pet'>(person.type === 'pet' ? 'pet' : 'person');
  let species = $state(person.species ?? '');

  const onSubmit = async () => {
    const success = await handleUpdatePersonType(
      person,
      personType,
      personType === 'pet' ? species.trim() || null : null,
    );
    if (success) {
      onClose();
    }
  };
</script>

<FormModal title={$t('edit_person_type')} size="small" icon={mdiPaw} {onClose} {onSubmit}>
  <Text size="small">{$t('person_type_modal_hint')}</Text>
  <div class="my-4 flex flex-col gap-4">
    <Field label={$t('person_type')}>
      <select
        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        bind:value={personType}
      >
        <option value="person">{$t('person_type_person')}</option>
        <option value="pet">{$t('person_type_pet')}</option>
      </select>
    </Field>
    {#if personType === 'pet'}
      <Field label={$t('pet_species')} description={$t('pet_species_hint')}>
        <Input bind:value={species} placeholder={$t('pet_species_placeholder')} />
      </Field>
    {/if}
  </div>
</FormModal>
