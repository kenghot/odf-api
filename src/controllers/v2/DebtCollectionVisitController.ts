import { getRepository } from "typeorm";
import { DebtCollectionVisit } from "../../entities/DebtCollectionVisit";
import { jsreport } from "../../jsreport";
import { NotFoundError } from "../../middlewares/error/error-type";
import DebtCollectionRepository from "../../repositories/v2/DebtCollectionRepository";
import VisitRepository from "../../repositories/v2/VisitRepository";
import { convertNumberToText } from "../../utils/number-to-thai-text";
import { BaseController } from "./BaseController";

const formBoolean = {
  ["true"]: true,
  ["false"]: false
};

class DebtCollectionVisitController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  withFormData = (req, res, next) => {
    req.body.isMeetTarget =
      req.body.isMeetTarget && formBoolean[req.body.isMeetTarget];
    req.body.isWorking = req.body.isWorking && formBoolean[req.body.isWorking];
    req.body.hasExtraIncome =
      req.body.hasExtraIncome && formBoolean[req.body.hasExtraIncome];

    next();
  };

  createVisit = async (req, res, next) => {
    try {
      const debtCollection = await DebtCollectionRepository.findOne(
        req.params.id
      );

      if (
        !debtCollection.deathNotification.isConfirm &&
        debtCollection.step < 2
      ) {
        debtCollection.step = 2;
      }

      const visit = VisitRepository.create(req.body as DebtCollectionVisit);
      visit.debtCollection = debtCollection;

      await VisitRepository.createVisit(visit);

      res.locals.data = visit;

      // req.params.id = visit.debtCollectionId;

      next();
    } catch (err) {
      next(err);
    }
  };

  public printVisitForm = async (req, res, next) => {
    try {
      const id = req.params.id;
      const debtCollectionVisit = await getRepository(DebtCollectionVisit)
        .createQueryBuilder("visit")
        .where("visit.id = :id", { id })
        .leftJoinAndSelect("visit.debtCollection", "debtCollection")
        .leftJoinAndSelect(
          "debtCollection.accountReceivable",
          "accountReceivable"
        )
        .leftJoinAndSelect("accountReceivable.organization", "organization")
        .leftJoinAndSelect("accountReceivable.agreement", "agreement")
        .leftJoinAndSelect("accountReceivable.controls", "controls")
        .leftJoinAndSelect(
          "controls.accountReceivable",
          "accountReceivableControl"
        )
        .leftJoinAndSelect("accountReceivable.guarantee", "guarantee")
        .leftJoinAndSelect("guarantee.request", "guaranteeRequest")
        .leftJoinAndSelect("guarantee.guaranteeItems", "guaranteeItems")
        .leftJoinAndSelect("agreement.agreementItems", "agreementItems")
        .orderBy("controls.createdDate", "DESC")
        .getOne();

      // res.send(debtCollectionVisit);

      if (!debtCollectionVisit) {
        return next(
          new NotFoundError({
            name: "ไม่พบเอกสาร"
            // message: "ไม่พบใบสำคัญรับเงิน กรุณาเลือกสัญญาที่ต้องการทำรายการ"
          })
        );
      } else {
        // คำนวนอายุใหม่ตามวันปัจจุบันให้กับ borrower และ guarantor
        debtCollectionVisit.debtCollection.accountReceivable.agreement.agreementItems[0].borrower.setAge(
          new Date()
        );
        debtCollectionVisit.debtCollection.accountReceivable.agreement.agreementItems[0].guarantor.setAge(
          new Date()
        );
        debtCollectionVisit.setThaiFormatForReport();
        const agreement =
          debtCollectionVisit.debtCollection.accountReceivable.agreement;
        const accountReceivable =
          debtCollectionVisit.debtCollection.accountReceivable;
        const agreementItem =
          debtCollectionVisit.debtCollection.accountReceivable.agreement
            .agreementItems[0];
        const control = accountReceivable.controls[0];

        const jsreportData: any = {};
        jsreportData.fullName = `${agreementItem.borrower.title}${agreementItem.borrower.firstname} ${agreementItem.borrower.lastname}`.trim();
        jsreportData.borrower = agreementItem.borrower;
        jsreportData.borrowerAge = agreementItem.borrower.age;
        jsreportData.borrowerAddress = debtCollectionVisit.currentAddress;

        jsreportData.borrowerTelephone =
          // @ts-ignore
          debtCollectionVisit.contactTelephone;
        jsreportData.agreementDocumentNumber = agreement.documentNumber;
        jsreportData.agreementDocumentDate = agreement.documentDate;
        jsreportData.loanAmount = agreement.loanAmount;
        jsreportData.requestOccupation = debtCollectionVisit.occupation;
        jsreportData.overDueInstallmentTimes = control
          ? control.overDueInstallmentTimes
          : 0;
        jsreportData.overDueBalance = control ? control.overDueBalance : 0;
        jsreportData.occupationName = debtCollectionVisit.isWorking
          ? `${debtCollectionVisit.occupation.name} ${debtCollectionVisit.occupation.description}`
          : "";
        jsreportData.occupationSalary = debtCollectionVisit.occupation.salary;
        jsreportData.extraIncome = debtCollectionVisit.hasExtraIncome
          ? debtCollectionVisit.extraIncome
          
          : 0;
        jsreportData.extraIncomeDescription =
          debtCollectionVisit.extraIncomeDescription;
        jsreportData.familyMember = debtCollectionVisit.familyMember;
        jsreportData.familyMemberDescription =
          debtCollectionVisit.familyMemberDescription;
        jsreportData.expenseDeclaration =
          debtCollectionVisit.expenseDeclaration;

        jsreportData.problem1 = debtCollectionVisit.problem1;
        jsreportData.problem2 = debtCollectionVisit.problem2;
        jsreportData.problem3 = debtCollectionVisit.problem3;
        jsreportData.inspection1 = debtCollectionVisit.inspection1;
        jsreportData.inspection2 = debtCollectionVisit.inspection2;
        jsreportData.inspection3 = debtCollectionVisit.inspection3;
        jsreportData.comments = debtCollectionVisit.comments;
        jsreportData.visitorName = debtCollectionVisit.visitorName;
        jsreportData.visitorPosition = debtCollectionVisit.visitorPosition;
        jsreportData.visitDate = debtCollectionVisit.visitDate;

        // Guarantor
        jsreportData.guarantorFullName = `${agreementItem.guarantor.title}${agreementItem.guarantor.firstname} ${agreementItem.guarantor.lastname}`.trim();
        jsreportData.guarantor = agreementItem.guarantor;
        jsreportData.guarantorAge = agreementItem.guarantor.age;
        jsreportData.guarantorAddress = debtCollectionVisit.currentAddress;
        jsreportData.guarantorTelephone =
          // @ts-ignore
          debtCollectionVisit.contactTelephone;
        jsreportData.guaranteeDocumentNumber =
          agreement.guaranteeDocumentNumber;
        jsreportData.guaranteeDocumentDate = agreement.guaranteeDocumentDate;

        const visitType: string = debtCollectionVisit.visitType;
        let formName;
        let pdfName;
        if (visitType === "DCB") {
          formName = "personal-visit-form-borrower";
          pdfName = `borrower-visit-form${new Date().toISOString()}.pdf`;
        } else if (visitType === "DCG") {
          formName = "personal-visit-form-guarantor";
          pdfName = `guarantor-visit-form${new Date().toISOString()}.pdf`;
        }

        // res.send(jsreportData);

        const resp = await jsreport.render({
          template: { name: formName },
          data: jsreportData
        });
        res
          .header("Content-Disposition", `attachment; filename=${pdfName}`)
          .header("filename", pdfName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };
}

export const controller = new DebtCollectionVisitController(
  "DebtCollectionVisit",
  "รายงานการลงเยี่ยมบ้าน"
);
