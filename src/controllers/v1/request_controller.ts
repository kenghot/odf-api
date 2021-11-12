import { RequestHandler } from "express";
import { DeepPartial, getRepository } from "typeorm";

import { AttachedFile } from "../../entities/AttachedFile";
import { BudgetAllocationItem } from "../../entities/BudgetAllocationItem";
import { EmbeddedProfile } from "../../entities/embedded/EmbeddedProfile";
import { Organization } from "../../entities/Organization";
import { Request } from "../../entities/Request";
import { RequestFactSheet } from "../../entities/RequestFactSheet";
import { RequestItem } from "../../entities/RequestItem";
import { agreementStatusSet, requestStatusSet } from "../../enumset";
import {
  NotFoundError,
  ValidateError
} from "../../middlewares/error/error-type";
import {
  AgreementRepository,
  OrganizationRepository,
  RequestRepository
} from "../../repositories/v1";
import { IRequestQuery } from "../../repositories/v1/request_repository";
import { getAge, getFiscalYear } from "../../utils/datetime-helper";
import { flattenObject } from "../../utils/object-helper";
import { BaseController, IGetOptions } from "./base_controller";

class RequestController extends BaseController {
  getMany = (options?: IGetOptions): RequestHandler => {
    return async (req, res, next) => {
      const query: IRequestQuery = req.query;

      try {
        const [entities, total] = await RequestRepository.findRequests(
          query,
          options
        );

        if (!total) {
          // return next(
          //   new NotFoundError({
          //     name: "ไม่พบรายการคำร้อง",
          //     message: "ไม่พบรายการคำร้อง"
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
    const request: DeepPartial<Request> = req.body;

    try {
      if (!request.requestItems) {
        return next(
          new ValidateError({
            name: "ไม่สามารถสร้างเอกสารคำร้องได้",
            message: "กรุณาระบุข้อมูลผู้ขอกู้และผู้ค้ำประกัน"
          })
        );
      }
      // if (!request.budgetAllocationItems) {
      //   return next(
      //     new ValidateError({
      //       name: "ไม่สามารถสร้างเอกสารคำร้องได้",
      //       message: "กรุณาระบุข้อมูลตารางค่าใช่จ่าย"
      //     })
      //   );
      // }
      if (!request.organization) {
        return next(
          new ValidateError({
            name: "ไม่สามารถสร้างเอกสารคำร้องได้",
            message: "กรุณาระบุหน่วยงานทำการสร้างคำร้อง"
          })
        );
      }

      if (!request.documentDate) {
        return next(
          new ValidateError({
            name: "ไม่สามารถสร้างเอกสารคำร้องได้",
            message: "กรุณาระบุวันที่ที่ต้องการสร้างคำร้อง"
          })
        );
      }

      if (request.organization && !request.organization.id) {
        return next(
          new ValidateError({
            name: "ไม่สามารถสร้างเอกสารคำร้องได้",
            message: "กรุณาระบุหน่วยงานทำการสร้างคำร้อง"
          })
        );
      }

      const organization = await OrganizationRepository.findOne(
        { id: request.organization.id },
        { relations: ["requestSequence"] }
      );

      if (!organization.requestSequence) {
        return next(
          new ValidateError({
            name: "ไม่สามารถสร้างเอกสารคำร้องได้",
            message:
              "หน่วยงานที่ทำการสร้างคำร้องยังไม่ได้ตั้งค่าเลขที่เอกสารคำร้อง กรุณาติดต่อผู้ดูแลระบบ"
          })
        );
      }

      const fiscalYear = getFiscalYear(request.documentDate as Date);
      //ฟังก์ชันล็อคปีงบประมาณ userต้องการปิด beer12112021

      // if (fiscalYear !== +organization.requestSequence.prefixYear) {
      //   return next(
      //     new ValidateError({
      //       name: "ไม่สามารถสร้างเอกสารคำร้องได้",
      //       message:
      //         "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ตรงกับปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ"
      //     })
      //   );
      // }

      request.fiscalYear = `${fiscalYear}`;

      // prevent error from status not DF
      // delete request.status;

      const entity = await RequestRepository.createRequest(
        RequestRepository.create(request)
        // organization.requestSequence
      );

      res.send({ data: entity, success: true });
    } catch (e) {
      next(e);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    const {
      budgetAllocationItems,
      requestItems,
      factSheet,
      // attachedFiles,
      ...rest
    } = req.body;
    let organization: Organization;
    try {
      const request = await RequestRepository.findOne(
        { id: +req.params.id },
        { relations: ["requestItems", "budgetAllocationItems", "organization"] }
      );

      if (!request) {
        return next(
          new NotFoundError({
            name: "ไม่สามารถแก้ไขเอกสารคำร้อง",
            message:
              "ไม่สามารถแก้ไขเอกสารคำร้องเนื่องจากไม่พบเอกสารคำร้องที่ต้องการแก้ไขในระบบ"
          })
        );
      }

      RequestRepository.merge(request, rest);

      if (!request.documentNumber && request.status === requestStatusSet.new) {
        organization = await OrganizationRepository.findOne(
          // { id: request.organization.id },
          { id: request.organizationId },
          { relations: ["requestSequence"] }
        );

        const fiscalYear = getFiscalYear(request.documentDate as Date);
      //ฟังก์ชันล็อคปีงบประมาณ userต้องการปิด beer12112021

        // if (fiscalYear !== +organization.requestSequence.prefixYear) {
        //   return next(
        //     new ValidateError({
        //       name: "ไม่สามารถสร้างเอกสารคำร้องได้",
        //       message:
        //         "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ตรงกับปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ"
        //     })
        //   );
        // }
      }else if(!request.documentNumber && request.status === requestStatusSet.newOnline){
        organization = await OrganizationRepository.findOne(
          // { id: request.organization.id },
          { id: request.organizationId },
          { relations: ["requestOnlineSequence"] }
        );

        const fiscalYear = getFiscalYear(request.documentDate as Date);
      //ฟังก์ชันล็อคปีงบประมาณ userต้องการปิด beer12112021

        // if (fiscalYear !== +organization.requestOnlineSequence.prefixYear) {
        //   return next(
        //     new ValidateError({
        //       name: "ไม่สามารถสร้างเอกสารคำร้องได้",
        //       message:
        //         "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ตรงกับปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ"
        //     })
        //   );
        // }
      }

      const _attachedFiles = [];
      flattenObject(req.body, "attachedFiles", true, _attachedFiles);

      const entity = await RequestRepository.updateRequest(
        request,
        requestItems
          ? getRepository(RequestItem).create(requestItems)
          : undefined,
        budgetAllocationItems
          ? getRepository(BudgetAllocationItem).create(budgetAllocationItems)
          : undefined,
        organization && organization.requestSequence
          ? organization.requestSequence
          : undefined,
        factSheet
          ? getRepository(RequestFactSheet).create(
              factSheet as RequestFactSheet
            )
          : undefined,
        getRepository(AttachedFile).create(_attachedFiles)
      );

      next();
    } catch (e) {
      console.log(e);
      next(e);
    }
  };

  updateAttachedFiles: RequestHandler = async (req, res, next) => {
    // const { attachedFiles } = req.body as DeepPartial<EmbeddedProfile>;
    try {
      const requestItem = await getRepository(RequestItem).findOne({
        id: req.params.subId
      });

      const _attachedFiles = [];
      flattenObject(req.body, "attachedFiles", true, _attachedFiles);

      const entity = await RequestRepository.updateAttachedFiles(
        requestItem,
        req.params.resource,
        // getRepository(AttachedFile).create(attachedFiles)
        getRepository(AttachedFile).create(_attachedFiles)
      );

      next();
    } catch (e) {
      next(e);
    }
  };

  createOrUpdateFactSheet: RequestHandler = async (req, res, next) => {
    const { attachedFiles, ...rest } = req.body as DeepPartial<
      RequestFactSheet
    >;
    try {
      const factSheet = await getRepository(RequestFactSheet).findOne({
        id: req.body.id
      });

      const _attachedFiles = [];
      flattenObject(req.body, "attachedFiles", true, _attachedFiles);

      const entity = await RequestRepository.createOrUpdateFactSheet(
        factSheet ? factSheet : getRepository(RequestFactSheet).create(rest),
        getRepository(AttachedFile).create(_attachedFiles)
      );
      next();
    } catch (e) {
      next(e);
    }
  };

  verifyBorrower: RequestHandler = async (req, res, next) => {
    const { firstname, lastname, idCardNo, agreementType, birthday } = req.body;
    try {
      const age = getAge(birthday, new Date());
      if (age < 60) {
        return next(
          new ValidateError({
            name: "DQ1",
            message: "ผู้ขอกู้คุณสมบัติไม่ผ่านเนื่องจากอายุยังไม่ถึง 60 ปี"
          })
        );
      }
      const [entities, total] = await AgreementRepository.findAgreements({
        firstname,
        lastname,
        idCardNo,
        agreementType,
        statusExcludeList: [agreementStatusSet.cancel, agreementStatusSet.close]
      });

      if (total) {
        return next(
          new ValidateError({
            name: "DQ2",
            message:
              "ผู้ขอกู้คุณสมบัติไม่ผ่านเนื่องจากยังติดภาระผูกพันจากการกู้ยืมอยู่"
          })
        );
      }

      res.send({ success: true });
    } catch (e) {
      next(e);
    }
  };

  verifyGuarantor: RequestHandler = async (req, res, next) => {
    const { firstname, lastname, idCardNo, agreementType, birthday } = req.body;
    try {
      const age = getAge(birthday, new Date());
      if (age > 59 || age < 20) {
        return next(
          new ValidateError({
            name: "DQ1",
            message:
              "ผู้ค้ำประกันคุณสมบัติไม่ผ่านเนื่องจากอายุไม่ถึง 20 ปี หรืออายุเกิน 59 ปี"
          })
        );
      }
      const [entities, total] = await AgreementRepository.findAgreements({
        guarantorFirstname: firstname,
        guarantorLastname: lastname,
        guarantorIdCardNo: idCardNo,
        agreementType,
        statusExcludeList: [agreementStatusSet.close, agreementStatusSet.cancel]
      });

      if (total) {
        return next(
          new ValidateError({
            name: "DQ2",
            message:
              "ผู้ค้ำประกันคุณสมบัติไม่ผ่านเนื่องจากยังติดภาระผูกพันจากการค้ำประกันอยู่"
          })
        );
      }

      res.send({ success: true });
    } catch (e) {
      next(e);
    }
  };

  upload: RequestHandler = async (req, res, next) => {
    // console.log("req.files", req.files);
    // if (req.params.resource === "borrower") {
    // tslint:disable-next-line: no-string-literal
    req.body[req.params.resource] = "666";
    // console.log(req.body, req.files);
    // req.body["borrower"][req.params.subId].attachFiles = req.files;
    // console.log(req.body.borrower);
    // console.log("666");
    // }

    res.send("555");
  };

  getOne = (options?: IGetOptions, deepRelation?: boolean): RequestHandler => {
    return async (req, res, next) => {
      const { id } = req.params;
      try {
        const entity = await RequestRepository.createQueryBuilder("request")
          .leftJoinAndSelect("request.organization", "organization")
          .leftJoinAndSelect("request.requestItems", "requestItem")
          .leftJoinAndSelect(
            "request.budgetAllocationItems",
            "budgetAllocationItem"
          )
          .leftJoinAndSelect("request.factSheet", "factSheet")
          .leftJoinAndMapMany(
            "requestItem.bAtfs",
            "AttachedFile",
            "attachedFile1",
            "attachedFile1.refId = requestItem.id and attachedFile1.refType = :refType1",
            { refType1: "REQUES.BORROWER.ATTACHEDFILE" }
          )
          .leftJoinAndMapMany(
            "requestItem.gAtfs",
            "AttachedFile",
            "attachedFile2",
            "attachedFile2.refId = requestItem.id and attachedFile2.refType = :refType2",
            { refType2: "REQUES.GUARANTOR.ATTACHEDFILE" }
          )
          .leftJoinAndMapMany(
            "requestItem.sAtfs",
            "AttachedFile",
            "attachedFile3",
            "attachedFile3.refId = requestItem.id and attachedFile3.refType = :refType3",
            { refType3: "REQUES.SPOUSE.ATTACHEDFILE" }
          )
          .leftJoinAndMapMany(
            "requestItem.gsAtfs",
            "AttachedFile",
            "attachedFile4",
            "attachedFile4.refId = requestItem.id and attachedFile4.refType = :refType4",
            { refType4: "REQUES.GUARANTORSPOUSE.ATTACHEDFILE" }
          )
          .leftJoinAndMapMany(
            "factSheet.attachedFiles",
            "AttachedFile",
            "attachedFile5",
            "attachedFile5.refId = factSheet.id and attachedFile5.refType = :refType5",
            { refType5: "FACTSHEET.ATTACHEDFILE" }
          )
          .where("request.id = :id", { id })
          .getOne();

        if (!entity) {
          return next(new NotFoundError({ message: "not found" }));
        }

        res.send({ data: entity, success: true });
      } catch (e) {
        next(e);
      }
    };
  };

  withFormDataFactSheet = (req, res, next) => {
    if (req.body.borrower) {
      req.body.borrower.isOnlyBirthYear = req.body.borrower.isOnlyBirthYear
        ? true
        : false;
      req.body.borrower.idCardLifetime = req.body.borrower.idCardLifetime
        ? true
        : false;
    }
    req.body.isApproved = req.body.isApproved ? true : false;
    next();
  };

  withFormRequestItem = (req, res, next) => {
    if (req.body.borrower) {
      req.body.borrower.isOnlyBirthYear = req.body.borrower.isOnlyBirthYear
        ? true
        : false;
      req.body.borrower.idCardLifetime = req.body.borrower.idCardLifetime
        ? true
        : false;
    }
    if (req.body.guarantor) {
      req.body.guarantor.isOnlyBirthYear = req.body.guarantor.isOnlyBirthYear
        ? true
        : false;
      req.body.guarantor.idCardLifetime = req.body.guarantor.idCardLifetime
        ? true
        : false;
    }
    if (req.body.spouse) {
      req.body.spouse.isOnlyBirthYear = req.body.spouse.isOnlyBirthYear
        ? true
        : false;
      req.body.spouse.idCardLifetime = req.body.spouse.idCardLifetime
        ? true
        : false;
    }
    next();
  };
}

export const controller = new RequestController(RequestRepository);
