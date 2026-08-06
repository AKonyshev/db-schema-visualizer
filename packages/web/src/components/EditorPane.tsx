export interface EditorPaneProps {
  value: string;
  onChange: (next: string) => void;
}

// Two properties, deliberately: a real code editor replaces the textarea behind
// this interface without the rest of the page learning which one it got.
const EditorPane = ({ value, onChange }: EditorPaneProps): JSX.Element => (
  <textarea
    aria-label="DBML source"
    className="h-full w-full resize-none border-0 bg-transparent p-3 font-mono text-sm text-neutral-200 outline-none"
    spellCheck={false}
    value={value}
    onChange={(event) => {
      onChange(event.target.value);
    }}
  />
);

export default EditorPane;
