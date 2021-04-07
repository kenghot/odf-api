import { getRepository } from "typeorm";
import { AttachedFile } from "../../entities/AttachedFile";
import { ReceiptControlLog } from "../../entities/ReceiptControlLog";
import { receiptControlLogStatusSet } from "../../enumset";
import { ValidateError } from "../../middlewares/error/error-type";
import PosRepository from "../../repositories/v2/PosRepository";
import ReceiptControlLogRepository from "../../repositories/v2/ReceiptControlLogRepository";
import { flattenObject } from "../../utils/object-helper";
import { BaseController } from "./BaseController";

class ReceiptControlLogController extends BaseController {
  getReceiptControllerLog = async (req, res, next) => {
    try {
      const receipt = await ReceiptControlLogRepository.findReceiptControlLog(
        req.params.id
      );

      res.locals.data = receipt;

      next();
    } catch (err) {
      next(err);
    }
  };

  createReceiptControlLog = async (req, res, next) => {
    const { posId, approveQuantity = 0, logType } = req.body;
    req.body.userId = req.user.id;
    req.body.documentDate = new Date();

    const atfs: any[] = [];
    flattenObject(req.body, "attachedFiles", true, atfs);
    const attachedFiles = getRepository(AttachedFile).create(atfs);

    const receiptControlLog = ReceiptControlLogRepository.create(
      req.body as ReceiptControlLog
    );
    try {
      if (logType === "USED") {
        receiptControlLog.status = receiptControlLogStatusSet.approve;

        const pos = await PosRepository.findOne(posId);

        // calculate onhandReceipt
        pos.onhandReceipt = +pos.onhandReceipt - +approveQuantity;
        receiptControlLog.pos = pos;

        // receiptControlLog.logCreatedBy(req.body);
        await ReceiptControlLogRepository.createOrUpdateReceiptControlLog(
          receiptControlLog
        );
      } else {
        // receiptControlLog.logCreatedBy(req.body);
        await ReceiptControlLogRepository.createOrUpdateReceiptControlLog(
          receiptControlLog,
          attachedFiles
        );
      }

      req.params.id = receiptControlLog.id;

      next();
    } catch (err) {
      next(err);
    }
  };

  updateReceiptControlLog = async (req, res, next) => {
    const { status } = req.body;

    const atfs: any[] = [];
    flattenObject(req.body, "attachedFiles", true, atfs);

    try {
      const receiptControlLog = await ReceiptControlLogRepository.findOne(
        req.params.id,
        { relations: ["pos"] }
      );

      ReceiptControlLogRepository.merge(receiptControlLog, req.body);

      // กรณีอนุมัติ
      if (
        receiptControlLog.logType === "REQUEST" &&
        status === receiptControlLogStatusSet.approve
      ) {
        receiptControlLog.pos.onhandReceipt =
          +receiptControlLog.pos.onhandReceipt +
          +receiptControlLog.approveQuantity;
      }

      if (receiptControlLog.pos.onhandReceipt < 0) {
        return next(
          new ValidateError({
            name: "ไม่สามารถทำรายการได้",
            message:
              "ไม่สามารถทำรายการได้เนื่องจากใบเสร็จคงเหลือในระบบน้อยกว่า 0"
          })
        );
      }

      // receiptControlLog.logUpdatedBy(req.body);

      const attachedFiles = await getRepository(AttachedFile).create(atfs);
      await ReceiptControlLogRepository.createOrUpdateReceiptControlLog(
        receiptControlLog,
        attachedFiles
      );

      next();
    } catch (err) {
      next(err);
    }
  };

  deleteLog = async (req, res, next) => {
    try {
      const receiptControlLog = await ReceiptControlLogRepository.findOne(
        req.params.id
      );

      if (receiptControlLog.status !== receiptControlLogStatusSet.waiting) {
        return next(
          new ValidateError({
            name: `ไม่สามารถลบข้อมูล${this.entityInfo}`,
            message: `ไม่สามารถลบข้อมูล${this.entityInfo}ที่ต้องการเนื่องจาก${this.entityInfo}ไม่ได้มีสถานะเป็นรออนุมัติ`
          })
        );
      }

      await ReceiptControlLogRepository.remove(receiptControlLog);

      res.send({ success: true });
    } catch (err) {
      next(err);
    }
  };
}

export const controller = new ReceiptControlLogController(
  "ReceiptControlLog",
  "ควบคุมใบเสร็จรับเงิน"
);
