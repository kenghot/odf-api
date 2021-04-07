import { EntityRepository, getCustomRepository, Repository } from "typeorm";

import { ReceiptPrintLog } from "../../entities/ReceiptPrintLog";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(ReceiptPrintLog)
class ReceiptPringLogRepository extends Repository<ReceiptPrintLog> {
  async createReceiptPringLog(receiptPringLog: ReceiptPrintLog) {
    try {
      await this.save(receiptPringLog);
      return receiptPringLog;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(ReceiptPringLogRepository);
