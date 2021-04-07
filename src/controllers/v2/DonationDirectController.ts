import moment = require("moment");
import * as eol from "eol";
import * as fs from "fs";
import * as iconv from "iconv-lite";
import * as os from "os";
import * as path from "path";
import { deleteFile, readAndParseXlsx } from "../../utils/fs-helper";
import { BaseController } from "./BaseController";

class DonationDirectController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }
  createManyFromFile = async (req, res, next) => {
    // console.log(req.files.donation_allowance);
    const promises = [];
    try {
      const records = readAndParseXlsx(req.files.donation_direct[0].path, 0);
      console.log(records);
      // records.forEach((r) => {
      //   promises.push(this.createRepo.create(this.entityClass, {}));
      // });
      // await Promise.all(promises);
      next();
    } catch (err) {
      throw err;
    } finally {
      await deleteFile(req.files.donation_allowance[0].path);
    }
  };
  createReceiptByDonationId = async (req, res, next) => {
    try {
      const donation = await this.searchRepo.findOneById(
        this.entityClass,
        "donation",
        req.params.id,
        [],
        {
          relations: ["organization", "pos", "pos.receiptSequence"],
        }
      );
      // const receipt = ReceiptRepository.create({});
      // await ReceiptRepository.createDonationAllowanceReceipt(receipt, donation);
      // console.log(donation);
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
  generateEDonation = async (req, res, next) => {
    const { ids } = req.body;
    try {
      const [records, total] = await this.searchRepo.findAndCount(
        this.entityClass,
        "donation",
        [
          {
            operator: "in",
            entityField: "id",
            queryField: "id",
            value: ids,
          },
        ],
        [],
        {},
        { relations: ["receipt", "receipt.receiptItems"] }
      );
      const header = `วันที่บริจาค\tประเภทผู้บริจาค\tเลขประจำตัวผู้เสียภาษีอากรของผู้บริจาค\tคำนำหน้าชื่อ\tชื่อ\tชื่อสกุล\tชื่อนิติบุคคล\tจำนวนเงินสด (บาท)\tรายการทรัพย์สิน\tจำนวนทรัพย์สิน (บาท)${os.EOL}`;
      const rows = [];
      records.forEach((d) => {
        const [firstname, lastname] = d.donatorName.split(" ");
        rows.push(
          `${moment(d.receiptDate).add(543, "year").format("DDMMYYYY")}\t1\t${
            d.donatorIdCardNo
          }\t${d.donatorTitle}\t${d.donatorFirstname}\t${
            d.donatorLastname
          }\t${" "}\t${d.paidAmount}\t${" "}\t0.00${os.EOL}`
        );
      });
      const filename = await this.createFile(header, rows);
      res
        .header("Content-Disposition", `attachment; filename=${filename}`)
        .header("filename", `${filename}`)
        .sendFile(path.join(process.cwd(), `/tmp/e_donation/${filename}`));
    } catch (err) {
      next(err);
    }
  };
  private createFile = (header: string, records: string[]) => {
    return new Promise((resolve, reject) => {
      const filename = `e_donaton${new Date().toISOString()}.txt`;

      const uploadPath = path.join(process.cwd(), "/tmp/e_donation");

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      const file = fs.createWriteStream(
        path.join(process.cwd(), `/tmp/e_donation/${filename}`)
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
        // file.write(record);
        file.write(iconv.encode(eol.crlf(r), "TIS-620"));
      });
      file.end();
    });
  };
}

export const controller = new DonationDirectController(
  "DonationDirect",
  "การบริจาคเงินเข้ากองทุน"
);
