import MonacoEditor from "@monaco-editor/react";

interface EditorProps {
  value?: string;
  defaultValue?: string;
  onChange: (value: string) => void;
  language: string;
  onMount: (editor: any) => any;
}

function Editor({
  value,
  defaultValue,
  onChange,
  language,
  onMount,
}: EditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <MonacoEditor
      height="89vh"
      language={language}
      value={value}
      defaultValue={defaultValue}
      onChange={handleEditorChange}
      theme="vs-dark"
      onMount={onMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: "on",
      }}
    />
  );
}

export default Editor;
