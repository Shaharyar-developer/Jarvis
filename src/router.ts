import { initTRPC } from "@trpc/server";
import { z } from "zod";
import Run from "@/openai/run";
import { createOrGetAssistant, createOrGetThread } from "./openai/init";

const t = initTRPC.create();

const assistant = await createOrGetAssistant();
const thread = await createOrGetThread();

export const appRouter = t.router({});

export type AppRouter = typeof appRouter;
