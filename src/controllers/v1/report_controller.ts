import { RequestHandler } from "express";
import * as fs from "fs";
import moment = require("moment");
import * as os from "os";
import * as path from "path";
import { DeepPartial, getRepository, In } from "typeorm";
import { Agreement } from "../../entities/Agreement";
import { AgreementItem } from "../../entities/AgreementItem";
import { Guarantee } from "../../entities/Guarantee";
import { GuaranteeItem } from "../../entities/GuaranteeItem";
import { Request } from "../../entities/Request";
import { Voucher } from "../../entities/Voucher";
import { loanTypeSet, voucherStatusSet } from "../../enumset";
import { jsreport } from "../../jsreport";
import { NotFoundError } from "../../middlewares/error/error-type";
import {
  AgreementRepository,
  GuaranteeRepository,
  RequestRepository,
  VoucherRepository,
} from "../../repositories/v1";
import { generateBarcode } from "../../utils/barcode-helper";
import { getThaiPartialDate } from "../../utils/datetime-helper";

enum requestReportTypeSet {
  personal = "personal-request",
  group = "group-request",
}

enum agreementExampleReportTypeSet {
  personal = "personal-agreement-example",
  group = "group-agreement-example",
}

enum guaranteeExampleReportTypeSet {
  personal = "personal-guarantee-example",
  group = "group-guarantee-example",
}

enum agreementReportTypeSet {
  personal = "personal-agreement",
  group = "group-agreement",
}

enum guaranteeReportTypeSet {
  personal = "personal-guarantee",
  group = "group-guarantee",
}

export interface IKTBRecord {
  fileType: string; // 2
  recordType: string; // 1
  batchNo: string; // 6
  receivingBank: string; // 3
  receivingBranchCode: string; // 4
  receivingAccount: string; // 11
  sendingBankCode: string; // 3
  sendingBranchCode: string; // 4
  sendingAccount: string; // 11
  effectiveDate: string; // 8
  serviceType: string; // 2
  clearingHouseCode: string; // 2
  amount: string; // 17
  receiverInfo: string; // 8
  receiverId: string; // 10
  receiverName: string; // 100
  senderName: string; // 100
  otherInfo1: string; // 40
  ddaRef1: string; // 18
  reserveField1: string; // 2
  ddaRef2: string; // 18
  reserveField2: string; // 2
  otherInfo2: string; // 20
  refRunningNumber: string; // 6
  status: string; // 2
  email: string; // 40
  sms: string; // 20
  receivingSubBranchCode: string; // 4
  fillers: string; // 34
  carriageReturn?: string; // 2
}

export interface IKTB {
  fileType: string; // 2
  recordType: string; // 1
  batchNumber: string; // 6
  sendingBankCode: string; // 3
  totalTransactionInBatch: string; // 7
  totalAmount: string; // 19
  effectiveDate: string; // 8
  transactionCode: string; // 1
  receiverNo: string; // 8
  companyId: string; // 16
  userId: string; // 20
  fillers: string; // 407
  carriageReturn?: string; // 2
  records: IKTBRecord[];
}

export class ReportController {
  public static createRequestReport: RequestHandler = async (
    req,
    res,
    next
  ) => {
    try {
      let data: any = {};
      const request = await RequestRepository.findOne(req.params.id, {
        relations: ["requestItems", "budgetAllocationItems", "organization"],
      });

      if (!request) {
        return next(new NotFoundError({ message: "ไม่พบคำร้องที่ต้องพิมพ์" }));
      }
      request.setThaiFormatForReport();

      let name: string;

      switch (request.requestType) {
        case loanTypeSet.personal:
          name = requestReportTypeSet.personal;
          const { requestItems, ...rest } = request;
          ///// เซตค่าให้ที่อยู่ตามทะเบียนบ้าน ผู้กู้
          if (requestItems[0].borrower.registeredAddressType === 0) {
            requestItems[0].borrower.registeredAddress =
              requestItems[0].borrower.idCardAddress;
          }
          ///// เซตค่าให้ที่อยู่ปัจบัน ผู้กู้
          if (requestItems[0].borrower.currentAddressType === 0) {
            requestItems[0].borrower.currentAddress =
              requestItems[0].borrower.idCardAddress;
          } else if (requestItems[0].borrower.currentAddressType === 1) {
            requestItems[0].borrower.currentAddress =
              requestItems[0].borrower.registeredAddress;
          }
          ///// เซตค่าให้ที่อยู่ตามทะเบียนบ้าน ผู้ค้ำ
          if (requestItems[0].guarantor.registeredAddressType === 0) {
            requestItems[0].guarantor.registeredAddress =
              requestItems[0].guarantor.idCardAddress;
          }
          ///// เซตค่าให้ที่อยู่ปัจบัน ผู้ค้ำ
          if (requestItems[0].guarantor.currentAddressType === 0) {
            requestItems[0].guarantor.currentAddress =
              requestItems[0].guarantor.idCardAddress;
          } else if (requestItems[0].guarantor.currentAddressType === 1) {
            requestItems[0].guarantor.currentAddress =
              requestItems[0].guarantor.registeredAddress;
          }
          data = { ...rest, ...requestItems[0] };
          break;
        case loanTypeSet.group:
          name = requestReportTypeSet.group;
          break;
      }
      const resp = await jsreport.render({
        template: { name },
        data,
      });

      const filename = `request${new Date().toISOString()}.pdf`;

      res
        .header("Content-Disposition", `attachment; filename=${filename}`)
        .header("filename", filename)
        .send(resp.content);
    } catch (e) {
      next(e);
    }
  };

  public static createAgreementExampleReport: RequestHandler = async (
    req,
    res,
    next
  ) => {
    try {
      let data: any = {};
      const request = await RequestRepository.findOne(req.params.id, {
        relations: ["requestItems", "budgetAllocationItems", "organization"],
      });

      if (!request) {
        return next(new NotFoundError({ message: "ไม่พบคำร้องที่ต้องพิมพ์" }));
      }

      const agreement = ReportController.mapRequestToAgreement(request);
      agreement.setThaiFormatForReport();

      let name: string;

      switch (request.requestType) {
        case loanTypeSet.personal:
          name = agreementExampleReportTypeSet.personal;
          // const { requestItems, ...rest } = request;
          // data = { ...rest, ...requestItems[0] };
          const { agreementItems, ...rest } = agreement;
          data = { ...rest, ...agreementItems[0] };
          break;
        case loanTypeSet.group:
          name = agreementExampleReportTypeSet.group;
          break;
      }

      const resp = await jsreport.render({
        template: { name },
        data,
      });

      const filename = `agreement-example${new Date().toISOString()}.pdf`;

      res
        .header("Content-Disposition", `attachment; filename=${filename}`)
        .header("filename", filename)
        .send(resp.content);
    } catch (e) {
      next(e);
    }
  };

  public static createGuaranteeExampleReport: RequestHandler = async (
    req,
    res,
    next
  ) => {
    try {
      let data: any = {};
      const request = await RequestRepository.findOne(req.params.id, {
        relations: ["requestItems", "budgetAllocationItems", "organization"],
      });

      if (!request) {
        return next(new NotFoundError({ message: "ไม่พบคำร้องที่ต้องพิมพ์" }));
      }

      const guarantee = ReportController.mapRequestToGuarantee(request);
      guarantee.setThaiFormatForReport();

      let name: string;

      switch (request.requestType) {
        case loanTypeSet.personal:
          name = guaranteeExampleReportTypeSet.personal;
          const { guaranteeItems, ...rest } = guarantee;
          data = { ...rest, ...guaranteeItems[0] };
          break;
        case loanTypeSet.group:
          name = guaranteeExampleReportTypeSet.group;
          break;
      }

      const resp = await jsreport.render({
        template: { name },
        data,
      });

      const filename = `guarantee-example${new Date().toISOString()}.pdf`;

      res
        .header("Content-Disposition", `attachment; filename=${filename}`)
        .header("filename", filename)
        .send(resp.content);
    } catch (e) {
      next(e);
    }
  };

  public static createRequestCommitee: RequestHandler = async (
    req,
    res,
    next
  ) => {
    try {
      const data: any = {};
      const requestData = [];
      const requests = await RequestRepository.find({
        relations: [
          "requestItems",
          "budgetAllocationItems",
          "factSheet",
          "organization",
        ],
        where: { id: In(req.body.ids) },
      });

      if (requests.length === 0) {
        return next(new NotFoundError({ message: "ไม่พบคำร้องที่ต้องพิมพ์" }));
      }

      for (const rq of requests) {
        const { requestItems, ...rest } = rq;

        const raw = await getRepository(AgreementItem)
          .createQueryBuilder("ai")
          .select("COUNT(agreementId)", "count")
          // .where("ai.borrower.firstname like :firstname", {
          //   firstname: requestItems[0].borrower.firstname,
          // })
          // .andWhere("ai.borrower.lastname like :lastname", {
          //   lastname: requestItems[0].borrower.lastname,
          // })
          .where("ai.borrower.idCardNo like :idCardNo", {
            idCardNo: requestItems[0].borrower.idCardNo,
          })
          .getRawMany();

        if (rq.result1.result) {
          rq.result1.setThaiFormatForReport();
        }
        if (rq.result2.result) {
          rq.result2.setThaiFormatForReport();
        }
        if (rq.result3.result) {
          rq.result3.setThaiFormatForReport();
        }
        requestData.push({
          ...rest,
          ...requestItems[0],
          loanCount: +raw[0].count + 1,
          totalBudget: rq.getTotalBudget(),
          requestBudgetDescription: rq.getRequestBudgetDescription(),
          isApproveFromFactsheet: rq.getIsApproveFromFactsheet(),
        });
      }

      data.requests = requestData;
      data.committeeNumber = req.body.committeeNumber;
      data.committeeName = req.body.committeeName;
      data.meetingDate =
        req.body.meetingDate && getThaiPartialDate(req.body.meetingDate);
      const resp = await jsreport.render({
        template: { name: "request-committee" },
        data,
      });

      const filename = `request-committee${new Date().toISOString()}.xlsx`;

      res
        .header("Content-Disposition", `attachment; filename=${filename}`)
        .header("filename", filename)
        .send(resp.content);
    } catch (e) {
      next(e);
    }
  };

  public static createAgreementReport: RequestHandler = async (
    req,
    res,
    next
  ) => {
    try {
      let data: any = {};
      const agreement = await AgreementRepository.findOne(req.params.id, {
        relations: ["agreementItems", "organization"],
      });

      if (!agreement) {
        return next(
          new NotFoundError({
            message: "ไม่พบสัญญาเงินกู้ที่ต้องการพิมพ์",
          })
        );
      }

      const idCardNo = agreement.agreementItems[0].borrower.idCardNo;
      agreement.setThaiFormatForReport();

      let name: string;

      switch (agreement.agreementType) {
        case loanTypeSet.personal:
          name = agreementReportTypeSet.personal;
          const { agreementItems, ...rest } = agreement;
          data = { ...rest, ...agreementItems[0] };
          break;
        case loanTypeSet.group:
          name = agreementReportTypeSet.group;
          break;
      }
      // const cr = os.EOL;
      const cr = "\r";
      const text = `|${process.env.TAX_ID}${
        process.env.SERVICE_NO
      }${cr}${idCardNo}${cr}${agreement.id.toString().padStart(8, "0")}${cr}${
        +agreement.installmentAmount * 100
      }`;
      const barcode = await generateBarcode(text);

      data.barcode = barcode;
      const resp = await jsreport.render({
        template: { name },
        data,
      });

      const filename = `agreement${new Date().toISOString()}.pdf`;

      res
        .header("Content-Disposition", `attachment; filename=${filename}`)
        .header("filename", filename)
        .send(resp.content);
    } catch (e) {
      console.log(e);
      next(e);
    }
  };

  public static createGuaranteeReport: RequestHandler = async (
    req,
    res,
    next
  ) => {
    try {
      let data: any = {};
      const guarantee = await GuaranteeRepository.findOne(req.params.id, {
        relations: ["guaranteeItems"],
      });

      if (!guarantee) {
        return next(
          new NotFoundError({
            message: "ไม่พบสัญญาค้ำประกันที่ต้องการพิมพ์",
          })
        );
      }

      guarantee.setThaiFormatForReport();

      let name: string;

      switch (guarantee.guaranteeType) {
        case loanTypeSet.personal:
          name = guaranteeReportTypeSet.personal;
          const { guaranteeItems, ...rest } = guarantee;
          data = { ...rest, ...guaranteeItems[0] };
          break;
        case loanTypeSet.group:
          name = guaranteeReportTypeSet.group;
          break;
      }

      const resp = await jsreport.render({
        template: { name },
        data,
      });

      const filename = `guarantee${new Date().toISOString()}.pdf`;

      res
        .header("Content-Disposition", `attachment; filename=${filename}`)
        .header("filename", filename)
        .send(resp.content);
    } catch (e) {
      next(e);
    }
  };

  public static createKTBFile: RequestHandler = async (req, res, next) => {
    try {
      if (req.body.ids.length <= 0) {
        return next(
          new NotFoundError({
            name: "ไม่พบใบสำคัญจ่าย",
            message: "ไม่พบใบสำคัญจ่าย กรุณาเลือกใบสำคัญจ่ายที่ต้องการทำรายการ",
          })
        );
      }

      const [vouchers, total] = await VoucherRepository.findAndCount({
        relations: ["voucherItems"],
        where: { id: In(req.body.ids) },
      });

      if (!total) {
        return next(
          new NotFoundError({
            name: "ไม่พบใบสำคัญจ่าย",
            message: "ไม่พบใบสำคัญจ่าย",
          })
        );
      }

      const data = ReportController.prepareKTBData(
        vouchers,
        total,
        req.body.effectiveDate
      );

      const filename = await ReportController.createFile(data);

      // const resp = await jsreport.render({
      //   template: { name: "ktb" },
      //   data
      // });

      // res
      //   .header("Content-Disposition", "attachment; filename=ktb.txt")
      //   .header("filename", "ktb.txt")
      //   .send(resp.content);
      res
        .header("Content-Disposition", "attachment; filename=ktb.txt")
        .header("filename", "ktb.txt")
        .sendFile(path.join(process.cwd(), `/tmp/ktb/${filename}`));
    } catch (e) {
      next(e);
    }
  };

  private static prepareKTBData = (
    vouchers?: Voucher[],
    total?: number,
    effectiveDate?: Date | string
  ) => {
    const date = moment("2019-01-01").format("DDMMYYYY");
    let totalAmountBatch = 0.0;

    const records = vouchers.map(
      (voucher, i): IKTBRecord => {
        totalAmountBatch += +voucher.totalAmount;
        return {
          fileType: "10",
          recordType: "2",
          batchNo: "000001",
          receivingBank: `${voucher.recieveBankAccountRefNo.slice(0, 3)}`, // เลข 18 หลัก
          receivingBranchCode: `${voucher.recieveBankAccountRefNo.slice(3, 7)}`, // เลข 18 หลัก
          receivingAccount: `${voucher.recieveBankAccountRefNo.slice(7)}`, // เลข 18 หลัก
          sendingBankCode: "006",
          sendingBranchCode: "0021".padStart(4), // 0021
          sendingAccount: "00216053706",
          effectiveDate: date,
          serviceType: "14",
          clearingHouseCode: "00",
          amount: `${+voucher.totalAmount * 100}`.padStart(17, "0"), // totalAmount
          receiverInfo: "".padEnd(8),
          receiverId: "".padStart(10, "0"),
          receiverName: `${voucher.toAccountName}`.padEnd(100), // title firstname lastname toAccountName
          senderName: "กองทุนผู้สูงอายุ/706".padEnd(100),
          otherInfo1: "".padEnd(40),
          ddaRef1: "".padStart(18),
          reserveField1: "".padStart(2),
          ddaRef2: "".padStart(18),
          reserveField2: "".padStart(2),
          otherInfo2: "".padEnd(20),
          refRunningNumber: `${i + 1}`.padStart(6, "0"),
          status: "09",
          email: "".padEnd(40),
          sms: voucher.toSms.padStart(20), // mobilephone toSms
          receivingSubBranchCode: "0000",
          fillers: "".padEnd(34),
          carriageReturn: "\n",
        };
      }
    );

    const ktbData: IKTB = {
      fileType: "10",
      recordType: "1",
      batchNumber: "000001",
      sendingBankCode: "006",
      totalTransactionInBatch: `${vouchers.length}`.padStart(7, "0"),
      totalAmount: `${totalAmountBatch * 100}`.padStart(19, "0"),
      effectiveDate: date,
      transactionCode: "C",
      receiverNo: "0".padEnd(8, "0"),
      companyId: "001".padEnd(16),
      userId: "".padEnd(20),
      fillers: "".padEnd(407),
      carriageReturn: "\n",
      records,
    };
    return ktbData;
  };

  private static createFile = (data: IKTB) => {
    return new Promise((resolve, reject) => {
      const { records, ...rest } = data;
      const header = `${rest.fileType}${rest.recordType}${rest.batchNumber}${rest.sendingBankCode}${rest.totalTransactionInBatch}${rest.totalAmount}${rest.effectiveDate}${rest.transactionCode}${rest.receiverNo}${rest.companyId}${rest.userId}${rest.fillers}${rest.carriageReturn}`;

      const filename = `ktb${Date.now()}.txt`;

      const file = fs.createWriteStream(
        path.join(process.cwd(), `/tmp/ktb/${filename}`)
      );
      file.on("error", (err) => {
        file.close();
        return reject(err);
      });
      file.on("close", (err) => {
        return resolve(filename);
      });
      file.write(header);
      records.forEach((r) => {
        const record = `${r.fileType}${r.recordType}${r.batchNo}${r.receivingBank}${r.receivingBranchCode}${r.receivingAccount}${r.sendingBankCode}${r.sendingBranchCode}${r.sendingAccount}${r.effectiveDate}${r.serviceType}${r.clearingHouseCode}${r.amount}${r.receiverInfo}${r.receiverId}${r.receiverName}${r.senderName}${r.otherInfo1}${r.ddaRef1}${r.reserveField1}${r.ddaRef2}${r.reserveField2}${r.otherInfo2}${r.refRunningNumber}${r.status}${r.email}${r.sms}${r.receivingSubBranchCode}${r.fillers}${r.carriageReturn}`;
        file.write(record);
      });
      file.end();
    });
  };

  private static mapRequestToAgreement = (request: Request): Agreement => {
    const agreementItemList: any[] = [];
    for (const requestItem of request.requestItems) {
      agreementItemList.push({
        agreement: undefined,
        id: 0,
        createdDate: "",
        updatedDate: "",
        createdByName: "",
        updatedByName: "",
        createdBy: 0,
        updatedBy: 0,
        agreementId: 0,
        borrowerTelephone: requestItem.borrower.telephone,
        borrowerRegisteredAddressType:
          requestItem.borrower.registeredAddressType,
        borrowerIdCardAddress: requestItem.borrower.idCardAddress,
        borrower: requestItem.borrower,
        borrowerRegisteredAddress:
          requestItem.borrower.registeredAddressType === 0
            ? requestItem.borrower.idCardAddress
            : requestItem.borrower.registeredAddress,
        guarantor: requestItem.guarantor,
      });
    }

    return AgreementRepository.create({
      // documentDate: request.documentDate,
      signLocation: request.organization.orgName,
      signLocationAddress: request.organization.address,
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
      loanAmount: request.result3.approveBudget,
      loanDurationYear: `${request.getDurationYear()}`,
      loanDurationMonth: `${request.getDurationMonth()}`,
      installmentTimes: request.installmentTimes,
      loanPaymentLocation: request.organization.orgName,
      installmentFirstDate: request.installmentFirstDate,
      installmentLastDate: request.installmentLastDate,
      installmentAmount: request.installmentAmount,
      witness1: request.organization.witness1,
      witness2: request.organization.witness2,
      agreementItems: agreementItemList,
    });
  };

  private static mapRequestToGuarantee = (request: Request): Guarantee => {
    const guaranteeItemList: any[] = [];
    for (const requestItem of request.requestItems) {
      guaranteeItemList.push({
        guarantee: undefined,
        id: 0,
        createdDate: "",
        updatedDate: "",
        createdByName: "",
        updatedByName: "",
        createdBy: 0,
        updatedBy: 0,
        guaranteeId: 0,
        guarantor: requestItem.guarantor,
        guarantorRegisteredAddressType:
          requestItem.guarantor.registeredAddressType,
        guarantorIdCardAddress: requestItem.guarantor.idCardAddress,
        guarantorTelephone: requestItem.guarantor.telephone,
        guarantorOccupation: requestItem.guarantor.occupation,
        guarantorCompanyName: requestItem.guarantorCompanyName,
        guarantorPosition: requestItem.guarantorPosition,
        guarantorSalary: requestItem.guarantor.occupation.salary,
        borrower: requestItem.borrower,
        guarantorRegisteredAddress:
          requestItem.guarantor.registeredAddressType === 0
            ? requestItem.guarantor.idCardAddress
            : requestItem.guarantor.registeredAddress,
      });
    }

    return GuaranteeRepository.create({
      // documentDate: request.documentDate,
      signLocation: request.organization.orgName,
      signLocationAddress: request.organization.address,
      agreementAuthorizedTitle: request.organization.agreementAuthorizedTitle,
      agreementAuthorizedFirstname:
        request.organization.agreementAuthorizedFirstname,
      agreementAuthorizedLastname:
        request.organization.agreementAuthorizedLastname,
      // agreementAuthorizedPosition:
      //   request.organization.agreementAuthorizedPosition,
      // agreementAuthorizedCommandNo:
      //   request.organization.agreementAuthorizedCommandNo,
      // agreementAuthorizedCommandDate:
      //   request.organization.agreementAuthorizedCommandDate,
      loanAmount: request.result3.approveBudget,
      witness1: request.organization.witness1,
      witness2: request.organization.witness2,
      guaranteeItems: guaranteeItemList,
      // agreementDocumentDate: request.documentDate
    });
  };
}
