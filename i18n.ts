import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

const locales = ["ar", "en"] as const;
export type Locale = typeof locales[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (locales as readonly string[]).includes(requested ?? "")
    ? (requested as Locale)
    : "ar";
  if (!(locales as readonly string[]).includes(locale)) notFound();
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
