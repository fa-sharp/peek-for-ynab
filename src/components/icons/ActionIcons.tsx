import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Pinned,
  Plus,
  SwitchHorizontal
} from "tabler-icons-react";

export const PinnedItemIcon = () => (
  <Pinned
    aria-hidden
    size={18}
    color="var(--action)"
    fill="var(--action)"
    strokeWidth={1}
  />
);
export const PinItemIcon = () => (
  <Pinned aria-hidden size={18} color="var(--action)" strokeWidth={1} />
);
export const AddTransactionIcon = () => (
  <Plus aria-hidden size={18} color="var(--action)" strokeWidth={1} />
);
export const AddTransferIcon = () => (
  <SwitchHorizontal aria-hidden size={18} color="var(--action)" strokeWidth={1} />
);
export const AddCCPaymentIcon = () => (
  <CreditCard aria-hidden size={18} color="var(--action)" strokeWidth={1} />
);

export const ExpandListIcon = () => (
  <ChevronDown aria-hidden size={24} color="var(--action)" strokeWidth={1} />
);
export const CollapseListIcon = () => (
  <ChevronUp aria-hidden size={24} color="var(--action)" strokeWidth={1} />
);

export const ExpandListIconBold = () => (
  <ChevronDown aria-hidden size={24} color="var(--action)" strokeWidth={2} />
);
export const CollapseListIconBold = () => (
  <ChevronUp aria-hidden size={24} color="var(--action)" strokeWidth={2} />
);
