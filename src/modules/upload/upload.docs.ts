import { registry } from "../../core/docs/registry";
import { z } from "zod";

registry.registerPath({
  method: "post",
  path: "/uploads/single",
  summary: "Upload a single file",
  tags: ["Uploads"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.any().openapi({
              type: "string",
              format: "binary",
              description: "File to upload",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "File uploaded successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({
              url: z.string().url(),
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/uploads/batch",
  summary: "Upload multiple files in a batch",
  tags: ["Uploads"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            files: z.any().openapi({
              type: "array",
              items: { type: "string", format: "binary" },
              description: "Files to upload (max 10)",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Files uploaded successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({
              urls: z.array(z.string().url()),
            }),
          }),
        },
      },
    },
  },
});
