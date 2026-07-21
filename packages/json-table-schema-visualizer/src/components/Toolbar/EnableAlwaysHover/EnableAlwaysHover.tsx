import { PaletteIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { shortcutKeyFor } from "@/constants/shortcuts";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { t } from "@/i18n/t";
import useLocalStorage from "@/hooks/localStorage";

const EnableAlwaysHover = () => {
  // The stored key does not match this option's name on purpose — see
  // STORAGE_KEYS for why it must not be renamed.
  const [isEnable, setIsEnable] = useLocalStorage<boolean>(
    STORAGE_KEYS.COLOR_RELATIONS,
    false,
  );

  return (
    <ToolbarButton
      label={t("action.colorRelations")}
      shortcutKey={shortcutKeyFor("colorRelations")}
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
