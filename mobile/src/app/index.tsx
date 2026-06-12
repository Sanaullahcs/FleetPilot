import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { getMobileRole } from '@/constants/app';

/** Post-login entry — sends users to the correct home tab. */
export default function Index() {
  const navigationState = useRootNavigationState();
  const { token, user, loading } = useAuthStore();
  const mobileRole = getMobileRole(user);
  const allowed = !!(token && user && mobileRole);

  // Redirecting before the navigation container is ready crashes release APKs.
  if (!navigationState?.key || loading) {
    return null;
  }

  if (!allowed) {
    return <Redirect href="/sign-in" />;
  }

  if (mobileRole === 'parent') {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/today" />;
}
