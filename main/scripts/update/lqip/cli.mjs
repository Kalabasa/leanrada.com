#!/usr/bin/env node
import { rewriteLQIP } from "./lqip.mjs";

const dryRun = process.argv.includes("--dry-run");
const refresh = process.argv.includes("--refresh");
const htmlFilePath = process.argv[process.argv.length - 1];
rewriteLQIP({ dryRun, refresh, includeVideos: true, htmlFilePath });
