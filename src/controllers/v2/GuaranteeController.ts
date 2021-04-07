import { DeepPartial, getManager, getRepository } from "typeorm";
import { Agreement } from "../../entities/Agreement";
import { Guarantee } from "../../entities/Guarantee";
import { GuaranteeItem } from "../../entities/GuaranteeItem";
import { Organization } from "../../entities/Organization";
import { guaranteeStatusSet } from "../../enumset";
import { ValidateError } from "../../middlewares/error/error-type";
import AgreementRepository from "../../repositories/v2/AgreementRepository";
import GuaranteeRepository from "../../repositories/v2/GuaranteeRepository";
import { BaseController } from "./BaseController";

class GuaranteeController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  create = async (req, res, next) => {
    const guarantee: DeepPartial<Guarantee> = req.body;
    let entity: Guarantee;

    try {
      if (guarantee.agreementId) {
        entity = await this.createGuaranteeAndMapToAgreement(
          guarantee.agreementId
        );
      } else {
        const [err, message] = this.validateCreateReq(guarantee);

        if (err) {
          return next(
            new ValidateError({
              name: `ไม่สามารถสร้าง${this.entityInfo}`,
              message: `ไม่สามารถสร้าง${this.entityInfo} ${message}`
            })
          );
        }

        guarantee.documentNumber = guarantee.agreementDocumentNumber;

        if (!guarantee.loanAmount) {
          guarantee.loanAmount = 0;
        }

        guarantee.agreementDocumentDate = guarantee.documentDate;

        // const guaranteeWithReq = await GuaranteeRepository.findOne({
        //   request: guarantee.request as any
        // });

        // if (guaranteeWithReq) {
        //   return next(
        //     new ValidateError({
        //       name: `ไม่สามารถสร้าง${this.entityInfo}`,
        //       message:
        //         "เอกสารคำร้องถูกใช้ไปแล้ว กรุณาเลือกเอกสารคำร้องที่ยังไม่ถูกนำไปสร้างเอกสารสัญญาค้ำประกัน"
        //     })
        //   );
        // }

        // const guaranteeWithAgree = await GuaranteeRepository.findOne({
        //   agreement: guarantee.agreement as any
        // });

        // if (guaranteeWithAgree) {
        //   return next(
        //     new ValidateError({
        //       name: `ไม่สามารถสร้าง${this.entityInfo}`,
        //       message:
        //         "เอกสารสัญญาเงินกู้ถูกใช้ไปแล้ว กรุณาเลือกเอกสารสัญญาเงินกู้ที่ยังไม่ถูกนำไปสร้างเอกสารสัญญาค้ำประกัน"
        //     })
        //   );
        // }

        entity = await this.createRepo.create("Guarantee", guarantee);

        if (entity.agreement.id === null) {
          delete entity.agreement;
        }
      }

      res.locals.data = entity;

      next();
    } catch (err) {
      err.message = `ไม่สามารถสร้างข้อมูล${this.entityInfo} ${err.message}`;
      next(err);
    }
  };

  private createGuaranteeAndMapToAgreement = async (
    agreementId: number
  ): Promise<Guarantee> => {
    try {
      const agreement = await AgreementRepository.findOne(agreementId, {
        relations: ["guarantee", "organization", "agreementItems"]
      });

      const { guarantee } = agreement;

      const newGuaranteeItems: DeepPartial<
        GuaranteeItem
      >[] = agreement.agreementItems.map((ai, index) => {
        return {
          borrower: {
            title: ai.borrower.title,
            firstname: ai.borrower.firstname,
            lastname: ai.borrower.lastname,
            birthDate: ai.borrower.birthDate,
            idCardNo: ai.borrower.idCardNo,
            idCardIssuer: ai.borrower.idCardIssuer,
            idCardIssuedDate: ai.borrower.idCardIssuedDate,
            idCardExpireDate: ai.borrower.idCardExpireDate,
            idCardLifetime: ai.borrower.idCardLifetime
          }
        };
      });

      if (guarantee) {
        guarantee.agreementId = null;
        guarantee.status = guaranteeStatusSet.cancel;
        guarantee.cancelDate = new Date();
        guarantee.guaranteeCancelReason = "ต้องการสร้างสัญญาค้ำประกันฉบับใหม่";
      }

      const newGuarantee: DeepPartial<Guarantee> = {
        organization: agreement.organization,
        refReportCode: "",
        fiscalYear: agreement.fiscalYear,
        documentDate: agreement.documentDate,
        documentNumber: agreement.documentNumber,
        guaranteeType: agreement.agreementType,
        status: guaranteeStatusSet.new,
        startDate: agreement.startDate,
        endDate: agreement.endDate,
        signLocation: agreement.signLocation,
        signLocationAddress: {
          houseNo: agreement.organization.address.houseNo,
          street: agreement.organization.address.street,
          subDistrictCode: agreement.organization.address.subDistrictCode,
          subDistrict: agreement.organization.address.subDistrict,
          districtCode: agreement.organization.address.districtCode,
          district: agreement.organization.address.district,
          provinceCode: agreement.organization.address.provinceCode,
          province: agreement.organization.address.province
        },
        loanAmount: agreement.loanAmount,
        agreement,
        agreementDocumentNumber: agreement.documentNumber,
        agreementDocumentDate: agreement.documentDate,
        agreementAuthorizedTitle:
          agreement.organization.agreementAuthorizedTitle,
        agreementAuthorizedFirstname:
          agreement.organization.agreementAuthorizedFirstname,
        agreementAuthorizedLastname:
          agreement.organization.agreementAuthorizedLastname,
        agreementAuthorizedPosition:
          agreement.organization.agreementAuthorizedPosition,
        agreementAuthorizedCommandNo:
          agreement.organization.agreementAuthorizedCommandNo,
        agreementAuthorizedCommandDate:
          agreement.organization.agreementAuthorizedCommandDate,
        requestId: agreement.requestId,
        guaranteeItems: newGuaranteeItems,
        witness1: agreement.organization.witness1,
        witness2: agreement.organization.witness2
      };

      const newG = GuaranteeRepository.create(newGuarantee);
      agreement.guarantee = newG;
      agreement.guaranteeDocumentNumber = newG.documentNumber;
      agreement.guaranteeDocumentDate = newG.documentDate;

      let entity: Guarantee;
      if (guarantee) {
        entity = await GuaranteeRepository.createGuaranteeAndMapToAgreement(
          guarantee,
          agreement
        );
      } else {
        await this.updateRepo.update(agreement);
        const agree = await AgreementRepository.findOne(agreement.id, {
          relations: ["guarantee"]
        });
        entity = agree.guarantee;
      }

      return entity;
    } catch (e) {
      throw e;
    }
  };

  updateGuarantee = async (req, res, next) => {
    try {
      const guarantee = await GuaranteeRepository.findOne(req.params.id, {});

      GuaranteeRepository.merge(guarantee, req.body);

      const guaranteeItems = getRepository(GuaranteeItem).create(
        req.body.guaranteeItems
      );

      // O2M
      // guarantee.guaranteeItems = req.body.guaranteeItems;
      guarantee.guaranteeItems = guaranteeItems;

      await GuaranteeRepository.updateGuarantee(guarantee);

      next();
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      let hasFKey = false;
      const guarantee = await GuaranteeRepository.findOne(+req.params.id, {
        relations: ["agreement"]
      });
      const { agreement } = guarantee;
      if (guarantee.agreementId) {
        guarantee.agreementId = null;
        hasFKey = true;
      }
      if (guarantee.requestId) {
        guarantee.requestId = null;
        hasFKey = true;
      }
      if (agreement) {
        agreement.guaranteeId = null;
      }

      delete guarantee.agreement;

      await getManager().transaction(async (transactionEntityManager) => {
        if (hasFKey) {
          await transactionEntityManager.save(guarantee);
          if (agreement) {
            await transactionEntityManager.save(agreement);
          }
        }
        await transactionEntityManager.remove(guarantee);
      });
      res.send({ success: true });
    } catch (e) {
      next(e);
    }
  };

  private validateCreateReq = (
    guarantee: DeepPartial<Guarantee>
  ): [boolean, string] => {
    const {
      guaranteeItems,
      organization,
      documentDate,
      request,
      agreementDocumentNumber
    } = guarantee;

    if (!guaranteeItems) {
      return [true, "ไม่พบข้อมูลผู้ขอกู้ และผู้ค้ำประกัน"];
    }

    // if (!organization.id) {
    if (!organization) {
      return [true, "กรุณาระบุหน่วยงานทำการสร้างเอกสารค้ำประกันเงินกู้"];
    }

    if (!documentDate) {
      return [true, "กรุณาระบุวันที่ที่ต้องการสร้างเอกสารค้ำประกันเงินกู้"];
    }

    // if (!request.id) {
    //   return [true, "ไม่พบเลขที่เอกสารคำร้อง กรุณาเลือกเอกสารคำร้องก่อน"];
    // }

    // if (!agreementDocumentNumber) {
    //   return [
    //     true,
    //     "ไม่พบเลขที่เอกสารสัญญาเงินกู้ กรุณาตรวจสอบข้อมูลสัญญาเงินกู้ที่เกี่ยวข้องให้ครบถ้วน"
    //   ];
    // }

    return [null, ""];
  };
}

export const controller = new GuaranteeController(
  "Guarantee",
  "เอกสารค้ำประกันเงินกู้"
);
