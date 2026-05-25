import useLocalStorage from "@/hooks/localStorage";

interface EnableAlwaysHoverProps {
  refresh: () => void;
}

const EnableAlwaysHover = ({ refresh }: EnableAlwaysHoverProps) => {
  const [isEnable, setIsEnable] = useLocalStorage<boolean>(
    "enableAlwaysHover",
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
      Подсветка связей
    </label>
  );
};

export default EnableAlwaysHover;
