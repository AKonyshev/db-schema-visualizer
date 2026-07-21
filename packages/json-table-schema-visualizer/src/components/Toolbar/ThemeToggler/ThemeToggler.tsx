import { Moon, Sun } from "lucide-react";

import ToolbarButton from "../Button";

import { t } from "@/i18n/t";
import { Theme } from "@/types/theme";
import { useThemeContext } from "@/hooks/theme";

// The stated exception to the toolbar's label rule. Stateful controls carry a
// label so their value can be read at a glance, but this one does not need one:
// the icon itself swaps between a sun and a moon, so it already is the
// indicator. A label would only restate it.
const ThemeToggler = () => {
  const { setTheme, theme } = useThemeContext();

  const handleThemeToggle = () => {
    setTheme(Theme.light === theme ? Theme.dark : Theme.light);
  };

  return (
    <ToolbarButton onClick={handleThemeToggle} label={t("action.themeToggle")}>
      <div className="cursor-pointer">
        <Sun className="dark:hidden" />

        <Moon className="hidden dark:block " />
      </div>
    </ToolbarButton>
  );
};

export default ThemeToggler;
