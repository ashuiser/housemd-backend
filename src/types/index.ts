import type { HumanMessage } from "langchain";
import "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export type TRunAgentRequest =
  | {
      id: number;
      method: "run.start";
      params: {
        input: {
          messages: [HumanMessage];
        };
        config: {
          configurable: {
            internetMode: "none" | "trusted_only" | "all" | "ask";
            thread_id: string;
          };
        };
      };
    }
  | {
      id: number;
      method: "input.respond";
      params: {
        config: {
          configurable: {
            thread_id: string;
            internetMode?: "none" | "trusted_only" | "all" | "ask";
          };
        };
        interrupt_id: string;
        response: { approvedUrls?: string[] };
      };
    };
