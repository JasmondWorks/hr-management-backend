import { registry } from "../../core/docs/registry";
import { RegisterCandidateBodySchema, CandidateSchema } from "./candidate.dto";
import { z } from "zod";

registry.registerPath({
  method: "post",
  path: "/candidates/register",
  summary: "Register a new candidate with resume upload",
  tags: ["Candidates"],
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: RegisterCandidateBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Candidate registered successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: CandidateSchema,
          }),
        },
      },
    },
    400: { description: "Validation error or file missing" },
    409: { description: "Candidate email already registered" },
  },
});
