import {
  EntityRepository,
  getCustomRepository,
  getManager,
  Repository,
} from "typeorm";

import { Agreement } from "../../entities/Agreement";
import { AgreementSequence } from "../../entities/AgreementSequence";
import { Guarantee } from "../../entities/Guarantee";
import { Request } from "../../entities/Request";
import { requestStatusSet } from "../../enumset";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(Agreement)
class AgreementRepository extends Repository<Agreement> {
  async createAgreementAndGuarantee(
    agreement: Agreement,
    guarantee: Guarantee,
    agreementSequence: AgreementSequence,
    request: Request
  ): Promise<Request> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          // increment agreementSequenceNumber by 1
          const agreementUpdateResult = await transactionEntityManager
            .createQueryBuilder()
            .update(AgreementSequence)
            .set({ sequenceNumber: () => "sequenceNumber + 1" })
            .whereEntity(agreementSequence)
            .execute();

          // get updated agreementSequenceNumber
          const updatedAgreementSequence = await transactionEntityManager.findOne(
            AgreementSequence,
            {
              id: agreementSequence.id,
              updatedDate: agreementUpdateResult.generatedMaps[0].updatedDate,
            }
          );

          // set documentNumber of agreement && guarantee
          agreement.documentNumber = updatedAgreementSequence.runningNumber;
          guarantee.documentNumber = agreement.documentNumber;

          // add guarantee to agreement
          // agreement.guarantee = guarantee;

          // create agreement && guarantee
          agreement.setAge();
          await transactionEntityManager.save(agreement);
          // guarantee.documentNumber = agreement.documentNumber;
          guarantee.agreementId = agreement.id;
          guarantee.agreementDocumentDate = agreement.documentDate;
          guarantee.agreementDocumentNumber = agreement.documentNumber;
          guarantee.setAge();
          await transactionEntityManager.save(guarantee);

          // change requestStatus after create agreement && guarantee
          request.status = requestStatusSet.done;
          await transactionEntityManager.save(request);
          // await transactionEntityManager.update(
          //   Request,
          //   { id: agreement.request.id },
          //   { status: requestStatusSet.done }
          // );

          // update guarantee field in agreement
          await transactionEntityManager.update(
            Agreement,
            { id: agreement.id },
            {
              guaranteeId: guarantee.id,
              guaranteeDocumentDate: guarantee.documentDate,
              guaranteeDocumentNumber: guarantee.documentNumber,
            }
          );
        } catch (e) {
          throw e;
        }
      });

      // return agreement;
      return request;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async createAgreement(
    agreement: Agreement,
    agreementSequence: AgreementSequence
  ): Promise<Agreement> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          const updateResult = await transactionEntityManager
            .createQueryBuilder()
            .update(AgreementSequence)
            .set({ sequenceNumber: () => "sequenceNumber + 1" })
            .whereEntity(agreementSequence)
            .execute();

          const updatedSequence = await transactionEntityManager.findOne(
            AgreementSequence,
            {
              id: agreementSequence.id,
              updatedDate: updateResult.generatedMaps[0].updatedDate,
            }
          );

          agreement.documentNumber = updatedSequence.runningNumber;

          await transactionEntityManager.save(agreement);

          // if create agreement success change request status to done
          await transactionEntityManager.update(
            Request,
            { id: agreement.requestId },
            { status: requestStatusSet.done }
          );
        } catch (e) {
          throw e;
        }
      });

      return agreement;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async updateAgreement(agreement: Agreement, guarantee: Guarantee) {
    console.log("guarantee =>", guarantee);
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        await transactionEntityManager.save(agreement);
        if (guarantee) {
          await transactionEntityManager.save(guarantee);
        }

        return agreement;
      });
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(AgreementRepository);
