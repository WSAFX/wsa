'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import AnnouncementForm, { AnnouncementFormValues, toLocalInput } from '@/components/AnnouncementForm';
import type { Announcement } from '@/lib/types';

export default function EditAnnouncementPage() {
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<AnnouncementFormValues | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Announcement>(`/announcements/${params.id}`)
      .then((a) =>
        setInitial({
          id: a.id,
          title: a.title,
          body_html: a.body_html || '',
          image_url: a.image_url,
          image_public_id: a.image_public_id,
          layout: a.layout,
          cta_label: a.cta_label || '',
          cta_href: a.cta_href || '',
          is_active: a.is_active,
          starts_at: toLocalInput(a.starts_at),
          ends_at: toLocalInput(a.ends_at),
        }),
      )
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!initial) return <p className="text-sm text-gray-400">Loading…</p>;
  return <AnnouncementForm key={initial.id} initial={initial} />;
}
