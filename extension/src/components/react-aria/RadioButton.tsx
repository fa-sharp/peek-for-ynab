import { useFocusRing } from "@react-aria/focus";
import {
  type AriaRadioGroupProps,
  type AriaRadioProps,
  useRadio,
  useRadioGroup
} from "@react-aria/radio";
import { mergeProps } from "@react-aria/utils";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import {
  type RadioGroupProps,
  type RadioGroupState,
  useRadioGroupState
} from "@react-stately/radio";
import { clsx } from "clsx";
import { createProvider } from "puro";
import { useContext, useRef } from "react";

const { BaseContext: RadioButtonContext, Provider: RadioButtonProvider } = createProvider(
  ({ state }: { state: RadioGroupState }) => {
    return { state };
  }
);

interface RadioButtonGroupProps extends RadioGroupProps, AriaRadioGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function RadioButtonGroup({
  children,
  className,
  ...props
}: RadioButtonGroupProps) {
  const state = useRadioGroupState(props);
  const { radioGroupProps, labelProps, descriptionProps } = useRadioGroup(
    {
      ...props,
      orientation: "horizontal"
    },
    state
  );

  return (
    <div {...radioGroupProps} className={className}>
      <span {...labelProps}>{props.label}</span>
      <RadioButtonProvider state={state}>{children}</RadioButtonProvider>
      {props.description && (
        <div {...descriptionProps} style={{ fontSize: ".9em" }}>
          {props.description}
        </div>
      )}
    </div>
  );
}

export function RadioButton(props: AriaRadioProps) {
  const { state } = useContext(RadioButtonContext);
  const ref = useRef(null);
  const { inputProps } = useRadio(props, state, ref);
  const { focusProps, isFocusVisible } = useFocusRing();
  const isSelected = state.selectedValue === props.value;

  return (
    <label
      className={clsx("button small rounded hide-overflow max-w-32", {
        accent: isSelected,
        gray: !isSelected,
        focus: isFocusVisible
      })}>
      <VisuallyHidden>
        <input {...mergeProps(inputProps, focusProps)} ref={ref} />
      </VisuallyHidden>
      {props.children}
    </label>
  );
}
