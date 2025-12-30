import { useEffect, useMemo, useState } from "react";

import Editor from "./components/Editor";
import Output from "./components/Output";
import { executePython } from "./api/execute";
import "./App.css";

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

interface ExecutionResult {
  stdout: string;
  stderr: string;
  error?: string;
}
const roomname = `syncCode-${new Date().toLocaleDateString("en-CA")}`;
function App() {
  const ydoc = useMemo(() => new Y.Doc(), []);
  const [editor, setEditor] = useState<any | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [binding, setBinding] = useState<MonacoBinding | null>(null);

  const [code, setCode] = useState<string>(
    '# Write your Python code here\nprint("Hello, World!")'
  );
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // helper for random colors
  const userColor = useMemo(() => {
    const colors = [
      "#ff6b6b",
      "#feca57",
      "#48dbfb",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const username = useMemo(() => `User ${Math.floor(Math.random() * 100)}`, []);

  // this effect manages the lifetime of the Yjs document and the provider
  useEffect(() => {
    const provider = new WebsocketProvider(
      "wss://demos.yjs.dev/ws",
      roomname,
      ydoc
    );

    // Set user awareness
    provider.awareness.setLocalStateField("user", {
      name: username,
      color: userColor,
    });

    setProvider(provider);
    return () => {
      provider?.destroy();
      ydoc.destroy();
    };
  }, [ydoc, userColor, username]);

  // this effect manages the lifetime of the editor binding
  useEffect(() => {
    if (provider == null || editor == null) {
      return;
    }

    const binding = new MonacoBinding(
      ydoc.getText("monaco"),
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
    setBinding(binding);
    return () => {
      binding.destroy();
    };
  }, [ydoc, provider, editor]);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);

    try {
      const result = await executePython(code);
      setOutput(result);
    } catch (error) {
      setOutput({
        stdout: "",
        stderr: "",
        error:
          error instanceof Error ? error.message : "Failed to execute code",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Mini CoderPad</h1>
        <button onClick={handleRun} disabled={isRunning} className="run-button">
          {isRunning ? "Running..." : "Run Code"}
        </button>
      </header>

      <div className="main-content">
        <div className="editor-section">
          <h2>Code Editor</h2>
          <Editor
            defaultValue={code}
            onChange={setCode}
            language="python"
            onMount={(editor) => {
              setEditor(editor);
            }}
          />
        </div>

        <div className="output-section">
          <h2>Output</h2>
          <Output result={output} isRunning={isRunning} />
        </div>
      </div>
    </div>
  );
}

export default App;
