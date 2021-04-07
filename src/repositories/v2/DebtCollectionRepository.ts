import {
  EntityRepository,
  getCustomRepository,
  getManager,
  getRepository,
  Repository
} from "typeorm";

import { AttachedFile } from "../../entities/AttachedFile";
import { DebtCollection } from "../../entities/DebtCollection";
import { DBError } from "../../middlewares/error/error-type";

interface IFindDebtCollectionOptions {
  selected?: string[];
  relations?: string[];
}

@EntityRepository(DebtCollection)
class DebtCollectionRepository extends Repository<DebtCollection> {
  async findDebtCollection(id: number, options: IFindDebtCollectionOptions) {
    const { selected = [], relations = [] } = options;
    try {
      const queryBuilder = this.createQueryBuilder("debt");

      selected.forEach((s) => {
        queryBuilder.select(`debt.${s}`);
      });

      relations.forEach((r) => {
        let rel = `debt.${r}`;
        let alias = r;
        const array = r.split(".");
        if (array.length > 1) {
          alias = array.pop();
          rel = `${array.pop()}.${alias}`;
        }
        queryBuilder.leftJoinAndSelect(rel, alias);
      });

      queryBuilder.leftJoinAndMapOne(
        "accountReceivable.control",
        "accountReceivable.controls",
        "controls2",
        "controls2.id = controls.id"
      );
      queryBuilder.leftJoinAndMapMany(
        "debt.memos",
        "Memo",
        "memo",
        "memo.refId = debt.id AND memo.refType = :refType",
        { refType: "DEBTCOLLECTION" }
      );
      queryBuilder.leftJoinAndMapMany(
        "letters.attachedFiles",
        "AttachedFile",
        "attachedFile1",
        "attachedFile1.refId = letters.id and attachedFile1.refType = :refType1",
        { refType1: "LETTER.ATTACHEDFILE" }
      );
      queryBuilder.leftJoinAndMapMany(
        "visits.attachedFiles",
        "AttachedFile",
        "attachedFile2",
        "attachedFile2.refId = visits.id and attachedFile2.refType = :refType2",
        { refType2: "VISIT.ATTACHEDFILE" }
      );
      queryBuilder.leftJoinAndMapMany(
        "memo.attachedFiles",
        "AttachedFile",
        "attachedFile3",
        "attachedFile3.refId = memo.id and attachedFile3.refType = :refType3",
        { refType3: "MEMO.ATTACHEDFILE" }
      );
      queryBuilder.leftJoinAndMapMany(
        "debt.debtSueAttachedFiles",
        "AttachedFile",
        "attachedFile4",
        "attachedFile4.refId = debt.id and attachedFile4.refType = :refType4",
        { refType4: "DEBT_SUE_ATTACHEDFILE" }
      );
      queryBuilder.leftJoinAndMapMany(
        "accountReceivable.atfs",
        "AttachedFile",
        "attachedFile5",
        "attachedFile5.refId = accountReceivable.debtAcknowledgement.preAccountReceivableId and attachedFile5.refType = :refType5",
        { refType5: "ACKNOWLEDGMENT.ATTACHEDFILE" }
      );

      queryBuilder.where("debt.id = :debtId", { debtId: id });
      queryBuilder.orderBy("controls.createdDate", "DESC");
      queryBuilder.addOrderBy("letters.documentDate", "ASC");
      queryBuilder.addOrderBy("visits.visitDate", "ASC");
      queryBuilder.addOrderBy("memo.documentDate", "ASC");

      const entity = await queryBuilder.getOne();

      return entity;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
  async updateDebtCollection(debtCollection: DebtCollection, atfs: any) {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        // update AttachedFiles
        if (atfs && atfs.length > 0) {
          const attachedFiles = getRepository(AttachedFile).create(atfs);

          await transactionEntityManager.save(attachedFiles);
        }

        await transactionEntityManager.save(debtCollection);
        await transactionEntityManager.save(debtCollection.accountReceivable);
      });
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(DebtCollectionRepository);
