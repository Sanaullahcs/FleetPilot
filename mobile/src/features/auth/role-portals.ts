import { getMobileRole, type MobileRole } from '@/constants/app';
import type { SignupRole } from '@/lib/auth-signup';
import { RoleAccents } from '@/constants/theme';

export const ROLE_PORTALS: Record<
  MobileRole,
  {
    label: string;
    appName: string;
    icon: 'bus' | 'people';
    outlineIcon: 'bus-outline' | 'people-outline';
    accent: string;
    signInTitle: string;
    signInSubtitle: string;
    signUpTitle: string;
    signUpSubtitle: string;
    demoEmail: string;
    highlights: Array<{ icon: 'navigate-outline' | 'list-outline' | 'location-outline' | 'chatbubbles-outline' | 'notifications-outline' | 'shield-checkmark-outline'; text: string }>;
  }
> = {
  driver: {
    label: 'Driver',
    appName: 'Driver app',
    icon: 'bus',
    outlineIcon: 'bus-outline',
    accent: RoleAccents.driver,
    signInTitle: 'Driver sign in',
    signInSubtitle: 'Today\'s runs, stop navigation, and student manifest',
    signUpTitle: 'Driver registration',
    signUpSubtitle: 'Apply to drive for your district transportation provider',
    demoEmail: 'driver@fleetpilot.test',
    highlights: [
      { icon: 'navigate-outline', text: 'GPS navigation to each stop' },
      { icon: 'list-outline', text: 'Run manifest & parent contacts' },
      { icon: 'chatbubbles-outline', text: 'Message dispatch & support' },
    ],
  },
  parent: {
    label: 'Parent',
    appName: 'Parent app',
    icon: 'people',
    outlineIcon: 'people-outline',
    accent: RoleAccents.parent,
    signInTitle: 'Parent sign in',
    signInSubtitle: 'Track your child\'s bus and receive route alerts',
    signUpTitle: 'Parent registration',
    signUpSubtitle: 'Link your account to your child\'s school transportation',
    demoEmail: 'parent@fleetpilot.test',
    highlights: [
      { icon: 'location-outline', text: 'Live bus tracking on the map' },
      { icon: 'notifications-outline', text: 'Pickup, delay & arrival alerts' },
      { icon: 'chatbubbles-outline', text: 'Message driver & school staff' },
    ],
  },
};

export const ROLE_DEMO_CREDENTIALS: Record<
  MobileRole,
  {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }
> = {
  driver: {
    email: 'driver@fleetpilot.test',
    password: 'password',
    firstName: 'Demo',
    lastName: 'Driver',
    phone: '555-010-2001',
  },
  parent: {
    email: 'parent@fleetpilot.test',
    password: 'password',
    firstName: 'Demo',
    lastName: 'Parent',
    phone: '555-010-3001',
  },
};

export function demoCredentialsForRole(role: MobileRole | SignupRole) {
  return ROLE_DEMO_CREDENTIALS[role];
}

export const ROLE_MISMATCH_MESSAGES: Record<MobileRole, string> = {
  driver: 'This account is a parent account. Select Parent above to sign in.',
  parent: 'This account is a driver account. Select Driver above to sign in.',
};
