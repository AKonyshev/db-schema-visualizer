import { useEffect, useRef } from "react";

// What a drag carrying files reports, as opposed to one carrying text. Monaco
// drags selected text around inside itself, and that must keep working, so this
// is the test that decides whether the page takes the event at all.
const carriesFiles = (event: DragEvent): boolean =>
  event.dataTransfer?.types.includes("Files") ?? false;

/**
 * Lets a file dropped anywhere on the page become the open document.
 *
 * On `window` rather than on a drop zone, because the reader's aim is not the
 * point — a schema dropped on the diagram means the same thing as one dropped on
 * the editor. And in the capture phase, because Monaco installs its own drop
 * handler: left to bubble, a dropped file would reach the editor first and be
 * pasted as a path, and the default action would replace the page with the file.
 */
export const useFileDrop = (onFile: (file: File) => void): void => {
  // Through a ref so a caller that rebuilds its callback each render does not
  // detach and reattach the window listeners on every keystroke.
  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;

  useEffect(() => {
    const onDragOver = (event: DragEvent): void => {
      if (!carriesFiles(event)) {
        return;
      }
      // Without this the drop event never fires at all: the default dragover
      // action is to refuse the drag.
      event.preventDefault();
      if (event.dataTransfer !== null) {
        event.dataTransfer.dropEffect = "copy";
      }
    };

    const onDrop = (event: DragEvent): void => {
      if (!carriesFiles(event)) {
        return;
      }
      // The default is for the browser to navigate to the file, discarding
      // everything the reader has typed.
      event.preventDefault();
      event.stopPropagation();

      const file = event.dataTransfer?.files[0];
      if (file !== undefined) {
        onFileRef.current(file);
      }
    };

    window.addEventListener("dragover", onDragOver, true);
    window.addEventListener("drop", onDrop, true);

    return () => {
      window.removeEventListener("dragover", onDragOver, true);
      window.removeEventListener("drop", onDrop, true);
    };
  }, []);
};
