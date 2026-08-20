// SEO utilities for meta tags and structured data

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  price?: number;
  currency?: string;
  availability?: 'in stock' | 'out of stock';
  brand?: string;
}

export const updateMetaTags = (metadata: SEOMetadata) => {
  // Update title
  document.title = metadata.title;

  // Update or create meta tags
  const metaTags = [
    { name: 'description', content: metadata.description },
    { name: 'keywords', content: metadata.keywords || '' },
    { property: 'og:title', content: metadata.title },
    { property: 'og:description', content: metadata.description },
    { property: 'og:type', content: metadata.type || 'website' },
    { property: 'og:url', content: metadata.url || window.location.href },
    { property: 'og:image', content: metadata.image || '' },
    { property: 'og:site_name', content: "Maharaja's Spices" },
    { property: 'og:locale', content: 'en_ZA' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: metadata.title },
    { name: 'twitter:description', content: metadata.description },
    { name: 'twitter:image', content: metadata.image || '' },
    { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
  ];

  metaTags.forEach(tag => {
    const selector = tag.name ? `meta[name="${tag.name}"]` : `meta[property="${tag.property}"]`;
    let element = document.querySelector(selector);
    
    if (!element) {
      element = document.createElement('meta');
      if (tag.name) {
        element.setAttribute('name', tag.name);
      } else if (tag.property) {
        element.setAttribute('property', tag.property);
      }
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', tag.content);
  });

  // Update canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', metadata.url || window.location.href);
};

/**
 * Generate BreadcrumbList structured data for a page
 * Helps Google show breadcrumbs in search results
 */
export const generateBreadcrumbStructuredData = (items: { name: string; url: string }[]) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  let script = document.querySelector('script[type="application/ld+json"][data-type="breadcrumb"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-type', 'breadcrumb');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(structuredData);
};

/**
 * Generate FAQPage structured data for rich snippets
 */
export const generateFAQStructuredData = (faqs: { question: string; answer: string }[]) => {
  if (faqs.length === 0) return;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  let script = document.querySelector('script[type="application/ld+json"][data-type="faq"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-type', 'faq');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(structuredData);
};

/**
 * Generate WebPage structured data
 */
export const generateWebPageStructuredData = (name: string, description: string, url: string) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": name,
    "description": description,
    "url": url,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Maharaja's Spices",
      "url": "https://maharajasspices.co.za"
    }
  };

  let script = document.querySelector('script[type="application/ld+json"][data-type="webpage"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-type', 'webpage');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(structuredData);
};

export const generateProductStructuredData = (product: {
  id: string;
  name: string;
  description?: string;
  price: number;
  brand: string;
  image?: string;
  in_stock?: boolean;
  category: string;
  sku?: string;
  rating?: number;
  reviewCount?: number;
}) => {
  const structuredData: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `Premium ${product.name} from Maharaja's Spices`,
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "ZAR",
      "availability": product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": `${window.location.origin}/product/${product.id}`,
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "ZA",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 30,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "ZA"
        },
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "99.00",
          "currency": "ZAR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 2,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      }
    },
    "image": product.image || '',
    "category": product.category
  };

  // Add SKU if available
  if (product.sku) {
    structuredData.sku = product.sku;
  }

  // Add aggregate rating if available (helps with rich snippets)
  if (product.rating && product.reviewCount) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount,
      "bestRating": 5,
      "worstRating": 1
    };
  }

  let script = document.querySelector('script[type="application/ld+json"][data-type="product"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-type', 'product');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(structuredData);
};

export const generateRecipeStructuredData = (recipe: {
  name: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  image?: string;
  ingredients?: string[];
  instructions?: string[];
  category?: string;
  cuisine?: string;
  keywords?: string;
  author?: string;
  datePublished?: string;
}) => {
  const structuredData: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": recipe.name,
    "description": recipe.description || `Delicious ${recipe.name} recipe`,
    "image": recipe.image || '',
    "prepTime": recipe.prepTime ? `PT${recipe.prepTime}M` : undefined,
    "cookTime": recipe.cookTime ? `PT${recipe.cookTime}M` : undefined,
    "totalTime": recipe.totalTime ? `PT${recipe.totalTime}M` : undefined,
    "recipeYield": recipe.servings ? `${recipe.servings} servings` : undefined,
    "recipeIngredient": recipe.ingredients || [],
    "recipeInstructions": recipe.instructions?.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "text": step
    })) || [],
    "author": {
      "@type": "Organization",
      "name": recipe.author || "Maharaja's Spices"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Maharaja's Spices",
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/logo-official.png`
      }
    }
  };

  // Add optional fields
  if (recipe.category) structuredData.recipeCategory = recipe.category;
  if (recipe.cuisine) structuredData.recipeCuisine = recipe.cuisine;
  if (recipe.keywords) structuredData.keywords = recipe.keywords;
  if (recipe.datePublished) structuredData.datePublished = recipe.datePublished;

  let script = document.querySelector('script[type="application/ld+json"][data-type="recipe"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-type', 'recipe');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(structuredData);
};

export const generateOrganizationStructuredData = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Maharaja's Spices",
    "description": "Premium quality spices, sauces, marinades and seasonings. Wholesale and manufacturing business founded in 2012.",
    "url": "https://maharajasspices.co.za",
    "logo": `${window.location.origin}/logo-official.png`,
    "foundingDate": "2012",
    "founder": {
      "@type": "Person",
      "name": "Elaine Pillay"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+27-31-409-5853",
      "contactType": "customer service",
      "areaServed": "ZA"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Unit 5, Shallcross Industrial Park",
      "addressLocality": "Shallcross",
      "addressRegion": "KZN",
      "postalCode": "4093",
      "addressCountry": "ZA"
    },
    "sameAs": [
      "https://www.facebook.com/maharajasspices",
      "https://www.instagram.com/maharajasspices",
      "https://www.tiktok.com/@maharajasspices"
    ]
  };

  let script = document.querySelector('script[type="application/ld+json"][data-type="organization"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-type', 'organization');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(structuredData);
};