import { User } from "../../entities/User";
import { ReceiptRepository } from "../../repositories/v1";
import ReceiptPringLogRepository from "../../repositories/v2/ReceiptPringLogRepository";
import { BaseController } from "./BaseController";

class ReceiptPrintLogController extends BaseController {
  setReceiptParam(req, res, next) {
    req.query.receiptId = req.params.id;
    next();
  }
  async createReceiptPringLog(req, res, next) {
    const {
      recieptPrintType,
      createdBy,
      createdByName,
      printedDatetime,
    } = req.body;
    try {
      const receipt = await ReceiptRepository.findOne(
        { id: req.params.id },
        { relations: ["posShift", "posShift.onDutymanager"] }
      );

      const manager = req.body.newPosManager
        ? (req.body.newPosManager as User)
        : receipt.posShift.onDutymanager;

      const pringLog = ReceiptPringLogRepository.create({
        receiptId: receipt.id,
        POSId: receipt.posShift.posId,
        recieptPrintType,
        manageBy: manager.id,
        manageByName: manager.fullname,
        manageByPosition: manager.position,
        createdBy,
        createdByName,
        printedDatetime,
      });
      await ReceiptPringLogRepository.createReceiptPringLog(pringLog);

      res.locals.data = pringLog;

      next();
    } catch (err) {
      next(err);
    }
  }
  async reprint(req, res, next) {
    try {
      const receipt = await ReceiptRepository.findOne(
        { id: req.params.id },
        { relations: ["posShift", "receiptPrintLogs"] }
      );
      const pringLog = ReceiptPringLogRepository.create({
        receiptId: receipt.id,
        POSId: receipt.posShift.posId,
        recieptPrintType: req.body.recieptPrintType,
        manageBy: req.body.recieveBy,
        manageByName: req.body.recieveByName,
        manageByPosition: req.body.recieveByPosition,
        printedDatetime: req.body.reprintDate,
      });
      await ReceiptPringLogRepository.createReceiptPringLog(pringLog);

      res.locals.data = pringLog;

      next();
    } catch (err) {
      next(err);
    }
  }
}

export const controller = new ReceiptPrintLogController(
  "ReceiptPrintLog",
  "บันทึกการพิมพ์ใบเสร็จรับเงิน"
);
