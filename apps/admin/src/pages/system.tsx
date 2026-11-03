import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldCheck } from 'lucide-react';
import { PERMISSION_GROUPS } from '@shekor/shared';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';
import { Card, ErrorBox, Loading, Modal, PageHeader, Pill, Tabs, useUi } from '@/components/ui';
import { NoAccess } from '@/components/layout';
import { ImageInput } from '@/components/fields';

interface StaffRow { id: number; name: string; email: string; phone: string | null; isActive: boolean; lastLoginAt: string | null; role: { id: number; name: string } | null }
interface Role { id: number; name: string; description: string | null; isSystem: boolean; users: number; permissions: string[] }

export function Staff() {
  const { can, user } = useAuth();
  const { t, date } = usePrefs();
  const { toast, confirm } = useUi();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'staff' | 'roles'>('staff');
  const staff = useQuery({ queryKey: ['staff'], queryFn: () => api<{ items: StaffRow[] }>('/admin/staff'), enabled: can('staff.read') });
  const roles = useQuery({ queryKey: ['roles'], queryFn: () => api<{ items: Role[]; allPermissions: string[] }>('/admin/roles'), enabled: can('staff.read') });
  const [editStaff, setEditStaff] = useState<Partial<StaffRow> & { password?: string; roleId?: number } | null>(null);
  const [editRole, setEditRole] = useState<Partial<Role> | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  if (!can('staff.read')) return <NoAccess />;
  if (staff.isLoading || roles.isLoading) return <Loading />;
  if (staff.error || roles.error) return <ErrorBox error={staff.error ?? roles.error} />;
  const w = can('staff.write');
  const refresh = () => { qc.invalidateQueries({ queryKey: ['staff'] }); qc.invalidateQueries({ queryKey: ['roles'] }); };
  const saveStaff = async () => {
    if (!editStaff) return;
    setErr({});
    try {
      if (editStaff.id) await api(`/admin/staff/${editStaff.id}`, { method: 'PUT', body: { name: editStaff.name, roleId: editStaff.roleId, ...(editStaff.password ? { password: editStaff.password } : {}) } });
      else await api('/admin/staff', { body: { name: editStaff.name, email: editStaff.email, phone: editStaff.phone || undefined, password: editStaff.password, roleId: editStaff.roleId } });
      toast(t('Staff saved', 'স্টাফ সংরক্ষিত')); setEditStaff(null); refresh();
    } catch (e) { setErr({ ...(e as ApiError).fields, _: (e as Error).message }); }
  };
  const saveRole = async () => {
    if (!editRole) return;
    setErr({});
    try {
      const body = { name: editRole.name, description: editRole.description || undefined, permissions: editRole.permissions ?? [] };
      if (editRole.id) await api(`/admin/roles/${editRole.id}`, { method: 'PUT', body }); else await api('/admin/roles', { body });
      toast(t('Role saved', 'রোল সংরক্ষিত')); setEditRole(null); refresh(); qc.invalidateQueries({ queryKey: ['me'] });
    } catch (e) { setErr({ ...(e as ApiError).fields, _: (e as Error).message }); }
  };
  return (
    <div data-testid="staff">
      <PageHeader title={t('Staff & roles', 'স্টাফ ও রোল')} actions={<><Tabs value={tab} onChange={setTab} items={[['staff', t('Staff', 'স্টাফ')], ['roles', t('Roles', 'রোল')]]} />
        {w && (tab === 'staff' ? <button type="button" className="btn btn-primary btn-sm" onClick={() => { setErr({}); setEditStaff({ name: '', email: '', roleId: roles.data!.items.find((r) => !r.isSystem)?.id }); }} data-testid="staff-new"><Plus className="w-4 h-4" />{t('Add staff', 'স্টাফ যোগ')}</button>
          : <button type="button" className="btn btn-primary btn-sm" onClick={() => { setErr({}); setEditRole({ name: '', permissions: ['dashboard.read'] }); }} data-testid="role-new"><Plus className="w-4 h-4" />{t('New role', 'নতুন রোল')}</button>)}</>} />
      {tab === 'staff' ? (
        <Card pad={false}><div className="overflow-x-auto"><table className="tbl"><thead><tr><th>{t('Name', 'নাম')}</th><th>{t('Role', 'রোল')}</th><th>{t('Last sign-in', 'শেষ সাইন ইন')}</th><th>{t('Status', 'স্ট্যাটাস')}</th><th /></tr></thead>
          <tbody>{staff.data!.items.map((s) => (
            <tr key={s.id} data-testid="staff-row"><td><p className="font-medium">{s.name}{s.id === user?.id && <span className="text-xs text-muted"> ({t('you', 'আপনি')})</span>}</p><p className="text-xs text-muted">{s.email}</p></td><td><Pill tone="brand">{s.role?.name ?? '—'}</Pill></td><td>{s.lastLoginAt ? date(s.lastLoginAt, true) : '—'}</td><td>{s.isActive ? <Pill tone="green">active</Pill> : <Pill tone="red">inactive</Pill>}</td>
              <td className="text-right whitespace-nowrap">{w && <><button type="button" className="btn btn-ghost btn-xs" onClick={() => { setErr({}); setEditStaff({ ...s, roleId: s.role?.id, password: '' }); }}>{t('Edit', 'সম্পাদনা')}</button>
                {s.id !== user?.id && <button type="button" className="btn btn-ghost btn-xs" onClick={async () => {
                  if (s.isActive && !(await confirm({ title: t(`Deactivate ${s.name}?`, 'নিষ্ক্রিয় করবেন?'), body: t('They are signed out immediately.', 'তাৎক্ষণিক সাইন আউট হবে।'), danger: true, confirm: t('Deactivate', 'নিষ্ক্রিয়') }))) return;
                  try { await api(`/admin/staff/${s.id}`, { method: 'PUT', body: { isActive: !s.isActive } }); refresh(); toast(t('Updated', 'আপডেট হয়েছে')); } catch (e) { toast((e as Error).message, 'err'); }
                }}>{s.isActive ? t('Deactivate', 'নিষ্ক্রিয়') : t('Activate', 'সক্রিয়')}</button>}</>}</td></tr>
          ))}</tbody></table></div></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{roles.data!.items.map((r) => (
          <div key={r.id} className="card p-5" data-testid="role-card">
            <div className="flex items-start gap-3"><span className="w-10 h-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><ShieldCheck className="w-5 h-5" /></span><div className="flex-1"><p className="font-semibold">{r.name}</p><p className="text-xs text-muted">{r.users} {t('staff', 'স্টাফ')} · {r.permissions.length} {t('permissions', 'অনুমতি')}</p></div></div>
            <p className="text-sm text-muted mt-3 min-h-10">{r.description}</p>
            {w && !r.isSystem && <div className="flex gap-2 mt-3"><button type="button" className="btn btn-outline btn-xs" onClick={() => { setErr({}); setEditRole(r); }}>{t('Edit permissions', 'অনুমতি সম্পাদনা')}</button>{!r.users && <button type="button" className="btn btn-ghost btn-xs text-sale" onClick={async () => { if (!(await confirm({ title: t(`Delete role ${r.name}?`, 'রোল মুছবেন?'), danger: true, confirm: t('Delete', 'মুছুন') }))) return; try { await api(`/admin/roles/${r.id}`, { method: 'DELETE' }); refresh(); toast(t('Role deleted', 'রোল মুছে ফেলা হয়েছে')); } catch (e) { toast((e as Error).message, 'err'); } }}>{t('Delete', 'মুছুন')}</button>}</div>}
            {r.isSystem && <p className="text-xs text-muted mt-3">{t('System role — always has every permission.', 'সিস্টেম রোল — সব অনুমতি থাকে।')}</p>}
          </div>
        ))}</div>
      )}
      {editStaff && (
        <Modal title={editStaff.id ? t('Edit staff', 'স্টাফ সম্পাদনা') : t('Add staff', 'স্টাফ যোগ')} onClose={() => setEditStaff(null)} footer={<><button type="button" className="btn btn-outline" onClick={() => setEditStaff(null)}>{t('Cancel', 'বাতিল')}</button><button type="button" className="btn btn-primary" onClick={saveStaff} data-testid="staff-save">{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="space-y-4">
            <div><label htmlFor="sn" className="label">{t('Name', 'নাম')}</label><input id="sn" className="input" value={editStaff.name ?? ''} onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })} />{err.name && <p className="err">{err.name}</p>}</div>
            {!editStaff.id && <><div><label htmlFor="se" className="label">{t('Email', 'ইমেইল')}</label><input id="se" type="email" className="input" value={editStaff.email ?? ''} onChange={(e) => setEditStaff({ ...editStaff, email: e.target.value })} />{err.email && <p className="err">{err.email}</p>}</div>
              <div><label htmlFor="sp" className="label">{t('Mobile (optional)', 'মোবাইল (ঐচ্ছিক)')}</label><input id="sp" className="input" value={editStaff.phone ?? ''} onChange={(e) => setEditStaff({ ...editStaff, phone: e.target.value })} />{err.phone && <p className="err">{err.phone}</p>}</div></>}
            <div><label htmlFor="sr" className="label">{t('Role', 'রোল')}</label><select id="sr" className="input" value={editStaff.roleId ?? ''} disabled={editStaff.id === user?.id} onChange={(e) => setEditStaff({ ...editStaff, roleId: Number(e.target.value) })}>{roles.data!.items.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
            <div><label htmlFor="spw" className="label">{editStaff.id ? t('New password (leave blank to keep)', 'নতুন পাসওয়ার্ড (ফাঁকা রাখলে আগেরটি)') : t('Temporary password', 'অস্থায়ী পাসওয়ার্ড')}</label><input id="spw" type="password" autoComplete="new-password" className="input" value={editStaff.password ?? ''} onChange={(e) => setEditStaff({ ...editStaff, password: e.target.value })} /><p className="hint">{t('At least 8 characters with a letter and a number.', 'কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যাসহ।')}</p>{err.password && <p className="err">{err.password}</p>}</div>
            {err._ && <p className="text-sm text-sale" role="alert">{err._}</p>}
          </div>
        </Modal>
      )}
      {editRole && (
        <Modal wide title={editRole.id ? t('Edit role', 'রোল সম্পাদনা') : t('New role', 'নতুন রোল')} onClose={() => setEditRole(null)} footer={<><button type="button" className="btn btn-outline" onClick={() => setEditRole(null)}>{t('Cancel', 'বাতিল')}</button><button type="button" className="btn btn-primary" onClick={saveRole} data-testid="role-save">{t('Save role', 'রোল সংরক্ষণ')}</button></>}>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div><label htmlFor="rn" className="label">{t('Role name', 'রোলের নাম')}</label><input id="rn" className="input" value={editRole.name ?? ''} onChange={(e) => setEditRole({ ...editRole, name: e.target.value })} />{err.name && <p className="err">{err.name}</p>}</div>
            <div><label htmlFor="rd" className="label">{t('Description', 'বিবরণ')}</label><input id="rd" className="input" value={editRole.description ?? ''} onChange={(e) => setEditRole({ ...editRole, description: e.target.value })} /></div>
          </div>
          <table className="tbl"><thead><tr><th>{t('Area', 'অংশ')}</th><th className="text-center">{t('View', 'দেখা')}</th><th className="text-center">{t('Edit', 'সম্পাদনা')}</th></tr></thead>
            <tbody>{Object.entries(PERMISSION_GROUPS).map(([g, perms]) => (
              <tr key={g}><td className="capitalize">{g}</td>{(['read', 'write'] as const).map((k) => {
                const code = (perms as readonly string[]).find((p) => p.endsWith(`.${k}`));
                const on = !!code && !!editRole.permissions?.includes(code);
                return <td key={k} className="text-center">{code ? <input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" aria-label={code} checked={on} onChange={() => {
                  let next = new Set(editRole.permissions ?? []);
                  if (on) { next.delete(code); if (k === 'read') (perms as readonly string[]).forEach((p) => next.delete(p)); }
                  else { next.add(code); if (k === 'write') { const r = (perms as readonly string[]).find((p) => p.endsWith('.read')); if (r) next.add(r); } }
                  next = new Set([...next]);
                  setEditRole({ ...editRole, permissions: [...next] });
                }} /> : <span className="text-muted">—</span>}</td>;
              })}</tr>
            ))}</tbody></table>
          {err._ && <p className="text-sm text-sale mt-3" role="alert">{err._}</p>}
        </Modal>
      )}
    </div>
  );
}

type SettingsMap = Record<string, Record<string, unknown>>;
const SECTIONS: { key: string; en: string; bn: string; fields: { k: string; label: string; type?: 'bool' | 'number' | 'image' | 'textarea' }[] }[] = [
  { key: 'store', en: 'Store', bn: 'স্টোর', fields: [{ k: 'name', label: 'Store name' }, { k: 'legalName', label: 'Legal name' }, { k: 'phone', label: 'Phone' }, { k: 'whatsapp', label: 'WhatsApp (8801…)' }, { k: 'email', label: 'Email' }, { k: 'address', label: 'Address', type: 'textarea' }, { k: 'tradeLicence', label: 'Trade licence' }, { k: 'bin', label: 'VAT BIN' }] },
  { key: 'seo', en: 'SEO', bn: 'এসইও', fields: [{ k: 'titleEn', label: 'Default title (EN)' }, { k: 'titleBn', label: 'Default title (বাংলা)' }, { k: 'descriptionEn', label: 'Default description (EN)', type: 'textarea' }, { k: 'descriptionBn', label: 'Default description (বাংলা)', type: 'textarea' }, { k: 'ogImage', label: 'Share image', type: 'image' }, { k: 'twitter', label: 'X / Twitter handle' }] },
  { key: 'social', en: 'Social', bn: 'সোশ্যাল', fields: [{ k: 'facebook', label: 'Facebook URL' }, { k: 'instagram', label: 'Instagram URL' }, { k: 'youtube', label: 'YouTube URL' }, { k: 'linkedin', label: 'LinkedIn URL' }] },
  { key: 'payments', en: 'Payments', bn: 'পেমেন্ট', fields: [{ k: 'bkash', label: 'bKash', type: 'bool' }, { k: 'nagad', label: 'Nagad', type: 'bool' }, { k: 'card', label: 'Cards / EMI (SSLCommerz)', type: 'bool' }, { k: 'cod', label: 'Cash on delivery', type: 'bool' }, { k: 'bank', label: 'Bank transfer', type: 'bool' }, { k: 'codAdvanceThreshold', label: 'COD advance required above (৳)', type: 'number' }, { k: 'codAdvancePercent', label: 'COD advance (%)', type: 'number' }] },
  { key: 'loyalty', en: 'Loyalty', bn: 'লয়্যালটি', fields: [{ k: 'pointsPer100', label: 'Points per ৳100', type: 'number' }, { k: 'redeemValue', label: 'Taka value per point', type: 'number' }] },
];

export function SettingsPage() {
  const { can } = useAuth();
  const { t } = usePrefs();
  const { toast } = useUi();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api<SettingsMap>('/admin/settings'), enabled: can('settings.read') });
  const [tab, setTab] = useState('store');
  const [draft, setDraft] = useState<SettingsMap>({});
  const [err, setErr] = useState('');
  if (!can('settings.read')) return <NoAccess />;
  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorBox error={q.error} />;
  const sec = SECTIONS.find((s) => s.key === tab)!;
  const val = { ...(q.data[tab] ?? {}), ...(draft[tab] ?? {}) };
  const setV = (k: string, v: unknown) => setDraft({ ...draft, [tab]: { ...(draft[tab] ?? {}), [k]: v } });
  return (
    <div data-testid="settings">
      <PageHeader title={t('Settings', 'সেটিংস')} actions={<Tabs value={tab} onChange={(v) => { setTab(v); setErr(''); }} items={SECTIONS.map((s) => [s.key, t(s.en, s.bn)] as [string, string])} />} />
      <Card title={t(sec.en, sec.bn)}>
        <fieldset disabled={!can('settings.write')} className="grid sm:grid-cols-2 gap-4">
          {sec.fields.map((f) => f.type === 'bool'
            ? <label key={f.k} className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" checked={!!val[f.k]} onChange={(e) => setV(f.k, e.target.checked)} />{f.label}</label>
            : <div key={f.k} className={f.type === 'textarea' || f.type === 'image' ? 'sm:col-span-2' : ''}><label htmlFor={`s-${f.k}`} className="label">{f.label}</label>
              {f.type === 'textarea' ? <textarea id={`s-${f.k}`} rows={2} className="input" value={String(val[f.k] ?? '')} onChange={(e) => setV(f.k, e.target.value)} />
                : f.type === 'image' ? <ImageInput id={`s-${f.k}`} value={(val[f.k] as string) ?? null} onChange={(v) => setV(f.k, v ?? '')} folder="settings" />
                : <input id={`s-${f.k}`} type={f.type === 'number' ? 'number' : 'text'} className="input" value={String(val[f.k] ?? '')} onChange={(e) => setV(f.k, f.type === 'number' ? Number(e.target.value) : e.target.value)} data-testid={`setting-${f.k}`} />}</div>)}
        </fieldset>
        {err && <p className="text-sm text-sale mt-4" role="alert">{err}</p>}
        {can('settings.write') && <div className="mt-6 flex gap-2"><button type="button" className="btn btn-primary btn-sm" disabled={!draft[tab]} data-testid="settings-save" onClick={async () => {
          setErr('');
          try { await api('/admin/settings', { method: 'PUT', body: { key: tab, value: val } }); toast(t('Settings saved — the store updates within a minute.', 'সেটিংস সংরক্ষিত।')); setDraft({ ...draft, [tab]: undefined as never }); qc.invalidateQueries({ queryKey: ['settings'] }); }
          catch (e) { setErr(Object.values((e as ApiError).fields).join(' · ') || (e as Error).message); }
        }}>{t('Save', 'সংরক্ষণ')}</button>{draft[tab] && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft({ ...draft, [tab]: undefined as never })}>{t('Discard', 'বাতিল')}</button>}</div>}
      </Card>
    </div>
  );
}
