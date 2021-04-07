import { ErrorRequestHandler } from "express";
import { JsonWebTokenError } from "jsonwebtoken";

export interface ICustomError {
  name?: string;
  message?: string;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // console.log("errorHandler", err.error);

  const statusCode = getHttpStatus(err);

  res.status(statusCode).send({
    success: false,
    error: {
      name: err.constructor.errorName || err.constructor.name,
      message: err.message,
      errorStack: err.stack
    }
  });
};

const getHttpStatus = (err: any): number => {
  if (err.constructor.errorCode) {
    return err.constructor.errorCode;
  }

  if (err instanceof JsonWebTokenError) return 401;

  return 500;
};
