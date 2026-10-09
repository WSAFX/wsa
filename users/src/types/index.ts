export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage?: string;
}

export interface CurrencyPair {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

export interface GalleryImage {
  id: number;
  src: string;
  caption: string;
  category: 'classroom' | 'events' | 'graduation' | 'workshop';
}

export interface TeamMember {
  name: string;
  role: string;
  image: string | null;
  description?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: string;
  features: string[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Backend (public API) shapes
// ---------------------------------------------------------------------------

export interface SiteSettings {
  business_name: string;
  tagline: string;
  logo_url: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  google_maps_url: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  tiktok_url: string;
  linkedin_url: string;
  default_meta_title: string;
  default_meta_description: string;
  copyright_text: string;
  business_hours: string;
  whatsapp_widget_enabled: boolean;
  whatsapp_greeting: string;
  whatsapp_message: string;
}

export interface HeroContent {
  badge_text: string;
  heading: string;
  heading_highlight: string;
  subheading: string;
  cta_label: string;
  cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
}

export interface AboutContent {
  headline: string;
  subheading: string;
  body_html: string;
  image_url: string | null;
  stats: { label: string; value: string }[];
  team: { name: string; role: string; image_url?: string | null }[];
}

export type CropMode = 'fill' | 'pad';
export type FrameStyle = 'none' | 'rounded' | 'polaroid' | 'gold' | 'shadow';
export type Gravity = 'auto' | 'face' | 'faces' | 'center';
export type AspectRatio = '1:1' | '4:3' | '3:4' | '3:2' | '16:9';

export interface GallerySettings {
  aspect_ratio: AspectRatio;
  crop_mode: CropMode;
  frame_style: FrameStyle;
  layout: 'grid' | 'masonry';
  columns: number;
}

export interface GalleryPhoto {
  id: string;
  image_url: string;
  width: number | null;
  height: number | null;
  caption: string;
  alt: string;
  crop_mode: CropMode | null;
  gravity: Gravity;
  frame_style: FrameStyle | null;
  category_slug: string | null;
  category_name: string | null;
}

export interface GalleryData {
  settings: GallerySettings | null;
  categories: { id: string; name: string; slug: string }[];
  images: GalleryPhoto[];
}

export interface Announcement {
  id: string;
  title: string;
  body_html: string;
  image_url: string | null;
  layout: 'image_top' | 'image_left' | 'image_background';
  cta_label: string;
  cta_href: string;
  updated_at: string;
}

export type BatchDisplayMode = 'slider' | 'featured_thumbs' | 'grid' | 'masonry';

export interface BatchPhoto {
  id: string;
  image_url: string;
  width: number | null;
  height: number | null;
  caption: string;
}

export interface Batch {
  id: string;
  name: string;
  slug: string;
  description: string;
  start_date: string | null;
  graduation_date: string | null;
  featured_image_url: string | null;
  status: 'current' | 'outgoing' | 'archived';
  display_mode: BatchDisplayMode;
  show_on_home: boolean;
  image_count?: number;
  images?: BatchPhoto[];
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  author: string;
  reading_minutes: number;
  published_at: string;
  featured: boolean;
}

export interface Article extends ArticleSummary {
  content_html: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CourseItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: string;
  features: string[];
  highlighted: boolean;
  badge_text: string;
  cta_label: string;
  cta_href: string;
}

export interface GoogleReview {
  id: string;
  author_name: string;
  author_uri: string | null;
  author_photo_uri: string | null;
  rating: number;
  text: string;
  publish_time: string | null;
  relative_time: string | null;
  review_uri: string | null;
}

export interface TestimonialsData {
  summary: {
    place_name: string | null;
    rating: number | null;
    total_reviews: number | null;
    maps_uri: string | null;
    write_review_uri: string;
  } | null;
  reviews: GoogleReview[];
}
