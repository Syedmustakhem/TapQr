import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

type ValidationSource = "body" | "params" | "query";

/**
 * Generic Zod validation middleware.
 *
 * By default it validates req.body.
 *
 * Examples:
 *
 * validate(schema)
 * validate(schema, "body")
 * validate(schema, "params")
 * validate(schema, "query")
 */
export const validate =
  (
    schema: ZodSchema,
    source: ValidationSource = "body"
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    let data: unknown;

    /**
     * Select the correct request source.
     */
    switch (source) {
      case "params":
        data = req.params;
        break;

      case "query":
        data = req.query;
        break;

      case "body":
      default:
        data = req.body;
        break;
    }

    /**
     * Validate with Zod.
     */
    const result = schema.safeParse(data);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: result.error.flatten(),
      });
    }

    /**
     * Store parsed data back into the appropriate
     * request property.
     *
     * Body is the only source where we replace the
     * complete object because this is already the
     * existing behavior of the application.
     *
     * Params/query are intentionally left untouched
     * because Express expects their values to remain
     * request strings and the controllers currently
     * read them directly.
     */
    if (source === "body") {
      req.body = result.data;
    }

    next();
  };