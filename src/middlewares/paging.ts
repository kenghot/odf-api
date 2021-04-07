import { RequestHandler } from "express";

export const paging: RequestHandler = (req, res, next) => {
  res.locals.currentPage = +req.query.currentPage || 1;
  res.locals.perPage = +req.query.perPage || 10;

  if (!res.locals.total) {
    return next();
  }

  res.locals.totalPages = Math.ceil(
    res.locals.total / (req.query.perPage || 10)
  );
  res.locals.success = true;

  res.send({ ...res.locals });
};
