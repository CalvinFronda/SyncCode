import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";

import Editor from "../components/Editor";
import Output from "../components/Output";
import UserList from "../components/UserList";
import Sidebar from "../components/Sidebar";
import { executeCode, ExecutionResult } from "../api/execute";

const DEFAULT_TEXT: Record<string, string> = {
  python: "# print('Hello world')",
  javascript: "// console.log('Hello World')",
};

function Room() {
  const { id: roomId } = useParams();
  const location = useLocation();
  const [username, setUsername] = useState<string>(() => {
    const saved = sessionStorage.getItem(`syncCode-username-${roomId}`);
    return saved || location.state?.username || "";
  });

  useEffect(() => {
    if (roomId && username) {
      sessionStorage.setItem(`syncCode-username-${roomId}`, username);
    }
  }, [roomId, username]);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const [editor, setEditor] = useState<any | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  const [code, setCode] = useState<string>(
    '# Write your Python code here\nprint("Hello, World!")'
  );

  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [users, setUsers] = useState<any[]>([]);

  // helper for random color (still randomized)
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

  const [triggeredBy, setTriggeredBy] = useState<string | undefined>(undefined);

  // Shared configuration state
  const configMap = ydoc.getMap("config");
  const [language, setLanguage] = useState("python");

  // Shared execution state
  const executionMap = ydoc.getMap("execution");

  // manages the lifetime of the Yjs document and the provider
  useEffect(() => {
    if (!roomId) return;
    if (!username) return; // Wait for username

    const provider = new WebsocketProvider(
      "wss://demos.yjs.dev/ws",
      `syncCode-${roomId}`,
      ydoc
    );

    // Set user awareness
    provider.awareness.setLocalStateField("user", {
      name: username,
      color: userColor,
    });

    // Listen to awareness changes
    provider.awareness.on("change", () => {
      const states = Array.from(provider.awareness.getStates().values());
      const users = states.map((state: any) => state.user).filter(Boolean);
      setUsers(users);
    });

    // Listen to config changes
    configMap.observe(() => {
      const newLanguage = configMap.get("language") as string;
      if (newLanguage && newLanguage !== language) {
        setLanguage(newLanguage);
      }
    });

    // Listen to execution state changes
    executionMap.observe(() => {
      const status = executionMap.get("status") as string;
      const runner = executionMap.get("triggeredBy") as string | undefined;
      const result = executionMap.get("result") as ExecutionResult | undefined;

      if (status === "running") {
        setIsRunning(true);
        setTriggeredBy(runner);
        setOutput(null);
      } else if (status === "completed" && result) {
        setIsRunning(false);
        setTriggeredBy(runner);
        setOutput({ ...result, triggeredBy: runner });
      }
    });

    setProvider(provider);
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [ydoc, roomId, username, userColor]);

  // manages the lifetime of the editor binding
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
    return () => {
      binding.destroy();
    };
  }, [ydoc, provider, editor]);

  const handleLanguageChange = (lang: string) => {
    configMap.set("language", lang);
    setLanguage(lang);
  };

  const handleRun = async () => {
    // Set shared state to running
    executionMap.set("status", "running");
    executionMap.set("triggeredBy", username);
    executionMap.set("result", null);

    try {
      const result = await executeCode(code, language);
      // Set shared state to completed with result
      const resultWithTrigger = { ...result, triggeredBy: username };
      executionMap.set("result", resultWithTrigger);
      executionMap.set("status", "completed");
    } catch (error) {
      const errorResult = {
        stdout: "",
        stderr: "",
        error:
          error instanceof Error ? error.message : "Failed to execute code",
        triggeredBy: username,
      };
      executionMap.set("result", errorResult);
      executionMap.set("status", "completed");
    }
  };

  const [inputName, setInputName] = useState("");

  if (!username) {
    return (
      <div className="landing-page">
        <div className="modal">
          <h1>Join Session</h1>
          <p>Please enter your name to join the room.</p>
          <div className="input-group">
            <input
              type="text"
              placeholder="Your Name"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="name-input"
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputName.trim())
                  setUsername(inputName);
              }}
            />
            <button
              onClick={() => inputName.trim() && setUsername(inputName)}
              className="create-button"
              disabled={!inputName.trim()}
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>SyncCode Room: {roomId?.slice(0, 8)}...</h1>
        <div className="header-controls">
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="share-button"
          >
            Share Link
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="run-button"
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
        </div>
      </header>

      <div className="main-content">
        <Sidebar language={language} setLanguage={handleLanguageChange} />

        <div className="room-layout-right">
          <div className="editor-output-split">
            <PanelGroup>
              <Panel>
                <div className="editor-section">
                  <Editor
                    defaultValue={DEFAULT_TEXT[language]}
                    onChange={setCode}
                    language={language}
                    onMount={(editor) => {
                      setEditor(editor);
                    }}
                  />
                </div>
              </Panel>
              <PanelResizeHandle className="resize-handle" />
              <Panel minSize={120}>
                <div className="output-section">
                  <h2>Output</h2>
                  <Output
                    result={output}
                    isRunning={isRunning}
                    triggeredBy={triggeredBy}
                  />
                </div>
              </Panel>
            </PanelGroup>
          </div>

          <div className="bottom-panel">
            <UserList
              users={users}
              currentUser={{ name: username, color: userColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room;
