import { Request } from "express";
import * as fs from "fs";
import * as mime from "mime";
import multer = require("multer");

interface IStorageOptions {
  withDate: boolean;
}

export const getStorage = (resource: string, options?: IStorageOptions) => {
  return multer.diskStorage({
    destination(req: Request, file, cb) {
      const uploadPath = `${process.env.ROOT_UPLOAD_PATH}/${resource}${req.url}/`;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename(req: any, file, cb) {
      cb(
        null,
        `${file.originalname.split(".")[0]}${
          // `${file.fieldname}${
          options && options.withDate ? Date.now() : ""
        }.${mime.getExtension(file.mimetype)}`
      );
    }
  });
};

export const fileFilter = (extension: string) => {
  return (req, file, cb) => {
    const type = mime.getExtension(file.mimetype);
    if (type !== extension) {
      return cb(null, false);
    }
    // To accept the file pass `true`, like so:
    cb(null, true);

    // // You can always pass an error if something goes wrong:
    // cb(new Error("I don't have a clue!"));
  };
};

export interface IFileOption {
  fieldname: string;
  maxCount: number;
}

interface IFilesOption {
  name: string;
  maxCount: number;
}

export const getFilesOptions = (options: IFileOption[]): IFilesOption[] => {
  const fileOptions = [];
  options.forEach((option) => {
    Array.from(Array(option.maxCount).keys()).forEach((ele, i) => {
      fileOptions.push({ name: `${option.fieldname}-${i}`, maxCount: 1 });
    });
  });
  return fileOptions;
};
