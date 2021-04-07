import { RequestHandler } from "express";

import { DeepPartial, getManager, getRepository } from "typeorm";
import { Guarantee } from "../../entities/Guarantee";
import { GuaranteeItem } from "../../entities/GuaranteeItem";
import { guaranteeStatusSet } from "../../enumset";
import {
  NotFoundError,
  ValidateError
} from "../../middlewares/error/error-type";
import {
  AgreementRepository,
  GuaranteeRepository,
  OrganizationRepository
} from "../../repositories/v1";
import { IGuaranteeQuery } from "../../repositories/v1/guarantee_repository";
import { getFiscalYear } from "../../utils/datetime-helper";
import { BaseController, IGetOptions } from "./base_controller";

class GuaranteeController extends BaseController {
  getMany = (options?: IGetOptions): RequestHandler => {
    return async (req, res, next) => {
      const query: IGuaranteeQuery = req.query;

      try {
        const [entities, total] = await GuaranteeRepository.findGuarantees(
          query,
          options
        );

        if (!total) {
          // return next(
          //   new NotFoundError({
          //     name: "ไม่พบรายการข้อมูลสัญญาค้ำประกันเงินกู้",
          //     message: "ไม่พบรายการข้อมูลสัญญาค้ำประกันเงินกู้"
          //   })
          // );
          next();
        }

        res.locals.data = entities;
        res.locals.total = total;
        next();
      } catch (e) {
        next(e);
      }
    };
  };

  create: RequestHandler = async (req, res, next) => {
    const guarantee = req.body as DeepPartial<Guarantee>;

    let entity: Guarantee;

    try {
      if (guarantee.agreementId) {
        entity = await this.createGuaranteeAndMapToAgreement(
          guarantee.agreementId
        );
      } else {
        if (!guarantee.guaranteeItems) {
          return next(
            new ValidateError({
              name: "ไม่สามารถสร้างเอกสารสัญญาค้ำประกัน",
              message:
                "ไม่สามารถสร้างเอกสารสัญญาค้ำประกัน ไม่พบข้อมูลผู้ขอกู้ และผู้ค้ำประกัน"
            })
          );
        }

        if (!guarantee.organization) {
          return next(
            new ValidateError({
              name: "ไม่สามารถสร้างเอกสารค้ำประกันเงินกู้ได้",
              message: "กรุณาระบุหน่วยงานทำการสร้างเอกสารค้ำประกันเงินกู้"
            })
          );
        }

        if (!guarantee.documentDate) {
          return next(
            new ValidateError({
              name: "ไม่สามารถสร้างเอกสารค้ำประกันเงินกู้ได้",
              message: "กรุณาระบุวันที่ที่ต้องการสร้างเอกสารค้ำประกันเงินกู้"
            })
          );
        }

        // if (!guarantee.request.id) {
        //   return next(
        //     new ValidateError({
        //       name: "ไม่สามารถสร้างเอกสารค้ำประกันเงินกู้ได้",
        //       message: "ไม่พบเลขที่เอกสารคำร้อง กรุณาเลือกเอกสารคำร้องก่อน"
        //     })
        //   );
        // }

        // const g = await GuaranteeRepository.findOne({
        //   request: guarantee.request as any
        // });

        // if (g) {
        //   return next(
        //     new ValidateError({
        //       name: "ไม่สามารถสร้างเอกสารค้ำประกันเงินกู้ได้",
        //       message:
        //         "เอกสารคำร้องถูกใช้ไปแล้ว กรุณาเลือกเอกสารคำร้องที่ยังไม่ถูกนำไปสร้างเอกสารสัญญาค้ำประกัน"
        //     })
        //   );
        // }

        // g = await GuaranteeRepository.findOne({
        //   agreement: guarantee.agreement as any
        // });

        // if (g) {
        //   return next(
        //     new ValidateError({
        //       name: "ไม่สามารถสร้างเอกสารค้ำประกันเงินกู้ได้",
        //       message:
        //         "เอกสารสัญญาเงินกู้ถูกใช้ไปแล้ว กรุณาเลือกเอกสารสัญญาเงินกู้ที่ยังไม่ถูกนำไปสร้างเอกสารสัญญาค้ำประกัน"
        //     })
        //   );
        // }

        // if (!guarantee.agreementDocumentNumber) {
        //   return next(
        //     new ValidateError({
        //       name: "ไม่สามารถสร้างเอกสารค้ำประกันเงินกู้ได้",
        //       message:
        //         "ไม่พบเลขที่เอกสารสัญญาเงินกู้ กรุณาตรวจสอบข้อมูลสัญญาเงินกู้ที่เกี่ยวข้องให้ครบถ้วน"
        //     })
        //   );
        // }
        guarantee.documentNumber = guarantee.agreementDocumentNumber;
        if (!guarantee.loanAmount) {
          guarantee.loanAmount = 0;
        }

        guarantee.agreementDocumentDate = guarantee.documentDate;

        entity = await GuaranteeRepository.createGuarantee(
          GuaranteeRepository.create(guarantee)
        );
        if (entity.agreement.id === null) {
          delete entity.agreement;
        }
      }

      res.send({ data: entity, success: true });
    } catch (e) {
      next(e);
    }
  };

  private createGuaranteeAndMapToAgreement = async (agreementId: number) => {
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
        const agree = await AgreementRepository.updateAgreement(agreement);
        entity = agree.guarantee;
      }

      return entity;
    } catch (e) {
      throw e;
    }
  };

  update: RequestHandler = async (req, res, next) => {
    const { guaranteeItems, ...rest } = req.body as DeepPartial<Guarantee>;
    try {
      const guarantee = await GuaranteeRepository.findOne(
        { id: +req.params.id },
        { join: { alias: "ett" }, relations: ["guaranteeItems"] }
      );
      GuaranteeRepository.merge(guarantee, rest);

      if (!guarantee) {
        return next(
          new NotFoundError({
            name: "ไม่สามารถแก้ไขเอกสารสัญญาค้ำประกันเงินกู้",
            message:
              "ไม่สามารถแก้ไขเอกสารสัญญาเงินกู้เนื่องจากไม่พบสัญญาค้ำประกันเงินกู้ที่ต้องการแก้ไขในระบบ"
          })
        );
      }

      const entity = await GuaranteeRepository.updateGuarantee(
        guarantee,
        guaranteeItems
          ? getRepository(GuaranteeItem).create(guaranteeItems as any)
          : undefined
      );

      res.send({ data: entity, success: true });
    } catch (e) {
      next(e);
    }
  };

  delete: RequestHandler = async (req, res, next) => {
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
}

export const controller = new GuaranteeController(GuaranteeRepository);
