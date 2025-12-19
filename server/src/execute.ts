import { spawn } from "child_process";

export function executePython(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const docker = spawn("docker", [
      "run",
      "--rm",
      "--network=none",
      "--memory=256m",
      "--cpus=0.5",
      "-e",
      `CODE=${code}`,
      "python-runner",
    ]);

    let output = "";

    docker.stdout.on("data", (data) => {
      output += data.toString();
    });

    docker.stderr.on("data", (data) => {
      output += data.toString();
    });

    docker.on("close", () => {
      resolve(output);
    });

    docker.on("error", reject);
  });
}
