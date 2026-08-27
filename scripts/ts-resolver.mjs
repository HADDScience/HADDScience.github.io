import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

/** 확장자 없는 상대 임포트를 .ts / .tsx / /index.ts 로 넓혀 해석한다. */
export async function resolve(specifier, ctx, next) {
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const base = ctx.parentURL
      ? path.dirname(decodeURIComponent(new URL(ctx.parentURL).pathname))
      : process.cwd()
    for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
      const p = path.join(base, specifier + ext)
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return { url: pathToFileURL(p).href, shortCircuit: true }
      }
    }
  }
  return next(specifier, ctx)
}
