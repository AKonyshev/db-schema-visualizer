import useLocalStorage from "@/hooks/localStorage";

interface ShortTableNameSettingProps {
  refresh: () => void;
}

const ShortTableNameSetting = ({ refresh }: ShortTableNameSettingProps) => {
  const [isEnable, setIsEnable] = useLocalStorage<boolean>(
    "shortTableNameSetting",
    false,
  );

  return (
    <label className="flex items-center gap-2 text-xs cursor-pointer">
      <input
        type="checkbox"
        checked={isEnable}
        className="accent-white"
        onChange={(event) => {
          setIsEnable(event.target.checked);
          refresh();
        }}
      />
      Короткое имя таблицы
    </label>
  );
};

export default ShortTableNameSetting;
