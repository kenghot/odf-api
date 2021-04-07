import { RequestHandler } from "express";

export const onSuccess = (options?: any): RequestHandler => {
  return async (req, res, next) => {
    try {
      res.locals.success = true;
      res.send({ ...res.locals });
    } catch (err) {
      next(err);
    }
  };
};
