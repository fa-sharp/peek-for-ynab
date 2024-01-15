import { vi } from "vitest";

//@ts-expect-error hack to make some jest mocks work with vitest
globalThis.jest = vi;
