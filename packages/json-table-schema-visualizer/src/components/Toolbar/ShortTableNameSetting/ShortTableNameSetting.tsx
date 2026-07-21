import { TypeIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { shortcutKeyFor } from "@/constants/shortcuts";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { t } from "@/i18n/t";
import useLocalStorage from "@/hooks/localStorage";

const ShortTableNameSetting = () => {
  const [isEnable, setIsEnable] = useLocalStorage<boolean>(
    STORAGE_KEYS.SHORT_TABLE_NAME,
    false,
  );

  return (
    <ToolbarButton
      label={t("action.shortTableName")}
      shortcutKey={shortcutKeyFor("shortTableName")}
      aria-pressed={isEnable}
      onClick={() => {
        setIsEnable((prev) => !prev);
      }}
      className={isEnable ? "!text-blue-500 dark:!text-blue-400" : ""}
    >
      <TypeIcon />

      <span className="ml-2">{t("action.shortTableName.compact")}</span>
    </ToolbarButton>
  );
};

export default ShortTableNameSetting;
