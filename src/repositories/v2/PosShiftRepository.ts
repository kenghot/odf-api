import {
  EntityRepository,
  getCustomRepository,
  getManager,
  Repository
} from "typeorm";
import { PosShift } from "../../entities/PosShift";
import { PosShiftLogs } from "../../entities/PosShiftLog";
import { Receipt } from "../../entities/Receipt";
import { DBError } from "../../middlewares/error/error-type";
import { ICreateOptions } from "./CreateRepository";

@EntityRepository(PosShift)
class PosShiftRepository extends Repository<PosShift> {
  async createPosShift(
    shift: PosShift,
    log: PosShiftLogs,
    swapManagerLog: PosShiftLogs,
    options: ICreateOptions = {}
  ) {
    const { listeners = true } = options;
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        await transactionEntityManager.save(shift, { listeners });
        log.posShiftId = shift.id;
        if (swapManagerLog) {
          swapManagerLog.posShiftId = shift.id;
          await transactionEntityManager.save(swapManagerLog, { listeners });
        }
        await transactionEntityManager.save(log, { listeners });
      });
      return shift;
    } catch (err) {
      if (err.constructor.errorCode === 400) {
        throw err;
      }
      throw new DBError({ message: err.message });
    }
  }
  async updatePosShift(shift: PosShift, log: PosShiftLogs) {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        await transactionEntityManager.save(shift);
        if (log) {
          await transactionEntityManager.save(log);
        }
      });
      return shift;
    } catch (err) {
      if (err.constructor.errorCode === 400) {
        throw err;
      }
      throw new DBError({ message: err.message });
    }
  }
  async getCalculateFieldShift(posShiftId: number) {
    const queryBuilder = this.createQueryBuilder("shift")
      .select([])
      .leftJoin("shift.logs", "log")
      .addSelect((qb) => {
        return qb
          .select("COUNT(receipt.id)")
          .from(Receipt, "receipt")
          .where("receipt.posShiftId = shift.id");
      }, "transactionCount")
      .addSelect((qb) => {
        return qb
          .select("SUM(IF(receipt.total, receipt.total, 0))")
          .from(Receipt, "receipt")
          .where("receipt.posShiftId = shift.id");
      }, "transactionAmount")
      .addSelect((qb) => {
        return qb
          .select("COUNT(receipt.id)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'CASH'"
          );
      }, "transactionCashCount")
      .addSelect((qb) => {
        return qb
          .select("IFNULL(SUM(receipt.total), 0)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'CASH'"
          );
      }, "transactionCashAmount")
      .addSelect((qb) => {
        return qb
          .select("COUNT(receipt.id)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'MONEYORDER'"
          );
      }, "transactionMoneyOrderCount")
      .addSelect((qb) => {
        return qb
          .select("IFNULL(SUM(receipt.total), 0)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'MONEYORDER'"
          );
      }, "transactionMoneyOrderAmount")
      .addSelect((qb) => {
        return qb
          .select("COUNT(receipt.id)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'CHECK'"
          );
      }, "transactionCheckCount")
      .addSelect((qb) => {
        return qb
          .select("IFNULL(SUM(receipt.total), 0)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'CHECK'"
          );
      }, "transactionCheckAmount")
      .addSelect(
        "SUM(IF((log.refType NOT LIKE 'RECEIPT' OR log.refType IS NULL) AND (log.action LIKE 'DROP'), log.transactionAmount, 0))",
        "dropAmount"
      )
      .addSelect(
        "SUM(IF((log.refType NOT LIKE 'RECEIPT' OR log.refType IS NULL) AND (log.action LIKE 'ADD'), log.transactionAmount, 0))",
        "addAmount"
      )
      .addSelect(
        "shift.drawerAmount - shift.expectedDrawerAmount",
        "overShortAmount"
      )
      .where("shift.id = :posShiftId", { posShiftId });

    try {
      const raw = await queryBuilder.getRawOne();

      return raw;
    } catch (err) {
      if (err.constructor.errorCode === 400) {
        throw err;
      }
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(PosShiftRepository);
