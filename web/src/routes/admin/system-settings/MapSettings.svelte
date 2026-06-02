<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { Link, Button } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());


  const handleBeforeSave = async () => {
    if (configToEdit.reverseGeocoding.geocoderUrl !== config.reverseGeocoding.geocoderUrl) {
      const confirm1 = confirm("Вы действительно хотите изменить URL-адрес сервера геокодирования? Изменение этого адреса может привести к нарушению работоспособности геокодирования и поиска мест.");
      if (!confirm1) return false;
      const confirm2 = confirm("Подтвердите еще раз: вы точно уверены? Функционал поиска по местам и определения локаций может пострадать.");
      if (!confirm2) return false;
    }
    return true;
  };
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="flex flex-col gap-4">
        <SettingAccordion key="map" title={$t('admin.map_settings')} subtitle={$t('admin.map_settings_description')}>
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.map_enable_description')}
              subtitle={$t('admin.map_implications')}
              {disabled}
              bind:checked={configToEdit.map.enabled}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.map_light_style')}
              description={$t('admin.map_style_description')}
              bind:value={configToEdit.map.lightStyle}
              disabled={disabled || !configToEdit.map.enabled}
              isEdited={configToEdit.map.lightStyle !== config.map.lightStyle}
            />
            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.map_dark_style')}
              description={$t('admin.map_style_description')}
              bind:value={configToEdit.map.darkStyle}
              disabled={disabled || !configToEdit.map.enabled}
              isEdited={configToEdit.map.darkStyle !== config.map.darkStyle}
            />
          </div></SettingAccordion
        >

        <SettingAccordion key="reverse-geocoding" title={$t('admin.map_reverse_geocoding_settings')}>
          {#snippet subtitleSnippet()}
            <p class="text-sm dark:text-immich-dark-fg">
              <FormatMessage key="admin.map_manage_reverse_geocoding_settings">
                {#snippet children({ message })}
                  <Link href="https://docs.immich.app/features/reverse-geocoding">{message}</Link>
                {/snippet}
              </FormatMessage>
            </p>
          {/snippet}
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.map_reverse_geocoding_enable_description')}
              {disabled}
              bind:checked={configToEdit.reverseGeocoding.enabled}
            />

            {#if configToEdit.reverseGeocoding.enabled}
              <div class="flex flex-col gap-2">
                <SettingInputField
                  inputType={SettingInputFieldType.TEXT}
                  label="URL-адрес сервера геокодирования"
                  description="Адрес локального сервера Nominatim для обратного геокодирования"
                  bind:value={configToEdit.reverseGeocoding.geocoderUrl}
                  disabled={disabled}
                  isEdited={configToEdit.reverseGeocoding.geocoderUrl !== config.reverseGeocoding.geocoderUrl}
                />
                <div class="flex gap-2 place-items-center -mt-2">
                  <Button
                    size="small"
                    shape="round"
                    variant="secondary"
                    disabled={disabled || configToEdit.reverseGeocoding.geocoderUrl === 'http://192.168.100.78:8088'}
                    onclick={() => configToEdit.reverseGeocoding.geocoderUrl = 'http://192.168.100.78:8088'}
                  >
                    Восстановить по умолчанию
                  </Button>
                </div>
              </div>

            {/if}
          </div></SettingAccordion>
        >

        <SettingButtonsRow bind:configToEdit keys={['map', 'reverseGeocoding']} {disabled} onBeforeSave={handleBeforeSave} />
      </div>
    </form>
  </div>
</div>
