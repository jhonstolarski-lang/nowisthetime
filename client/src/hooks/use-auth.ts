import { trpc } from '../lib/trpc';

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
