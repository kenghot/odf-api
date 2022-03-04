import { getRepository } from "typeorm";
import { AccountReceivable } from "../../entities/AccountReceivable";
import { DebtCollection } from "../../entities/DebtCollection";
import { Memo } from "../../entities/Memo";
import { jsreport } from "../../jsreport";
import { NotFoundError } from "../../middlewares/error/error-type";
import { getThaiPartialDate } from "../../utils/datetime-helper";
import { getEnumSetText } from "../../utils/get-enum-set-text";
import { BaseController } from "./BaseController";

class MemoController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  withFormData = (req, res, next) => {
    req.body.isOnlyBirthYear = req.body.isOnlyBirthYear ? true : false;
    req.body.isWorking = req.body.isWorking ? true : false;
    req.body.memoInformerRelationship = req.body.memoInformerRelationship
      ? req.body.memoInformerRelationship
      : null;
    next();
  };

  setDebtCollectParam = (req, res, next) => {
    req.params.id = res.locals.data.refId;
    next();
  };

  public printMemoForm = async (req, res, next) => {
    try {
      const debtCollectionMemo: any = await getRepository(Memo)
        .createQueryBuilder("memo")
        .leftJoinAndMapOne(
          "memo.debtcollection",
          "DebtCollection",
          "debtcollection",
          "debtcollection.id = memo.refId"
        )
        .leftJoinAndMapOne(
          "memo.accountReceivable",
          "AccountReceivable",
          "accountReceivable",
          "accountReceivable.id = debtcollection.accountReceivableId"
        )
        .leftJoinAndSelect("accountReceivable.agreement", "agreement")
        .leftJoinAndSelect("agreement.guarantee", "guarantee")
        .leftJoinAndSelect("accountReceivable.controls", "controls")
        .where("memo.id = :id", { id: req.params.id })
        .orderBy("controls.createdDate", "DESC")
        .getOne();

      // res.send(debtCollectionMemo);

      if (!debtCollectionMemo) {
        const accountReceivable: any = await getRepository(DebtCollection)
        .createQueryBuilder("debt")
        .leftJoinAndMapOne(
          "debt.accountReceivable",
          "AccountReceivable",
          "accountReceivable",
          "accountReceivable.id = debt.accountReceivableId"
        )
        .leftJoinAndSelect("accountReceivable.agreement", "agreement")
        .leftJoinAndSelect("agreement.guarantee", "guarantee")
        .leftJoinAndSelect("accountReceivable.controls", "controls")
        .where("debt.id = :id", { id: req.params.id })
        .orderBy("controls.createdDate", "DESC")
        .getOne();
        // console.log(accountReceivable);
        if(!accountReceivable){
          return next(
            new NotFoundError({
              name: "ไม่พบเอกสาร"
              // message: "ไม่พบใบบันทึกถ้อยคำ"
            })
          );
        }else{
          const control = accountReceivable.accountReceivable.controls[0];

        const jsreportData: any = {};
        jsreportData.location = "";
        jsreportData.documentDate = "";
        jsreportData.agreementDocumentNumber =
          accountReceivable.memoInformer === "B" ||
          accountReceivable.memoInformer === "BW"
            ? accountReceivable.accountReceivable.agreement.documentNumber
            : accountReceivable.accountReceivable.agreement.guarantee
                .documentNumber;
        jsreportData.agreementDocumentDate = getThaiPartialDate(
          accountReceivable.memoInformer === "B" ||
            accountReceivable.memoInformer === "BW"
            ? accountReceivable.accountReceivable.agreement.documentDate
            : accountReceivable.accountReceivable.agreement.guarantee
                .documentDate
        );
        jsreportData.overDueBalance = control ? control.overDueBalance : 0;
        jsreportData.memoInformer = "";
        jsreportData.memoInformerRelationship ="";
        jsreportData.fullName = "";
        jsreportData.title = "";
        jsreportData.firstname = "";
        jsreportData.lastname = "";
        jsreportData.age = "";
        jsreportData.occupation = "";
        jsreportData.currentAddress = "";
        jsreportData.mobilePhone = "";
        jsreportData.memoTitle = "";
        jsreportData.memoNote = "";
        jsreportData.interviewerName = "";
        jsreportData.interviewerPosition ="";

        // res.send(jsreportData);

        const resp = await jsreport.render({
          template: { name: "personal-memo" },
          data: jsreportData
        });

        const filename = `personal-memo${new Date().toISOString()}.pdf`;

        res
          .header("Content-Disposition", `attachment; filename=${filename}`)
          .header("filename", filename)
          .send(resp.content);
        }
      } else {
        const control = debtCollectionMemo.accountReceivable.controls[0];

        const jsreportData: any = {};
        jsreportData.location = debtCollectionMemo.location;
        jsreportData.documentDate = getThaiPartialDate(
          debtCollectionMemo.documentDate
        );
        jsreportData.agreementDocumentNumber =
          debtCollectionMemo.memoInformer === "B" ||
          debtCollectionMemo.memoInformer === "BW"
            ? debtCollectionMemo.accountReceivable.agreement.documentNumber
            : debtCollectionMemo.accountReceivable.agreement.guarantee
                .documentNumber;
        jsreportData.agreementDocumentDate = getThaiPartialDate(
          debtCollectionMemo.memoInformer === "B" ||
            debtCollectionMemo.memoInformer === "BW"
            ? debtCollectionMemo.accountReceivable.agreement.documentDate
            : debtCollectionMemo.accountReceivable.agreement.guarantee
                .documentDate
        );
        jsreportData.overDueBalance = control ? control.overDueBalance : 0;
        jsreportData.memoInformer = debtCollectionMemo.memoInformer;
        jsreportData.memoInformerRelationship =
          getEnumSetText(
            "guarantorBorrowerRelationship",
            debtCollectionMemo.memoInformerRelationship
          ) || "-";
        jsreportData.fullName = `${debtCollectionMemo.title}${debtCollectionMemo.firstname} ${debtCollectionMemo.lastname}`.trim();
        jsreportData.title = debtCollectionMemo.title;
        jsreportData.firstname = debtCollectionMemo.firstname;
        jsreportData.lastname = debtCollectionMemo.lastname;
        jsreportData.age = debtCollectionMemo.age;
        jsreportData.occupation = `${debtCollectionMemo.occupation.name} ${debtCollectionMemo.occupation.description}`.trim();
        jsreportData.currentAddress = debtCollectionMemo.currentAddress;
        jsreportData.mobilePhone = debtCollectionMemo.mobilePhone;
        jsreportData.memoTitle = debtCollectionMemo.memoTitle;
        jsreportData.memoNote = debtCollectionMemo.memoNote;
        jsreportData.interviewerName = debtCollectionMemo.interviewerName;
        jsreportData.interviewerPosition =
          debtCollectionMemo.interviewerPosition;

        // res.send(jsreportData);

        const resp = await jsreport.render({
          template: { name: "personal-memo" },
          data: jsreportData
        });

        const filename = `personal-memo${new Date().toISOString()}.pdf`;

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

export const controller = new MemoController("Memo", "บันทึกถ้อยคำ");
