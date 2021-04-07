export const validateFormBoolean = async (req, res, next) => {
  try {
    // fix update by form data
    if (req.body.activeString === "true") {
      req.body.active = true;
    } else if (req.body.activeString === "false") {
      req.body.active = false;
    }

    next();
  } catch (e) {
    return next(e);
  }
};
