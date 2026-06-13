import {
  Building2,
  Handshake,
  IdCard,
  MapPinned,
  School,
} from "lucide-react";

const iconProps = {
  size: 20,
  strokeWidth: 2,
  "aria-hidden": true as const,
  className: "shrink-0",
};

/** Fleet company / transportation provider */
export function RoleIconTransportationProvider() {
  return <Building2 {...iconProps} />;
}

/** Subcontractor linked to a provider */
export function RoleIconContractor() {
  return <Handshake {...iconProps} />;
}

/** School campus contact */
export function RoleIconSchool() {
  return <School {...iconProps} />;
}

/** Route driver */
export function RoleIconDriver() {
  return <IdCard {...iconProps} />;
}

/** Parent / guardian — live tracking */
export function RoleIconParent() {
  return <MapPinned {...iconProps} />;
}
