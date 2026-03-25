import {
  AlertTriangle,
  Circle,
  type IconProps,
  Loader2,
  LockOpen,
} from "tabler-icons-react";

export const OverspendingAlertIcon = () => (
  <AlertTriangle aria-hidden color="var(--stale)" size={18} />
);

export const ReconcileAlertIcon = () => (
  <LockOpen aria-hidden color="var(--stale)" size={18} />
);

export const UnapprovedAlertIcon = (props?: IconProps) => (
  <Circle aria-hidden fill="#2ea1be" stroke="transparent" size={16} {...props} />
);

export const LoadingIcon = () => (
  <Loader2 aria-hidden fill="transparent" stroke="#2ea1be" size={16} />
);

export const ImportErrorIcon = () => (
  <AlertTriangle aria-hidden color="var(--stale)" size={18} />
);
