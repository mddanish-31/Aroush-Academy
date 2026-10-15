import { resolve as pathResolve } from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync, statSync } from "node:fs";

const rootDir = process.cwd();

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith("@/")) {
    const relativePath = specifier.slice(2);
    let resolvedPath = pathResolve(rootDir, "src", relativePath);
    if (existsSync(resolvedPath)) {
      if (statSync(resolvedPath).isDirectory()) {
        if (existsSync(pathResolve(resolvedPath, "index.ts"))) {
          resolvedPath = pathResolve(resolvedPath, "index.ts");
        }
      }
    } else if (existsSync(resolvedPath + ".ts")) {
      resolvedPath += ".ts";
    }
    return defaultResolve(pathToFileURL(resolvedPath).href, context, defaultResolve);
  }
  return defaultResolve(specifier, context, defaultResolve);
}
