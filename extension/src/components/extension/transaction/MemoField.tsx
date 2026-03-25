import { type ForwardedRef, forwardRef, type SetStateAction } from "react";
import { WorldWww } from "tabler-icons-react";

import IconButton from "~components/IconButton";
import type { AppSettings } from "~lib/types";
import { executeScriptInCurrentTab } from "~lib/utils";

type Props = {
  disabled?: boolean;
  memo?: string;
  setMemo: (memo: SetStateAction<string>) => void;
  settings?: AppSettings;
};

const MemoField = (
  { memo = "", setMemo, disabled, settings }: Props,
  ref: ForwardedRef<HTMLInputElement>
) => {
  const onCopyURLIntoMemo = async () => {
    const url = await executeScriptInCurrentTab(() => location.href);
    setMemo((memo) => memo + url);
  };

  return (
    <label className="form-input" htmlFor="memo-input">
      Memo
      <div className="flex-row">
        <input
          ref={ref}
          id="memo-input"
          aria-label="Memo"
          className="flex-grow"
          autoComplete="off"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          disabled={disabled}
        />
        {settings?.currentTabAccess && (
          <IconButton
            icon={<WorldWww strokeWidth={1} aria-hidden />}
            label="Copy URL into memo field"
            onClick={onCopyURLIntoMemo}
          />
        )}
      </div>
    </label>
  );
};
export default forwardRef(MemoField);
