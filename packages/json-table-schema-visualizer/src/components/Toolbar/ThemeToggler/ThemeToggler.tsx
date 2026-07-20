import { Moon, Sun } from "lucide-react";

import ToolbarButton from "../Button";

import { t } from "@/i18n/t";
import { Theme } from "@/types/theme";
import { useThemeContext } from "@/hooks/theme";

const ThemeToggler = () => {
  const { setTheme, theme } = useThemeContext();

  const handleThemeToggle = () => {
    setTheme(Theme.light === theme ? Theme.dark : Theme.light);
  };

  return (
    <ToolbarButton
      onClick={handleThemeToggle}
      aria-label="Change theme mode"
      title={t("action.themeToggle")}
    >
      <div className="cursor-pointer">
        <Sun className="dark:hidden" />

        <Moon className="hidden dark:block " />
      </div>
    </ToolbarButton>
  );
};

export default ThemeToggler;
