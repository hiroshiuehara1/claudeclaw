export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode ?? 500;
  const response = {
    error: error.code ?? "INTERNAL_SERVER_ERROR",
    message: error.message ?? "Unexpected server error"
  };

  if (process.env.NODE_ENV !== "production" && error.stack) {
    response.stack = error.stack;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json(response);
};

