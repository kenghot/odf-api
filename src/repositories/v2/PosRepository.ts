import {
  Brackets,
  EntityRepository,
  getCustomRepository,
  Repository
} from "typeorm";
import { Pos } from "../../entities/Pos";
import { Receipt } from "../../entities/Receipt";
import { ReceiptControlLog } from "../../entities/ReceiptControlLog";
import { DBError } from "../../middlewares/error/error-type";
import { IPagination } from "./SearchRepository";

export interface IPosFilter {
  posCode: string;
  active: string;
  isOnline: string;
  permittedOrganizationIds: number[] | string[];
}

@EntityRepository(Pos)
class PosRepository extends Repository<Pos> {
  async findAndCountPoses(filter: IPosFilter, pagination: IPagination = {}) {
    const { posCode, permittedOrganizationIds, active, isOnline } = filter;

    const skip = (+pagination.currentPage - 1) * +pagination.perPage;

    const queryBuilder = this.createQueryBuilder(`pos`)
      .leftJoinAndSelect("pos.organization", "organization")
      .leftJoinAndSelect("pos.manager", "manager")
      .leftJoinAndMapOne("pos.lastestPosShift", "pos.shifts", "shift")
      .leftJoinAndSelect("shift.onDutymanager", "onDutymanager")
      .leftJoinAndSelect("shift.currentCashier", "currentCashier");

    if (posCode) {
      queryBuilder.andWhere("pos.posCode LIKE :posCode", {
        posCode: posCode.trim()
      });
    }

    if (permittedOrganizationIds) {
      queryBuilder.andWhere("pos.organizationId IN(:orgIds)", {
        orgIds: permittedOrganizationIds
      });
    }

    if (active) {
      const isActive = active === "true" ? true : false;
      queryBuilder.andWhere("pos.active = :active", {
        active: isActive
      });
    }

    if (isOnline) {
      if (isOnline === "true") {
        queryBuilder.andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select("posShift.id")
            .from("PosShift", "posShift")
            .where("posShift.posId = pos.id")
            .orderBy("posShift.startedShift", "DESC")
            .limit(1)
            .getQuery();
          return `shift.id = ${subQuery} AND shift.endedShift IS NULL`;
        });

        queryBuilder.addOrderBy("shift.startedShift", "DESC");
      } else if (isOnline === "false") {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where((qb1) => {
              const subQuery = qb1
                .subQuery()
                .select("posShift.id")
                .from("PosShift", "posShift")
                .where("posShift.posId = pos.id")
                .orderBy("posShift.startedShift", "DESC")
                .limit(1)
                .getQuery();
              return `shift.id = ${subQuery} AND shift.endedShift IS NOT NULL`;
            }).orWhere("shift.id is null");
          })
        );

        queryBuilder.addOrderBy("shift.startedShift", "DESC");
      }
    } else {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where((qb1) => {
            const subQuery = qb1
              .subQuery()
              .select("posShift.id")
              .from("PosShift", "posShift")
              .where("posShift.posId = pos.id")
              .orderBy("posShift.startedShift", "DESC")
              .limit(1)
              .getQuery();
            return "shift.id =" + subQuery;
          }).orWhere("shift.id is null");
        })
      );

      queryBuilder.addOrderBy("shift.startedShift", "DESC");
    }

    try {
      const [poses, total] = await queryBuilder
        .skip(skip)
        .take(pagination.perPage)
        .getManyAndCount();

      return [poses, total];
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }

  async findOnePos(id: number, fromLogin?: boolean) {
    const queryBuilder = this.createQueryBuilder("pos")
      .leftJoinAndSelect("pos.organization", "organization")
      .leftJoinAndSelect("pos.manager", "manager");
    if (fromLogin) {
      queryBuilder.leftJoinAndSelect(
        "pos.shifts",
        "shift",
        "shift.endedShift IS NULL"
      );
    } else {
      queryBuilder.leftJoinAndSelect("pos.shifts", "shift");
    }

    queryBuilder.leftJoin("shift.logs", "log");

    queryBuilder
      .addSelect((qb) => {
        return qb
          .select("COUNT(receipt.id)")
          .from(Receipt, "receipt")
          .where("receipt.posShiftId = shift.id");
      }, "transactionCount")
      .addSelect((qb) => {
        return qb
          .select("IFNULL(SUM(receipt.total), 0)")
          .from(Receipt, "receipt")
          .where("receipt.posShiftId = shift.id");
      }, "transactionAmount")
      .addSelect((qb) => {
        return qb
          .select("COUNT(receipt.id)")
          .from(Receipt, "receipt")
          .where("receipt.posShiftId = shift.id AND receipt.status ='CL'");
      }, "transactionCancelCount")
      .addSelect((qb) => {
        return qb
          .select("IFNULL(SUM(receipt.total), 0)")
          .from(Receipt, "receipt")
          .where("receipt.posShiftId = shift.id AND receipt.status ='CL'");
      }, "transactionCancelAmount")
      .addSelect((qb) => {
        return qb
          .select("COUNT(receipt.id)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'CASH' AND receipt.status ='PD'"
          );
      }, "transactionCashCount")
      .addSelect((qb) => {
        return qb
          .select("IFNULL(SUM(receipt.total), 0)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'CASH' AND receipt.status ='PD'"
          );
      }, "transactionCashAmount")
      .addSelect((qb) => {
        return qb
          .select("COUNT(receipt.id)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'TRANSFER' AND receipt.status ='PD' "
          );
      }, "transactionTransferCount")
      .addSelect((qb) => {
        return qb
          .select("IFNULL(SUM(receipt.total), 0)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'TRANSFER' AND receipt.status ='PD'"
          );
      }, "transactionTransferAmount")
      .addSelect((qb) => {
        return qb
          .select("COUNT(receipt.id)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'MONEYORDER' AND receipt.status ='PD'"
          );
      }, "transactionMoneyOrderCount")
      .addSelect((qb) => {
        return qb
          .select("IFNULL(SUM(receipt.total), 0)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'MONEYORDER' AND receipt.status ='PD'"
          );
      }, "transactionMoneyOrderAmount")
      .addSelect((qb) => {
        return qb
          .select("COUNT(receipt.id)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'CHECK' AND receipt.status ='PD'"
          );
      }, "transactionCheckCount")
      .addSelect((qb) => {
        return qb
          .select("IFNULL(SUM(receipt.total), 0)")
          .from(Receipt, "receipt")
          .where(
            "receipt.posShiftId = shift.id AND receipt.paymentMethod LIKE 'CHECK' AND receipt.status ='PD'"
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
      );

    queryBuilder.addSelect((qb) => {
      return qb
        .select("IFNULL(SUM(log.requestQuantity), 0)")
        .from(ReceiptControlLog, "log")
        .where(
          "log.posId = pos.id AND log.logType = 'REQUEST' AND log.status = 'WT'"
        );
    }, "requestReceipt");

    queryBuilder
      .leftJoinAndSelect("shift.onDutymanager", "onDutymanager")
      .leftJoinAndSelect("shift.currentCashier", "currentCashier")
      .where(
        new Brackets((qb) => {
          qb.where((qb1) => {
            const subQuery = qb1
              .subQuery()
              .select("MAX(posShift.createdDate)")
              .from("PosShift", "posShift")
              .where("posShift.posId = pos.id")
              .getQuery();
            return "shift.createdDate =" + subQuery;
          }).orWhere("shift.id is null");
        })
      )
      .andWhere("pos.id = :id", { id });

    queryBuilder.groupBy("shift.id");

    queryBuilder.orderBy("shift.startedShift", "DESC");

    try {
      const { entities, raw } = await queryBuilder.getRawAndEntities();
      const pos = entities[0];
      pos.requestReceipt = +raw[0].requestReceipt;
      if (pos.lastestPosShift) {
        pos.lastestPosShift.transactionCount = raw[0].transactionCount;
        pos.lastestPosShift.transactionAmount = raw[0].transactionAmount;
        pos.lastestPosShift.transactionCashCount = raw[0].transactionCashCount;
        pos.lastestPosShift.transactionCashAmount =
          raw[0].transactionCashAmount;
        pos.lastestPosShift.transactionTransferCount=raw[0].transactionTransferCount;
        pos.lastestPosShift.transactionTransferAmount=raw[0].transactionTransferAmount;
        pos.lastestPosShift.transactionMoneyOrderCount =
          raw[0].transactionMoneyOrderCount;
        pos.lastestPosShift.transactionMoneyOrderAmount =
          raw[0].transactionMoneyOrderAmount;
        pos.lastestPosShift.transactionCheckCount =
          raw[0].transactionCheckCount;
        pos.lastestPosShift.transactionCheckAmount =
          raw[0].transactionCheckAmount;
        pos.lastestPosShift.dropAmount = raw[0].dropAmount;
        pos.lastestPosShift.addAmount = raw[0].addAmount;
        pos.lastestPosShift.overShortAmount = raw[0].overShortAmount;
        pos.lastestPosShift.transactionCancelCount=raw[0].transactionCancelCount;
        pos.lastestPosShift.transactionCancelAmount=raw[0].transactionCancelAmount;
      }

      return pos;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }

  async findAndCountPosesWithReceiptControl(
    qs: any = {}
  ): Promise<[any, number]> {
    const { currentPage = 1, perPage = 10, permittedOrganizationIds } = qs;

    const queryBuilder = this.createQueryBuilder("pos")
      .select(["pos.id id", "posCode", "posName", "onhandReceipt"])
      .leftJoin("pos.organization", "organization")
      .addSelect("organization.orgName", "orgName")
      .addSelect("organization.orgName", "orgName")
      .addSelect((qb) => {
        return qb
          .select("IFNULL(SUM(log.requestQuantity), 0)")
          .from(ReceiptControlLog, "log")
          .where(
            "log.posId = pos.id AND log.logType = 'REQUEST' AND log.status = 'WT'"
          );
      }, "requestReceipt");

    if (permittedOrganizationIds) {
      queryBuilder.andWhere("pos.organizationId IN(:orgIds)", {
        orgIds: permittedOrganizationIds
      });
    }

    queryBuilder.offset((currentPage - 1) * perPage).limit(perPage);

    try {
      const [raw, count] = await Promise.all([
        queryBuilder.getRawMany(),
        queryBuilder.getCount()
      ]);

      return [raw, count];
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }

  async findOrganizationsByReceiptSequence(seqId: string) {
    const queryBuilder = this.createQueryBuilder("pos")
      .leftJoin("pos.organization", "organization")
      // How to use DISTINCT
      .select(
        "DISTINCT (organization.id) as id, organization.orgName as orgName, organization.orgCode as orgCode"
      )
      .where("pos.receiptSequenceId = :seqId", { seqId });

    try {
      const raw = await queryBuilder.getRawMany();

      return raw;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(PosRepository);
