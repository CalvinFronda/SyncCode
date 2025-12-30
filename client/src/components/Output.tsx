interface ExecutionResult {
  stdout: string;
  stderr: string;
  error?: string;
}

interface OutputProps {
  result: ExecutionResult | null;
  isRunning: boolean;
}

function Output({ result, isRunning }: OutputProps) {
  if (isRunning) {
    return (
      <div className="output-container running">
        <p>Executing code...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="output-container empty">
        <p className="placeholder">Click "Run Code" to see output</p>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="output-container error">
        <h3>Error</h3>
        <pre>{result.error}</pre>
      </div>
    );
  }

  return (
    <div className="output-container">
      {result.stdout && (
        <div className="stdout">
          <h3>Output</h3>
          <pre>{result.stdout}</pre>
        </div>
      )}

      {result.stderr && (
        <div className="stderr">
          <h3>Errors</h3>
          <pre>{result.stderr}</pre>
        </div>
      )}

      {!result.stdout && !result.stderr && (
        <p className="placeholder">No output</p>
      )}
    </div>
  );
}

export default Output;
