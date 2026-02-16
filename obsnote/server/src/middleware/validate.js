export const validateBody =
  (schema) =>
  (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const error = new Error("Invalid request body");
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      error.details = parsed.error.flatten();
      next(error);
      return;
    }

    req.body = parsed.data;
    next();
  };

