import { Colors } from '@/constants/theme';

const VIEW_W = 48;
const VIEW_H = 56;

/** Web-only logo — avoids react-native-svg resolution issues on Expo web */
export function FleetPilotLogoMark({ size = 48 }: { size?: number }) {
  const height = Math.round(size * (VIEW_H / VIEW_W));

  return (
    <svg
      width={size}
      height={height}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M24 1.5C14.887 1.5 7.5 8.887 7.5 18c0 10.8 16.5 34.5 16.5 34.5S40.5 28.8 40.5 18C40.5 8.887 33.113 1.5 24 1.5Z"
        fill={Colors.orange}
      />
      <circle cx="24" cy="18.5" r="12.5" fill={Colors.white} />
      <g transform="translate(24 18.5)">
        <rect x="-9.5" y="-6.5" width="19" height="11" rx="2.2" fill={Colors.primary} />
        <rect x="-8" y="-7.8" width="16" height="2.2" rx="1" fill={Colors.primaryDark} />
        <circle cx="-4.5" cy="-8.6" r="0.9" fill="#FDE68A" />
        <circle cx="0" cy="-8.6" r="0.9" fill="#FDE68A" />
        <circle cx="4.5" cy="-8.6" r="0.9" fill="#FDE68A" />
        <rect x="-7.2" y="-5.2" width="6.2" height="4.2" rx="0.8" fill={Colors.primaryLight} />
        <rect x="1" y="-5.2" width="6.2" height="4.2" rx="0.8" fill={Colors.primaryLight} />
        <rect x="-11.2" y="-3.8" width="1.6" height="2.4" rx="0.5" fill={Colors.primaryDark} />
        <rect x="9.6" y="-3.8" width="1.6" height="2.4" rx="0.5" fill={Colors.primaryDark} />
        <circle cx="-5.8" cy="2.8" r="1.35" fill="#FEF3C7" />
        <circle cx="5.8" cy="2.8" r="1.35" fill="#FEF3C7" />
        <rect x="-3.2" y="1.6" width="6.4" height="1.2" rx="0.35" fill={Colors.primaryDark} />
        <line x1="-2.2" y1="1.6" x2="-2.2" y2="2.8" stroke={Colors.white} strokeWidth="0.45" />
        <line x1="0" y1="1.6" x2="0" y2="2.8" stroke={Colors.white} strokeWidth="0.45" />
        <line x1="2.2" y1="1.6" x2="2.2" y2="2.8" stroke={Colors.white} strokeWidth="0.45" />
        <rect x="-8.2" y="4.2" width="16.4" height="1.3" rx="0.45" fill={Colors.primaryDark} />
      </g>
    </svg>
  );
}
