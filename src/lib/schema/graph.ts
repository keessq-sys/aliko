// src/lib/schema/graph.ts
// Combines multiple schema.org nodes into a single `@graph` JSON-LD document
// and serializes it to a string. Call this at the end of a server load()
// function; the resulting string is assigned to PageSEO.jsonLd and rendered
// as-is (no re-parsing) inside a single <script type="application/ld+json">
// tag by SEO.svelte. One `@graph` block per page beats several separate
// <script> tags — it lets every node reference every other node by `@id`
// (e.g. Article.publisher -> Organization) without duplicating the object.
import type { SchemaNode } from './types';

export function buildPageGraph(schemas: SchemaNode[]): string {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': schemas
  };
  // JSON.stringify (not a template string) so any user-supplied text inside
  // a schema field (e.g. an FAQ answer) is correctly escaped — this runs
  // server-side and the output is embedded directly into HTML. `<` is
  // additionally escaped to < so a field value can never contain a
  // literal "</script>" and break out of the JSON-LD <script> tag.
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}
