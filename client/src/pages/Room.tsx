import { useEffect, useMemo, useRef, useState } from "react";
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
import JoinSessionModal from "@/components/JoinSessionModal";
import axios from "axios";

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
  const [outputLog, setOutPutLog] = useState<ExecutionResult[]>([]);

  const [code, setCode] = useState<string>(DEFAULT_TEXT.python);

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
  const languageRef = useRef(language);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

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

    // Observer for awareness
    const handleAwarenessChange = () => {
      const states = Array.from(provider.awareness.getStates().values());
      const users = states.map((state: any) => state.user).filter(Boolean);
      setUsers(users);
    };

    // Observer for config
    const configObserver = () => {
      const newLanguage = configMap.get("language") as string;
      if (newLanguage && newLanguage !== languageRef.current) {
        setLanguage(newLanguage);
        setOutPutLog([]);
      }
    };

    // Observer for execution
    const executionObserver = () => {
      const status = executionMap.get("status") as string;
      const runner = executionMap.get("triggeredBy") as string | undefined;
      const result = executionMap.get("result") as ExecutionResult | undefined;

      if (status === "running") {
        setIsRunning(true);
        setTriggeredBy(runner);
      } else if (status === "completed" && result) {
        setIsRunning(false);
        setTriggeredBy(runner);
        setOutPutLog((prev) => [...prev, { ...result, triggeredBy: runner }]);
      }
    };

    // Attach listeners
    provider.awareness.on("change", handleAwarenessChange);
    configMap.observe(configObserver);
    executionMap.observe(executionObserver);

    setProvider(provider);

    return () => {
      provider.awareness.off("change", handleAwarenessChange);
      configMap.unobserve(configObserver);
      executionMap.unobserve(executionObserver);
      provider.destroy();
    };
  }, [ydoc, roomId, username, userColor]);

  // manages the lifetime of the editor binding
  useEffect(() => {
    if (provider == null || editor == null) {
      return;
    }

    const yText = ydoc.getText("monaco");
    if (yText.toString() === "") {
      yText.insert(0, DEFAULT_TEXT[language] || DEFAULT_TEXT.python);
    }

    const binding = new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
    return () => {
      binding.destroy();
    };
  }, [ydoc, provider, editor]);

  const handleLanguageChange = (newLang: string) => {
    const yText = ydoc.getText("monaco");
    const currentContent = yText.toString().trim();

    // Check if content matches any default text (so we don't overwrite user code)
    const isDefault = Object.values(DEFAULT_TEXT).some(
      (text) => text.trim() === currentContent
    );

    if (isDefault) {
      yText.delete(0, yText.length);
      yText.insert(0, DEFAULT_TEXT[newLang]);
    }

    configMap.set("language", newLang);

    setLanguage(newLang);
    setOutPutLog([]);
  };

  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    if (!username || !roomId) return;

    // Fetch session token
    // Use same logic as execute.ts: Dev -> 3000, Prod -> Relative
    const baseUrl = import.meta.env.DEV
      ? "http://localhost:3000"
      : import.meta.env.VITE_NGROK_URL;

    axios
      .post(`${baseUrl}/session`, { roomId, username })
      .then((res) => {
        setSessionToken(res.data.token);
      })
      .catch((err) => {
        console.error("Failed to get session token", err);
      });
  }, [username, roomId]);

  const handleRun = async () => {
    if (!sessionToken) {
      alert("No session token! Cannot execute.");
      return;
    }

    // Set shared state to running
    executionMap.set("status", "running");
    executionMap.set("triggeredBy", username);
    executionMap.set("result", null);

    try {
      const result = await executeCode(code, language, sessionToken);
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

  if (!username) {
    return (
      <div className="landing-page">
        <JoinSessionModal onInputChange={setUsername} />
      </div>
    );
  }

  function handleResetOutput() {
    setOutPutLog([]);
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
              <Panel minSize={170}>
                <div className="output-section">
                  <div className="output-header">
                    <h2>Output</h2>
                    <button onClick={handleResetOutput}>Reset</button>
                  </div>
                  <Output
                    results={outputLog}
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
