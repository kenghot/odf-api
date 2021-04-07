import {
  EntityRepository,
  getCustomRepository,
  getManager,
  Repository
} from "typeorm";

import { Receipt } from "../../entities/Receipt";
import { ReceiptItem } from "../../entities/ReceiptItem";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(Receipt)
class ReceiptRepository extends Repository<Receipt> {
  async updateReceipt(
    receipt: Receipt,
    receiptItems: ReceiptItem[]
  ): Promise<Receipt> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          if (receiptItems) {
            await transactionEntityManager.remove(
              ReceiptItem,
              receipt.receiptItems
            );
            receipt.receiptItems = receiptItems;
          }

          await transactionEntityManager.save(receipt);
        } catch (e) {
          throw e;
        }
      });
      return receipt;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
}

export default getCustomRepository(ReceiptRepository);
