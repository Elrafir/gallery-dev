import { beforeAll } from 'vitest';
import { init, register, waitLocale } from 'svelte-i18n';

/** Loads English messages so filter components using $t() match string expectations in specs. */
export function setupEnglishI18n(): void {
  beforeAll(async () => {
    const { default: messages } = await import('../../../../../../i18n/en.json');
    register('en', () => Promise.resolve(messages));
    await init({ fallbackLocale: 'en', initialLocale: 'en' });
    await waitLocale();
  });
}
