import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const role = useAuthStore((s) => s.user?.role);

  if (role === 'driver') {
    return <Redirect href="/today" />;
  }

  if (role === 'parent') {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/today" />;
}
