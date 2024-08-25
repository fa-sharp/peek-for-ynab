import React from "react";
import { ExternalLink, Rocket, X } from "tabler-icons-react";

import IconButton from "~components/IconButton";
import { LATEST_VERSION_ALERT_TEXT } from "~lib/constants";
import { useNotificationsContext } from "~lib/context";

function NewVersionAlert() {
  const { resetVersionAlert } = useNotificationsContext();

  const onOpenReleaseNotes = async () => {
    await resetVersionAlert();
    window.open(`${process.env.PLASMO_PUBLIC_MAIN_URL}/releases`, "_blank");
  };

  return (
    <div className="heading-small flex-row gap-xs justify-center mb-lg">
      <Rocket size={20} color="var(--error)" aria-hidden />
      {LATEST_VERSION_ALERT_TEXT}
      <IconButton
        label="See details"
        icon={<ExternalLink size={20} aria-hidden />}
        onClick={onOpenReleaseNotes}
      />
      <IconButton
        label="Dismiss"
        icon={<X size={20} aria-hidden />}
        onClick={resetVersionAlert}
      />
    </div>
  );
}

export default NewVersionAlert;
