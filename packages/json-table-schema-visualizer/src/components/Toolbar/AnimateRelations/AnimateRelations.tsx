import { WavesIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { STORAGE_KEYS } from "@/constants/storageKeys";
import { t } from "@/i18n/t";
import useLocalStorage from "@/hooks/localStorage";

const AnimateRelations = () => {
  const [isEnable, setIsEnable] = useLocalStorage<boolean>(
    STORAGE_KEYS.ANIMATE_RELATIONS,
    false,
  );

  return (
    <ToolbarButton
      title={t("action.animateRelations")}
      aria-pressed={isEnable}
      onClick={() => {
        setIsEnable((prev) => !prev);
      }}
      className={isEnable ? "!text-blue-500 dark:!text-blue-400" : ""}
    >
      <WavesIcon />

      <span className="ml-2">{t("action.animateRelations.compact")}</span>
    </ToolbarButton>
  );
};

export default AnimateRelations;
