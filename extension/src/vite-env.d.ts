/** biome-ignore-all lint/correctness/noUnusedVariables: Vite env variables typechecking */

interface ImportMetaEnv {
  /** The URL of the Peek for YNAB website/server */
  readonly PUBLIC_MAIN_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
