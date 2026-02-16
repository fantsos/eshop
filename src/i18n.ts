import {getRequestConfig} from 'next-intl/server';

export const locales = ['el', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'el';

export default getRequestConfig(async ({requestLocale}) => {
  const locale = (await requestLocale) || defaultLocale;
  return {
    locale,
    timeZone: 'Europe/Athens',
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
