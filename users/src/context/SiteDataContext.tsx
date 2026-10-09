import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { COMPANY_INFO } from '../data/constants';
import type { AboutContent, HeroContent, SiteSettings } from '../types';

/**
 * Admin-managed content shared across the site (business info, hero, about).
 * Starts from the static constants so the page renders instantly — and still
 * works if the API is unreachable — then swaps in the live values.
 */
interface SiteData {
  settings: SiteSettings;
  hero: HeroContent | null;
  about: AboutContent | null;
}

const FALLBACK_SETTINGS: SiteSettings = {
  business_name: COMPANY_INFO.name,
  tagline: COMPANY_INFO.tagline,
  logo_url: null,
  phone: COMPANY_INFO.contact.phone,
  whatsapp: COMPANY_INFO.contact.whatsapp,
  email: COMPANY_INFO.contact.email,
  address: COMPANY_INFO.location.address,
  city: COMPANY_INFO.location.city,
  state: COMPANY_INFO.location.state,
  country: COMPANY_INFO.location.country,
  google_maps_url: COMPANY_INFO.location.googleMapsUrl,
  facebook_url: COMPANY_INFO.social.facebook,
  instagram_url: COMPANY_INFO.social.instagram,
  youtube_url: COMPANY_INFO.social.youtube,
  tiktok_url: COMPANY_INFO.social.tiktok,
  linkedin_url: COMPANY_INFO.social.linkedin,
  default_meta_title: 'Wallstreet Forex Academy | Master Forex Trading',
  default_meta_description: '',
  copyright_text: '',
  business_hours: 'Mon - Sat: 9AM - 6PM',
  whatsapp_widget_enabled: true,
  whatsapp_greeting: 'Hi there 👋 Have a question about our forex programs? Chat with us on WhatsApp.',
  whatsapp_message: 'Hello Wallstreet Forex Academy, I would like to know more about your courses.',
};

const SiteDataContext = createContext<SiteData>({ settings: FALLBACK_SETTINGS, hero: null, about: null });

/** Replace null/empty API values with the fallback so components never render blanks. */
function mergeSettings(live: Partial<SiteSettings>): SiteSettings {
  const out = { ...FALLBACK_SETTINGS };
  for (const [k, v] of Object.entries(live)) {
    if (v !== null && v !== undefined && v !== '') (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>({ settings: FALLBACK_SETTINGS, hero: null, about: null });

  useEffect(() => {
    Promise.allSettled([
      api.get<Partial<SiteSettings>>('/site-settings'),
      api.get<HeroContent>('/hero'),
      api.get<AboutContent>('/about'),
    ]).then(([s, h, a]) => {
      setData({
        settings: s.status === 'fulfilled' ? mergeSettings(s.value) : FALLBACK_SETTINGS,
        hero: h.status === 'fulfilled' && h.value?.heading ? h.value : null,
        about: a.status === 'fulfilled' && a.value?.headline ? a.value : null,
      });
    });
  }, []);

  return <SiteDataContext.Provider value={data}>{children}</SiteDataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSiteData = () => useContext(SiteDataContext);
