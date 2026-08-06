import { useCallback, useState, type ReactNode } from "react";

const MIN_PERCENT = 15;
const MAX_PERCENT = 70;
const DEFAULT_PERCENT = 35;

interface SplitLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

const SplitLayout = ({ left, right }: SplitLayoutProps): JSX.Element => {
  const [leftPercent, setLeftPercent] = useState(DEFAULT_PERCENT);

  const startDrag = useCallback(() => {
    const onMove = (event: MouseEvent): void => {
      const percent = (event.clientX / window.innerWidth) * 100;
      // Clamped so neither pane can be dragged away entirely: a zero-width
      // editor cannot be typed in, and a zero-width diagram cannot be read.
      setLeftPercent(Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, percent)));
    };

    const onUp = (): void => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
    };

    // Dragging across a textarea would otherwise select its text.
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  return (
    <div className="flex h-full w-full">
      <div style={{ width: `${leftPercent}%` }} className="h-full min-w-0">
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize editor"
        onMouseDown={startDrag}
        className="w-1 shrink-0 cursor-col-resize bg-neutral-700 hover:bg-neutral-500"
      />
      <div className="h-full min-w-0 flex-1">{right}</div>
    </div>
  );
};

export default SplitLayout;
