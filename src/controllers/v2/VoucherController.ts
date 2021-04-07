import * as eol from "eol";
import * as fs from "fs";
import moment = require("moment");
import * as os from "os";
import * as path from "path";
import { DeepPartial, getRepository, In } from "typeorm";
import { AccountReceivable } from "../../entities/AccountReceivable";
import { Agreement } from "../../entities/Agreement";
import { Guarantee } from "../../entities/Guarantee";
import { Organization } from "../../entities/Organization";
import { Voucher } from "../../entities/Voucher";
import { VoucherItem } from "../../entities/VoucherItem";
import {
  accountReceiviableStatusSet,
  agreementStatusSet,
  bankSet,
  guaranteeStatusSet,
  paymentMethodSet,
  voucherStatusSet,
  voucherTypeSet,
} from "../../enumset";
import { jsreport } from "../../jsreport";
import {
  NotFoundError,
  ValidateError,
} from "../../middlewares/error/error-type";
import AgreementRepository from "../../repositories/v2/AgreementRepository";
import VoucherRepository from "../../repositories/v2/VoucherRepository";
import { getFiscalYear } from "../../utils/datetime-helper";
import { deleteFile, readFileStream } from "../../utils/fs-helper";
import { BaseController } from "./BaseController";
import * as iconv from "iconv-lite";

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

const bankCode = {
  [`${bankSet.KTB}`]: "006",
};

class VoucherController extends BaseController {
  constructor(entityClass: string, entityInfo) {
    super(entityClass, entityInfo);
  }

  createMany = async (req, res, next) => {
    const { ids, documentDate } = req.body;
    try {
      const agreements = await getRepository(Agreement).find({
        relations: [
          "agreementItems",
          "organization",
          "request",
          "request.requestItems",
          "guarantee",
        ],
        where: { id: In(ids), status: agreementStatusSet.new },
      });

      const successAgreements: Agreement[] = [];
      const failedAgreements: Agreement[] = [];

      for (const agreement of agreements) {
        if (!agreement.guaranteeId) {
          agreement.error = {
            message:
              "ไม่สามารถสร้างใบสำคัญจ่ายได้เนื่องจากไม่พบสัญญาค้ำประกันที่เกี่ยวข้อง",
          };
          failedAgreements.push(agreement);
          continue;
        }

        if (!agreement.request.validateReceiveBankData()) {
          agreement.error = {
            message:
              "ไม่สามารถสร้างใบสำคัญจ่ายได้เนื่องจากไม่พบข้อมูลชื่อธนาคาร กรุณาตรวจสอบข้อมูลชื่อธนาคารในใบคำร้องให้ถูกต้องก่อนทำรายการนี้",
          };
          failedAgreements.push(agreement);
          continue;
        }

        const voucherData = this.prepareVoucherData(agreement, documentDate);
        const organization = await getRepository(Organization).findOne(
          { id: voucherData.organization.id },
          {
            relations: ["voucherSequence"],
          }
        );

        if (!organization.voucherSequence) {
          // failedAgreements.push(agreement);
          // continue;
          return next(
            new ValidateError({
              name: "ไม่สามารถสร้างเอกสารใบสำคัญจ่ายได้",
              message:
                "หน่วยงานที่ทำการสร้างใบสำคัญจ่ายยังไม่ได้ตั้งค่าเลขที่เอกสารใบสำคัญจ่าย กรุณาติดต่อผู้ดูแลระบบ",
            })
          );
        }

        const fiscalYear = getFiscalYear(voucherData.documentDate as Date);

        // if (fiscalYear !== +organization.voucherSequence.prefixYear) {
        //   // failedAgreements.push(agreement);
        //   // continue;
        //   return next(
        //     new ValidateError({
        //       name: "ไม่สามารถสร้างเอกสารใบสำคัญจ่ายได้",
        //       message:
        //         "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ตรงกับปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ",
        //     })
        //   );
        // }

        voucherData.fiscalYear = `${fiscalYear}`;

        if (!agreement.requestId) {
          delete agreement.request;
        }

        const voucherEntity = getRepository(Voucher).create(voucherData);

        // actionLog
        voucherEntity.logCreatedBy(req.body);
        agreement.logUpdatedBy(req.body);

        try {
          const updatedAgreement = await VoucherRepository.createVoucher(
            // getRepository(Voucher).create(voucherData),
            voucherEntity,
            organization.voucherSequence,
            agreement
          );

          successAgreements.push(updatedAgreement);
        } catch (e) {
          agreement.error = {
            message: e.message,
          };
          failedAgreements.push(agreement);
        }
      }

      res.send({
        data: { successAgreements, failedAgreements },
        success: true,
      });
    } catch (e) {
      e.message = `ไม่สามารถสร้างเอกสารใบสำคัญจ่าย ${e.message}`;
      next(e);
    }
  };

  private prepareVoucherData = (agreement: Agreement, date: Date | string) => {
    const voucherItems: DeepPartial<VoucherItem>[] = [];
    voucherItems.push({
      description: `เงินกู้ยืมทุนประกอบอาชีพ กองทุนผู้สูงอายุ สัญญากู้เลขที่ ${agreement.documentNumber}`,
      subtotal: agreement.loanAmount,
    });
    const sendingBankCode =
      agreement.organization.bankName === bankSet.KTB
        ? bankCode[bankSet.KTB]
        : agreement.organization.bankName;
    const voucherData: DeepPartial<Voucher> = {
      // organizationId: number;
      organization: agreement.organization,
      // refReportCode: string;
      fiscalYear: agreement.fiscalYear,
      documentDate: moment(new Date()).format("YYYY-MM-DD"),
      // documentNumber: string;
      voucherType: voucherTypeSet.payment,
      status: voucherStatusSet.waiting,
      refType: "AGREEMENT",
      refId: agreement.id,
      // exteranalRef: ""
      partnerName: agreement.name,
      partnerAddress: agreement.agreementItems[0].borrowerIdCardAddress.getAddress(),
      partnerTaxNumber: agreement.agreementItems[0].borrower.idCardNo,
      totalAmount: agreement.loanAmount,
      paymentMethod: paymentMethodSet.transfer,
      // fromAccountRef1: "KTB",
      // fromAccountRef2: "00216053706",
      // fromAccountRef1: agreement.organization.bankName,
      fromAccountRef1: sendingBankCode,
      fromAccountRef2: agreement.organization.bankAccountNo.trim(),
      // fromAccountRef3: date.toString(),
      fromAccountRef3: agreement.organization.bankBranchCode.trim() || "0000",
      fromAccountRef4:
        agreement.organization.bankAccountName.trim() || "กองทุนผู้สูงอายุ/706",
      toBankName: agreement.request
        ? agreement.request.receiveBankName
        : bankSet.KTB,
      toAccountNo: agreement.request
        ? agreement.request.recieveBankAccountNo.trim()
        : "",
      toAccountName: agreement.request
        ? agreement.request.recieveBankAccountName
        : "",
      recieveBankAccountRefNo: agreement.request
        ? agreement.request.getRecieveBankAccountRefNo()
        : "",
      toSms:
        agreement.request && agreement.request.requestItems
          ? agreement.request.requestItems[0].borrower.mobilePhone
          : "",
      // toEmail: undefined,
      // toAccountBranch: "",
      // toAccountType: "",
      voucherItems,
      // paidAmount: number;
      // paidDate: Date | string;
      // paidRef1: string;
      // paidRef2: string;
      // reciever: "",
      // payBy: 1, // required
      // payByName: string;
      // payByPosition: string;
      // approvedBy: 1, // required
      // approvedByName: string;
      // approvedByPosition: string;
      dueDate: date,
    };
    return voucherData;
  };

  createKTBFile = async (req, res, next) => {
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
        where: { id: In(req.body.ids), status: voucherStatusSet.waiting },
      });

      if (!total) {
        return next(
          new NotFoundError({
            name: "ไม่พบใบสำคัญจ่าย",
            message:
              "ไม่พบใบสำคัญจ่ายสถานะรอการดำเนินการในรายการที่เลือก สำหรับสร้างไฟล์ทำรายการจ่ายKTB",
          })
        );
      }

      // const data = this.prepareKTBData(vouchers, total, req.body.effectiveDate);
      const data = this.prepareKTBData(vouchers, total);

      const filename = await this.createFile(data);

      res
        .header("Content-Disposition", `attachment; filename=${filename}`)
        .header("filename", `${filename}`)
        .sendFile(path.join(process.cwd(), `/tmp/ktb/${filename}`));
    } catch (e) {
      e.message = `ไม่สามารถสร้างไฟล์ทำรายการจ่ายKTB ${e.message}`;
      next(e);
    }
  };

  private prepareKTBData = (vouchers?: Voucher[], total?: number) => {
    // const date = moment("2019-01-01").format("DDMMYYYY");
    // const date = moment(effectiveDate).format("DDMMYYYY");
    const date = moment(new Date()).format("DDMMYYYY");
    let totalAmountBatch = 0.0;

    const records = vouchers.map(
      (voucher, i): IKTBRecord => {
        // const date = moment(voucher.dueDate).format("DDMMYYYY");
        const [
          receivingBank,
          receivingBranchCode,
          receivingAccount,
        ] = voucher.generate18Digit();
        totalAmountBatch += +voucher.totalAmount;
        // const sendingBankCode =
        //   voucher.fromAccountRef1 === bankSet.KTB
        //     ? bankCode[voucher.fromAccountRef1]
        //     : voucher.fromAccountRef1;
        return {
          fileType: "10",
          recordType: "2",
          batchNo: "000001",
          receivingBank,
          receivingBranchCode,
          receivingAccount,
          // sendingBankCode: "006",
          // sendingBankCode: bankCode[voucher.fromAccountRef1],
          sendingBankCode: voucher.fromAccountRef1
            .trim()
            .slice(0, 3)
            .padStart(3, "0"),
          // sendingBranchCode: "0021".padStart(4), // 0021
          sendingBranchCode: voucher.fromAccountRef3
            .trim()
            .slice(0, 4)
            .padStart(4), // 0021
          // sendingAccount: "00216053706",
          sendingAccount: voucher.fromAccountRef2
            .trim()
            .slice(0, 11)
            .padStart(11, "0"),
          effectiveDate: date,
          serviceType: "14",
          clearingHouseCode: "00",
          amount: `${+voucher.totalAmount * 100}`.padStart(17, "0"), // totalAmount
          receiverInfo: "".padEnd(8),
          receiverId: "".padStart(10, "0"),
          receiverName: `${voucher.toAccountName.trim().slice(0, 100)}`.padEnd(
            100
          ), // title firstname lastname toAccountName
          // senderName: "กองทุนผู้สูงอายุ/706".padEnd(100),
          senderName: `${voucher.fromAccountRef4.trim().slice(0, 100)}`.padEnd(
            100
          ),
          otherInfo1: "".padEnd(40),
          ddaRef1: "".padStart(18),
          reserveField1: "".padStart(2),
          ddaRef2: "".padStart(18),
          reserveField2: "".padStart(2),
          otherInfo2: "".padEnd(20),
          refRunningNumber: `${i + 1}`.padStart(6, "0"),
          status: "09",
          email: `${
            voucher.toEmail ? voucher.toEmail.trim().slice(0, 40) : ""
          }`.padEnd(40),
          sms: voucher.toSms.trim().slice(0, 20).padStart(20), // mobilephone toSms
          receivingSubBranchCode: "0000",
          fillers: "".padEnd(34),
          carriageReturn: os.EOL,
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
      carriageReturn: os.EOL,
      records,
    };
    return ktbData;
  };

  private createFile = (data: IKTB) => {
    return new Promise((resolve, reject) => {
      const { records, ...rest } = data;
      const header = `${rest.fileType}${rest.recordType}${rest.batchNumber}${rest.sendingBankCode}${rest.totalTransactionInBatch}${rest.totalAmount}${rest.effectiveDate}${rest.transactionCode}${rest.receiverNo}${rest.companyId}${rest.userId}${rest.fillers}${rest.carriageReturn}`;

      const filename = `ktb${new Date().toISOString()}.txt`;

      const uploadPath = path.join(process.cwd(), "/tmp/ktb");

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

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
      // file.write(header);
      file.write(iconv.encode(eol.crlf(header), "TIS-620"));

      records.forEach((r) => {
        const record = `${r.fileType}${r.recordType}${r.batchNo}${r.receivingBank}${r.receivingBranchCode}${r.receivingAccount}${r.sendingBankCode}${r.sendingBranchCode}${r.sendingAccount}${r.effectiveDate}${r.serviceType}${r.clearingHouseCode}${r.amount}${r.receiverInfo}${r.receiverId}${r.receiverName}${r.senderName}${r.otherInfo1}${r.ddaRef1}${r.reserveField1}${r.ddaRef2}${r.reserveField2}${r.otherInfo2}${r.refRunningNumber}${r.status}${r.email}${r.sms}${r.receivingSubBranchCode}${r.fillers}${r.carriageReturn}`;
        // file.write(record);
        file.write(iconv.encode(eol.crlf(record), "TIS-620"));
      });
      file.end();
    });
  };

  updateVoucherByKTBFile = async (req, res, next) => {
    try {
      if (!req.files.ktb) {
        return next(
          new ValidateError({
            name: "ไม่พบไฟล์ที่ต้องการ",
            message: "ไฟล์ที่อัปโหลดต้องนามสกุล txt เท่านั้น",
          })
        );
      }
      const buffer = await readFileStream(req.files.ktb[0].path);

      // const list = eol.split(buffer.toString());
      const list = eol.split(iconv.decode(buffer, "TIS-620"));

      const [header, ...records] = list;

      const voucherData = this.prepareUpdatedVoucherDataByKTB(records);

      if (!voucherData || voucherData.length === 0) {
        return next(
          new NotFoundError({
            name: "ไม่สามารถอัปเดตใบสำคัญจ่าย",
            message:
              "ไม่สามารถอัปเดตใบสำคัญจ่าย ไม่สามารถทำรายการได้เนื่องจากไม่พบรายการที่มีการเปลี่ยนแปลง",
          })
        );
      }

      const successVouchers: Voucher[] = [];
      const failedVouchers: Voucher[] = [];

      const fiscalYear = getFiscalYear(new Date());

      for (const v of voucherData) {
        const voucher = await VoucherRepository.findOne(
          {
            status: voucherStatusSet.waiting,
            recieveBankAccountRefNo: v.recieveBankAccountRefNo,
            refType: "AGREEMENT",
            // toAccountName: v.toAccountName,
            // toSms: v.toSms
          },
          { relations: ["organization"] }
        );

        if (!voucher) {
          continue;
        }
        try {
          VoucherRepository.merge(voucher, { ...v });

          const agreement = await AgreementRepository.findOne({
            where: {
              id: voucher.refId,
              status: agreementStatusSet.duringPayment,
            },
            relations: ["agreementItems"],
          });
          if (!agreement) {
            voucher.error = {
              message:
                "ไม่สามารถทำรายการได้เนื่องจากไม่พบสัญญาเงินกู้ที่เกี่ยวข้องกับใบสำคัญจ่าย",
            };
            failedVouchers.push(voucher);
            continue;
          }
          const guarantee = await getRepository(Guarantee).findOne({
            where: {
              id: agreement.guaranteeId,
            },
            relations: ["guaranteeItems"],
          });
          if (!guarantee) {
            voucher.error = {
              message:
                "ไม่สามารถทำรายการได้เนื่องจากไม่พบสัญญาค้ำประกันเงินกู้ที่เกี่ยวข้องกับใบสำคัญจ่าย",
            };
            failedVouchers.push(voucher);
            continue;
          }

          agreement.status = agreementStatusSet.done;
          // agreement.guarantee.status = guaranteeStatusSet.normal;
          agreement.startDate = voucher.paidDate as any;
          agreement.loanPaymentDate = voucher.paidDate as any;
          guarantee.status = guaranteeStatusSet.normal;
          guarantee.startDate = voucher.paidDate as any;

          const arData = this.prepareARData(voucher, agreement, guarantee);

          arData.fiscalYear = `${fiscalYear}`;

          const arEntity = getRepository(AccountReceivable).create(arData);

          // actionLog
          voucher.logUpdatedBy(req.body);
          agreement.logUpdatedBy(req.body);
          guarantee.logUpdatedBy(req.body);
          arEntity.logCreatedBy(req.body);

          await VoucherRepository.updateVoucherAndCreateAR(
            voucher,
            agreement,
            guarantee,
            // getRepository(AccountReceivable).create(arData)
            arEntity
          );

          successVouchers.push(voucher);
        } catch (e) {
          voucher.error = {
            message: e.message,
          };
          failedVouchers.push(voucher);
        }
      }

      await deleteFile(req.files.ktb[0].path);

      res.send({ data: { successVouchers, failedVouchers }, success: true });
    } catch (e) {
      e.message = `ไม่สามารถทำรายการได้ ${e.message}`;
      next(e);
    }
  };

  private prepareUpdatedVoucherDataByKTB = (records) => {
    const vouchers: DeepPartial<Voucher>[] = [];
    records.forEach((r) => {
      // console.log(r);
      // console.log(r.slice(398, 400));
      // console.log(`${r.slice(92, 192).trim()}`);
      // console.log(`${r.slice(9, 12)}${r.slice(12, 16)}${r.slice(16, 27)}`);
      // console.log(+r.slice(57, 74) / 100);
      // console.log(`${r.slice(49, 53)}-${r.slice(47, 49)}-${r.slice(45, 47)}`);
      const success = r.slice(398, 400) === "00" ? true : false;
      if (success) {
        vouchers.push({
          // organizationId: number;
          // organization: agreement.organization,

          // refReportCode: string;

          // fiscalYear: agreement.fiscalYear,
          // documentDate: date,
          // documentNumber: string;
          // voucherType: voucherTypeSet.payment,
          status: voucherStatusSet.paid,
          // refType: "AGREEMENT",
          // refId: agreement.id,
          // refDocument: Agreement;
          // exteranalRef: ""
          // partnerName: "", // ชื่อผู้รับเงิน
          // partnerAddress: "",
          // partnerTaxNumber: "",
          // totalAmount: agreement.loanAmount,
          // paymentMethod: paymentMethodSet.transfer,
          // fromAccountRef1: "";
          // fromAccountRef2: "";
          // fromAccountRef3: "";
          // toBankName: bankSet.KTB,
          // toAccountNo: `${r.slice(92, 192).trim()}`,
          toAccountName: `${r.slice(92, 192).trim()}`,
          recieveBankAccountRefNo: `${r.slice(9, 12)}${r.slice(
            12,
            16
          )}${r.slice(16, 27)}`,
          toSms: r.slice(440, 460).trim(),
          // voucherItems,
          paidAmount: +r.slice(57, 74) / 100,
          paidDate: `${r.slice(49, 53)}-${r.slice(47, 49)}-${r.slice(45, 47)}`,
          // paidRef1: string;
          // paidRef2: string;
          // reciever: "",
          // payBy: 1, // required
          // payByName: string;
          // payByPosition: string;
          // approvedBy: 1 // required
          // approvedByName: string;
          // approvedByPosition: string;
        });
      }
    });
    return vouchers;
  };

  private prepareARData = (
    voucher: Voucher,
    agreement: Agreement,
    guarantee: Guarantee
  ) => {
    const arData: DeepPartial<AccountReceivable> = {
      organizationId: voucher.organizationId,
      organization: voucher.organization,

      refReportCode: "",
      fiscalYear: voucher.fiscalYear,
      agreement,
      guarantee,
      documentDate: voucher.paidDate,
      documentNumber: agreement.documentNumber,
      // internalRef: string;
      status: accountReceiviableStatusSet.normal,
      // startDate: Date;
      // endDate: Date;
      // closeDate: Date;
      name: agreement.name,
      loanAmount: agreement.loanAmount,
      loanDurationYear: agreement.loanDurationYear,
      loanDurationMonth: agreement.loanDurationMonth,
      installmentAmount: agreement.installmentAmount,
      installmentLastAmount: agreement.installmentLastAmount,
      installmentPeriodValue: agreement.installmentPeriodValue,
      installmentPeriodUnit: agreement.installmentPeriodUnit,
      installmentPeriodDay: agreement.installmentPeriodDay,
      installmentTimes: agreement.installmentTimes,
      // installmentFirstDate: agreement.installmentFirstDate,
      // installmentLastDate: agreement.installmentLastDate,
      // paidTimeCounts: number;
      // paidMonthCounts: number;
      // paidInstallmentCount: number;
      // lastPaymentDate: Date;
      outstandingDebtBalance: agreement.loanAmount,
      // overDueBalance: number;
      // paidRatio: number;
      // transactions: AccountReceivableTransaction[];
      borrowerContactAddress: agreement.agreementItems[0].borrowerIdCardAddress,
      borrowerContactTelephone: agreement.agreementItems[0].borrowerTelephone,
      guarantorContactAddress:
        guarantee.guaranteeItems[0].guarantorIdCardAddress,
      guarantorContactTelephone: guarantee.guaranteeItems[0].guarantorTelephone,
      debtAcknowledgement: {},
    };
    return arData;
  };

  public generateVoucherReceipt = async (req, res, next) => {
    try {
      const receipt = await VoucherRepository.findOne(req.params.id, {
        relations: ["voucherItems", "organization"],
      });

      if (!receipt) {
        return next(
          new NotFoundError({
            name: "ไม่พบใบสำคัญรับเงิน",
            // message: "ไม่พบใบสำคัญรับเงิน กรุณาเลือกสัญญาที่ต้องการทำรายการ"
          })
        );
      }
      receipt.setThaiFormatForReport();
      const resp = await jsreport.render({
        template: { name: "personal-money-receipt" },
        data: receipt,
      });

      const filename = `voucher-receipt${new Date().toISOString()}.pdf`;

      res
        .header("Content-Disposition", `attachment; filename=${filename}`)
        .header("filename", filename)
        .send(resp.content);
    } catch (e) {
      next(e);
    }
  };

  setVoucherParams = (req, res, next) => {
    req.query.refType = "AGREEMENT";
    next();
  };
}

export const controller = new VoucherController("Voucher", "ใบสำคัญ");
