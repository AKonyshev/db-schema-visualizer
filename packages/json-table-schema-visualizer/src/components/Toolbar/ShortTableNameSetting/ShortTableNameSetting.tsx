import { TypeIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { t } from "@/i18n/t";
import useLocalStorage from "@/hooks/localStorage";

const ShortTableNameSetting = () => {
  const [isEnable, setIsEnable] = useLocalStorage<boolean>(
    "shortTableNameSetting",
    false,
  );

  return (
    <ToolbarButton
      title={t("action.shortTableName")}
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
