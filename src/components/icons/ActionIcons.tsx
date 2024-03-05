import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  List,
  Pinned,
  Plus,
  SwitchHorizontal
} from "tabler-icons-react";

export const PinnedItemIcon = () => (
  <Pinned size={18} color="var(--action)" fill="var(--action)" strokeWidth={1} />
);
export const PinItemIcon = () => (
  <Pinned size={18} color="var(--action)" strokeWidth={1} />
);
export const AddTransactionIcon = () => (
  <Plus size={18} color="var(--action)" strokeWidth={1} />
);
export const AddTransferIcon = () => (
  <SwitchHorizontal size={18} color="var(--action)" strokeWidth={1} />
);
export const AddCCPaymentIcon = () => (
  <CreditCard size={18} color="var(--action)" strokeWidth={1} />
);

export const ExpandListIcon = () => (
  <ChevronDown size={24} color="var(--action)" strokeWidth={1} />
);
export const CollapseListIcon = () => (
  <ChevronUp size={24} color="var(--action)" strokeWidth={1} />
);

export const ExpandListIconBold = () => (
  <ChevronDown size={24} color="var(--action)" strokeWidth={2} />
);
export const CollapseListIconBold = () => (
  <ChevronUp size={24} color="var(--action)" strokeWidth={2} />
);

export const DetailIcon = () => <List size={18} color="var(--action)" strokeWidth={1} />;
