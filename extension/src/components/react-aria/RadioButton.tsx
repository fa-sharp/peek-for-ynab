import { useFocusRing } from "@react-aria/focus";
import {
  type AriaRadioGroupProps,
  type AriaRadioProps,
  useRadio,
  useRadioGroup,
} from "@react-aria/radio";
import { mergeProps } from "@react-aria/utils";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import {
  type RadioGroupProps,
  type RadioGroupState,
  useRadioGroupState,
} from "@react-stately/radio";
import { clsx } from "clsx";
import { createContext, useContext, useRef } from "react";

interface RadioButtonGroupProps extends RadioGroupProps, AriaRadioGroupProps {
  children: React.ReactNode;
  className?: string;
}

const useRadioButtonProvider = (props: { state: RadioGroupState }) => props;
//@ts-expect-error Context should not be null if wrapped in provider
const RadioButtonContext = createContext<ReturnType<typeof useRadioButtonProvider>>(null);

export function RadioButtonGroup({
  children,
  className,
  ...props
}: RadioButtonGroupProps) {
  const state = useRadioGroupState(props);
  const { radioGroupProps, labelProps, descriptionProps } = useRadioGroup(
    {
      ...props,
      orientation: "horizontal",
    },
    state
  );

  return (
    <div {...radioGroupProps} className={className}>
      <span {...labelProps}>{props.label}</span>
      <RadioButtonContext.Provider value={{ state }}>
        {children}
      </RadioButtonContext.Provider>
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
        focus: isFocusVisible,
      })}>
      <VisuallyHidden>
        <input {...mergeProps(inputProps, focusProps)} ref={ref} />
      </VisuallyHidden>
      {props.children}
    </label>
  );
}
