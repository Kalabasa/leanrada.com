#!/usr/bin/env node
import fs from "node:fs";
import express from "express";
import { getProjects } from "./util/get_projects.js";
import path from "node:path";
import { colorError, colorInfo, colorVerbose } from "./util/colors.js";

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
    app.get(route, (req, res, next) => {
      const reqPath = normalizeReqPath(req.path);

      let siteRelPath = path.relative(
        sitePathPrefix,
        decodeURIComponent(reqPath)
      );

      if (fs.statSync(getFsPath(project, siteRelPath), { throwIfNoEntry: false })?.isDirectory()) {
        siteRelPath = path.relative(
          sitePathPrefix,
          path.join(reqPath, "index.html")
        );
      }

      res.sendFile(getFsPath(project, siteRelPath), (err) => {
        if (err) {
          res.sendStatus(404);
          if (req.method !== "HEAD") {
            console.log(colorInfo(req.method), req.path, colorError("404"));
          }
        } else {
          if (req.method !== "HEAD") {
            console.log(colorInfo(req.method), req.path, colorVerbose(siteRelPath));
          }
        }
      });
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
