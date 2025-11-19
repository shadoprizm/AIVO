import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
}

export default function SEOHead({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
}: SEOHeadProps) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    const updateMetaTag = (selector: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const attr = selector.includes('property=') ? 'property' : 'name';
        const value = selector.match(/"([^"]+)"/)?.[1];
        if (value) {
          element.setAttribute(attr, value);
          document.head.appendChild(element);
        }
      }
      if (element) {
        element.setAttribute('content', content);
      }
    };

    if (description) {
      updateMetaTag('meta[name="description"]', description);
    }

    if (ogTitle) {
      updateMetaTag('meta[property="og:title"]', ogTitle);
    }

    if (ogDescription) {
      updateMetaTag('meta[property="og:description"]', ogDescription);
    }

    if (ogImage) {
      updateMetaTag('meta[property="og:image"]', ogImage);
    }

    if (ogType) {
      updateMetaTag('meta[property="og:type"]', ogType);
    }

    if (twitterCard) {
      updateMetaTag('meta[name="twitter:card"]', twitterCard);
    }

    if (canonical) {
      let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'canonical');
        document.head.appendChild(linkElement);
      }
      linkElement.href = canonical;
    }
  }, [title, description, canonical, ogTitle, ogDescription, ogImage, ogType, twitterCard]);

  return null;
}
