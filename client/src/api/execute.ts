import axios from "axios";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  error?: string;
  triggeredBy?: string;
}
// TODO: move into env var
// In Dev (Vite), point to separate server. In Prod (Express), use relative path.
const API_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : import.meta.env.VITE_NGROK_URL;

export async function executeCode(
  code: string,
  language: string = "python",
  token: string
): Promise<ExecutionResult> {
  try {
    const response = await axios.post<ExecutionResult>(
      `${API_URL}/execute`,
      {
        code,
        language,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ExecutionResult;
    }
    return {
      stdout: "",
      stderr: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
