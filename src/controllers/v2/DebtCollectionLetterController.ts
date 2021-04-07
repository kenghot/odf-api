import moment = require("moment");
import { getRepository } from "typeorm";
import { DebtCollectionLetter } from "../../entities/DebtCollectionLetter";
import { letterTypeSet } from "../../enumset";
import { jsreport } from "../../jsreport";
import { NotFoundError } from "../../middlewares/error/error-type";
import DebtCollectionRepository from "../../repositories/v2/DebtCollectionRepository";
import LetterRepository from "../../repositories/v2/LetterRepository";
import { getThaiPartialDate } from "../../utils/datetime-helper";
import { convertNumberToText } from "../../utils/number-to-thai-text";
import { BaseController } from "./BaseController";

const formBoolean = {
  ["true"]: true,
  ["false"]: false
};

class DebtCollectionLetterController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  withFormData = (req, res, next) => {
    req.body.isSentBack =
      req.body.isSentBack && formBoolean[req.body.isSentBack];
    req.body.isCollectable =
      req.body.isCollectable && formBoolean[req.body.isCollectable];

    next();
  };

  createLetter = async (req, res, next) => {
    const { letterType } = req.body as DebtCollectionLetter;
    try {
      const debtCollection = await DebtCollectionRepository.findOne(
        req.params.id
      );
      // กรณีปกติ
      if (
        !debtCollection.deathNotification.isConfirm &&
        [
          letterTypeSet.collectionLetterBorrower,
          letterTypeSet.collectionLetterGuarantor
        ].includes(letterType) &&
        debtCollection.step < 1
      ) {
        debtCollection.step = 1;

        // กรณีเสียชีวิต
      } else if (debtCollection.deathNotification.isConfirm) {
        // กรณีสืบหาทายาท
        if (
          [
            letterTypeSet.searchingHeritage,
            letterTypeSet.searchingManager
          ].includes(letterType) &&
          debtCollection.step < 1
        ) {
          debtCollection.step = 1;
          // กรณีแจ้งทายาท
        } else if (
          letterType === letterTypeSet.notification &&
          debtCollection.step < 2
        ) {
          debtCollection.step = 2;
        }
      }

      const letter = LetterRepository.create(req.body as DebtCollectionLetter);
      letter.debtCollection = debtCollection;

      await LetterRepository.createLetter(letter);

      res.locals.data = letter;

      next();
    } catch (err) {
      next(err);
    }
  };

  public printLetterReport = async (req, res, next) => {
    try {
      const letter = await getRepository(DebtCollectionLetter)
        .createQueryBuilder("letter")
        .leftJoinAndSelect("letter.debtCollection", "debtCollection")
        .leftJoinAndSelect(
          "debtCollection.accountReceivable",
          "accountReceivable"
        )
        .leftJoinAndSelect("accountReceivable.controls", "controls")
        .leftJoinAndSelect("accountReceivable.organization", "organization")
        .leftJoinAndSelect("accountReceivable.agreement", "agreement")
        .leftJoinAndSelect("agreement.agreementItems", "agreementItems")
        .where("letter.id = :id", { id: req.params.id })
        .orderBy("controls.createdDate", "DESC")
        .getOne();

      if (!letter) {
        return next(
          new NotFoundError({
            name: "ไม่พบเอกสาร"
            // message: "ไม่พบใบสำคัญรับเงิน กรุณาเลือกสัญญาที่ต้องการทำรายการ"
          })
        );
      } else {
        letter.setThaiFormatForReport();
        const agreement = letter.debtCollection.accountReceivable.agreement;
        const accountReceivable = letter.debtCollection.accountReceivable;
        const control = accountReceivable.controls[0];
        const organization =
          letter.debtCollection.accountReceivable.organization;
        const agreementItem =
          letter.debtCollection.accountReceivable.agreement.agreementItems[0];

        const jsreportData: any = {};
        jsreportData.organization = organization;
        jsreportData.letterDocumentDate = letter.documentDate;
        jsreportData.borrower = agreementItem.borrower;
        jsreportData.agreementDocumentNumber = agreement.documentNumber;
        jsreportData.agreementDocumentDate = agreement.documentDate;
        jsreportData.loanAmount = agreement.loanAmount;
        jsreportData.loanAmountText = convertNumberToText(agreement.loanAmount);
        jsreportData.guarantor = agreementItem.guarantor;
        jsreportData.outstandingDebtBalance =
          accountReceivable.outstandingDebtBalance;
        jsreportData.outstandingDebtBalanceText = convertNumberToText(
          accountReceivable.outstandingDebtBalance
        );
        jsreportData.asOfDate = control ? control.asOfDate : "รอการประมวลผล";
        jsreportData.overdueBalance = control ? control.overDueBalance : 0;
        jsreportData.overdueBalanceText = convertNumberToText(
          control ? control.overDueBalance : 0
        );

        jsreportData.guaranteeDocumentNumber =
          agreement.guaranteeDocumentNumber;
        jsreportData.guaranteeDocumentDate = agreement.guaranteeDocumentDate;

        // res.send(jsreportData);

        const letterType: string = letter.letterType;
        let formName;
        let pdfName;
        if (letterType === "CLB") {
          formName = "personal-debt-collection-borrower";
          pdfName = `borrower-letter${new Date().toISOString()}.pdf`;
        } else if (letterType === "CLG") {
          formName = "personal-debt-collection-guarantor";
          pdfName = `guarantor-letter${new Date().toISOString()}.pdf`;
        }
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

  public printCancelBorrowerReport = async (req, res, next) => {
    try {
      const debtCollection = await DebtCollectionRepository.findDebtCollection(
        req.params.id,
        {
          relations: [
            "accountReceivable",
            "accountReceivable.organization",
            "accountReceivable.agreement",
            "accountReceivable.agreement.agreementItems",
            "accountReceivable.guarantee",
            "accountReceivable.controls",
            "accountReceivable.guarantee.guaranteeItems",
            "letters",
            "visits"
          ]
        }
      );

      if (!debtCollection) {
        return next(
          new NotFoundError({
            name: "ไม่พบเอกสาร"
            // message: "ไม่พบใบสำคัญรับเงิน กรุณาเลือกสัญญาที่ต้องการทำรายการ"
          })
        );
      } else {
        debtCollection.setThaiFormatForReport();
        const agreement = debtCollection.accountReceivable.agreement;
        const accountReceivable = debtCollection.accountReceivable;
        const organization = debtCollection.accountReceivable.organization;
        const agreementItem =
          debtCollection.accountReceivable.agreement.agreementItems[0];
        const guarantee = debtCollection.accountReceivable.guarantee;

        const jsreportData: any = {};
        jsreportData.organization = organization;
        jsreportData.formDataDate = getThaiPartialDate(moment().format());
        jsreportData.borrower = agreementItem.borrower;
        jsreportData.agreementDocumentNumber = agreement.documentNumber;
        jsreportData.agreementDocumentDate = agreement.documentDate;

        jsreportData.loanAmount = agreement.loanAmount;
        jsreportData.loanAmountText = convertNumberToText(agreement.loanAmount);
        jsreportData.guarantor = agreementItem.guarantor;
        jsreportData.installmentAmount = accountReceivable.installmentAmount;
        jsreportData.installmentAmountText = convertNumberToText(
          accountReceivable.installmentAmount
        );
        jsreportData.installmentFirstDate =
          accountReceivable.installmentFirstDate;
        jsreportData.installmentTimes = accountReceivable.installmentTimes;
        jsreportData.outstandingDebtBalance =
          accountReceivable.outstandingDebtBalance;
        jsreportData.outstandingDebtBalanceText = convertNumberToText(
          accountReceivable.outstandingDebtBalance
        );

        jsreportData.guaranteeDocumentDate = guarantee.agreementDocumentDate;
        jsreportData.guaranteeDocumentNumber =
          guarantee.agreementDocumentNumber;

        const resp = await jsreport.render({
          template: { name: "personal-cancel-borrower" },
          data: jsreportData
        });
        const filename = `cancel-borrower${new Date().toISOString()}.pdf`;
        res
          .header("Content-Disposition", `attachment; filename=${filename}`)
          .header("filename", filename)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  public printCancelGuarantorReport = async (req, res, next) => {
    try {
      const debtCollection = await DebtCollectionRepository.findDebtCollection(
        req.params.id,
        {
          relations: [
            "accountReceivable",
            "accountReceivable.organization",
            "accountReceivable.agreement",
            "accountReceivable.agreement.agreementItems",
            "accountReceivable.guarantee",
            "accountReceivable.controls",
            "accountReceivable.guarantee.guaranteeItems",
            "letters",
            "visits"
          ]
        }
      );
      // res.send(debtCollection);

      if (!debtCollection) {
        return next(
          new NotFoundError({
            name: "ไม่พบเอกสาร"
            // message: "ไม่พบใบสำคัญรับเงิน กรุณาเลือกสัญญาที่ต้องการทำรายการ"
          })
        );
      } else {
        debtCollection.setThaiFormatForReport();
        const agreement = debtCollection.accountReceivable.agreement;
        const accountReceivable = debtCollection.accountReceivable;
        const organization = debtCollection.accountReceivable.organization;
        const agreementItem =
          debtCollection.accountReceivable.agreement.agreementItems[0];

        const jsreportData: any = {};
        jsreportData.organization = organization;
        jsreportData.formDataDate = getThaiPartialDate(moment().format());
        jsreportData.guarantor = agreementItem.guarantor;
        jsreportData.guaranteeDocumentNumber =
          agreement.guaranteeDocumentNumber;
        jsreportData.guaranteeDocumentDate = agreement.guaranteeDocumentDate;
        jsreportData.agreementDocumentNumber = agreement.documentNumber;
        jsreportData.agreementDocumentDate = agreement.documentDate;
        jsreportData.borrower = agreementItem.borrower;
        jsreportData.loanAmount = agreement.loanAmount;
        jsreportData.loanAmountText = convertNumberToText(agreement.loanAmount);
        jsreportData.outstandingDebtBalance =
          accountReceivable.outstandingDebtBalance;
        jsreportData.outstandingDebtBalanceText = convertNumberToText(
          accountReceivable.outstandingDebtBalance
        );
        // res.send(jsreportData);

        const resp = await jsreport.render({
          template: { name: "personal-cancel-guarantor" },
          data: jsreportData
        });

        const filename = `cancel-guarantor${new Date().toISOString()}.pdf`;

        res
          .header("Content-Disposition", `attachment; filename=${filename}`)
          .header("filename", filename)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };
}

export const controller = new DebtCollectionLetterController(
  "DebtCollectionLetter",
  "หนังสือถวงถาม"
);
