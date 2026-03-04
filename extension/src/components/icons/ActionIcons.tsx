import {
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  type IconProps,
  List,
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
export const AddTransactionIcon = (props?: IconProps) => (
  <Plus aria-hidden size={18} color="var(--action)" strokeWidth={1} {...props} />
);
export const AddTransferIcon = (props?: IconProps) => (
  <SwitchHorizontal
    aria-hidden
    size={18}
    color="var(--action)"
    strokeWidth={1}
    {...props}
  />
);
export const AddCCPaymentIcon = (props?: IconProps) => (
  <CreditCard aria-hidden size={18} color="var(--action)" strokeWidth={1} {...props} />
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

export const DetailIcon = () => (
  <List aria-hidden size={18} color="var(--action)" strokeWidth={1} />
);
export const CheckIcon = (props?: IconProps) => <Check aria-hidden {...props} />;
