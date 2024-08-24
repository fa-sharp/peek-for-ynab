import { AlertTriangle, LockOpen } from "tabler-icons-react";

export const OverspendingAlertIcon = () => (
  <AlertTriangle color="var(--stale)" size={18} />
);

export const ReconcileAlertIcon = () => <LockOpen color="var(--stale)" size={18} />;

export const ImportErrorIcon = () => <AlertTriangle color="var(--stale)" size={18} />;
