import fs from "fs";
import path from "path";
import type { Router } from "express";
import type { AnyContract } from "../framework/contract/types";

/**
 * The shape every module must export as its default export.
 *
 * @example
 * // src/modules/auth/index.ts
 * export default {
 *   name: 'auth',
 *   router,
 *   contracts: [registerContract, loginContract],
 * } satisfies AppModule;
 */
export interface AppModule {
  /** URL prefix segment. Module 'auth' → routes at /api/v1/auth */
  name: string;
  /** Express Router with all routes pre-registered */
  router: Router;
  /** All contracts defined by this module — used for Swagger generation */
  contracts: AnyContract[];
}

const MODULES_DIR = path.join(__dirname, "..", "..", "modules");

/**
 * Scans `src/modules/` for folders containing an `index.ts` and dynamically
 * imports each one. Returns the array of loaded AppModules.
 *
 * No central registry needed — adding a folder + index.ts is enough.
 */
export function loadModules(): AppModule[] {
  const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true });
  const modules: AppModule[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const indexPath = path.join(MODULES_DIR, entry.name, "index.ts");
    if (!fs.existsSync(indexPath)) continue;

    try {
      // Dynamic require works in CJS ts-node without import.meta
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(indexPath) as { default?: AppModule };
      if (mod.default) {
        modules.push(mod.default);
      }
    } catch (err) {
      console.error(`[loader] Failed to load module at ${indexPath}:`, err);
    }
  }

  return modules;
}

/**
 * Mounts each module's router at `/api/v1/<module.name>`.
 * Called once in server.ts before app.listen().
 */
export function registerModules(
  app: import("express").Application,
  modules: AppModule[],
): void {
  for (const mod of modules) {
    app.use(`/api/v1/${mod.name}`, mod.router);
  }
}
