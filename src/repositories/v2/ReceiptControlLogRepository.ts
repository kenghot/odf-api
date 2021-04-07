import {
  EntityRepository,
  getCustomRepository,
  getManager,
  Repository
} from "typeorm";

import { AccountReceivable } from "../../entities/AccountReceivable";
import { AccountReceivableTransaction } from "../../entities/AccountReceivableTransaction";
import { Agreement } from "../../entities/Agreement";
import { AttachedFile } from "../../entities/AttachedFile";
import { DebtCollection } from "../../entities/DebtCollection";
import { ReceiptControlLog } from "../../entities/ReceiptControlLog";
import { DBError } from "../../middlewares/error/error-type";

export interface IReceiptPayment {
  accountReceivable: AccountReceivable;
  transaction: AccountReceivableTransaction;
  collection: DebtCollection;
  agreement: Agreement;
}

@EntityRepository(ReceiptControlLog)
class ReceiptControlLogRepository extends Repository<ReceiptControlLog> {
  async createOrUpdateReceiptControlLog(
    log: ReceiptControlLog,
    atfs?: AttachedFile[]
  ) {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        await transactionEntityManager.save(log);
        if (log.pos) {
          await transactionEntityManager.save(log.pos);
        }
        if (atfs && atfs.length > 0) {
          atfs.forEach((a) => {
            if (!a.refId) {
              a.refId = log.id;
            }
          });
          await transactionEntityManager.save(atfs);
        }
      });
    } catch (err) {
      if (err.constructor.errorCode === 400) {
        throw err;
      }
      throw new DBError({ message: err.message });
    }
  }
  async findReceiptControlLog(id: string | number) {
    const queryBuilder = this.createQueryBuilder("rcl")
      .leftJoinAndSelect("rcl.pos", "pos")
      .leftJoinAndSelect("pos.organization", "organization")
      .leftJoinAndSelect("rcl.user", "user")
      .leftJoinAndSelect("rcl.onDutymanager", "onDutymanager")
      .leftJoinAndMapMany(
        "rcl.requestAttachedFiles",
        "AttachedFile",
        "attachedFile1",
        "attachedFile1.refType = 'RECEIPT.REQUEST' AND attachedFile1.refId = rcl.id"
      )
      .leftJoinAndMapMany(
        "rcl.approveAttachedFiles",
        "AttachedFile",
        "attachedFile2",
        "attachedFile2.refType = 'RECEIPT.APPROVE' AND attachedFile1.refId = rcl.id"
      );

    queryBuilder.addSelect((qb) => {
      return qb
        .select("IFNULL(SUM(log.requestQuantity), 0)")
        .from(ReceiptControlLog, "log")
        .where(
          "log.posId = pos.id AND log.logType = 'REQUEST' AND log.status = 'WT'"
        );
    }, "requestReceipt");

    queryBuilder.where("rcl.id = :rclId", { rclId: id });

    try {
      const { entities, raw } = await queryBuilder.getRawAndEntities();
      const receipt = entities[0];

      receipt.pos.requestReceipt = +raw[0].requestReceipt;

      return receipt;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(ReceiptControlLogRepository);
