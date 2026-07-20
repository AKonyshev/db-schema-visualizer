export interface ShortcutEntry {
  id: string;
  /** Значение `event.key` для исполняемых записей; для справочных — текст для легенды. */
  key: string;
  label: string;
  /** false — запись только для легенды, логика живёт в другом месте. */
  executable: boolean;
}

// Единственный источник правды: из него растут обработчик клавиш и легенда,
// поэтому легенда не может разойтись с тем, что реально нажимается.
export const SHORTCUTS = [
  { id: "colorRelations", key: "c", label: "Цветные связи", executable: true },
  {
    id: "animateRelations",
    key: "a",
    label: "Анимация связей",
    executable: true,
  },
  {
    id: "shortTableName",
    key: "s",
    label: "Короткое имя таблицы",
    executable: true,
  },
  {
    id: "detailLevel",
    key: "d",
    label: "Уровень детализации",
    executable: true,
  },
  { id: "autoArrange", key: "l", label: "Авто-раскладка", executable: true },
  { id: "fitToView", key: "f", label: "Вписать в экран", executable: true },
  { id: "legend", key: "?", label: "Показать эту легенду", executable: true },
  {
    id: "closeLegend",
    key: "Esc",
    label: "Закрыть легенду",
    executable: false,
  },
  {
    id: "search",
    key: "Ctrl/Cmd+F",
    label: "Поиск по таблицам",
    executable: false,
  },
  {
    id: "toggleRefs",
    key: "Alt+H",
    label: "Переключить Ref в DBML",
    executable: false,
  },
] as const satisfies readonly ShortcutEntry[];

export type ExecutableShortcutId = Extract<
  (typeof SHORTCUTS)[number],
  { executable: true }
>["id"];
