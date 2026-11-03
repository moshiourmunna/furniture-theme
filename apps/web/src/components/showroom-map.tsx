'use client';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useStore } from './providers';

export interface MapRoom { id: number; name: string; lat: number; lng: number }

/** OpenStreetMap embed (allowed by CSP frame-src) with a showroom switcher. */
export function ShowroomMap({ rooms }: { rooms: MapRoom[] }) {
  const { t } = useStore();
  const [id, setId] = useState(rooms[0]?.id);
  const r = rooms.find((x) => x.id === id) ?? rooms[0];
  if (!r) return null;
  const d = 0.01;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${r.lng - d},${r.lat - d},${r.lng + d},${r.lat + d}&layer=mapnik&marker=${r.lat},${r.lng}`;
  return (
    <div className="grid lg:grid-cols-[260px_1fr] border border-line" data-testid="showroom-map">
      <ul className="max-h-[420px] overflow-y-auto divide-y divide-line" role="listbox" aria-label={t('Showrooms', 'শোরুম')}>
        {rooms.map((x) => (
          <li key={x.id}><button type="button" role="option" aria-selected={x.id === id} onClick={() => setId(x.id)} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 ${x.id === id ? 'bg-surface-2 font-semibold' : 'hover:bg-surface-2/60'}`}><MapPin className="w-4 h-4 text-accent shrink-0" />{x.name}</button></li>
        ))}
      </ul>
      <iframe key={r.id} title={`${t('Map', 'মানচিত্র')}: ${r.name}`} src={src} className="w-full h-[420px] border-0 bg-surface-2" loading="lazy" referrerPolicy="no-referrer" />
    </div>
  );
}
