'use client';

import AnnouncementForm, { EMPTY_ANNOUNCEMENT } from '@/components/AnnouncementForm';

export default function NewAnnouncementPage() {
  return <AnnouncementForm initial={EMPTY_ANNOUNCEMENT} />;
}
