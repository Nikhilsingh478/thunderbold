import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
}

export function useSEO({ title, description, canonicalUrl }: SEOProps = {}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Update Title
    const baseTitle = "Thunderbold — Curated Streetwear & Fashion India";
    const newTitle = title ? `${title} | Thunderbold` : baseTitle;
    document.title = newTitle;

    // 2. Update Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);

      // Update og:description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', description);
      }

      // Update twitter:description
      let twitterDesc = document.querySelector('meta[name="twitter:description"]');
      if (twitterDesc) {
        twitterDesc.setAttribute('content', description);
      }
    }

    // 3. Update Canonical URL & og:url
    const canonicalHref = canonicalUrl || `https://thunderbold.shop${location.pathname}`;
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    
    // Normalize path by stripping trailing slash for consistency
    let cleanHref = canonicalHref;
    if (cleanHref.length > 27 && cleanHref.endsWith('/')) {
      cleanHref = cleanHref.slice(0, -1);
    }
    linkCanonical.setAttribute('href', cleanHref);

    // Update og:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', cleanHref);
    }

    // Update og:title
    if (title) {
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', title);
      }
      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) {
        twitterTitle.setAttribute('content', title);
      }
    }
  }, [title, description, canonicalUrl, location.pathname]);
}
