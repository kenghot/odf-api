
export const setHeader = async (req, res, next) => {
  res
    .set("version", process.env.VERSION);
  next();
}