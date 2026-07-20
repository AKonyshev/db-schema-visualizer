import { PaletteIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { t } from "@/i18n/t";
import useLocalStorage from "@/hooks/localStorage";

const EnableAlwaysHover = () => {
  // The key deliberately stays `enableAlwaysHover`: renaming it would reset the
  // setting for everyone who has already enabled the mode.
  const [isEnable, setIsEnable] = useLocalStorage<boolean>(
    "enableAlwaysHover",
    false,
  );

  return (
    <ToolbarButton
      title={t("action.colorRelations")}
      aria-pressed={isEnable}
      onClick={() => {
        setIsEnable((prev) => !prev);
      }}
      className={isEnable ? "!text-blue-500 dark:!text-blue-400" : ""}
    >
      <PaletteIcon />

      <span className="ml-2">{t("action.colorRelations")}</span>
    </ToolbarButton>
  );
};

export default EnableAlwaysHover;
