import AttachedFileRepository from "../../repositories/v2/AttachedFileRepository";
import { BaseController } from "./BaseController";

// map params to Obj for query attachedFiles
const m2A = {
  ["borrower"]: "REQUES.BORROWER.ATTACHEDFILE",
  ["guarantor"]: "REQUES.GUARANTOR.ATTACHEDFILE",
  ["spouse"]: "REQUES.SPOUSE.ATTACHEDFILE",
  ["guarantorSpouse"]: "REQUES.GUARANTORSPOUSE.ATTACHEDFILE"
};
const refTypes = [
  "REQUES.BORROWER.ATTACHEDFILE",
  "REQUES.GUARANTOR.ATTACHEDFILE",
  "REQUES.SPOUSE.ATTACHEDFILE",
  "REQUES.GUARANTORSPOUSE.ATTACHEDFILE"
];
const m2F = {
  [refTypes[0]]: "borrower",
  [refTypes[1]]: "guarantor",
  [refTypes[2]]: "spouse",
  [refTypes[3]]: "guarantorSpouse"
};

class RequestItemController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  getRequestItemWithAllAttachedFiles = async (req, res, next) => {
    try {
      const entity = await AttachedFileRepository.findAttachedFiles(
        req.params.subId,
        refTypes
      );

      const item = {
        borrower: { attachedFiles: [] },
        guarantor: { attachedFiles: [] },
        spouse: { attachedFiles: [] },
        guarantorSpouse: { attachedFiles: [] }
      };
      entity.forEach((en) => {
        item[m2F[en.refType]].attachedFiles.push(en);
      });

      res.locals.data = item;

      next();
    } catch (err) {
      next(err);
    }
  };

  getRequestItemWithAttachedFiles = async (req, res, next) => {
    const { subId, resource } = req.params;

    try {
      const entities = await AttachedFileRepository.findAttachedFiles(subId, [
        ...m2A[resource]
      ]);

      res.locals.data = {
        [resource]: { attachedFiles: entities }
      };

      next();
    } catch (err) {
      next(err);
    }
  };
}

export const controller = new RequestItemController(
  "RequestItem",
  "เอกสารคำร้อง"
);
