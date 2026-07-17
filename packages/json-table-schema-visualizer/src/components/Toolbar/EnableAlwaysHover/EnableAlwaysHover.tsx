import { HighlighterIcon } from "lucide-react";

import ToolbarButton from "../Button";

import useLocalStorage from "@/hooks/localStorage";

const EnableAlwaysHover = () => {
  const [isEnable, setIsEnable] = useLocalStorage<boolean>(
    "enableAlwaysHover",
    false,
  );

  return (
    <ToolbarButton
      title="Подсветка связей"
      aria-pressed={isEnable}
      onClick={() => {
        setIsEnable((prev) => !prev);
      }}
      className={isEnable ? "!text-blue-500 dark:!text-blue-400" : ""}
    >
      <HighlighterIcon />

      <span className="ml-2">Подсветка связей</span>
    </ToolbarButton>
  );
};

export default EnableAlwaysHover;
