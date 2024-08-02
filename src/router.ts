import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { createOrGetAssistant, createOrGetThread } from "./openai/init";

const t = initTRPC.create();

export const appRouter = t.router({
  test: t.procedure
    .input(
      z.object({
        base64Data: z.string(),
        contentType: z.string(),
      }),
    )
    .query((opts) => {
      return `content-type: ${opts.input.contentType}`;
    }),
  test2: t.procedure.query(() => {
    return "Test2";
  }),
});

export type AppRouter = typeof appRouter;
