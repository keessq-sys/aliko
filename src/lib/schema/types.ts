// src/lib/schema/types.ts
// Minimal, purpose-built typings for the schema.org shapes this app emits.
// Deliberately not a full schema.org type package: only the fields the
// builders in builders.ts actually populate are typed, kept loose with
// `[key: string]: unknown` so additional schema.org properties can be added
// without fighting the type system.

export interface Crumb {
  name: string;
  url: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Step {
  name: string;
  text: string;
  url?: string;
  image?: string;
}

export interface AuthorData {
  name: string;
  role?: string;
  url?: string;
  image?: string;
  sameAs?: string[];
}

export interface ArticleData {
  headline: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: AuthorData;
}

export interface ServiceData {
  name: string;
  description: string;
  url: string;
  image?: string;
  category: string;
  areaServed: string[];
  priceFrom?: number;
  priceCurrency?: string;
}

export interface DefinedTermData {
  name: string;
  description: string;
  url: string;
  inDefinedTermSet: string;
}

export interface ProductData {
  name: string;
  description: string;
  url: string;
  image: string;
  sku?: string;
  priceCurrency: string;
  price: number;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
}

/** Any schema.org node this app's builders can produce, loosely typed so they
 *  compose freely inside an `@graph` array. */
export type SchemaNode = { '@type': string; [key: string]: unknown };
