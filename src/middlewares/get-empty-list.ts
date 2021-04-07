export const getEmptyList = (req, res, next) => {
  res.locals.data = [];
  res.locals.total = 0;
  res.locals.totalPages = 0;
  res.locals.success = true;
  res.send({ ...res.locals });
};
