#!/bin/sh
cd "$(dirname "$0")"/..
pwd
yarn --silent --cwd ../compose-html build
yarn --silent upgrade compose-html
