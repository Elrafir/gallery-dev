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

  let newRuleOriginal = $state('');
  let newRuleReplacement = $state('');
  let newRuleStartYear = $state<number | undefined>(undefined);
  let newRuleEndYear = $state<number | undefined>(undefined);

  const addRule = () => {
    if (!newRuleOriginal.trim() || !newRuleReplacement.trim()) {
      return;
    }
    const rule = {
      original: newRuleOriginal.trim(),
      replacement: newRuleReplacement.trim(),
      startYear: newRuleStartYear || undefined,
      endYear: newRuleEndYear || undefined,
    };
    configToEdit.reverseGeocoding.substitutions = [
      ...(configToEdit.reverseGeocoding.substitutions || []),
      rule
    ];
    newRuleOriginal = '';
    newRuleReplacement = '';
    newRuleStartYear = undefined;
    newRuleEndYear = undefined;
  };

  const removeRule = (index: number) => {
    configToEdit.reverseGeocoding.substitutions = configToEdit.reverseGeocoding.substitutions.filter(
      (_, i) => i !== index
    );
  };

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

              <hr class="my-2 border-gray-200 dark:border-gray-700" />

              <div class="flex flex-col gap-2">
                <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Правила подмены стран</h3>
                <p class="text-xs text-gray-500">
                  Правила позволяют изменять названия стран в зависимости от года съёмки фотографии (например, до 1991 г. заменять "Украина" на "УССР").
                </p>

                <!-- Список текущих правил -->
                {#if configToEdit.reverseGeocoding.substitutions && configToEdit.reverseGeocoding.substitutions.length > 0}
                  <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                      <thead class="bg-gray-50 dark:bg-zinc-800">
                        <tr>
                          <th class="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Исходная страна</th>
                          <th class="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Замена</th>
                          <th class="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Диапазон годов</th>
                          <th class="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-zinc-900">
                        {#each configToEdit.reverseGeocoding.substitutions as rule, index}
                          <tr class="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                            <td class="px-4 py-2 font-mono">{rule.original}</td>
                            <td class="px-4 py-2 font-mono">{rule.replacement}</td>
                            <td class="px-4 py-2">
                              {#if rule.startYear && rule.endYear}
                                {rule.startYear} – {rule.endYear}
                              {:else if rule.startYear}
                                с {rule.startYear}
                              {:else if rule.endYear}
                                до {rule.endYear}
                              {:else}
                                Все года
                              {/if}
                            </td>
                            <td class="px-4 py-2 text-right">
                              <Button
                                size="small"
                                shape="round"
                                variant="ghost"
                                disabled={disabled}
                                onclick={() => removeRule(index)}
                              >
                                Удалить
                              </Button>
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {:else}
                  <p class="text-sm italic text-gray-400 my-2">Нет настроенных правил подмены.</p>
                {/if}

                <!-- Форма добавления нового правила -->
                <div class="mt-4 p-4 border border-dashed rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-zinc-850/50">
                  <h4 class="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 tracking-wider mb-3">Добавить новое правило</h4>
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-3 place-items-end">
                    <div class="w-full">
                      <label class="text-xs font-medium text-gray-500 block mb-1">Исходная страна</label>
                      <input
                        type="text"
                        placeholder="Например, Украина"
                        bind:value={newRuleOriginal}
                        disabled={disabled}
                        class="w-full text-sm p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100"
                      />
                    </div>
                    <div class="w-full">
                      <label class="text-xs font-medium text-gray-500 block mb-1">Замена</label>
                      <input
                        type="text"
                        placeholder="Например, Россия"
                        bind:value={newRuleReplacement}
                        disabled={disabled}
                        class="w-full text-sm p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100"
                      />
                    </div>
                    <div class="w-full flex gap-2">
                      <div class="w-1/2">
                        <label class="text-xs font-medium text-gray-500 block mb-1">С года</label>
                        <input
                          type="number"
                          placeholder="Все"
                          bind:value={newRuleStartYear}
                          disabled={disabled}
                          class="w-full text-sm p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100"
                        />
                      </div>
                      <div class="w-1/2">
                        <label class="text-xs font-medium text-gray-500 block mb-1">По год</label>
                        <input
                          type="number"
                          placeholder="Все"
                          bind:value={newRuleEndYear}
                          disabled={disabled}
                          class="w-full text-sm p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div class="w-full flex justify-end">
                      <Button
                        size="small"
                        shape="round"
                        disabled={disabled || !newRuleOriginal || !newRuleReplacement}
                        onclick={addRule}
                      >
                        Добавить
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div></SettingAccordion
        >

        <SettingButtonsRow bind:configToEdit keys={['map', 'reverseGeocoding']} {disabled} onBeforeSave={handleBeforeSave} />
      </div>
    </form>
  </div>
</div>
