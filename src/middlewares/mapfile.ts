import { RequestHandler } from "express";
import { setNestedObject } from "../utils/object-helper";

export const mapFiles: RequestHandler = (req, res, next) => {
  const files: any = req.files;

  if (files) {
    files.forEach((_file: any) => {
      const match = _file.fieldname.match(/([a-z||A-Z]+)|([^\[\]]+)/g);
      setNestedObject(req.body, match, _file);
    });
  }

  next();
};
