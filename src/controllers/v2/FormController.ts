import { jsreport } from "../../jsreport";
import { NotFoundError } from "../../middlewares/error/error-type";
import { getThaiPartialDate } from "../../utils/datetime-helper";
import { convertNumberToText } from "../../utils/number-to-thai-text";
import { BaseController } from "./BaseController";
import { fullNameFormatting } from "../../utils/format-helper";

export class FormController {
  public static printDebtAcknowledgeForm = async (req, res, next) => {
    try {
      const preAccountReceivable = req.body.accountReceivable;
      const debtAcknowledgement = req.body.debtAcknowledgement;
      if (!preAccountReceivable && !debtAcknowledgement) {
        return next(
          new NotFoundError({
            name: "ไม่พบเอกสาร"
            // message: "ไม่พบใบสำคัญรับเงิน กรุณาเลือกสัญญาที่ต้องการทำรายการ"
          })
        );
      } else {
        const jsreportData: any = {};
        jsreportData.location = debtAcknowledgement.location;
        jsreportData.acknowledgeDate = getThaiPartialDate(
          debtAcknowledgement.acknowledgeDate
        );
        jsreportData.fullName = `${debtAcknowledgement.title}${debtAcknowledgement.firstname} ${debtAcknowledgement.lastname}`.trim();
        jsreportData.idCardNo = debtAcknowledgement.idCardNo;
        jsreportData.telephone = debtAcknowledgement.telephone;
        if (preAccountReceivable) {
          jsreportData.documentNumber =
            preAccountReceivable.agreement.documentNumber;
          jsreportData.documentDate = getThaiPartialDate(
            preAccountReceivable.agreement.documentDate
          );
          jsreportData.loanAmount = preAccountReceivable.agreement.loanAmount;
          jsreportData.loanAmountText = convertNumberToText(
            preAccountReceivable.agreement.loanAmount
          );
          jsreportData.outstandingDebtBalance =
            preAccountReceivable.outstandingDebtBalance;
          jsreportData.outstandingDebtBalanceText = convertNumberToText(
            preAccountReceivable.outstandingDebtBalance
          );
          jsreportData.installmentAmount =
            preAccountReceivable.installmentAmount;
          jsreportData.installmentAmountText = convertNumberToText(
            preAccountReceivable.installmentAmount
          );
        }
        const guarantorTemp =
          preAccountReceivable.agreement.agreementItems[0].guarantor;
        jsreportData.guarantor = {
          ...guarantorTemp,
          fullName: fullNameFormatting(
            guarantorTemp.title,
            guarantorTemp.firstname,
            guarantorTemp.lastname
          )
        };

        jsreportData.onBehalfOf = debtAcknowledgement.onBehalfOf;

        const formName = debtAcknowledgement.isBehalf
          ? "personal-dept-acknowledge-dying-form"
          : "personal-dept-acknowledge-form";
        const pdfName = debtAcknowledgement.isBehalf
          ? `debt-acknowledge-dying${new Date().toISOString()}.pdf`
          : `debt-acknowledge${new Date().toISOString()}.pdf`;
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
