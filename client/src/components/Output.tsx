export interface ExecutionResult {
  stdout: string;
  stderr: string;
  error?: string;
  triggeredBy?: string;
}

interface OutputProps {
  results: ExecutionResult[];
  isRunning: boolean;
  triggeredBy?: string;
}

function Output({ results, isRunning, triggeredBy }: OutputProps) {
  if (isRunning) {
    return (
      <div className="output-container running">
        <p>
          Executing code...
          {triggeredBy && (
            <span className="runner-info"> (Run by {triggeredBy})</span>
          )}
        </p>
      </div>
    );
  }

  if (results.length < 1) {
    return (
      <div className="output-container empty">
        <p className="placeholder">Click "Run Code" to see output</p>
      </div>
    );
  }

  return (
    <div className="output-container">
      {results.map((result, i) => (
        <div key={i} className="log-entry">
          <div className="log-header">
            {result.triggeredBy ? (
              <span className="runner-label">Run by {result.triggeredBy}</span>
            ) : (
              <span className="runner-label">Run</span>
            )}
          </div>

          {result.stdout && (
            <div className="stdout">
              <pre>{result.stdout}</pre>
            </div>
          )}

          {result.stderr && (
            <div className="stderr">
              <h3>Error</h3>
              <pre>{result.stderr}</pre>
            </div>
          )}

          {!result.stdout && !result.stderr && (
            <p className="placeholder">No output</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default Output;
