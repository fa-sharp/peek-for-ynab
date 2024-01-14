import { vi } from "vitest";

//@ts-expect-error hack to make this mock work with vitest
globalThis.jest = vi;
