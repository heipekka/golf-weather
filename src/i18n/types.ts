import type { TranslationDictionary } from './translations/fi';

type PathsOf<T> = T extends string
  ? []
  : { [K in Extract<keyof T, string>]: [K, ...PathsOf<T[K]>] }[Extract<keyof T, string>];

type Join<Parts extends readonly string[]> = Parts extends readonly [infer Head, ...infer Rest]
  ? Head extends string
    ? Rest extends readonly string[]
      ? Rest extends readonly []
        ? Head
        : `${Head}.${Join<Rest>}`
      : never
    : never
  : never;

/** Every valid dot-path translation key, derived from the `fi` dictionary shape. */
export type TranslationKey = Join<PathsOf<TranslationDictionary>>;
