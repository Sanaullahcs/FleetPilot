/** Monochrome SVG vehicle icons for Leaflet markers. */
export function vehicleMarkerSvg(type: string): string {
  switch (type) {
    case "bus":
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5V15a2.5 2.5 0 0 1-2.5 2.5H19a1.5 1.5 0 1 1-3 0H8a1.5 1.5 0 1 1-3 0H5.5A2.5 2.5 0 0 1 3 15V8.5Z" fill="currentColor"/>
        <path d="M3 12h18" stroke="white" stroke-width="0.9" opacity="0.55"/>
        <rect x="5.5" y="8.5" width="3" height="2.5" rx="0.35" fill="white" opacity="0.7"/>
        <rect x="9.75" y="8.5" width="3" height="2.5" rx="0.35" fill="white" opacity="0.7"/>
        <rect x="14" y="8.5" width="3" height="2.5" rx="0.35" fill="white" opacity="0.7"/>
        <rect x="18.25" y="8.5" width="1.75" height="2.5" rx="0.35" fill="white" opacity="0.7"/>
        <circle cx="7.25" cy="17.5" r="1.35" fill="white" stroke="currentColor" stroke-width="1.1"/>
        <circle cx="16.75" cy="17.5" r="1.35" fill="white" stroke="currentColor" stroke-width="1.1"/>
        <path d="M9.5 6V4.75A1.25 1.25 0 0 1 10.75 3.5h2.5A1.25 1.25 0 0 1 14.5 4.75V6" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
      </svg>`;
    case "sedan":
      return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4 14h16l-1.5-4.5a2 2 0 0 0-1.9-1.3H7.4a2 2 0 0 0-1.9 1.3L4 14z" fill="currentColor"/>
        <circle cx="7.5" cy="15.5" r="1.5" fill="white" stroke="currentColor" stroke-width="1.1"/>
        <circle cx="16.5" cy="15.5" r="1.5" fill="white" stroke="currentColor" stroke-width="1.1"/>
      </svg>`;
    case "wheelchair_van":
      return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="7" width="18" height="9" rx="2" fill="currentColor"/>
        <circle cx="8" cy="17" r="1.5" fill="white" stroke="currentColor" stroke-width="1.1"/>
        <circle cx="16" cy="17" r="1.5" fill="white" stroke="currentColor" stroke-width="1.1"/>
        <circle cx="17" cy="10" r="1.5" fill="white" opacity="0.85"/>
      </svg>`;
    default:
      return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="8" width="18" height="8" rx="2" fill="currentColor"/>
        <circle cx="7.5" cy="17" r="1.5" fill="white" stroke="currentColor" stroke-width="1.1"/>
        <circle cx="16.5" cy="17" r="1.5" fill="white" stroke="currentColor" stroke-width="1.1"/>
      </svg>`;
  }
}

export function routeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    am: "Morning (AM)",
    pm: "Afternoon (PM)",
    midday: "Midday",
    activity: "Activity",
    sped: "Special ed",
    charter: "Charter",
  };
  return map[type] ?? type.toUpperCase();
}
