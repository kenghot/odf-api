import { RequestHandler } from "express";
import { DeepPartial, getRepository, In } from "typeorm";

import { Agreement } from "../../entities/Agreement";
import { AgreementItem } from "../../entities/AgreementItem";
import { Guarantee } from "../../entities/Guarantee";
import { GuaranteeItem } from "../../entities/GuaranteeItem";
import { Request } from "../../entities/Request";
import {
  agreementStatusSet,
  guaranteeStatusSet,
  loanTypeSet,
  requestStatusSet
} from "../../enumset";
import {
  NotFoundError,
  ValidateError
} from "../../middlewares/error/error-type";
import {
  AgreementRepository,
  GuaranteeRepository,
  OrganizationRepository,
  RequestRepository
} from "../../repositories/v1";
import { IAgreementQuery } from "../../repositories/v1/agreement_repository";
import { getFiscalYear } from "../../utils/datetime-helper";
import { BaseController, IGetOptions } from "./base_controller";

interface ICreateAgreement {
  ids: number[];
  documentDate: string;
}

class AgreementController extends BaseController {
  getMany = (options?: IGetOptions): RequestHandler => {
    return async (req, res, next) => {
      const query: IAgreementQuery = req.query;

      try {
        const [entities, total] = await AgreementRepository.findAgreements(
          query,
          options
        );

        if (!total) {
          // return next(
          //   new NotFoundError({
          //     name: "ไม่พบรายการข้อมูลสัญญาเงินกู้",
          //     message: "ไม่พบรายการข้อมูลสัญญาเงินกู้"
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
    const agreement = req.body as DeepPartial<Agreement>;

    try {
      if (!agreement.agreementItems) {
        return next(
          new ValidateError({
            name: "ไม่สามารถสร้างเอกสารสัญญาเงินกู้",
            message:
              "ไม่สามารถสร้างเอกสารสัญญาเงินกู้ ไม่พบข้อมูลผู้ขอกู้ และผู้ค้ำประกัน"
          })
        );
      }
      if (!agreement.organization.id) {
        throw new ValidateError({
          name: "ไม่สามารถสร้างเอกสารสัญญาเงินกู้ได้",
          message: "กรุณาระบุหน่วยงานที่ทำการสร้างสัญญาเงินกู้"
        });
      }

      if (!agreement.documentDate) {
        throw new ValidateError({
          name: "ไม่สามารถสร้างเอกสารสัญญาเงินกู้ได้",
          message: "กรุณาระบุวันที่ที่ต้องการสร้างสัญญาเงินกู้"
        });
      }

      const organization = await OrganizationRepository.findOne(
        { id: agreement.organization.id },
        { relations: ["agreementSequence"] }
      );

      const fiscalYear = getFiscalYear(agreement.documentDate as Date);
      //ฟังก์ชันล็อคปีงบประมาณ userต้องการปิด beer12112021
      // if (fiscalYear !== +organization.agreementSequence.prefixYear) {
      //   throw new ValidateError({
      //     name: "ไม่สามารถสร้างเอกสารสัญญาเงินกู้ได้ได้",
      //     message:
      //       "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ"
      //   });
      // }

      const a = await AgreementRepository.findOne({
        request: agreement.request as any
      });

      if (a) {
        return next(
          new ValidateError({
            name: "ไม่สามารถสร้างเอกสารสัญญาเงินกู้ได้",
            message:
              "เอกสารคำร้องถูกใช้ไปแล้ว กรุณาเลือกเอกสารคำร้องที่ยังไม่ถูกนำไปสร้างเอกสารสัญญาเงินกู้"
          })
        );
      }

      const entity = await AgreementRepository.createAgreement(
        AgreementRepository.create(agreement),
        organization.agreementSequence
      );

      res.send({ data: entity, success: true });
    } catch (e) {
      next(e);
    }
  };

  createMany: RequestHandler = async (req, res, next) => {
    const { ids, documentDate } = req.body as ICreateAgreement;
    try {
      const requests = await RequestRepository.find({
        relations: ["requestItems", "organization"],
        where: { id: In(ids), status: requestStatusSet.approve3 }
        // where: { id: In(ids) }
      });

      const successRequests: Request[] = [];
      const failedRequests: Request[] = [];

      // const ap3Requests: Request[] = [];

      // // very bad code for nodejs
      // requests.forEach((r) => {
      //   if (r.status !== requestStatusSet.approve3) {
      //     failedRequests.push(r);
      //   } else {
      //     ap3Requests.push(r);
      //   }
      // });

      for (const request of requests) {
        // for (const request of ap3Requests) {
        const agreementData = this.prepareAgreementData(request, documentDate);
        const guaranteeData = this.prepareGuaranteeData(request, documentDate);
        const organization = await OrganizationRepository.findOne(
          { id: agreementData.organization.id },
          {
            relations: ["agreementSequence"]
          }
        );

        if (!organization.agreementSequence) {
          return next(
            new ValidateError({
              name: "ไม่สามารถสร้างเอกสารสัญญาเงินกู้ได้",
              message:
                "ไม่สามารถสร้างเอกสารสัญญาเงินกู้ได้เนื่องจากหน่วยงานยังไม่มีเลขที่เอกสารสัญญาเงินกู้ กรุณาติดต่อผู้ดูแลระบบ"
            })
          );
        }

        const fiscalYear = getFiscalYear(agreementData.documentDate as Date);
      //ฟังก์ชันล็อคปีงบประมาณ userต้องการปิด beer12112021

        // if (fiscalYear !== +organization.agreementSequence.prefixYear) {
        //   return next(
        //     new ValidateError({
        //       name: "ไม่สามารถสร้างเอกสารสัญญาเงินกู้ได้",
        //       message:
        //         "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ตรงกับปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ"
        //     })
        //   );
        // }

        agreementData.fiscalYear = `${fiscalYear}`;
        guaranteeData.fiscalYear = `${fiscalYear}`;
        try {
          const updatedRequest = await AgreementRepository.createAgreementAndGuarantee(
            AgreementRepository.create(agreementData),
            GuaranteeRepository.create(guaranteeData),
            organization.agreementSequence,
            request
          );

          successRequests.push(updatedRequest);
        } catch (e) {
          request.error = { message: e.message };
          failedRequests.push(request);
          // throw e;
        }
      }

      res.send({
        data: { successRequests, failedRequests },
        success: true
      });
    } catch (e) {
      next(e);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    const { agreementItems, ...rest } = req.body as DeepPartial<Agreement>;
    try {
      const agreement = await AgreementRepository.findOne(
        { id: +req.params.id },
        { join: { alias: "ett" }, relations: ["agreementItems"] }
      );
      AgreementRepository.merge(agreement, rest);

      if (!agreement) {
        return next(
          new NotFoundError({
            name: "ไม่สามารถแก้ไขเอกสารสัญญาเงินกู้",
            message:
              "ไม่สามารถแก้ไขเอกสารสัญญาเงินกู้เนื่องจากไม่พบสัญญาเงินกู้ที่ต้องการแก้ไขในระบบ"
          })
        );
      }

      const entity = await AgreementRepository.updateAgreement(
        agreement,
        agreementItems
          ? getRepository(AgreementItem).create(agreementItems)
          : undefined
      );

      res.send({ data: entity, success: true });
    } catch (e) {
      next(e);
    }
  };

  private prepareAgreementData = (request: Request, date: Date | string) => {
    const agreementItems: DeepPartial<
      AgreementItem
    >[] = request.requestItems.map((ri) => {
      return {
        borrower: {
          title: ri.borrower.title,
          firstname: ri.borrower.firstname,
          lastname: ri.borrower.lastname,
          birthDate: ri.borrower.birthDate,
          idCardNo: ri.borrower.idCardNo,
          idCardIssuer: ri.borrower.idCardIssuer,
          idCardIssuedDate: ri.borrower.idCardIssuedDate,
          idCardExpireDate: ri.borrower.idCardExpireDate,
          idCardLifetime: ri.borrower.idCardLifetime
        },
        borrowerIdCardAddress: ri.borrower.idCardAddress,
        borrowerRegisteredAddressType: ri.borrower.registeredAddressType,
        borrowerRegisteredAddress: ri.borrower.registeredAddress,
        borrowerTelephone: ri.borrower.telephone,
        guarantor: {
          title: ri.guarantor.title,
          firstname: ri.guarantor.firstname,
          lastname: ri.guarantor.lastname,
          birthDate: ri.guarantor.birthDate,
          idCardNo: ri.guarantor.idCardNo,
          idCardIssuer: ri.guarantor.idCardIssuer,
          idCardIssuedDate: ri.guarantor.idCardIssuedDate,
          idCardExpireDate: ri.guarantor.idCardExpireDate,
          idCardLifetime: ri.guarantor.idCardLifetime
        }
      };
    });
    const agreementData: DeepPartial<Agreement> = {
      organization: request.organization,
      refReportCode: "",
      fiscalYear: request.fiscalYear,
      documentDate: date,
      // documentNumber: string;
      agreementType: request.requestType,
      name: request.name,
      status: agreementStatusSet.new,
      startDate: date,
      endDate: request.installmentLastDate,
      // loanPaymentDate: Date;
      // disclaimDate: Date;
      // cancelDate: Date;
      // closeDate: Date;
      // requestId: number;
      request,
      signLocation: request.organization.orgName,
      signLocationAddress: {
        houseNo: request.organization.address.houseNo,
        street: request.organization.address.street,
        subDistrictCode: request.organization.address.subDistrictCode,
        subDistrict: request.organization.address.subDistrict,
        districtCode: request.organization.address.districtCode,
        district: request.organization.address.district,
        provinceCode: request.organization.address.provinceCode,
        province: request.organization.address.province
      },
      agreementAuthorizedTitle: request.organization.agreementAuthorizedTitle,
      agreementAuthorizedFirstname:
        request.organization.agreementAuthorizedFirstname,
      agreementAuthorizedLastname:
        request.organization.agreementAuthorizedLastname,
      agreementAuthorizedPosition:
        request.organization.agreementAuthorizedPosition,
      agreementAuthorizedCommandNo:
        request.organization.agreementAuthorizedCommandNo,
      agreementAuthorizedCommandDate:
        request.organization.agreementAuthorizedCommandDate,
      agreementItems,
      loanAmount: request.result3.approveBudget,
      loanDurationYear: `${request.getDurationYear()}`,
      loanDurationMonth: `${request.getDurationMonth()}`,
      // guarantee: Guarantee;
      // guaranteeDocumentNumber: string;
      // guaranteeDocumentDate: Date | string;
      loanPaymentLocation: request.organization.orgName,
      installmentAmount: request.installmentAmount,
      installmentLastAmount: request.installmentLastAmount,
      installmentPeriodValue: request.installmentPeriodValue,
      installmentPeriodUnit: request.installmentPeriodUnit,
      installmentPeriodDay: request.installmentPeriodDay,
      installmentTimes: request.installmentTimes,
      installmentFirstDate: request.installmentFirstDate,
      installmentLastDate: request.installmentLastDate,
      // agreementCancelReason: string;
      witness1: request.organization.witness1,
      witness2: request.organization.witness2
    };
    return agreementData;
  };

  private prepareGuaranteeData = (request: Request, date: Date | string) => {
    const guaranteeItems: DeepPartial<
      GuaranteeItem
    >[] = request.requestItems.map((ri) => {
      return {
        guarantor: {
          title: ri.guarantor.title,
          firstname: ri.guarantor.firstname,
          lastname: ri.guarantor.lastname,
          birthDate: ri.guarantor.birthDate,
          idCardNo: ri.guarantor.idCardNo,
          idCardIssuer: ri.guarantor.idCardIssuer,
          idCardIssuedDate: ri.guarantor.idCardIssuedDate,
          idCardExpireDate: ri.guarantor.idCardExpireDate,
          idCardLifetime: ri.guarantor.idCardLifetime
        },
        guarantorIdCardAddress: ri.guarantor.idCardAddress,
        guarantorRegisteredAddressType: ri.guarantor.registeredAddressType,
        guarantorRegisteredAddress: ri.guarantor.registeredAddress,
        guarantorTelephone: ri.guarantor.telephone,
        guarantorOccupation: ri.guarantor.occupation,
        guarantorCompanyName: ri.guarantorCompanyName,
        guarantorPosition: ri.guarantorPosition,
        guarantorSalary: ri.guarantor.occupation.salary,
        borrower: {
          title: ri.borrower.title,
          firstname: ri.borrower.firstname,
          lastname: ri.borrower.lastname,
          birthDate: ri.borrower.birthDate,
          idCardNo: ri.borrower.idCardNo,
          idCardIssuer: ri.borrower.idCardIssuer,
          idCardIssuedDate: ri.borrower.idCardIssuedDate,
          idCardExpireDate: ri.borrower.idCardExpireDate,
          idCardLifetime: ri.borrower.idCardLifetime
        }
      };
    });
    const guaranteeData: DeepPartial<Guarantee> = {
      organization: request.organization,
      refReportCode: "",
      fiscalYear: request.fiscalYear,
      documentDate: date,
      //   documentNumber: string;
      guaranteeType: request.requestType,
      // name: request.name,
      name:
        request.requestType === loanTypeSet.group
          ? request.name
          : `${request.requestItems[0].guarantor.title}${request.requestItems[0].guarantor.firstname} ${request.requestItems[0].guarantor.lastname}`,
      status: guaranteeStatusSet.new,
      startDate: date,
      endDate: request.installmentLastDate,
      signLocation: request.organization.orgName,
      signLocationAddress: {
        houseNo: request.organization.address.houseNo,
        street: request.organization.address.street,
        subDistrictCode: request.organization.address.subDistrictCode,
        subDistrict: request.organization.address.subDistrict,
        districtCode: request.organization.address.districtCode,
        district: request.organization.address.district,
        provinceCode: request.organization.address.provinceCode,
        province: request.organization.address.province
      },
      guaranteeItems,
      loanAmount: request.result3.approveBudget,
      //   agreement: Agreement;
      //   agreementDocumentNumber: string;
      //   agreementDocumentDate: Date | string;
      agreementAuthorizedTitle: request.organization.agreementAuthorizedTitle,
      agreementAuthorizedFirstname:
        request.organization.agreementAuthorizedFirstname,
      agreementAuthorizedLastname:
        request.organization.agreementAuthorizedLastname,
      agreementAuthorizedPosition:
        request.organization.agreementAuthorizedPosition,
      agreementAuthorizedCommandNo:
        request.organization.agreementAuthorizedCommandNo,
      agreementAuthorizedCommandDate:
        request.organization.agreementAuthorizedCommandDate,
      request,
      witness1: request.organization.witness1,
      witness2: request.organization.witness2
      //   guaranteeCancelReason: string;
    };
    return guaranteeData;
  };
}

export const controller = new AgreementController(AgreementRepository);
