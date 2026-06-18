<script lang="ts">
  /**
   * @component UserSettingsPage
   * Страница пользовательских настроек.
   * Является контейнером для `UserSettingsList`, где отображаются все доступные
   * для изменения параметры профиля текущего пользователя.
   */
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import UserSettingsList from './user-settings-list.svelte';
  import { getKeyboardActions } from '$lib/services/keyboard.service';
  import { Container } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  const { KeyboardShortcuts } = $derived(getKeyboardActions($t));
</script>

<UserPageLayout title={data.meta.title} actions={[KeyboardShortcuts]}>
  <Container size="medium" center>
    <UserSettingsList keys={data.keys} sessions={data.sessions} />
  </Container>
</UserPageLayout>
