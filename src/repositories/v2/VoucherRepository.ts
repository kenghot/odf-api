import {
  EntityRepository,
  getCustomRepository,
  getManager,
  Repository
} from "typeorm";

import { AccountReceivable } from "../../entities/AccountReceivable";
import { Agreement } from "../../entities/Agreement";
import { Guarantee } from "../../entities/Guarantee";
import { Voucher } from "../../entities/Voucher";
import { VoucherSequence } from "../../entities/VoucherSequence";
import { agreementStatusSet, guaranteeStatusSet } from "../../enumset";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(Voucher)
class VoucherRepository extends Repository<Voucher> {
  async createVoucher(
    voucher: Voucher,
    voucherSequence: VoucherSequence,
    agreement: Agreement
  ): Promise<Agreement> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          // increment agreementSequenceNumber by 1
          const voucherUpdateResult = await transactionEntityManager
            .createQueryBuilder()
            .update(VoucherSequence)
            .set({ sequenceNumber: () => "sequenceNumber + 1" })
            .whereEntity(voucherSequence)
            .execute();

          // get updated agreementSequenceNumber
          const updatedVoucherSequence = await transactionEntityManager.findOne(
            VoucherSequence,
            {
              id: voucherSequence.id,
              updatedDate: voucherUpdateResult.generatedMaps[0].updatedDate
            }
          );

          // set documentNumber of voucher
          voucher.documentNumber = updatedVoucherSequence.runningNumber;

          // calculate totalAmount before insert
          voucher.setTotalAmount();

          // create voucher
          await transactionEntityManager.save(voucher);

          // change agreement status after create voucher
          agreement.status = agreementStatusSet.duringPayment;
          agreement.guarantee.status = guaranteeStatusSet.duringPayment;
          await transactionEntityManager.save(agreement);

          agreement.voucher = voucher;
        } catch (e) {
          throw e;
        }
      });

      // return voucher;
      return agreement;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async updateVoucherAndCreateAR(
    voucher: Voucher,
    agreement: Agreement,
    guarantee: Guarantee,
    ar: AccountReceivable
  ): Promise<Voucher> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          await transactionEntityManager.save(voucher);
          await transactionEntityManager.save(agreement);
          guarantee.endDate = agreement.endDate;
          await transactionEntityManager.save(guarantee);
          ar.agreementInstallmentFirstDate = agreement.installmentFirstDate;
          ar.agreementInstallmentLastDate = agreement.installmentLastDate;
          await transactionEntityManager.save(ar);
        } catch (e) {
          throw e;
        }
      });
      return voucher;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
}

export default getCustomRepository(VoucherRepository);
