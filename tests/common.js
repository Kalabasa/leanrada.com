export const devServer = "http://localhost:4567";

export function getURL(path) {
  if (!path.startsWith("/")) throw new Error("Invalid path!");
  return devServer + path;
}
