import {mkdirSync, writeFileSync} from "node:fs";
import {join} from "node:path";

import {evalsHome} from "./paths.ts";

const PASSED_THROUGH = [
  "PATH",
  "LANG",
  "LC_ALL",
  "TERM",
  "TMPDIR",
  "TZ",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "no_proxy",
  "SSL_CERT_FILE",
  "NODE_EXTRA_CA_CERTS",
];

/**
 * The environment for `npm install` and `npm pack`: an allow-list of the parent's, an empty user
 * and global config instead of the developer's `~/.npmrc`, and a cache under the harness home
 * instead of the shared one. The registry therefore comes from npm's defaults, not from the
 * machine's own configuration.
 */
export function npmEnvironment(): NodeJS.ProcessEnv {
  const home = join(evalsHome(), "npm");
  // Two files: npm refuses to load one path as both the user and the global config.
  const userConfig = join(home, "user.npmrc");
  const globalConfig = join(home, "global.npmrc");
  const cache = join(home, "cache");

  mkdirSync(cache, {recursive: true});
  writeFileSync(userConfig, "");
  writeFileSync(globalConfig, "");

  const env: NodeJS.ProcessEnv = {};

  for (const name of PASSED_THROUGH) {
    const value = process.env[name];

    if (value !== undefined) env[name] = value;
  }

  return {
    ...env,
    HOME: home,
    npm_config_cache: cache,
    npm_config_globalconfig: globalConfig,
    npm_config_update_notifier: "false",
    npm_config_userconfig: userConfig,
  };
}
