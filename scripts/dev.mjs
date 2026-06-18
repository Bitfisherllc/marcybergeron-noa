#!/usr/bin/env node
/**
 * Dev server tuned for projects on network volumes (e.g. /Volumes/Whale).
 * Uses webpack + polling so file changes are detected over SMB/NFS.
 */
import { spawn } from "node:child_process";
import { cwd } from "node:process";

const onNetworkVolume = cwd().startsWith("/Volumes/");
const args = ["dev", ...(onNetworkVolume ? ["--webpack"] : [])];

if (onNetworkVolume) {
  console.log("Network volume detected — using webpack file polling for reliable hot reload.\n");
}

const child = spawn("next", args, { stdio: "inherit", env: process.env, shell: true });
child.on("exit", (code) => process.exit(code ?? 0));
