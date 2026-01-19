#!/usr/bin/env node
import fs from "node:fs";
import express from "express";
import { getProjects } from "./util/get_projects.js";
import path from "node:path";
import { colorInfo, colorVerbose } from "./util/colors.js";

export function runDevServer(port) {
  const projects = getProjects().sort(
    (a, b) => b.sitePathPrefix.length - a.sitePathPrefix.length
  );

  const app = express();

  for (const project of projects) {
    const sitePathPrefix = path.resolve("/", project.sitePathPrefix);
    const route = [
      sitePathPrefix,
      path.resolve(sitePathPrefix, "*"),
    ];
    app.get(route, (req, res) => {
      const reqPath = normalizeReqPath(req.path);

      let siteRelPath = path.relative(
        sitePathPrefix,
        decodeURIComponent(reqPath)
      );

      try {
        if (fs.statSync(getFsPath(project, siteRelPath)).isDirectory()) {
          siteRelPath = path.relative(
            sitePathPrefix,
            path.join(reqPath, "index.html")
          );
        }
      } catch (e) {
        console.log(e);
      }

      if (req.method !== "HEAD") {
        console.log(colorInfo(req.method), req.path, colorVerbose(siteRelPath));
      }

      res.sendFile(getFsPath(project, siteRelPath));
    });
  }

  app.listen(port, () => {
    console.log(`${colorInfo("Dev server:")} http://localhost:${port}/`);
  });
}

function normalizeReqPath(reqPath) {
  if (path.extname(reqPath)) return path.normalize(reqPath);
  return path.normalize(reqPath + "/index.html");
}

function getFsPath(project, relFilePath) {
  return path.resolve(
    project.rootDir,
    project.webFilesDir ?? project.devWebFilesDir ?? "",
    relFilePath
  );
}
