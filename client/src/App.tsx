import { useState } from "react";

import Editor from "./components/Editor";
import Output from "./components/Output";
import { executePython } from "./api/execute";
import "./App.css";

interface ExecutionResult {
  stdout: string;
  stderr: string;
  error?: string;
}

function App() {
  const [code, setCode] = useState<string>(
    '# Write your Python code here\nprint("Hello, World!")'
  );
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

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
          <Editor value={code} onChange={setCode} language="python" />
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
