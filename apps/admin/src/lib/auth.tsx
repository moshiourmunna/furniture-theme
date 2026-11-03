import { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export interface Staff { id: number; name: string; email: string | null; role: string | null; permissions: string[] }
interface Auth { user: Staff | null; loading: boolean; can: (perm: string) => boolean; refresh: () => Promise<unknown>; logout: () => Promise<void> }
const Ctx = createContext<Auth | null>(null);
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('AuthProvider missing'); return c; };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['me'], queryFn: () => api<{ user: Staff | null }>('/admin/auth/me').then((r) => r.user).catch(() => null), staleTime: 60_000, retry: false });
  useEffect(() => {
    const on = () => qc.setQueryData(['me'], null);
    window.addEventListener('shekor:unauthorized', on);
    return () => window.removeEventListener('shekor:unauthorized', on);
  }, [qc]);
  const user = q.data ?? null;
  const value: Auth = {
    user, loading: q.isLoading,
    can: (p) => !!user?.permissions.includes(p),
    refresh: () => qc.invalidateQueries({ queryKey: ['me'] }),
    logout: async () => { await api('/admin/auth/logout', { method: 'POST' }).catch(() => {}); qc.clear(); qc.setQueryData(['me'], null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
