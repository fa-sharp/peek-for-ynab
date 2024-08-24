import { AlertTriangle, Circle, type IconProps, LockOpen } from "tabler-icons-react";

export const OverspendingAlertIcon = () => (
  <AlertTriangle aria-hidden color="var(--stale)" size={18} />
);

export const ReconcileAlertIcon = () => (
  <LockOpen aria-hidden color="var(--stale)" size={18} />
);

export const UnapprovedAlertIcon = (props?: IconProps) => (
  <Circle aria-hidden fill="#2ea1be" stroke="transparent" size={18} {...props} />
);

export const ImportErrorIcon = () => (
  <AlertTriangle aria-hidden color="var(--stale)" size={18} />
);
