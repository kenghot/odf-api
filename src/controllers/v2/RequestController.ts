import moment = require("moment");
import { DeepPartial, getRepository, Not } from "typeorm";
import { AccountReceivable } from "../../entities/AccountReceivable";
import { AccountReceivableTransaction } from "../../entities/AccountReceivableTransaction";
import { Organization } from "../../entities/Organization";
import { Request } from "../../entities/Request";
import { RequestSequence } from "../../entities/RequestSequence";
import { agreementStatusSet, requestStatusSet } from "../../enumset";
import { jsreport } from "../../jsreport";
import {
  NotFoundError,
  ValidateError,
} from "../../middlewares/error/error-type";
import RequestRepository from "../../repositories/v2/RequestRepository";
import { IUpdateOptions } from "../../repositories/v2/UpdateRepository";
import {
  queries as agreementQueries,
  subQueries as agreementSubQueries,
} from "../../routes/api/v2/AgreementRoute";
import { queries as requestQueries } from "../../routes/api/v2/RequestRoute";
import {
  getAge,
  getFiscalYear,
  getThaiPartialDate,
} from "../../utils/datetime-helper";
import { getEnumSetText } from "../../utils/get-enum-set-text";
import { addSelectRegion } from "../queries-utils/organization-queries";
import {
  addSelectApproveBudget,
  addSelectBorrowerMarriageStatus,
  addSelectConsiderationBudget,
  addSelectConsiderationResult,
  addSelectFactSheetComments,
  addSelectFactSheetResult,
  addSelectGroupResultByMeeting,
  addSelectGuarantorBorrowerRelationship,
  addSelectGuarantorMarriageStatus,
  addSelectLoanTimes,
  addSelectQualification,
  addSelectResultComments,
  addSelectStatus,
  addSelectTotalBudget,
  getQualificationNumber,
  addSelectResultComments2,
  addSelectResult,
  addSelectStatus2,
} from "../queries-utils/request-queries";
import { BaseController } from "./BaseController";
import { Agreement } from "../../entities/Agreement";
import { transporter } from "../../utils/email-helper";
import { UserRepository } from "../../repositories/v1";

class RequestController extends BaseController {
  private reportNotFoundMessage =
    "ไม่พบข้อมูลสำหรับออกรายงาน กรุณาเลือกเงื่อนไขใหม่";

  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  create = async (req, res, next) => {
    const request: DeepPartial<Request> = req.body;
    const { organization, documentDate } = request;

    const [err, message] = this.validateCreateReq(request);

    if (err) {
      return next(
        new ValidateError({
          name: "ไม่สามารถสร้างเอกสารคำร้องได้",
          message,
        })
      );
    }

    try {
      const {
        requestSequence,
      } = await this.searchRepo.findOneById(
        "Organization",
        "organization",
        organization.id,
        [],
        { relations: ["requestSequence"] }
      );

      // tslint:disable-next-line: no-shadowed-variable
      const [err, message, fiscalYear] = this.validateDocSequence(
        requestSequence,
        documentDate as Date
      );

      if (err) {
        return next(
          new ValidateError({
            name: "ไม่สามารถสร้างเอกสารคำร้องได้",
            message,
          })
        );
      }

      request.fiscalYear = `${fiscalYear}`;

      // prevent error from status not DF
      // delete request.status;

      const entity = await this.createRepo.create(this.entityClass, request);

      res.locals.data = entity;

      if(request.status=="DFO"){
        const id = entity.organization.id;
        const rolesId = 4;
        const records = await UserRepository.createQueryBuilder("user")
          .leftJoinAndSelect("user.roles", "roles")
          .where("user.organizationId = :id", { id })
          .andWhere("roles.id = :rolesId", { rolesId })
          .getRawMany();
        for (let i = 0; i < records.length; i++) {
          const mailOptions = {
            from: process.env.APP_EMAIL,
            to: records[i].user_email,
            subject:
              "มีการยื่นแบบร่างคำร้องออนไลน์",
            html: `
            <br/>เรียน  ${records[i].roles_description}
            <br/>เรื่อง  มีการยื่นแบบร่างคำร้องออนไลน์เข้ามาในระบบให้บริการกู้ยืมเงินทุนประกอบการอาชีพ
            <br/><br/>ข้อมูลผู้ยื่นคำร้องออนไลน์ 
            <br/>เลขบัตรประชาชน ${entity.requestItems[0].borrower.idCardNo.slice(0, -3)}xxx 
            <br/> ชื่อ-นามสกุล ${entity.requestItems[0].borrower.title}${entity.requestItems[0].borrower.firstname} ${entity.requestItems[0].borrower.lastname} 
            <br/> เบอร์โทร ${entity.requestItems[0].borrower.telephone}
            <br/> วันที่ยื่นคำร้อง ${entity.documentDate}
            <br/> Click-link http://odf.dop.go.th/loan/request/view/${entity.requestItems[0].requestId}/P  `
          };
          try {
            await transporter.sendMail(mailOptions);
          } catch (e) {
            throw e;
          }
      }
      }
      next();
    } catch (err) {
      err.message = `ไม่สามารถสร้าง${this.entityInfo} ${err.message}`;
      next(err);
    }
  };

  update = (options: IUpdateOptions = {}) => {
    return async (req, res, next) => {
      let organization: Organization;

      const o2ms = this.prepareO2Ms(req.body, options.o2ms);
      const m2ms = this.prepareM2Ms(req.body, options.m2ms);
      try {
        const entity = await RequestRepository.findOne(
          { id: req.params.id },
          { relations: options.relations }
        );

        RequestRepository.merge(entity, req.body);

        if (!entity.documentNumber && entity.status === requestStatusSet.new) {
          organization = await getRepository(Organization).findOne(
            { id: entity.organizationId },
            { relations: ["requestSequence"] }
          );

          const fiscalYear = getFiscalYear(entity.documentDate as Date);

          if (fiscalYear !== +organization.requestSequence.prefixYear) {
            return next(
              new ValidateError({
                name: "ไม่สามารถสร้างเอกสารคำร้องได้",
                message:
                  "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ตรงกับปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ",
              })
            );
          }

          await RequestRepository.updateRequest(
            entity,
            "RequestSequence",
            organization.requestSequence,
            { o2ms, m2ms }
          );
        }else if(!entity.documentNumber && entity.status === requestStatusSet.newOnline){
          organization = await getRepository(Organization).findOne(
            { id: entity.organizationId },
            { relations: ["requestOnlineSequence"] }
          );

          const fiscalYear = getFiscalYear(entity.documentDate as Date);

          if (fiscalYear !== +organization.requestOnlineSequence.prefixYear) {
            return next(
              new ValidateError({
                name: "ไม่สามารถสร้างเอกสารคำร้องได้",
                message:
                  "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ตรงกับปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ",
              })
            );
          }

          await RequestRepository.updateRequest(
            entity,
            "RequestOnlineSequence",
            organization.requestOnlineSequence,
            { o2ms, m2ms }
          );
        } else {
          await this.updateRepo.update(entity, { o2ms, m2ms });
        }

        res.locals.data = entity;

        next();
      } catch (err) {
        err.message = `ไม่สามารถแก้ไขข้อมูล${this.entityInfo} ${err.message}`;
        next(err);
      }
    };
  };

  searchResult = async (req, res, next) => {
    const requestSubQueries = [
      {
        operator: "in",
        entityField: "id",
        subEntityClass: "RequestItem",
        alias: "requestItem",
        subEntityField: "requestId",
        queries: [
          {
            operator: "=",
            entityField: "borrower.idCardNo",
            queryField: "idCardNo",
          },
        ],
      },
    ];
    const queries = this.prepareQuery(req.query, requestQueries);
    const subQueries = this.prepareSubQuery(req.query, requestSubQueries);

    const agreement_SubQueries = [
      {
        operator: "in",
        entityField: "id",
        subEntityClass: "AgreementItem",
        alias: "agreementItem",
        subEntityField: "agreementId",
        queries: [
          {
            operator: "=",
            entityField: "borrower.idCardNo",
            queryField: "idCardNo",
          },
        ],
      },
    ];
    const queries_agreement = this.prepareQuery(req.query, agreementQueries);
    const subQueries_agreement = this.prepareSubQuery(req.query, agreement_SubQueries);


    try {
      const [entities, total] = await this.searchRepo.findAndCount(
        "Request",
        "request",
        queries,
        subQueries,
        {},
        {
          relations: ["requestItems", "factSheet"],
          orderBy: [{ entityField: "documentDate", orderType: "DESC" }],
        }
      );

      const [entities_agreement, total_agreement] = await this.searchRepo.findAndCount(
        "Agreement",
        "agreement",
        queries_agreement,
        subQueries_agreement,
        {},
        {
          orderBy: [{ entityField: "documentDate", orderType: "DESC" }],
        }
      );
      if (!total) {
        return next(
          new NotFoundError({
            message: "ไม่พบคำร้องที่ค้นหา",
          })
        );
      }
      let agreementDoc: Agreement;
      if (total_agreement) {
        agreementDoc= entities_agreement[0];
      }
      const requestDoc: Request = entities[0];

      const step1Status = [
        requestStatusSet.new,
        requestStatusSet.qualified,
        requestStatusSet.approve1,
        requestStatusSet.approve2,
        requestStatusSet.approve3,
        requestStatusSet.disqualified,
      ];
      const step2Status = [
        requestStatusSet.qualified,
        requestStatusSet.approve1,
        requestStatusSet.approve2,
        requestStatusSet.approve3,
        requestStatusSet.disqualified,
      ];
      const step3Status = [
        requestStatusSet.approve1,
        requestStatusSet.approve2,
        requestStatusSet.approve3,
        requestStatusSet.reject,
      ];
      const step4Status = [
        requestStatusSet.approve2,
        requestStatusSet.approve3,
        requestStatusSet.reject,
      ];
      const step5Status = [requestStatusSet.approve3, requestStatusSet.reject];

      const step6Status = [requestStatusSet.done, requestStatusSet.reject];
      
      const step7Status = [agreementStatusSet.done, agreementStatusSet.cancel];

      const step8Status = [agreementStatusSet.duringPayment, agreementStatusSet.cancel];


      let isInStep1 = step1Status.includes(requestDoc.status) ? true : false;
      let isInStep2 = step2Status.includes(requestDoc.status) ? true : false;
      let isInStep3 = step3Status.includes(requestDoc.status) ? true : false;
      let isInStep4 = step4Status.includes(requestDoc.status) ? true : false;
      let isInStep5 = step5Status.includes(requestDoc.status) ? true : false;
      let isInStep6 = step6Status.includes(requestDoc.status) ? true : false;
      let isInStep7=false;
      let isInStep8=false;
      if (total_agreement) {
        isInStep7 = step7Status.includes(agreementDoc.status) ? true : false;
        isInStep8 = step8Status.includes(agreementDoc.status) ? true : false;
      }
      
      if(isInStep6){
        isInStep1=true;
        isInStep2=true;
        isInStep3=true;
        isInStep4=true;
        isInStep5=true;
      }
      if(isInStep8){
        isInStep7=true;
      }
      const resultObj = {
        ["AP"]: "เห็นชอบตามวงเงิน",
        ["AJ"]: "เห็นควรให้ปรับเพิ่ม/ลดวงเงิน",
        ["RJ"]: "ไม่อนุมัติ"
      };
      const agreementObj = {
        ["NW"]: "เตรียมทำสัญญา",
        ["DN"]: "ทำสัญญาแล้ว",
        ["DP"]: "รอโอนเงิน"
      };

      const data = [
        {
          step: "1. ยื่นใบคำร้อง",
          status: isInStep1,
          result: isInStep1
            ? `ใบคำร้องแลขที่ ${requestDoc.documentNumber}`
            : "",
        },
        {
          step: "2. ตรวจสอบข้อเท็จจริง",
          status: isInStep2,
          result: isInStep2
            ? requestDoc.factSheet.isApproved
              ? "เห็นสมควรให้กู้ยืม"
              : "ไม่เห็นสมควรให้กู้ยืม"
            : "",
        },
        {
          step: "3. วิเคราะห์ข้อมูลและพิจารณาโดยหัวหน้างาน/กลุ่ม",
          status: isInStep3,
          result: isInStep3 ? resultObj[requestDoc.result1.result] : "",
        },
        {
          step: "4. พิจารณาโดยคณะอนุกรรมการกลั่นกรองฯ",
          status: isInStep4,
          result: isInStep4 ? resultObj[requestDoc.result2.result] : "",
        },
        {
          step: "5. พิจารณาโดยคณะกรรมการบริหารกองทุนฯ",
          status: isInStep5,
          result: isInStep5 ? resultObj[requestDoc.result3.result] : "",
        },
        {
          step: "6. ส่งทำสัญญา",
          status: isInStep6,
          result: isInStep6 ? agreementObj["NW"] : "",
        },
        {
          step: "7. ทำสัญญา",
          status: isInStep7,
          result: isInStep7 ? agreementObj["DN"] : "",
        },
        {
          step: "8. รอโอนเงิน",
          status: isInStep8,
          result: isInStep8 ? agreementObj["DP"] : "",
        },
      ];

      res.locals.data = data;

      next();
    } catch (err) {
      next(err);
    }
  };

  verifyBorrower = async (req, res, next) => {
    const { birthday, idCardNo } = req.body;
    if (idCardNo.length !== 13) {
      return next(
        new ValidateError({
          name: "DQ1",
          message: "กรุณากรอกรหัสบัตรประชาชนให้ถูกต้อง",
        })
      );
    }
    try {
      const age = getAge(birthday, new Date());
      if (age < 60) {
        return next(
          new ValidateError({
            name: "DQ1",
            message: "ผู้ขอกู้คุณสมบัติไม่ผ่านเนื่องจากอายุยังไม่ถึง 60 ปี",
          })
        );
      }

      req.body.statusExcludeList = [
        agreementStatusSet.cancel,
        agreementStatusSet.close,
        agreementStatusSet.disclaim,
      ];

      const queries = this.prepareQuery(
        { statusExcludeList: req.body.statusExcludeList },
        agreementQueries
      );
      const subQueries = this.prepareSubQuery(
        { idCardNo },
        agreementSubQueries
      );

      const [entities, total] = await this.searchRepo.findAndCount(
        "Agreement",
        "agreement",
        queries,
        subQueries
      );

      if (total) {
        return next(
          new ValidateError({
            name: "DQ2",
            message:
              "ผู้ขอกู้คุณสมบัติไม่ผ่านเนื่องจากยังติดภาระผูกพันจากการกู้ยืมอยู่",
          })
        );
      }

      
      const requestSubQueries = [
        {
          operator: "in",
          entityField: "id",
          subEntityClass: "RequestItem",
          alias: "requestItem",
          subEntityField: "requestId",
          queries: [
            {
              operator: "=",
              entityField: "borrower.idCardNo",
              queryField: "idCardNo",
            },
          ],
        },
      ];

      const requestSubQueriesCheck = this.prepareSubQuery(
        { idCardNo },
        requestSubQueries
      );

      const [entitiesRequest, totalRequest] = await this.searchRepo.findAndCount(
        "Request",
        "request",
        requestQueries,
        requestSubQueriesCheck
      );
      let totalCheckStatus =0;
      entitiesRequest.forEach(function (value){
        if (value.status ==requestStatusSet.draft
          || value.status ==requestStatusSet.draftOnline
          || value.status ==requestStatusSet.new
          || value.status ==requestStatusSet.newOnline
          || value.status ==requestStatusSet.qualified
          || value.status ==requestStatusSet.approve1
          || value.status ==requestStatusSet.approve2
          || value.status ==requestStatusSet.approve3
          ) {
            totalCheckStatus = totalCheckStatus+1;
        }
      });
      // console.log(totalCheckStatus)
      if(totalCheckStatus>0)
      {
        return next(
          new ValidateError({
            name: "DQ3",
            message:
              "ผู้ขอกู้คุณสมบัติไม่ผ่านเนื่องจากยังติดสถานะยื่นคำร้องอยู่และยังไม่ได้ส่งทำสัญญา",
          })
        );
      }
      
      res.send({ success: true });
    } catch (err) {
      err.message = `ไม่สามารถสร้าง${this.entityInfo} ${err.message}`;
      next(err);
    }
  };

  verifyGuarantor = async (req, res, next) => {
    const { firstname, lastname, idCardNo, agreementType, birthday } = req.body;
    if (idCardNo.length !== 13) {
      return next(
        new ValidateError({
          name: "DQ1",
          message: "กรุณากรอกรหัสบัตรประชาชนให้ถูกต้อง",
        })
      );
    }
    try {
      const age = getAge(birthday, new Date());
      if (age > 58 || age < 20) {
        return next(
          new ValidateError({
            name: "DQ1",
            message:
              "ผู้ค้ำประกันคุณสมบัติไม่ผ่านเนื่องจากอายุน้อยกว่า 20 ปี หรืออายุเกิน 58 ปี",
          })
        );
      }

      const queries = this.prepareQuery(
        {
          statusExcludeList: [
            agreementStatusSet.close,
            agreementStatusSet.cancel,
            agreementStatusSet.disclaim,
          ],
        },
        agreementQueries
      );
      const subQueries = this.prepareSubQuery(
        {
          guarantorIdCardNo: idCardNo,
        },
        agreementSubQueries
      );

      const [entities, total] = await this.searchRepo.findAndCount(
        "Agreement",
        "agreement",
        queries,
        subQueries
      );

      if (total) {
        return next(
          new ValidateError({
            name: "DQ2",
            message:
              "ผู้ค้ำประกันคุณสมบัติไม่ผ่านเนื่องจากยังติดภาระผูกพันจากการค้ำประกันอยู่",
          })
        );
      }

      res.send({ success: true });
    } catch (err) {
      err.message = `ไม่สามารถสร้าง${this.entityInfo} ${err.message}`;
      next(err);
    }
  };

  private validateCreateReq = (
    request: DeepPartial<Request>
  ): [boolean, string] => {
    const { requestItems, organization, documentDate } = request;

    if (!requestItems) {
      return [true, "กรุณาระบุข้อมูลผู้ขอกู้และผู้ค้ำประกัน"];
    }

    if (!organization || !organization.id) {
      return [true, "กรุณาระบุหน่วยงานทำการสร้างคำร้อง"];
    }

    if (!documentDate) {
      return [true, "กรุณาระบุวันที่ที่ต้องการสร้างคำร้อง"];
    }

    return [null, ""];
  };

  private validateDocSequence = (
    sequence: RequestSequence,
    date: Date
  ): [boolean, string, number?] => {
    if (!sequence) {
      return [
        true,
        "หน่วยงานที่ทำการสร้างคำร้องยังไม่ได้ตั้งค่าเลขที่เอกสารคำร้อง กรุณาติดต่อผู้ดูแลระบบ",
      ];
    }

    const fiscalYear = getFiscalYear(date);

    if (fiscalYear !== +sequence.prefixYear) {
      return [
        true,
        "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ตรงกับปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ",
      ];
    }

    return [null, "", fiscalYear];
  };

  // REPORT-1
  public printPersonalRequestReportReport = async (req, res, next) => {
    try {
      const organizationIdParam = req.query.organizationId;
      const statusParam = req.query.status;
      const fiscalYearParam = req.query.fiscalYear;

      let requestsQuery = await getRepository(Request)
        .createQueryBuilder("requests")
        .innerJoin("requests.requestItems", "requestItems")
        .innerJoin("requests.organization", "organization")
        .leftJoin("requests.budgetAllocationItems", "budget")
        .leftJoin("requests.factSheet", "factSheet")
        .where(`requests.requestType = "P"`)
        // .andWhere(`requestItems.borrowerIdCardNo != ''`)

        .select(`requests.documentNumber`, "documentNumber")
        .addSelect(`requestItems.borrower.idCardNo`, "borrowerIdCardNo")
        .addSelect(
          `CONCAT(requestItems.borrower.title, requestItems.borrower.firstname, " ", requestItems.borrower.lastname)`,
          "borrowerFullName"
        )
        .addSelect(`requestItems.borrower.age`, "borrowerAge")
        .addSelect(
          `CONCAT(requests.requestOccupation.name, " ", requests.requestOccupation.description)`,
          "requestOccupation"
        )
        .addSelect(`factSheet.borrowerScore`, "borrowerScore")
        .addSelect(`factSheet.guarantorScore`, "guarantorScore")
        .addSelect(`requests.requestBudget`, "requestBudget")
        .addSelect(`organization.orgName`, "orgName")
        .addSelect(`factSheet.comments`, "comments");

      // Oganization
      if (organizationIdParam) {
        requestsQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }

      // Status
      if (statusParam) {
        requestsQuery.andWhere("requests.status=:status", {
          status: statusParam,
        });
      }

      // Fiscal year
      if (fiscalYearParam) {
        requestsQuery.andWhere("requests.fiscalYear=:fiscalYear", {
          fiscalYear: fiscalYearParam,
        });
      }

      requestsQuery = addSelectTotalBudget(requestsQuery);
      requestsQuery = addSelectStatus2(requestsQuery);
      requestsQuery = addSelectQualification(requestsQuery);
      requestsQuery = addSelectConsiderationBudget(requestsQuery);
      requestsQuery = addSelectLoanTimes(requestsQuery);
      requestsQuery = addSelectFactSheetComments(requestsQuery);
      requestsQuery = addSelectConsiderationResult(requestsQuery);
      requestsQuery = addSelectApproveBudget(requestsQuery);
      requestsQuery = addSelectResultComments(requestsQuery);

      const requests = await requestsQuery
        .groupBy("requests.documentNumber")
        .addGroupBy("organization.orgName")
        .addGroupBy("requests.status")
        .addGroupBy("requestItems.borrowerIdCardNo")
        .addGroupBy("requestItems.borrowerTitle")
        .addGroupBy("requestItems.borrowerFirstname")
        .addGroupBy("requestItems.borrowerLastname")
        .addGroupBy("requestItems.borrowerAge")
        .addGroupBy("requests.requestOccupationName")
        .addGroupBy("requests.requestOccupationDescription")
        .addGroupBy("factSheet.borrowerScore")
        .addGroupBy("factSheet.guarantorScore")
        .addGroupBy("factSheet.isApproved")
        .addGroupBy("factSheet.comments")
        .addGroupBy("requests.requestBudget")
        .addGroupBy("requests.result1ApproveBudget")
        .addGroupBy("requests.result2ApproveBudget")
        .addGroupBy("requests.result3ApproveBudget")
        .addGroupBy("requests.result1Result")
        .addGroupBy("requests.result2Result")
        .addGroupBy("requests.result3Result")
        .addGroupBy("requests.result1Comments")
        .addGroupBy("requests.result2Comments")
        .addGroupBy("requests.result3Comments")
        .addGroupBy("requests.id")

        .getRawMany();

      if (!requests || requests.length < 1) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const templateData = {
          title1: "รายงานข้อมูลผู้ขอกู้ยืมเงินทุนประกอบอาขีพ ประเภทรายบุคคล",
          title2: `ผู้กู้ยืมทั้งหมด ${requests.length} ราย ผ่านเกณฑ์จำนวน ${
            getQualificationNumber(requests).passedQualificationNumber
          } ราย ไม่ผ่านเกณฑ์จำนวน ${
            getQualificationNumber(requests).notPassedQualificationNumber
          } ราย`,
          reportDataDate: getThaiPartialDate(moment().format()),
          data: requests,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          // template: { name: "REPORT1-13" },
          template: { name: "REPORT1-13-xlsx-recipe" },
          data: templateData,
        });

        const reportName = `PersonalRequestReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // REPORT-13
  public printDisqualifyPersonalRequestReport = async (req, res, next) => {
    try {
      const organizationIdParam = req.query.organizationId;
      const fiscalYearParam = req.query.fiscalYear;

      let requestsQuery = await getRepository(Request)
        .createQueryBuilder("requests")
        .innerJoin("requests.requestItems", "requestItems")
        .innerJoin("requests.organization", "organization")
        .leftJoin("requests.budgetAllocationItems", "budget")
        .leftJoin("requests.factSheet", "factSheet")
        .where(`requests.status = "DQF"`)
        // .andWhere("requests.id = requestItems.requestId")
        // .andWhere(`requests.requestType = "P"`)

        .select(`requests.documentNumber`, "documentNumber")
        .addSelect(`requestItems.borrower.idCardNo`, "borrowerIdCardNo")
        .addSelect(
          `CONCAT(requestItems.borrower.title, requestItems.borrower.firstname, " ", requestItems.borrower.lastname)`,
          "borrowerFullName"
        )
        .addSelect(`requestItems.borrower.age`, "borrowerAge")
        .addSelect(
          `CONCAT(requests.requestOccupation.name, " ", requests.requestOccupation.description)`,
          "requestOccupation"
        )
        .addSelect(`factSheet.borrowerScore`, "borrowerScore")
        .addSelect(`factSheet.guarantorScore`, "guarantorScore")
        .addSelect(`requests.requestBudget`, "requestBudget")
        .addSelect(`organization.orgName`, "orgName")
        .addSelect(`factSheet.comments`, "comments");

      // Oganization
      if (organizationIdParam) {
        requestsQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }

      // Fiscal year
      if (fiscalYearParam) {
        requestsQuery.andWhere("requests.fiscalYear=:fiscalYear", {
          fiscalYear: fiscalYearParam,
        });
      }

      requestsQuery = addSelectTotalBudget(requestsQuery);
      requestsQuery = addSelectStatus(requestsQuery);
      requestsQuery = addSelectQualification(requestsQuery);
      requestsQuery = addSelectConsiderationBudget(requestsQuery);
      requestsQuery = addSelectLoanTimes(requestsQuery);
      requestsQuery = addSelectFactSheetComments(requestsQuery);
      requestsQuery = addSelectConsiderationResult(requestsQuery);
      requestsQuery = addSelectApproveBudget(requestsQuery);
      // requestsQuery = addSelectResultComments(requestsQuery);
      requestsQuery = addSelectResultComments2(requestsQuery);

      const requests = await requestsQuery
        .groupBy("requests.documentNumber")
        .addGroupBy("organization.orgName")
        .addGroupBy("requests.status")
        .addGroupBy("requestItems.borrowerIdCardNo")
        .addGroupBy("requestItems.borrowerTitle")
        .addGroupBy("requestItems.borrowerFirstname")
        .addGroupBy("requestItems.borrowerLastname")
        .addGroupBy("requestItems.borrowerAge")
        .addGroupBy("requests.requestOccupationName")
        .addGroupBy("requests.requestOccupationDescription")
        .addGroupBy("factSheet.borrowerScore")
        .addGroupBy("factSheet.guarantorScore")
        .addGroupBy("factSheet.isApproved")
        .addGroupBy("factSheet.comments")
        .addGroupBy("requests.requestBudget")
        .addGroupBy("requests.result1ApproveBudget")
        .addGroupBy("requests.result2ApproveBudget")
        .addGroupBy("requests.result3ApproveBudget")
        .addGroupBy("requests.result1Result")
        .addGroupBy("requests.result2Result")
        .addGroupBy("requests.result3Result")
        .addGroupBy("requests.result1Comments")
        .addGroupBy("requests.result2Comments")
        .addGroupBy("requests.result3Comments")
        .addGroupBy("requests.id")

        .getRawMany();

      if (!requests || requests.length < 1) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        // สำหรับ Header ของ Report
        const templateData = {
          title1: `รายชื่อผู้ขอยื่นกู้ที่มีเอกสารไม่สมบูรณ์และคุณสมบัติไม่ถูกต้องตามหลักเกณฑ์ของกองทุนผู้สูงอายุ`,
          title2: `ผู้ยื่นคำร้องที่ไม่ผ่านคุณสมบัติจำนวน ${requests.length} ราย`,
          reportDataDate: getThaiPartialDate(moment().format()),
          data: requests,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          // template: { name: "REPORT1-13" },
          template: { name: "REPORT1-13-xlsx-recipe" },
          data: templateData,
        });

        const reportName = `DisqualifyPersonalRequestReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // REPORT-12
  public printIncompletePersonalRequestReport = async (req, res, next) => {
    try {
      const organizationIdParam = req.query.organizationId;
      const fiscalYearParam = req.query.fiscalYear;

      let requestsQuery = await getRepository(Request)
        .createQueryBuilder("requests")
        .leftJoin("requests.requestItems", "requestItems")
        .leftJoin("requests.organization", "organization")
        .leftJoin("requests.budgetAllocationItems", "budget")
        .leftJoin("requests.factSheet", "factSheet")
        .where(`requests.status = "DQF"`)
        .andWhere(`requests.requestType = "P"`)
        .select("requests.documentNumber", "documentNumber")
        .addSelect("organization.orgName", "organization")
        .addSelect("requests.documentDate", "documentDate")
        .addSelect("requestItems.borrowerIdCardNo", "borrowerIdCardNo")
        .addSelect(
          `CONCAT(requestItems.borrowerTitle, requestItems.borrowerFirstname, " ", requestItems.borrowerLastname)`,
          "borrowerFullName"
        )
        .addSelect(`requestItems.borrowerBirthDate`, "borrowerBirthDate")
        .addSelect(`requestItems.borrowerAge`, "borrowerAge")
        .addSelect(
          `requestItems.borrowerRegisteredAddressProvince`,
          "borrowerRegisteredAddressProvince"
        )
        .addSelect(
          `requestItems.borrowerOccupationName`,
          "borrowerOccupationName"
        )
        .addSelect(
          `requestItems.borrowerOccupationDescription`,
          "borrowerOccupationDescription"
        )
        .addSelect(
          `requestItems.borrowerOccupationSalary`,
          "borrowerOccupationSalary"
        )
        .addSelect(`requestItems.guarantorIdCardNo`, "guarantorIdCardNo")
        .addSelect(
          `concat(requestItems.guarantorTitle, requestItems.guarantorFirstname," ",requestItems.guarantorLastname)`,
          "guarantorFullName"
        )
        .addSelect(`requestItems.guarantorBirthDate`, "guarantorBirthDate")
        .addSelect(`requestItems.guarantorAge`, "guarantorAge")
        .addSelect(
          `requestItems.guarantorRegisteredAddressProvince`,
          "guarantorRegisteredAddressProvince"
        )
        .addSelect(
          `requestItems.guarantorOccupationName`,
          "guarantorOccupationName"
        )
        .addSelect(
          `requestItems.guarantorOccupationDescription`,
          "guarantorOccupationDescription"
        )
        .addSelect(
          `requestItems.guarantorOccupationSalary`,
          "guarantorOccupationSalary"
        )
        .addSelect(`requestItems.guarantorCompanyName`, "guarantorCompanyName")
        .addSelect(`requestItems.guarantorPosition`, "guarantorPosition")
        .addSelect(`requests.requestBudget`, "requestBudget")
        .addSelect(
          'concat(requests.requestOccupationName ," ",requests.requestOccupationDescription)',
          "requestOccupation"
        )
        .addSelect("factSheet.borrowerScore", "facesheetBorrowerScore")
        .addSelect("factSheet.guarantorScore", "facesheetGuarantorScore");

      // Oganization
      if (organizationIdParam) {
        requestsQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }

      // Fiscal year
      if (fiscalYearParam) {
        requestsQuery.andWhere("requests.fiscalYear=:fiscalYear", {
          fiscalYear: fiscalYearParam,
        });
      }

      requestsQuery = addSelectStatus(requestsQuery);
      requestsQuery = addSelectBorrowerMarriageStatus(requestsQuery);
      requestsQuery = addSelectGuarantorBorrowerRelationship(requestsQuery);
      requestsQuery = addSelectGuarantorMarriageStatus(requestsQuery);
      requestsQuery = addSelectTotalBudget(requestsQuery);
      requestsQuery = addSelectQualification(requestsQuery);
      requestsQuery = addSelectFactSheetComments(requestsQuery);
      requestsQuery = addSelectConsiderationResult(requestsQuery);
      // requestsQuery = addSelectResultComments(requestsQuery);
      requestsQuery = addSelectResult(requestsQuery);
      requestsQuery = addSelectResultComments2(requestsQuery);

      const requests = await requestsQuery
        .groupBy("requests.documentNumber")
        .addGroupBy("requests.documentDate")
        .addGroupBy("organization.orgName")
        .addGroupBy("requests.status")
        .addGroupBy("requestItems.borrowerIdCardNo")
        .addGroupBy("requestItems.borrowerTitle")
        .addGroupBy("requestItems.borrowerFirstname")
        .addGroupBy("requestItems.borrowerLastname")
        .addGroupBy("requestItems.borrowerBirthDate")
        .addGroupBy("requestItems.borrowerAge")
        .addGroupBy("requestItems.borrowerRegisteredAddressProvince")
        .addGroupBy("requestItems.borrowerOccupationName")
        .addGroupBy("requestItems.borrowerOccupationDescription")
        .addGroupBy("requestItems.borrowerOccupationSalary")
        .addGroupBy("requestItems.borrowerMarriageStatus")
        .addGroupBy("requestItems.guarantorIdCardNo")
        .addGroupBy("requestItems.guarantorTitle")
        .addGroupBy("requestItems.guarantorFirstname")
        .addGroupBy("requestItems.guarantorLastname")
        .addGroupBy("requestItems.guarantorBirthDate")
        .addGroupBy("requestItems.guarantorAge")
        .addGroupBy("requestItems.guarantorRegisteredAddressProvince")
        .addGroupBy("requestItems.guarantorOccupationName")
        .addGroupBy("requestItems.guarantorOccupationDescription")
        .addGroupBy("requestItems.guarantorOccupationSalary")
        .addGroupBy("requestItems.guarantorCompanyName")
        .addGroupBy("requestItems.guarantorPosition")
        .addGroupBy("requestItems.guarantorMarriageStatus")
        .addGroupBy("requestItems.guarantorBorrowerRelationship")
        .addGroupBy("requests.requestOccupationName")
        .addGroupBy("requests.requestOccupationDescription")
        .addGroupBy("factSheet.borrowerScore")
        .addGroupBy("factSheet.guarantorScore")
        .addGroupBy("factSheet.isApproved")
        .addGroupBy("factSheet.comments")
        .addGroupBy("requests.requestBudget")
        .addGroupBy("requests.result1ApproveBudget")
        .addGroupBy("requests.result2ApproveBudget")
        .addGroupBy("requests.result3ApproveBudget")
        .addGroupBy("requests.result1Result")
        .addGroupBy("requests.result2Result")
        .addGroupBy("requests.result3Result")
        .addGroupBy("requests.result1Comments")
        .addGroupBy("requests.result2Comments")
        .addGroupBy("requests.result3Comments")
        .addGroupBy("requests.id")
        .getRawMany();

      requests.forEach((r) => console.log(r.resultComments));

      if (!requests || requests.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const templateData = {
          reportDataDate: getThaiPartialDate(moment().format()),
          data: requests,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          // template: { name: "REPORT12" },
          template: { name: "REPORT12-xlsx-recipe" },
          data: templateData,
        });

        const reportName = `IncompletePersonalRequestReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // REPORT-6
  public printCommitteeResultReport = async (req, res, next) => {
    try {
      const committeeParam = req.query.committee;
      const meetingNumberParam = req.query.meetingNumber;
      const fiscalYearParam = req.query.fiscalYear;
      const organizationIdParam  = req.query.organizationId;
      const permissonGetAllParam  = req.query.permissonGetAll;


      if (!fiscalYearParam) {
        return next(
          new NotFoundError({
            name: "กรุณาเลือกปีงบประมาณ",
          })
        );
      }
      if (!organizationIdParam && permissonGetAllParam!="getAll") {
        return next(
          new NotFoundError({
            name: "กรุณาเลือกหน่วยงาน",
          })
        );
      }
      if (!committeeParam) {
        return next(
          new NotFoundError({
            name: "กรุณาเลือกคณะพิจารณา",
          })
        );
      }

      let requestsQuery = await getRepository(Request)
        .createQueryBuilder("requests")
        .innerJoin("requests.organization", "organization")
        .leftJoin("requests.factSheet", "factSheet")

        .select("organization.address.province", "province");
      requestsQuery = addSelectRegion(requestsQuery);

      // คำร้องทั้งหมด
      requestsQuery
        .addSelect("SUM(requests.requestBudget)", "totalRequestBudget")
        .addSelect(
          "SUM(IF(factSheet.isApproved = TRUE, 1, 0))",
          "totalPassedQualification"
        )
        .addSelect(
          "SUM(IF(!factSheet.isApproved  AND  !ISNULL(factSheet.isApproved), 1, 0))",
          "totalNotPassedQualification"
        )
        .addSelect(
          "SUM(IF(ISNULL(factSheet.isApproved) , 1, 0))",
          "totalNotCheckedQualification"
        )
        .addSelect("COUNT(requests.id)", "totalRequest")
        // จำนวนคำร้องทั้งหมดแยกตามเกณฑ์คุณสมบัติ
        .addSelect(
          "SUM(IF(factSheet.borrowerScore >= 65 and factSheet.guarantorScore >= 65, 1, 0))",
          "totalPassed65and65"
        )
        .addSelect(
          "SUM(IF(factSheet.borrowerScore < 65, 1, 0))",
          "totalNotPassedBorrower"
        )
        .addSelect(
          "SUM(IF(factSheet.guarantorScore < 65, 1, 0))",
          "totalNotPassedGuarantor"
        )
        .addSelect(
          "SUM(IF(factSheet.borrowerScore < 65 or factSheet.guarantorScore < 65, 1, 0))",
          "totalNotPassed"
        )
        .addSelect("COUNT(factSheet.id)", "totalFacesheet");

      // คำร้องที่พิจารณาโดยที่ประชุม
      if (
        committeeParam === "หัวหน้างาน/กลุ่ม" ||
        committeeParam === "คณะอนุกรรมการกลั่นกรองฯ" ||
        committeeParam === "คณะกรรมการบริหารกองทุนฯ"
      ) {
        let resultColumn;
        if (committeeParam === "หัวหน้างาน/กลุ่ม") {
          resultColumn = "result1";
        } else if (committeeParam === "คณะอนุกรรมการกลั่นกรองฯ") {
          resultColumn = "result2";
        } else if (committeeParam === "คณะกรรมการบริหารกองทุนฯ") {
          resultColumn = "result3";
        }
        
        // Oganization
      if (organizationIdParam || permissonGetAllParam!="getAll") {
        requestsQuery.andWhere("requests.organizationId=:organizationId", {
          organizationId: organizationIdParam,
        });
      }

        requestsQuery.andWhere(`requests.${resultColumn}.result IS NOT NULL`);
        requestsQuery = addSelectGroupResultByMeeting(
          requestsQuery,
          resultColumn,
          "result"
        );

        // meetingNumber
        if (meetingNumberParam) {
          requestsQuery.andWhere(
            `requests.${resultColumn}.meetingNumber like :meetingNumber`,
            {
              meetingNumber: `%${meetingNumberParam}/${fiscalYearParam}%`,
            }
          );
        }
      }

      // Fiscal year
      if (fiscalYearParam) {
        requestsQuery.andWhere("requests.fiscalYear=:fiscalYear", {
          fiscalYear: fiscalYearParam,
        });
      }

      const requests = await requestsQuery
        .groupBy("organization.region")
        .addGroupBy("organization.orgName")
        .addGroupBy("organization.address.province")
        .getRawMany();

      if (!requests || requests.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const meetingTime = meetingNumberParam
          ? `ครั้งที่ ${meetingNumberParam}`
          : "";
        const templateData = {
          title1: `รายงานผลการพิจารณาอนุมัติของ ${
            getEnumSetText("committee", committeeParam) || "-"
          } ประเภทรายบุคคล ประจำปี ${fiscalYearParam || "-"}`,
          title2: `จากการประชุม ${
            getEnumSetText("committee", committeeParam) || "-"
          } ${meetingTime}`,
          reportDataDate: getThaiPartialDate(moment().format()),
          data: requests,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT6" },
          data: templateData,
        });

        const reportName = `CommitteeResultReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // REPORT-10
  public printPersonalRequestSummaryReport = async (req, res, next) => {
    try {
      const fiscalYearParam = req.query.fiscalYear;
      const regionParam = req.query.region;
      const provinceParam = req.query.province;

      let requestsQuery = await getRepository(Request)
        .createQueryBuilder("requests")
        .innerJoin("requests.organization", "organization")
        .leftJoin("requests.factSheet", "factSheet")

        .select("organization.address.province", "province");
      requestsQuery = addSelectRegion(requestsQuery);
      // คำร้องที่พิจารณาโดยที่ประชุม หัวหน้างาน/กลุ่ม
      requestsQuery = addSelectGroupResultByMeeting(requestsQuery, "result1");
      // คำร้องที่พิจารณาโดยที่ประชุม คณะอนุกรรมการกลั่นกรองฯ
      requestsQuery = addSelectGroupResultByMeeting(requestsQuery, "result2");
      // คำร้องที่พิจารณาโดยที่ประชุม คณะกรรมการบริหารกองทุนฯ
      requestsQuery = addSelectGroupResultByMeeting(requestsQuery, "result3");

      // คำร้องทั้งหมด
      requestsQuery
        .addSelect("SUM(requests.requestBudget)", "totalRequestBudget")
        .addSelect(
          "SUM(IF(factSheet.isApproved = TRUE, 1, 0))",
          "totalPassedQualification"
        )
        .addSelect(
          "SUM(IF(!factSheet.isApproved  AND  !ISNULL(factSheet.isApproved), 1, 0))",
          "totalNotPassedQualification"
        )
        .addSelect(
          "SUM(IF(ISNULL(factSheet.isApproved) , 1, 0))",
          "totalNotCheckedQualification"
        )
        .addSelect("COUNT(requests.id)", "totalRequest")

        // จำนวนคำร้องทั้งหมดแยกตามเกณฑ์คุณสมบัติ
        .addSelect(
          "SUM(IF(factSheet.borrowerScore >= 65 and factSheet.guarantorScore >= 65, 1, 0))",
          "totalPassed65and65"
        )
        .addSelect(
          "SUM(IF(factSheet.borrowerScore < 65, 1, 0))",
          "totalNotPassedBorrower"
        )
        .addSelect(
          "SUM(IF(factSheet.guarantorScore < 65, 1, 0))",
          "totalNotPassedGuarantor"
        )
        .addSelect(
          "SUM(IF(factSheet.borrowerScore < 65 or factSheet.guarantorScore < 65, 1, 0))",
          "totalNotPassed"
        )
        .addSelect("COUNT(factSheet.id)", "totalFacesheet");

      // Fiscal year
      if (fiscalYearParam) {
        requestsQuery.andWhere("requests.fiscalYear=:fiscalYear", {
          fiscalYear: fiscalYearParam,
        });
      }
      // Region
      if (regionParam) {
        requestsQuery.andWhere("organization.region=:region", {
          region: regionParam,
        });
      }
      // Province
      if (provinceParam) {
        requestsQuery.andWhere("organization.address.provinceCode=:province", {
          province: provinceParam,
        });
      }

      const requests = await requestsQuery
        .groupBy("organization.region")
        .addGroupBy("organization.orgName")
        .addGroupBy("organization.address.province")
        .getRawMany();

      if (!requests || requests.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const templateData = {
          title1: `รายงานสรุปผลกาารพิจารณาการกู้ยืมเงินกองทุนประกอบอาชีพ ประเภทรายบุคคล ประจำปี ${
            req.query.fiscalYear || "-"
          }`,
          title2: "โดย คณะกรรมการบริหารกองทุนฯ",
          reportDataDate: getThaiPartialDate(moment().format()),
          data: requests,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT10" },
          data: templateData,
        });

        const reportName = `PersonalRequestSummaryReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // REPORT-11
  public printResultSummaryReport = async (req, res, next) => {
    try {
      const fiscalYearParam = req.query.fiscalYear;
      const organizationIdParam = req.query.organizationId;

      let requestsQuery = await getRepository(Request)
        .createQueryBuilder("requests")
        .innerJoin("requests.requestItems", "requestItems")
        .innerJoin("requests.organization", "organization")
        .innerJoin("requests.budgetAllocationItems", "budget")
        .innerJoin("requests.factSheet", "factSheet")
        .select("organization.orgName", "orgName")
        .addSelect("requests.documentDate", "documentDate")
        .addSelect("factSheet.interviewDate", "interviewDate")
        .addSelect("requestItems.borrowerIdCardNo", "borrowerIdCardNo")
        .addSelect(
          `concat(requestItems.borrowerTitle, requestItems.borrowerFirstname," ",requestItems.borrowerLastname)`,
          "borrowerFullName"
        )
        .addSelect("requestItems.borrowerAge", "borrowerAge")
        .addSelect(
          `concat(requests.requestOccupationName ," ",requests.requestOccupationDescription)`,
          "requestOccupation"
        )
        .addSelect("requestItems.guarantorIdCardNo", "guarantorIdCardNo")
        .addSelect(
          `concat(requestItems.guarantorTitle, requestItems.guarantorFirstname," ",requestItems.guarantorLastname)`,
          "guarantorFullName"
        )
        .addSelect("requestItems.guarantorAge", "guarantorAge")
        .addSelect("requests.requestBudget", "requestBudget")
        .addSelect("factSheet.factSheetItems", "faceSheetItems")
        .addSelect("factSheet.borrowerScore", "factSheetBorrowerScore")
        .addSelect("factSheet.guarantorScore", "factSheetGuarantorScore")
        .addSelect("factSheet.comments", "faceSheetComments")
        .addSelect(
          `CASE
            requests.result1Result
            WHEN "AP" THEN "อนุมัติ"
            WHEN "AJ" THEN "เห็นควรให้ปรับวงเงิน"
            WHEN "RJ" THEN "ไม่อนุมัติ"
            ELSE  "-"
          END`,
          "result1Result"
        )
        .addSelect("requests.result1ApproveBudget", "result1ApproveBudget")
        .addSelect("requests.result1Comments", "result1Comments")
        .addSelect(
          `CASE
          requests.result2Result
            WHEN "AP" THEN "อนุมัติ"
            WHEN "AJ" THEN "เห็นควรให้ปรับวงเงิน"
            WHEN "RJ" THEN "ไม่อนุมัติ"
            ELSE  "-"
          END`,
          "result2Result"
        )
        .addSelect("requests.result2MeetingDate", "result2MeetingDate")
        .addSelect("requests.result2MeetingNumber", "result2MeetingNumber")
        .addSelect("requests.result2ApproveBudget", "result2ApproveBudget")
        .addSelect("requests.result2Comments", "result2Comments")
        .addSelect(
          `CASE
            requests.result3Result
            WHEN "AP" THEN "อนุมัติ"
            WHEN "AJ" THEN "เห็นควรให้ปรับวงเงิน"
            WHEN "RJ" THEN "ไม่อนุมัติ"
            ELSE  "-"
          END`,
          "result3Result"
        )
        .addSelect("requests.result3MeetingDate", "result3MeetingDate")
        .addSelect("requests.result3MeetingNumber", "result3MeetingNumber")
        .addSelect("requests.result3ApproveBudget", "result3ApproveBudget")
        .addSelect("requests.result3Comments", "result3Comments");

      // Oganization
      if (organizationIdParam) {
        requestsQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }

      // Fiscal year
      if (fiscalYearParam) {
        requestsQuery.andWhere("requests.fiscalYear=:fiscalYear", {
          fiscalYear: fiscalYearParam,
        });
      }

      requestsQuery = addSelectRegion(requestsQuery);
      requestsQuery = addSelectTotalBudget(requestsQuery);
      requestsQuery = addSelectQualification(requestsQuery);
      requestsQuery = addSelectFactSheetResult(requestsQuery);
      requestsQuery = addSelectFactSheetComments(requestsQuery);

      const requests = await requestsQuery
        .groupBy("organization.region")
        .addGroupBy("organization.orgName")
        .addGroupBy("requests.documentDate")
        .addGroupBy("factSheet.interviewDate")
        .addGroupBy("requestItems.borrowerIdCardNo")
        .addGroupBy("requestItems.borrowerTitle")
        .addGroupBy("requestItems.borrowerFirstname")
        .addGroupBy("requestItems.borrowerLastname")
        .addGroupBy("requestItems.borrowerAge")
        .addGroupBy("requests.requestOccupationName")
        .addGroupBy("requests.requestOccupationDescription")
        .addGroupBy("requestItems.guarantorIdCardNo")
        .addGroupBy("requestItems.guarantorTitle")
        .addGroupBy("requestItems.guarantorFirstname")
        .addGroupBy("requestItems.guarantorLastname")
        .addGroupBy("requestItems.guarantorAge")
        .addGroupBy("requests.requestBudget")
        .addGroupBy("factSheet.borrowerScore")
        .addGroupBy("factSheet.guarantorScore")
        .addGroupBy("factSheet.factSheetItems")
        .addGroupBy("factSheet.isApproved")
        .addGroupBy("factSheet.comments")
        .addGroupBy("requests.result1Result")
        .addGroupBy("requests.result1ApproveBudget")
        .addGroupBy("requests.result1Comments")
        .addGroupBy("requests.result2Result")
        .addGroupBy("requests.result2ApproveBudget")
        .addGroupBy("requests.result2Comments")
        .addGroupBy("requests.result2MeetingDate")
        .addGroupBy("requests.result2MeetingNumber")
        .addGroupBy("requests.result3Result")
        .addGroupBy("requests.result3ApproveBudget")
        .addGroupBy("requests.result3Comments")
        .addGroupBy("requests.result3MeetingDate")
        .addGroupBy("requests.result3MeetingNumber")
        .addGroupBy("requests.id")
        .getRawMany();

      if (!requests || requests.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const templateData = {
          title1: `รายงานสรุปตารางผลการพิจารณาตามหลักเกณฑ์ ประจำปี ${
            fiscalYearParam || "-"
          }`,
          title2: `ของ ${organizationIdParam ? requests[0].orgName : "-"}`,
          reportDataDate: getThaiPartialDate(moment().format()),
          data: requests,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          // template: { name: "REPORT11" },
          template: { name: "REPORT11-xlsx-recipe" },
          data: templateData,
        });

        const reportName = `ResultSummaryReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // REPORT-3
  public printRequestResultReport = async (req, res, next) => {
    try {
      const fiscalYearParam = req.query.fiscalYear;
      const regionParam = req.query.region;
      const organizationIdParam = req.query.organizationId;
      const startDocumentDateParam = req.query.startDocumentDate;
      const endDocumentDateParam = req.query.endDocumentDate;

      const year = +fiscalYearParam - 543;
      const prevYear = year - 1;
      const firstDateOfYear = `${prevYear}-10-01`;
      const lastDateOfYear = `${year}-09-30`;

      let requestsQuery = await getRepository(Request)
        .createQueryBuilder("requests")
        .leftJoin("requests.organization", "organization")
        .leftJoin("requests.factSheet", "factSheet")
        .leftJoin(
          "agreements",
          "agreement",
          "agreement.requestId = requests.id"
        )

        .select("organization.orgName", "orgName");
      requestsQuery = addSelectRegion(requestsQuery);

      // คำร้องทั้งหมด
      requestsQuery
        .addSelect("SUM(requests.requestBudget)", "totalRequestBudget")
        .addSelect(
          "SUM(IF(factSheet.isApproved = TRUE, 1, 0))",
          "totalPassedQualification"
        )
        .addSelect(
          "SUM(IF(factSheet.isApproved = FALSE, 1, 0))",
          "totalNotPassedQualification"
        )
        .addSelect(
          "SUM(IF(requests.factSheet IS NULL, 1, 0))",
          "totalNotCheckedQualification"
        )
        .addSelect("SUM(1)", "totalRequest")

        // คำร้องที่พิจารณาโดยที่ประชุม คณะกรรมการบริหารกองทุนฯ
        .addSelect(
          `SUM(requests.result3.approveBudget)`,
          `resultToTalApproveBudget`
        )
        .addSelect(
          `SUM(IF(requests.result3.result = 'AP' OR requests.result3.result = 'AJ', 1, 0))`,
          `resultTotalApprove`
        )
        .addSelect(
          `SUM(IF(requests.result3.result = 'RJ', 1, 0))`,
          `resultTotalReject`
        )
        .addSelect(
          `SUM(IF(requests.result3.result = 'AJ' OR requests.result3.result = 'AP' OR requests.result3.result = 'RJ', 1, 0))`,
          `resultTotal`
        )

        // ข้อมูลสัญญา
        .addSelect("SUM(agreement.loanAmount)", "totalLoanAmount")
        .addSelect(
          "SUM(IF(agreement.status = 'DN', 1, 0))",
          "totalDoneAgreement"
        )
        .addSelect(
          "SUM(IF(agreement.status = 'CL', 1, 0))",
          "totalCancelAgreement"
        )
        .addSelect(
          "SUM(IF(agreement.status = 'DC', 1, 0))",
          "totalDisclaimAgreement"
        )
        .addSelect(
          "SUM(IF(agreement.status != 'DN' AND agreement.status != 'CL' AND agreement.status != 'DC', 1, 0))",
          "totalPendingAgreement"
        )
        .addSelect("SUM(IF(!ISNULL(agreement.id), 1, 0))", "totalAgreement");

      // Fiscal year
      if (fiscalYearParam) {
        requestsQuery.andWhere("requests.fiscalYear=:fiscalYear", {
          fiscalYear: fiscalYearParam,
        });
      }
      // Region
      if (regionParam) {
        requestsQuery.andWhere("organization.region=:region", {
          region: regionParam,
        });
      }
      // Oganization
      if (organizationIdParam) {
        requestsQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }

      // startDocumentDate and endDocumentDate
      if (startDocumentDateParam && endDocumentDateParam) {
        requestsQuery.andWhere(
          "agreement.documentDate BETWEEN :startDocumentDate AND :endDocumentDate",
          {
            startDocumentDate: startDocumentDateParam,
            endDocumentDate: endDocumentDateParam,
          }
        );
      }

      const requests = await requestsQuery
        .groupBy("organization.region")
        .addGroupBy("organization.orgName")
        .getRawMany();

      if (!requests || requests.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const firstDate = startDocumentDateParam
          ? startDocumentDateParam
          : firstDateOfYear;
        const lastDate = endDocumentDateParam
          ? endDocumentDateParam
          : lastDateOfYear;
        const templateData = {
          title1: `รายงานผลการกู้ยืมเงินกองทุน ประเภทรายบุคคล ประจำปี ${
            req.query.fiscalYear || "-"
          }`,
          title2: `ระหว่าง ${
            firstDate && lastDate
              ? getThaiPartialDate(firstDate) +
                " - " +
                getThaiPartialDate(lastDate)
              : "-"
          }`,
          reportDataDate: getThaiPartialDate(moment().format()),
          data: requests,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT3" },
          data: templateData,
        });

        const reportName = `RequestResultReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // REPORT-7
  public printOperationReport = async (req, res, next) => {
    try {
      const fiscalYearParam = req.query.fiscalYear;
      const regionParam = req.query.region;
      const organizationIdParam = req.query.organizationId;
      const startDocumentDateParam = req.query.startDocumentDate;
      const endDocumentDateParam = req.query.endDocumentDate;

      const year = +fiscalYearParam - 543;
      const prevYear = year - 1;
      const firstDateOfYear = `${prevYear}-10-01`;
      const lastDateOfYear = `${year}-09-30`;

      let requestsQuery = await getRepository(Request)
        .createQueryBuilder("requests")
        .leftJoin("requests.organization", "organization")
        .leftJoin("requests.factSheet", "factSheet")
        .leftJoin(
          "agreements",
          "agreement",
          "agreement.requestId = requests.id"
        )
        .leftJoin(
          AccountReceivable,
          "accountReceivable",
          "accountReceivable.agreementId = agreement.id "
        )
        // .leftJoin(
        //   AccountReceivableTransaction,
        //   "accTrans",
        //   "accountReceivable.id = accTrans.accountReceivableId"
        // )

        .select("organization.orgName", "orgName");
      requestsQuery = addSelectRegion(requestsQuery);

      // คำร้องทั้งหมด
      requestsQuery
        .addSelect("SUM(requests.requestBudget)", "totalRequestBudget")
        .addSelect(
          "SUM(IF(factSheet.isApproved = TRUE, 1, 0))",
          "totalPassedQualification"
        )
        .addSelect(
          "SUM(IF(factSheet.isApproved = FALSE, 1, 0))",
          "totalNotPassedQualification"
        )
        .addSelect(
          "SUM(IF(requests.factSheet IS NULL, 1, 0))",
          "totalNotCheckedQualification"
        )
        .addSelect("COUNT(requests.id)", "totalRequest")

        // คำร้องที่พิจารณาโดยที่ประชุม คณะกรรมการบริหารกองทุนฯ
        .addSelect(
          `SUM(requests.result3.approveBudget)`,
          `resultToTalApproveBudget`
        )
        .addSelect(
          `SUM(IF(requests.result3.result = 'AP' OR requests.result3.result = 'AJ', 1, 0))`,
          `resultTotalApprove`
        )
        .addSelect(
          `SUM(IF(requests.result3.result = 'RJ', 1, 0))`,
          `resultTotalReject`
        )
        .addSelect(
          `SUM(IF(requests.result3.result = 'AJ' OR requests.result3.result = 'AP' OR requests.result3.result = 'RJ', 1, 0))`,
          `resultTotal`
        )

        // ข้อมูลสัญญา
        .addSelect(
          `SUM(IF(agreement.status != "DN", agreement.loanAmount, 0))`,
          "totalPrepareLoanAmount"
        )
        .addSelect(
          `SUM(IF(agreement.status = "DN", agreement.loanAmount,0))`,
          "totalDoneLoanAmount"
        )
        .addSelect("SUM(agreement.loanAmount)", "totalLoanAmount")

        .addSelect(
          `SUM(IF(agreement.status != "DN", 1,0))`,
          "totalPrepareAgreement"
        )
        .addSelect(
          `SUM(IF(agreement.status = "DN", 1,0))`,
          "totalDoneAgreement"
        )
        .addSelect("COUNT(agreement.id) ", "totalAgreement")

        // .addSelect(
        //   "@sumLoan := SUM(IF(ISNULL(accountReceivable.loanAmount), 0, accountReceivable.loanAmount))",
        //   "totalARLoanAmount"
        // )
        // .addSelect(
        //   "@paidLoan := SUM(IF(ISNULL(accTrans.paidAmount), 0, accTrans.paidAmount))",
        //   "totalPaidAmount"
        // )
        .addSelect((qb) => {
          const subQ = qb
            .select("SUM(ar.loanAmount)")
            .from(AccountReceivable, "ar")
            .innerJoin(Agreement, "ag")
            .innerJoin(Request, "r")
            // .innerJoin(AccountReceivableTransaction, "art")
            // .where("ar.id = art.accountReceivableId")
            .andWhere("ar.agreementId = ag.id")
            .andWhere("r.id = ag.requestId")
            .andWhere("r.organizationId = organization.id");
          // Fiscal year
          if (fiscalYearParam) {
            subQ.andWhere("r.fiscalYear=:fiscalYear1", {
              fiscalYear1: fiscalYearParam,
            });
          }
          // startDocumentDate and endDocumentDate
          if (startDocumentDateParam && endDocumentDateParam) {
            requestsQuery.andWhere(
              "ag.documentDate BETWEEN :startDocumentDate1 AND :endDocumentDate1",
              {
                startDocumentDate1: startDocumentDateParam,
                endDocumentDate1: endDocumentDateParam,
              }
            );
          }

          return subQ;
        }, "totalARLoanAmount")
        .addSelect((qb) => {
          const subQ = qb
            .select("SUM(art.paidAmount)")
            .from(AccountReceivable, "ar")
            .innerJoin(Agreement, "ag")
            .innerJoin(Request, "r")
            .innerJoin(AccountReceivableTransaction, "art")
            .where("ar.id = art.accountReceivableId")
            .andWhere("ar.agreementId = ag.id")
            .andWhere("r.id = ag.requestId")
            .andWhere("r.organizationId = organization.id");
          // Fiscal year
          if (fiscalYearParam) {
            subQ.andWhere("r.fiscalYear=:fiscalYear2", {
              fiscalYear2: fiscalYearParam,
            });
          }
          // startDocumentDate and endDocumentDate
          if (startDocumentDateParam && endDocumentDateParam) {
            requestsQuery.andWhere(
              "ag.documentDate BETWEEN :startDocumentDate2 AND :endDocumentDate2",
              {
                startDocumentDate2: startDocumentDateParam,
                endDocumentDate2: endDocumentDateParam,
              }
            );
          }

          return subQ;
        }, "totalPaidAmount");
      // .addSelect((qb) => {
      //   const subQ = qb
      //     .select("ar.loanAmount - SUM(art.paidAmount)")
      //     .from(AccountReceivable, "ar")
      //     .innerJoin(Agreement, "ag")
      //     .innerJoin(Request, "r")
      //     .innerJoin(AccountReceivableTransaction, "art")
      //     .where("ar.id = art.accountReceivableId")
      //     .andWhere("ar.agreementId = ag.id")
      //     .andWhere("r.id = ag.requestId")
      //     .andWhere("r.organizationId = organization.id");
      //   // Fiscal year
      //   if (fiscalYearParam) {
      //     subQ.andWhere("r.fiscalYear=:fiscalYear3", {
      //       fiscalYear3: fiscalYearParam,
      //     });
      //   }
      //   // startDocumentDate and endDocumentDate
      //   if (startDocumentDateParam && endDocumentDateParam) {
      //     requestsQuery.andWhere(
      //       "ag.documentDate BETWEEN :startDocumentDate3 AND :endDocumentDate3",
      //       {
      //         startDocumentDate3: startDocumentDateParam,
      //         endDocumentDate3: endDocumentDateParam,
      //       }
      //     );
      //   }

      //   return subQ;
      // }, "totalOutstandingDebtBalance");
      // .addSelect(
      //   "SUM(IF(ISNULL(accountReceivable.outstandingDebtBalance), 0, accountReceivable.outstandingDebtBalance))",
      //   "totalOutstandingDebtBalance"
      // );

      // Fiscal year
      if (fiscalYearParam) {
        requestsQuery.andWhere("requests.fiscalYear=:fiscalYear", {
          fiscalYear: fiscalYearParam,
        });
      }
      // Region
      if (regionParam) {
        requestsQuery.andWhere("organization.region=:region", {
          region: regionParam,
        });
      }
      // Oganization
      if (organizationIdParam) {
        requestsQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }

      // startDocumentDate and endDocumentDate
      if (startDocumentDateParam && endDocumentDateParam) {
        requestsQuery.andWhere(
          "agreement.documentDate BETWEEN :startDocumentDate AND :endDocumentDate",
          {
            startDocumentDate: startDocumentDateParam,
            endDocumentDate: endDocumentDateParam,
          }
        );
      }
      // requestsQuery.andWhere((qb) => {
      //   const subQuery = qb
      //     .subQuery()
      //     .select("ar.id")
      //     // .leftJoin(Agreement, "ag", "ar.agreementId = agreement.id")
      //     .from(AccountReceivable, "ar")
      //     .where("ar.agreementId = agreement.id")
      //     .orderBy("ar.createdDate", "ASC")
      //     .limit(1);
      //   return `accountReceivable.id  = ${subQuery.getQuery()}`;
      // });

      const requests = await requestsQuery
        .groupBy("organization.region")
        .addGroupBy("organization.id")
        .addGroupBy("organization.orgName")
        .getRawMany();

      if (!requests || requests.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const firstDate = startDocumentDateParam
          ? startDocumentDateParam
          : firstDateOfYear;
        const lastDate = endDocumentDateParam
          ? endDocumentDateParam
          : lastDateOfYear;
        const templateData = {
          title1: `รายงานผลการดำเนินงานกองทุนผู้สูงอายุ ประเภทรายบุคคล ประจำปี ${
            req.query.fiscalYear || "-"
          }`,
          title2: `ระหว่าง ${
            firstDate && lastDate
              ? getThaiPartialDate(firstDate) +
                " - " +
                getThaiPartialDate(lastDate)
              : "-"
          }`,
          reportDataDate:
            "ข้อมูล ณ วันที่ " + getThaiPartialDate(moment().format()),
          data: requests,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT7" },
          data: templateData,
        });

        const reportName = `OperationReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  public showAllRequests = async (req, res, next) => {
    try {
      const query = await getRepository(Request).query(
        `SELECT 
        trans.paidDate as "วันที่รับชำระเงิน",
        ar.name as "ชื่อ-สกุล / ชื่อกลุ่ม",
        cs.REFERENCE_1 as "เลขที่บัตรประาชน",
        cs.REFERENCE_2 as "หมายเลขอ้างอิงลูกหนี้", 
        agree.documentNumber as "เลขที่สัญญา", 
        agree.fiscalYear as "ปีสัญญา", 
        org.orgCode as "รหัสจังวัด",
        org.addressProvince as "ลูกหนี้ของจังหวัด",
        IF(cs.ZONE =1 ,"นครหลวง","ภูมิภาค") as "พื้นที่ชำระเงิน",
        cs.COUNTER_NO as "รหัสสาขา", 
        cs.SERVICE_RUN_NO as "เลขที่ใบเสร็จ",
        cs.TERM_NO as "รหัสเครื่อง",
        cs.AMOUNT_RECEIVED as "จำนวนเงิน"  FROM account_receivable_transactions as trans
      INNER JOIN counter_services as cs on cs.id = trans.paymentId
      INNER JOIN account_receivables as ar on ar.id = trans.accountReceivableId
      INNER JOIN agreements as agree on ar.agreementId = agree.id
      INNER JOIN organizations as org on org.id = ar.organizationId
      and trans.paymentType = "CS"
      and trans.status = "CL" # report1 "NM" ::report 2 "CL"
      and cs.createdDate > DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY ), "%Y-%m-%d")
      and cs.createdDate < DATE_FORMAT(NOW(), "%Y-%m-%d")
      order by trans.paidDate , cs.zone, org.orgCode`
      );
      // let accountReceivableQuery = await getRepository(
      //   AccountReceivableTransaction
      // )
      //   .createQueryBuilder("accTrans")
      //   .innerJoinAndSelect("accTrans.accountReceivable", "accountReceivable")
      //   .innerJoinAndSelect("accountReceivable.agreement", "agreement")
      //   .innerJoinAndSelect("agreement.agreementItems", "agreementItems")
      //   .innerJoinAndSelect("accountReceivable.organization", "organization")
      //   .getOne();
      res.send(query);
    } catch (e) {
      next(e);
    }
  };
}

export const controller = new RequestController("Request", "เอกสารคำร้อง");
