import axios from "axios";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  error?: string;
  triggeredBy?: string;
}
// TODO: move into env var
const API_URL = "http://localhost:3000";

export async function executeCode(
  code: string,
  language: string = "python"
): Promise<ExecutionResult> {
  try {
    const response = await axios.post<ExecutionResult>(`${API_URL}/execute`, {
      code,
      language,
    });
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
