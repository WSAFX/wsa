import { z } from 'zod';

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color');

/** Preprocesses empty strings/undefined into null and validates URL or relative path */
const optionalUrl = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z.string().url().or(z.string().startsWith('/')).nullable().optional()
);

/** Preprocesses empty strings/undefined into null */
const optionalString = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z.string().nullable().optional()
);

/** Preprocesses empty strings/undefined/null into number or null */
const optionalNumber = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? val : num;
}, z.number().nullable().optional());

export const articleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(80).optional(),
  excerpt: z.string().max(500).optional().default(''),
  content_html: z.string().optional().default(''),
  cover_image_url: optionalUrl,
  cover_public_id: optionalString,
  meta_title: z.string().max(200).optional().default(''),
  meta_description: z.string().max(320).optional().default(''),
  keywords: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  featured: z.boolean().optional().default(false),
  author: z.string().max(120).optional(),
  category_ids: z.array(z.string().uuid()).optional().default([]),
});

export const heroSchema = z.object({
  badge_text: z.string().max(120).optional().default(''),
  heading: z.string().min(1).max(200),
  heading_highlight: z.string().max(120).optional().default(''),
  subheading: z.string().max(500).optional().default(''),
  cta_label: z.string().max(60).optional().default(''),
  cta_href: z.string().max(200).optional().default(''),
  secondary_cta_label: z.string().max(60).optional().default(''),
  secondary_cta_href: z.string().max(200).optional().default(''),
});

export const siteSettingsSchema = z.object({
  business_name: z.string().min(1).max(200),
  tagline: z.string().max(300).optional(),
  logo_url: optionalUrl,
  logo_public_id: optionalString,
  primary_color: hex,
  secondary_color: hex,
  default_hero_color: hex,
  phone: z.string().max(40).optional(),
  whatsapp: z.string().max(40).optional(),
  email: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  lat: optionalNumber,
  lng: optionalNumber,
  facebook_url: z.string().max(300).optional(),
  instagram_url: z.string().max(300).optional(),
  youtube_url: z.string().max(300).optional(),
  tiktok_url: z.string().max(300).optional(),
  linkedin_url: z.string().max(300).optional(),
  google_maps_url: z.string().max(300).optional(),
  default_meta_title: z.string().max(200).optional(),
  default_meta_description: z.string().max(320).optional(),
  copyright_text: z.string().max(300).optional().default(''),
  business_hours: z.string().max(120).optional().default(''),
  whatsapp_widget_enabled: z.boolean().optional().default(true),
  whatsapp_greeting: z.string().max(300).optional().default(''),
  whatsapp_message: z.string().max(500).optional().default(''),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export const aboutSchema = z.object({
  headline: z.string().min(1).max(200),
  subheading: z.string().max(300).optional().default(''),
  body_html: z.string().optional().default(''),
  image_url: optionalUrl,
  image_public_id: optionalString,
  stats: z.array(z.object({ label: z.string(), value: z.string() })).optional().default([]),
  team: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        image_url: optionalUrl,
        image_public_id: optionalString,
        description: z.string().max(600).optional().default(''),
      }),
    )
    .optional()
    .default([]),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(120).optional(),
  description: z.string().max(300).optional().default(''),
});

export const mediaSignSchema = z.object({
  folder: z.string().max(60).optional(),
});

export const mediaDestroySchema = z.object({
  public_id: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------
const cropMode = z.enum(['fill', 'pad']);
const frameStyle = z.enum(['none', 'rounded', 'polaroid', 'gold', 'shadow']);
const gravity = z.enum(['auto', 'face', 'faces', 'center']);
const optionalInt = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
  z.number().int().positive().nullable().optional(),
);
const optionalUuid = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().uuid().nullable().optional(),
);

export const galleryImageSchema = z.object({
  image_url: z.string().url(),
  public_id: optionalString,
  width: optionalInt,
  height: optionalInt,
  caption: z.string().max(300).optional().default(''),
  alt: z.string().max(200).optional().default(''),
  category_id: optionalUuid,
  crop_mode: cropMode.nullable().optional(),
  gravity: gravity.optional().default('auto'),
  frame_style: frameStyle.nullable().optional(),
  sort_order: z.coerce.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

export const galleryImageUpdateSchema = galleryImageSchema.omit({ image_url: true, public_id: true, width: true, height: true }).partial();

export const galleryBulkSchema = z.object({
  images: z.array(galleryImageSchema).min(1).max(50),
});

export const gallerySettingsSchema = z.object({
  aspect_ratio: z.enum(['1:1', '4:3', '3:4', '3:2', '16:9']),
  crop_mode: cropMode,
  frame_style: frameStyle,
  layout: z.enum(['grid', 'masonry']),
  columns: z.coerce.number().int().min(2).max(5),
});

export const galleryCategorySchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().max(80).optional(),
  sort_order: z.coerce.number().int().optional().default(0),
});

// ---------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------
const optionalDateTime = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.coerce.date().nullable().optional(),
);

export const announcementSchema = z
  .object({
    title: z.string().min(1).max(200),
    body_html: z.string().optional().default(''),
    image_url: optionalUrl,
    image_public_id: optionalString,
    layout: z.enum(['image_top', 'image_left', 'image_background']).optional().default('image_top'),
    cta_label: z.string().max(60).optional().default(''),
    cta_href: z.string().max(300).optional().default(''),
    is_active: z.boolean().optional().default(false),
    starts_at: optionalDateTime,
    ends_at: optionalDateTime,
  })
  .refine((a) => !a.starts_at || !a.ends_at || a.ends_at > a.starts_at, {
    message: 'End date must be after the start date',
    path: ['ends_at'],
  });

export const announcementToggleSchema = z.object({
  is_active: z.boolean(),
});

// ---------------------------------------------------------------------
// Batches
// ---------------------------------------------------------------------
const optionalDate = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').nullable().optional(),
);

export const batchSchema = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().max(80).optional(),
  description: z.string().max(2000).optional().default(''),
  start_date: optionalDate,
  graduation_date: optionalDate,
  featured_image_url: optionalUrl,
  featured_public_id: optionalString,
  status: z.enum(['current', 'outgoing', 'archived']).optional().default('current'),
  display_mode: z.enum(['slider', 'featured_thumbs', 'grid', 'masonry']).optional().default('slider'),
  show_on_home: z.boolean().optional().default(false),
  sort_order: z.coerce.number().int().optional().default(0),
});

export const batchImagesSchema = z.object({
  images: z
    .array(
      z.object({
        image_url: z.string().url(),
        public_id: optionalString,
        width: optionalInt,
        height: optionalInt,
        caption: z.string().max(300).optional().default(''),
      }),
    )
    .min(1)
    .max(100),
});

export const batchImageUpdateSchema = z.object({
  caption: z.string().max(300),
});

// ---------------------------------------------------------------------
// Public AI assistant
// ---------------------------------------------------------------------
export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
});

// ---------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------
export const courseSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(1000).optional().default(''),
  duration: z.string().max(60).optional().default(''),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().default('Beginner'),
  price: z.string().max(60).optional().default(''),
  features: z.array(z.string().trim().min(1).max(200)).max(30).optional().default([]),
  highlighted: z.boolean().optional().default(false),
  badge_text: z.string().max(40).optional().default('Most Popular'),
  cta_label: z.string().max(40).optional().default('Enroll Now'),
  cta_href: z.string().max(300).optional().default(''),
  active: z.boolean().optional().default(true),
});

// ---------------------------------------------------------------------
// Google reviews
// ---------------------------------------------------------------------
export const reviewSettingsSchema = z.object({
  // undefined = keep the saved key, '' or null = remove it, string = replace it
  api_key: z.string().trim().max(200).nullable().optional(),
  place_id: z.string().trim().max(300).nullable().optional(),
  place_name: z.string().max(300).nullable().optional(),
  place_address: z.string().max(500).nullable().optional(),
  min_rating: z.coerce.number().int().min(1).max(5),
  keep_history: z.boolean(),
});

export const placeSearchSchema = z.object({
  query: z.string().trim().min(2).max(200),
  // lets the admin test a key before saving it
  api_key: z.string().trim().max(200).optional(),
});

export const reviewFlagsSchema = z.object({
  hidden: z.boolean().optional(),
  pinned: z.boolean().optional(),
});
