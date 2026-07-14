import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Favorite = { id: string; path: string; label: string };

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('user_favorites')
      .select('id, path, label')
      .eq('user_id', uid)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    setFavorites((data as Favorite[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) load(uid);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) load(uid);
      else setFavorites([]);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const isFavorite = useCallback(
    (path: string) => favorites.some((f) => f.path === path),
    [favorites]
  );

  const toggle = useCallback(
    async (path: string, label: string) => {
      if (!userId) return;
      const existing = favorites.find((f) => f.path === path);
      if (existing) {
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
        await supabase.from('user_favorites').delete().eq('id', existing.id);
      } else {
        const { data } = await supabase
          .from('user_favorites')
          .insert({ user_id: userId, path, label, position: favorites.length })
          .select('id, path, label')
          .single();
        if (data) setFavorites((prev) => [...prev, data as Favorite]);
      }
    },
    [userId, favorites]
  );

  return { favorites, isFavorite, toggle, loading };
}
