import { getRepository } from "typeorm";
import { DonationAllowance } from "../../entities/DonationAllowance";
import { PosShiftLogs } from "../../entities/PosShiftLog";
import { Receipt } from "../../entities/Receipt";
import { officePaymentMethodSet, POSShiftLogActionSet } from "../../enumset";
import { jsreport } from "../../jsreport";
import { ValidateError } from "../../middlewares/error/error-type";
import PosRepository from "../../repositories/v2/PosRepository";
import PosShiftRepository from "../../repositories/v2/PosShiftRepository";
import ReceiptRepository from "../../repositories/v2/ReceiptRepository";
import {
  getFiscalYear,
  getMonthYearText,
  getThaiPartialDate,
} from "../../utils/datetime-helper";
import { BaseController } from "./BaseController";
import { deleteFile, readAndParseXlsx } from "../../utils/fs-helper";
import moment = require("moment");
// tslint:disable-next-line: no-var-requires
require("node-datetime-thai");

class DonationAllowanceController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  createManyFromFile = async (req, res, next) => {
    const promises = [];
    try {
      const [row1, row2, ...records] = readAndParseXlsx(
        req.files.donation_allowance[0].path,
        0
      );
      if (!req.body.organizationId) {
        throw new ValidateError({
          message: `ไม่สามารถสร้างรายการรับบริจาคได้เนื่องจากไม่พบข้อมูลหน่วยงานที่รับบริจาค`,
        });
      }
      if (!req.body.posId) {
        throw new ValidateError({
          message: `ไม่สามารถสร้างรายการรับบริจาคได้เนื่องจากไม่พบข้อหมูลจุดรับชำระ`,
        });
      }
      const donationRepo = getRepository(DonationAllowance);
      records.forEach((rec) => {
        if(rec[2] || rec[3]){
          const donation = donationRepo.create({
            organizationId: req.body.organizationId,
            receiptOrganization: rec[0],
            posId: req.body.posId,
            paidAmount: rec[13] || 0.0,
            donationDate: rec[15]
            ? moment(rec[15], "DD/MM/YYYY", true)
            .subtract(543, "year")
            .format("YYYY-MM-DD").toString() != 'Invalid date' ? 
            moment(rec[15], "DD/MM/YYYY", true)
            .subtract(543, "year")
            .format("YYYY-MM-DD")
            :
            null
            :
            null,
            receiptDate: rec[14]
            ? moment(rec[14], "DD/MM/YYYY", true)
              .subtract(543, "year")
              .format("YYYY-MM-DD").toString() != 'Invalid date' ? 
              moment(rec[14], "DD/MM/YYYY", true)
              .subtract(543, "year")
              .format("YYYY-MM-DD")
              :
              null
              :
              null,
            donator: {
              idCardNo: rec[4],
              title: rec[1],
              firstname: rec[2],
              lastname: rec[3],
              birthDate:rec[17] ? 
              moment(rec[17], "DD/MM/YYYY", true)
              .subtract(543, "year")
              .format("YYYY-MM-DD").toString() != 'Invalid date' ? 
              moment(rec[17], "DD/MM/YYYY", true)
              .subtract(543, "year")
              .format("YYYY-MM-DD")
              :
              null
              :rec[16] 
              ? moment(rec[16], "DD/MM/YYYY", true)
              .subtract(543, "year")
              .format("YYYY-MM-DD").toString() != 'Invalid date' ? 
              moment(rec[16], "DD/MM/YYYY", true)
              .subtract(543, "year")
              .format("YYYY-MM-DD")
              :
              null
              :
              null,
              isOnlyBirthYear:rec[17]? true:false  ,
              idCardLifetime: false,
              idCardAddress: {
                houseNo: rec[5],
                buildingName: "",
                roomNo: "",
                floor: "",
                hmoo: rec[8],
                soi: rec[6],
                street: rec[7],
                subDistrict: rec[9],
                district: rec[10],
                province: rec[11],
                zipcode: rec[12],
              },
              documentDeliveryAddress: {
                houseNo: rec[19],
                buildingName: "",
                roomNo: "",
                floor: "",
                hmoo: rec[22],
                soi: rec[20],
                street: rec[21],
                subDistrict: rec[23],
                district: rec[24],
                province: rec[25],
                zipcode: rec[26],
              },
            },
          });
          donation.logCreatedBy(req.body);
          promises.push(
            this.createRepo.create(this.entityClass, donation as any)
          );
        }
      });
      await Promise.all(promises);
      next();
    } catch (err) {
      throw err;
    } finally {
      await deleteFile(req.files.donation_allowance[0].path);
    }
  };
  createReceiptByDonationId = async (req, res, next) => {
    try {
      const donation: DonationAllowance = await this.searchRepo.findOneById(
        this.entityClass,
        "donation",
        req.params.id,
        [],
        {
          relations: [
            "organization",
            "pos",
            "pos.receiptSequence",
            "pos.manager",
          ],
        }
      );

      if (!donation.posId) {
        throw new ValidateError({
          message: `ไม่สามารถสร้างใบเสร็จได้เนื่องจากไม่พบข้อมูลจุดรับชำระ`,
        });
      }

      const pos = await PosRepository.findOnePos(donation.posId);
      pos.lastestPosShift.expectedDrawerAmount =
        +pos.lastestPosShift.expectedDrawerAmount + +donation.paidAmount;

      const log = getRepository(PosShiftLogs).create({
        transactionAmount: +donation.paidAmount,
        expectedDrawerAmount: pos.lastestPosShift.expectedDrawerAmount,
        action: POSShiftLogActionSet.add_cash,
        posShiftId: pos.lastestPosShift.id,
        refType: "RECEIPT",
        createdBy: req.body.createdBy,
        createdByName: req.body.createdByName,
      });

      if (donation.receiptId) {
        throw new ValidateError({
          message: `ไม่สามารถสร้างใบสำเร็จรับเงินซ้ำได้`,
        });
      }
      // if (!donation.organizationId) {
      //   throw new ValidateError({
      //     message: `ไม่สามารถสร้างใบสำเร็จรับเงินได้เนื่องจากไม่พบหน่วยที่รับบริจาค`,
      //   });
      // }
      const receipt: Receipt = ReceiptRepository.create({
        posId: donation.posId,
        posShiftId: pos.lastestPosShift.id,
        fiscalYear: getFiscalYear(donation.receiptDate as Date),
        documentDate: donation.receiptDate,
        organizationId: donation.organizationId,
        organizationName: donation.organization.address.province+" ("+donation.organization.orgCode+")",
        organizationAddressLine1: donation.organization.address.getAddress1(),
        // organizationAddressLine2: donation.organization.address.getAddress2(),
        organizationAddressLine3: donation.organization.address.getAddress3(),
        "organizationAddressLine4": donation.organization.address.getAddress4(),
        organizationTaxNo: donation.organization.taxNumber,
        // "POSVATCode": "",
        clientType: "P",
        clientTaxNumber: donation.donator.idCardNo,
        clientName: donation.donator.fullName,
        clientFirstname: donation.donator.firstname,
        clientLastname: donation.donator.lastname,
        clientTitle: donation.donator.title,
        // "clientBranch": "",
        // "clientTelephone": "0957482223",
        clientAddress: donation.donator.idCardAddress.getAddress(),
        // "exteranalRef": "",
        // "internalRef1": "",
        // "internalRef2": "",
        subtotal: donation.paidAmount,
        // "discountFactor": "0.00",
        // "discount": "0.00",
        // "vatIncluded": false,
        vat: 0.0,
        // "excludeVat": "840.00",
        // "withHoldingFactor": "0.00",
        // "withHoldingTax": "0.00",
        total: donation.paidAmount,
        documentNote: donation.note || "",
        // "internalNote": "",
        recieveBy: donation.pos.managerId,
        recieveByName: donation.pos.manager.fullname,
        recieveByPosition: donation.pos.manager.position,
        // "cancelApprovedManagerId": null,
        // "cancelApprovedManagerName": "",
        // "cancelApprovedManagerPosition": "",
        paymentMethod: officePaymentMethodSet.transfer,
        paidAmount: donation.paidAmount,
        // "changeAmount": "160.00",
        // "paymentBank": "",
        // "paymentBankBranch": "",
        // "paymentRefNo": "",
        paidDate: donation.receiptDate,
        status: "PD",
        receiptItems: [
          {
            // "createdDate": "2019-12-23T08:44:53.544Z",
            // "updatedDate": "2019-12-23T08:44:53.544Z",
            // "createdBy": null,
            // "createdByName": "",
            // "updatedBy": null,
            // "updatedByName": "",
            refType: "DA",
            refId: donation.id,
            // "ref1": "3250100611098",
            // "ref2": "00147464",
            // "ref3": "กท/2554/0227",
            // "ref4": "",
            name: "บริจาคเบี้ยยังชีพผู้สูงอายุเข้ากองทุนผู้สูงอายุ",
            description1: donation.donator.fullName,
            description2: `ประจำเดือน ${getMonthYearText(
              donation.receiptDate
            )}`,
            description3: `วันที่รับโอน ${getThaiPartialDate(
              donation.receiptDate
            )}`,
            // description4: donation.note,
            quantity: 1,
            price: donation.paidAmount,
            subtotal: donation.paidAmount,
          },
        ],
      } as {});
      receipt.logCreatedBy(req.body);
      await ReceiptRepository.createDonationAllowanceReceipt(
        receipt,
        donation,
        donation.pos.receiptSequence,
        pos.lastestPosShift,
        log
      );
      next();
    } catch (err) {
      next(err);
    }
  };
  printThankyouLetters = async (req, res, next) => {
    try {
      const data = await this.searchRepo.findAndCount(
        this.entityClass,
        "donation",
        [
          {
            operator: "in",
            entityField: "id",
            queryField: "id",
            value: req.body,
          },
        ]
      );
      console.log(data);
      // const resp = await jsreport.render({
      //   template: { name: "donationletter" },
      //   data,
      // });

      // const filename = `donationletter${new Date().toISOString()}.xlsx`;

      // res
      //   .header("Content-Disposition", `attachment; filename=${filename}`)
      //   .header("filename", filename)
      //   .send(resp.content);
      next();
    } catch (err) {
      next(err);
    }
  };
  printEnvelops = async (req, res, next) => {
    try {
      const data = await this.searchRepo.findAndCount(
        this.entityClass,
        "donation",
        [
          {
            operator: "in",
            entityField: "id",
            queryField: "id",
            value: req.body,
          },
        ]
      );
      console.log(data);
      // const resp = await jsreport.render({
      //   template: { name: "request-committee" },
      //   data,
      // });

      // const filename = `request-committee${new Date().toISOString()}.xlsx`;

      // res
      //   .header("Content-Disposition", `attachment; filename=${filename}`)
      //   .header("filename", filename)
      //   .send(resp.content);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const controller = new DonationAllowanceController(
  "DonationAllowance",
  "การบริจาคเบี้ยยังชีพผู้สูงอายุ"
);
