import { useEffect } from "react";

const SITE_NAME = "Passua Bites";
const DEFAULT_DESC = "Best smochas, burgers, and combos in Ruiru. Order via M-Pesa STK Push or WhatsApp.";
const DEFAULT_OG_IMAGE = ""; // set when you have a hero image URL
const SITE_URL = "https://passuabites.vercel.app";

export interface PageMeta {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  /** Don't append " - Passua Bites" suffix */
  exactTitle?: boolean;
}

/**
 * Sets per-page <title>, meta description, Open Graph, and Twitter card tags.
 * Restores defaults on unmount.
 */
export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    const fullTitle = meta.exactTitle
      ? meta.title
      : `${meta.title} | ${SITE_NAME}`;
    const desc = meta.description ?? DEFAULT_DESC;
    const ogImage = meta.ogImage ?? DEFAULT_OG_IMAGE;
    const ogType = meta.ogType ?? "website";

    const prev = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? DEFAULT_DESC,
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? fullTitle,
      ogDesc: document.querySelector('meta[property="og:description"]')?.getAttribute("content") ?? desc,
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? ogImage,
      ogType: document.querySelector('meta[property="og:type"]')?.getAttribute("content") ?? "website",
      ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute("content") ?? SITE_URL,
      twCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute("content") ?? "summary",
      twTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ?? fullTitle,
      twDesc: document.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ?? desc,
      twImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ?? ogImage,
    };

    document.title = fullTitle;
    setMeta("description", desc);
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:image", ogImage, "property");
    setMeta("og:type", ogType, "property");
    setMeta("og:url", SITE_URL, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", ogImage);

    return () => {
      document.title = prev.title;
      setMeta("description", prev.description);
      setMeta("og:title", prev.ogTitle, "property");
      setMeta("og:description", prev.ogDesc, "property");
      setMeta("og:image", prev.ogImage, "property");
      setMeta("og:type", prev.ogType, "property");
      setMeta("og:url", prev.ogUrl, "property");
      setMeta("twitter:card", prev.twCard);
      setMeta("twitter:title", prev.twTitle);
      setMeta("twitter:description", prev.twDesc);
      setMeta("twitter:image", prev.twImage);
    };
  }, [
    meta.title,
    meta.description,
    meta.ogImage,
    meta.ogType,
    meta.exactTitle,
  ]);
}

function setMeta(
  name: string,
  content: string,
  attr: "name" | "property" = "name",
) {
  if (!content) return;
  const selector = attr === "property" ? `meta[property="${name}"]` : `meta[name="${name}"]`;

  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
