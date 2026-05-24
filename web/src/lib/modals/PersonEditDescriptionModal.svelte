<script lang="ts">
  import { handleUpdatePersonDescription } from '$lib/services/person.service';
  import { type PersonResponseDto } from '@immich/sdk';
  import { Button, Field, FormModal, Text, Textarea } from '@immich/ui';
  import { mdiText } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    person?: PersonResponseDto;
    description?: string | null;
    onSave?: (description: string) => Promise<boolean | void>;
    onClose: () => void;
  };

  let { person, description: initialDescription = null, onSave, onClose }: Props = $props();
  let description = $state(person?.description ?? initialDescription ?? '');
  const hasDescription = $derived(Boolean(description.trim()));

  const onSubmit = async () => {
    const submittedDescription = description.trim();
    const success = onSave
      ? await onSave(submittedDescription)
      : person && (await handleUpdatePersonDescription(person, submittedDescription));
    if (success) {
      onClose();
    }
  };
</script>

<FormModal title={$t('edit_person_description')} size="medium" icon={mdiText} {onClose} {onSubmit}>
  <Text size="small">{$t('person_description_modal_hint')}</Text>
  <div class="my-4 flex flex-col gap-2">
    <Field label={$t('description')}>
      <Textarea bind:value={description} grow maxlength={2000} />
    </Field>
    {#if hasDescription}
      <div class="flex justify-end">
        <Button shape="round" color="secondary" size="small" onclick={() => (description = '')}>
          {$t('clear')}
        </Button>
      </div>
    {/if}
  </div>
</FormModal>
