import { AlertTriangle, type IconProps, InfoCircle, LockOpen } from "tabler-icons-react";

export const OverspendingAlertIcon = () => (
  <AlertTriangle color="var(--stale)" size={18} />
);

export const ReconcileAlertIcon = () => <LockOpen color="var(--stale)" size={18} />;

export const UnapprovedAlertIcon = (props?: IconProps) => (
  <InfoCircle fill="#2ea1be" stroke="white" size={16} {...props} />
);

export const ImportErrorIcon = () => <AlertTriangle color="var(--stale)" size={18} />;
