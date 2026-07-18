import { PaletteIcon } from "lucide-react";

import ToolbarButton from "../Button";

import useLocalStorage from "@/hooks/localStorage";

const EnableAlwaysHover = () => {
  // Ключ намеренно остаётся `enableAlwaysHover`: переименование сбросило бы
  // настройку у всех, кто уже включил режим.
  const [isEnable, setIsEnable] = useLocalStorage<boolean>(
    "enableAlwaysHover",
    false,
  );

  return (
    <ToolbarButton
      title="Цветные связи"
      aria-pressed={isEnable}
      onClick={() => {
        setIsEnable((prev) => !prev);
      }}
      className={isEnable ? "!text-blue-500 dark:!text-blue-400" : ""}
    >
      <PaletteIcon />

      <span className="ml-2">Цветные связи</span>
    </ToolbarButton>
  );
};

export default EnableAlwaysHover;
