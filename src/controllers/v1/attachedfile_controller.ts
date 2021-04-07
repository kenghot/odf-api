import { RequestHandler } from "express";
import * as path from "path";
import { AttachedFileRepository } from "../../repositories/v1";
import { deleteFile } from "../../utils/fs-helper";
import { BaseController } from "./base_controller";

class AttachedFileController extends BaseController {
  update: RequestHandler = async (req, res, next) => {
    try {
      const entity = await AttachedFileRepository.findOne({
        id: req.params.id
      });
      const filePath = entity.file.path;
      entity.file = {
        fieldname: null,
        originalname: null,
        encoding: null,
        mimetype: null,
        size: null,
        destination: null,
        filename: null,
        path: null
      };
      const record = await AttachedFileRepository.save(entity);
      await deleteFile(path.join(process.cwd(), `/${filePath}`));
      res.send({ data: record, success: true });
    } catch (e) {
      next(e);
    }
  };

  delete: RequestHandler = async (req, res, next) => {
    try {
      const atf = await AttachedFileRepository.findOne(req.params.id);
      const filePath = atf.file.path;
      await AttachedFileRepository.delete(req.params.id);
      await deleteFile(path.join(process.cwd(), `/${filePath}`));
      res.send({ success: true });
    } catch (e) {
      next(e);
    }
  };
}

export const controller = new AttachedFileController(AttachedFileRepository);
