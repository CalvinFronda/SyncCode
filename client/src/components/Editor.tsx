import MonacoEditor from "@monaco-editor/react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

function Editor({ value, onChange, language }: EditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <MonacoEditor
      height="500px"
      language={language}
      value={value}
      onChange={handleEditorChange}
      theme="vs-dark"
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
