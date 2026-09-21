// src/lib/schema/builders.ts
// Typed factory functions, one per schema.org type this app emits. Each
// returns a plain SchemaNode (no `@context`, no `@graph` wrapper) — combine
// several with buildPageGraph() from ./graph.ts before serializing. Call
// these from a +page.server.ts / +layout.server.ts load() function only;
// they must never run in a component, or the JSON-LD ships client-rendered
// (invisible to crawlers that don't execute JS) instead of in the initial HTML.
import { ORGANIZATION, SITE_NAME, SITE_URL } from '$lib/data/organization';
import type {
  ArticleData,
  AuthorData,
  Crumb,
  DefinedTermData,
  FAQ,
  ProductData,
  ServiceData,
  SchemaNode,
  Step
} from './types';

export function buildOrganizationSchema(): SchemaNode {
  return {
    '@type': 'RealEstateAgent',
    '@id': `${SITE_URL}/#organization`,
    name: ORGANIZATION.legalName,
    alternateName: SITE_NAME,
    url: ORGANIZATION.url,
    logo: {
      '@type': 'ImageObject',
      url: ORGANIZATION.logo
    },
    image: ORGANIZATION.logo,
    email: ORGANIZATION.email,
    telephone: ORGANIZATION.telephone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: ORGANIZATION.address.addressLocality,
      addressRegion: ORGANIZATION.address.addressRegion,
      addressCountry: ORGANIZATION.address.addressCountry
    },
    areaServed: ORGANIZATION.areaServed,
    ...(ORGANIZATION.sameAs.length ? { sameAs: ORGANIZATION.sameAs } : {})
  };
}

export function buildWebSiteSchema(): SchemaNode {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-NG',
    // Sitelinks Searchbox: enables a search box directly in Google/AI search
    // result cards. `/properties?location={search_term_string}` matches the
    // real filter param the properties listing route already reads.
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/properties?location={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function buildBreadcrumbSchema(crumbs: Crumb[]): SchemaNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
}

export function buildPersonSchema(author: AuthorData): SchemaNode {
  return {
    '@type': 'Person',
    name: author.name,
    ...(author.role ? { jobTitle: author.role } : {}),
    ...(author.url ? { url: author.url } : {}),
    ...(author.image ? { image: author.image } : {}),
    ...(author.sameAs?.length ? { sameAs: author.sameAs } : {}),
    worksFor: { '@id': `${SITE_URL}/#organization` }
  };
}

export function buildArticleSchema(article: ArticleData): SchemaNode {
  return {
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    url: article.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': article.url },
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: buildPersonSchema(article.author),
    publisher: { '@id': `${SITE_URL}/#organization` }
  };
}

export function buildFAQSchema(faqs: FAQ[]): SchemaNode {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

export function buildHowToSchema(name: string, description: string, steps: Step[]): SchemaNode {
  return {
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step) => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url } : {}),
      ...(step.image ? { image: step.image } : {})
    }))
  };
}

export function buildServiceSchema(service: ServiceData): SchemaNode {
  return {
    '@type': 'Service',
    name: service.name,
    description: service.description,
    url: service.url,
    ...(service.image ? { image: service.image } : {}),
    serviceType: service.category,
    areaServed: service.areaServed,
    provider: { '@id': `${SITE_URL}/#organization` },
    ...(service.priceFrom
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: service.priceCurrency ?? 'NGN',
            price: service.priceFrom,
            url: service.url
          }
        }
      : {})
  };
}

export function buildProductSchema(product: ProductData): SchemaNode {
  return {
    '@type': 'Product',
    name: product.name,
    description: product.description,
    url: product.url,
    image: product.image,
    ...(product.sku ? { sku: product.sku } : {}),
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: product.priceCurrency,
      price: product.price,
      availability: `https://schema.org/${product.availability ?? 'InStock'}`
    }
  };
}

export function buildDefinedTermSchema(term: DefinedTermData): SchemaNode {
  return {
    '@type': 'DefinedTerm',
    name: term.name,
    description: term.description,
    url: term.url,
    inDefinedTermSet: term.inDefinedTermSet
  };
}
