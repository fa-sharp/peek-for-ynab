import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { defineCollection } from "astro:content";

const releaseNotes = defineCollection({
  loader: glob({
    pattern: ["*.md", "*.mdx"],
    base: "src/release-notes",
    generateId: (file) => file.entry.replace(/\.mdx?$/, ""),
  }),
  schema: z.object({
    date: z.date(),
  }),
});

export const collections = { releaseNotes };
