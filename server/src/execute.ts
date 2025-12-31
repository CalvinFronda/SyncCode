import { spawn } from "child_process";

interface ExecutionResult {
  stdout: string;
  stderr: string;
  error?: string;
}
const IMAGE_MAP: Record<string, string> = {
  python: "python-runner",
  javascript: "js-runner",
};

export function executeCode(
  language: string,
  code: string
): Promise<ExecutionResult> {
  return new Promise((resolve, reject) => {
    const docker = spawn("docker", [
      "run",
      "--rm",
      "--network=none",
      "--memory=256m",
      "--cpus=0.5",
      "-e",
      `CODE=${code}`,
      `${IMAGE_MAP[language]}`,
    ]);

    let stdout = "";
    let stderr = "";

    docker.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    docker.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    docker.on("close", () => {
      resolve({ stdout, stderr });
    });

    docker.on("error", (error) => {
      resolve({ stdout: "", stderr: "", error: error.message });
    });
  });
}
