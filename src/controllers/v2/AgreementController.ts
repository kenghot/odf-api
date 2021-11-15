import { DeepPartial, getRepository, In } from "typeorm";
import { Agreement } from "../../entities/Agreement";
import { AgreementItem } from "../../entities/AgreementItem";
import { AgreementSequence } from "../../entities/AgreementSequence";
import { Guarantee } from "../../entities/Guarantee";
import { GuaranteeItem } from "../../entities/GuaranteeItem";
import { Organization } from "../../entities/Organization";
import { Request } from "../../entities/Request";
import {
  agreementStatusSet,
  guaranteeStatusSet,
  loanTypeSet,
  requestStatusSet,
} from "../../enumset";
import { ValidateError } from "../../middlewares/error/error-type";
import AgreementRepository from "../../repositories/v2/AgreementRepository";
import { getFiscalYear } from "../../utils/datetime-helper";
import { BaseController } from "./BaseController";

class AgreementController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  create = async (req, res, next) => {
    const agreement: DeepPartial<Agreement> = req.body;
    const { organization, documentDate } = agreement;

    const [err, message] = this.validateCreateReq(agreement);

    if (err) {
      return next(
        new ValidateError({
          name: `ไม่สามารถสร้างเอกสาร${this.entityInfo}`,
          message: `ไม่สามารถสร้างเอกสาร${this.entityInfo} ${message}`,
        })
      );
    }

    try {
      const {
        agreementSequence,
      }: Organization = await this.searchRepo.findOneById(
        "Organization",
        "organization",
        organization.id,
        [],
        { relations: ["agreementSequence"] }
      );

      // tslint:disable-next-line: no-shadowed-variable
      const [err, message, fiscalYear] = this.validateDocSequence(
        agreementSequence,
        documentDate as Date
      );

      if (err) {
        return next(
          new ValidateError({
            name: `ไม่สามารถสร้างเอกสาร${this.entityInfo}`,
            message: `ไม่สามารถสร้างเอกสาร${this.entityInfo} ${message}`,
          })
        );
      }

      const agreementWithRequest = await AgreementRepository.findOne({
        request: agreement.request as any,
      });

      if (agreementWithRequest) {
        return next(
          new ValidateError({
            name: `ไม่สามารถสร้างเอกสาร${this.entityInfo}`,
            message:
              "เอกสารคำร้องถูกใช้ไปแล้ว กรุณาเลือกเอกสารคำร้องที่ยังไม่ถูกนำไปสร้างเอกสารสัญญาเงินกู้",
          })
        );
      }

      const entity = await AgreementRepository.createAgreement(
        getRepository(Agreement).create(agreement),
        agreementSequence
      );

      res.locals.data = entity;

      next();
    } catch (err) {
      err.message = `ไม่สามารถสร้างเอกสาร${this.entityInfo} ${err.message}`;
      next(err);
    }
  };

  createMany = async (req, res, next) => {
    const { ids, documentDate } = req.body;
    try {
      const requests = await getRepository(Request).find({
        relations: ["requestItems", "organization"],
        where: { id: In(ids), status: requestStatusSet.approve3 },
      });

      const successRequests: Request[] = [];
      const failedRequests: Request[] = [];

      for (const request of requests) {
        if (!request.installmentFirstDate) {
          request.error = {
            message:
              "ไม่สามารถสร้างสัญญาเงินกู้ได้เนื่องจากไม่พบข้อมูลวันที่ผ่อนชำระงวดแรก",
          };
          failedRequests.push(request);
          continue;
        }
        const agreementData = this.prepareAgreementData(request, documentDate);
        const guaranteeData = this.prepareGuaranteeData(request, documentDate);
        const organization = await getRepository(Organization).findOne(
          { id: agreementData.organization.id },
          {
            relations: ["agreementSequence"],
          }
        );

        if (!organization.agreementSequence) {
          return next(
            new ValidateError({
              name: "ไม่สามารถสร้างเอกสารสัญญาเงินกู้ได้",
              message:
                "ไม่สามารถสร้างเอกสารสัญญาเงินกู้ได้เนื่องจากหน่วยงานยังไม่มีเลขที่เอกสารสัญญาเงินกู้ กรุณาติดต่อผู้ดูแลระบบ",
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
        //         "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ตรงกับปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ",
        //     })
        //   );
        // }

        agreementData.fiscalYear = `${fiscalYear}`;
        guaranteeData.fiscalYear = `${fiscalYear}`;

        const agreementEntity = getRepository(Agreement).create(agreementData);
        const guaranteeEntity = getRepository(Guarantee).create(guaranteeData);

        // actionLog
        agreementEntity.logCreatedBy(req.body);
        guaranteeEntity.logCreatedBy(req.body);

        try {
          const updatedRequest = await AgreementRepository.createAgreementAndGuarantee(
            // getRepository(Agreement).create(agreementData),
            // getRepository(Guarantee).create(guaranteeData),
            agreementEntity,
            guaranteeEntity,
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
        success: true,
      });
    } catch (err) {
      err.message = `ไม่สามารถสร้าง${this.entityInfo} ${err.message}`;
      next(err);
    }
  };

  validateUpdateAgreement = async (req, res, next) => {
    const agreement: DeepPartial<Agreement> = req.body;

    try {
      if (agreement.request) {
        if (agreement.request.id) {
          const agreementWithRequest = await AgreementRepository.findOne({
            request: agreement.request as any,
          });

          // เช็คว่าสัญญาที่ผูกกับคำร้องเป็นสัญญาตัวที่กำลังแก้ไขรึป่าว
          if (
            agreementWithRequest &&
            +agreementWithRequest.id !== +req.params.id
          ) {
            return next(
              new ValidateError({
                name: `ไม่สามารถสร้างเอกสาร${this.entityInfo}`,
                message:
                  "เอกสารคำร้องถูกใช้ไปแล้ว กรุณาเลือกเอกสารคำร้องที่ยังไม่ถูกนำไปสร้างเอกสารสัญญาเงินกู้",
              })
            );
          }
        } else if (!agreement.request.id) {
          agreement.request = undefined;
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
  updateAgreement = async (req, res, next) => {
    try {
      const agreementEntity = await AgreementRepository.findOne(
        { id: req.params.id },
        {
          relations: ["organization", "agreementItems", "guarantee"],
        }
      );

      AgreementRepository.merge(agreementEntity, req.body);

      const { guarantee } = agreementEntity;
      if (guarantee) {
        agreementEntity.guaranteeDocumentDate = agreementEntity.documentDate;
        guarantee.documentDate = agreementEntity.guaranteeDocumentDate;
        guarantee.agreementDocumentDate = agreementEntity.documentDate;
      }

      await AgreementRepository.updateAgreement(agreementEntity, guarantee);

      next();
    } catch (err) {
      next(err);
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
          isOnlyBirthYear: ri.borrower.isOnlyBirthYear,
          idCardNo: ri.borrower.idCardNo,
          idCardIssuer: ri.borrower.idCardIssuer,
          idCardIssuedDate: ri.borrower.idCardIssuedDate,
          idCardExpireDate: ri.borrower.idCardExpireDate,
          idCardLifetime: ri.borrower.idCardLifetime,
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
          isOnlyBirthYear: ri.guarantor.isOnlyBirthYear,
          idCardNo: ri.guarantor.idCardNo,
          idCardIssuer: ri.guarantor.idCardIssuer,
          idCardIssuedDate: ri.guarantor.idCardIssuedDate,
          idCardExpireDate: ri.guarantor.idCardExpireDate,
          idCardLifetime: ri.guarantor.idCardLifetime,
        },
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
        province: request.organization.address.province,
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
      witness2: request.organization.witness2,
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
          isOnlyBirthYear: ri.guarantor.isOnlyBirthYear,
          idCardNo: ri.guarantor.idCardNo,
          idCardIssuer: ri.guarantor.idCardIssuer,
          idCardIssuedDate: ri.guarantor.idCardIssuedDate,
          idCardExpireDate: ri.guarantor.idCardExpireDate,
          idCardLifetime: ri.guarantor.idCardLifetime,
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
          isOnlyBirthYear: ri.borrower.isOnlyBirthYear,
          idCardNo: ri.borrower.idCardNo,
          idCardIssuer: ri.borrower.idCardIssuer,
          idCardIssuedDate: ri.borrower.idCardIssuedDate,
          idCardExpireDate: ri.borrower.idCardExpireDate,
          idCardLifetime: ri.borrower.idCardLifetime,
        },
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
        province: request.organization.address.province,
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
      witness2: request.organization.witness2,
      //   guaranteeCancelReason: string;
    };
    return guaranteeData;
  };

  private validateCreateReq = (
    agreement: DeepPartial<Agreement>
  ): [boolean, string] => {
    const { agreementItems, organization, documentDate } = agreement;

    if (!agreementItems) {
      return [true, "ไม่พบข้อมูลผู้ขอกู้ และผู้ค้ำประกัน"];
    }

    if (!organization.id) {
      return [true, "กรุณาระบุหน่วยงานที่ทำการสร้างสัญญาเงินกู้"];
    }

    if (!documentDate) {
      return [true, "กรุณาระบุวันที่ที่ต้องการสร้างสัญญาเงินกู้"];
    }

    return [null, ""];
  };

  private validateDocSequence = (
    sequence: AgreementSequence,
    date: Date
  ): [boolean, string, number?] => {
    if (!sequence) {
      return [
        true,
        "หน่วยงานที่ทำการสร้างสัญญาเงินกู้ยังไม่ได้ตั้งค่าเลขที่เอกสารสัญญาเงินกู้ กรุณาติดต่อผู้ดูแลระบบ",
      ];
    }

    const fiscalYear = getFiscalYear(date);
      //ฟังก์ชันล็อคปีงบประมาณ userต้องการปิด beer12112021

    // if (fiscalYear !== +sequence.prefixYear) {
    //   return [
    //     true,
    //     "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ตรงกับปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ",
    //   ];
    // }

    return [null, "", fiscalYear];
  };
}

export const controller = new AgreementController("Agreement", "สัญญาเงินกู้");
