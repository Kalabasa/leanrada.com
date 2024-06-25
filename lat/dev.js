#!/usr/bin/env node
import express from "express";
import { getProjects } from "./util/get_projects.js";
import path from "node:path";
import { colorInfo } from "./util/colors.js";

export function runDevServer(port) {
  const projects = getProjects().sort(
    (a, b) => b.sitePathPrefix.length - a.sitePathPrefix.length
  );

  const app = express();

  for (const project of projects) {
    const route = [
      path.resolve("/", project.sitePathPrefix),
      path.resolve("/", project.sitePathPrefix, "*"),
    ];
    app.get(route, (req, res) => {
      const reqPath = normalizeReqPath(req.path);
      if (req.method !== "HEAD") {
        console.log(colorInfo(req.method), req.path);
      }
      res.sendFile(
        path.resolve(
          project.rootDir,
          project.webFilesDir ?? project.devWebFilesDir ?? "",
          path.relative(
            path.resolve("/", project.sitePathPrefix),
            decodeURIComponent(reqPath)
          )
        )
      );
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
