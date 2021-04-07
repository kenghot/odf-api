import * as crypto from "crypto";
import moment = require("moment");
import { getRepository, Repository } from "typeorm";
import { AccountReceivableTransaction } from "../entities/AccountReceivableTransaction";
import { CounterService } from "../entities/CounterService";
import {
  arTransactionStatusSet,
  paymentMethodSet,
  paymentTypeSet
} from "../enumset";
import { PaymentService } from "../services/PaymentService";

enum counterServiceOperationSet {
  dataExchange = "DataExchange",
  dataExchangeConfirm = "DataExchangeConfirm",
  or = "OR",
  orConfirm = "ORConfirm"
}

interface ICounterServiceReq {
  TX_ID: string;
  LOG_ID: string;
  VENDOR_ID: string;
  SERVICE_ID: string;
  METHOD: string;
  COUNTER_NO: string;
  TERM_NO: string;
  POS_TAX_ID: string;
  SERVICE_RUN_NO: string;
  RECORD_STATUS: string;
  CLIENT_SERVICE_RUNNO: string;
  AMOUNT_RECEIVED: string;
  VAT_AMOUNT: string;
  BILL_TYPE: string;
  REFERENCE_1: string;
  REFERENCE_2: string;
  REFERENCE_3: string;
  REFERENCE_4: string;
  CUSTOMER_NAME: string;
  CUSTOMER_ADDR_1: string;
  CUSTOMER_ADDR_2: string;
  CUSTOMER_ADDR_3: string;
  CUSTOMER_TEL_NO: string;
  ZONE: string;
  R_SERVICE_RUNNO: string;
  CANCEL_OPERATING: string;
  OPERATE_BY_STAFF: string;
  SYSTEM_DATE_TIME: string;
  USERID: string;
  PASSWORD: string;
}

interface ICounterServiceRes {
  TX_ID: string;
  LOG_ID: string;
  VENDOR_ID: string;
  SERVICE_ID: string;
  METHOD: string;
  SUCCESS: boolean;
  CODE: string;
  DESC: string;
  REFERENCE_1: string;
  REFERENCE_2: string;
  REFERENCE_3: string;
  REFERENCE_4: string;
  CUSTOMER_NAME: string;
  CUSTOMER_ADDR_1: string;
  CUSTOMER_ADDR_2: string;
  CUSTOMER_ADDR_3: string;
  CUSTOMER_TEL_NO: string;
  RETURN1: string;
  RETURN2: string;
  RETURN3: string;
  AMOUNT_RECEIVED: string;
  PRINT_SLIP: string;
}

interface ISoapError {
  ERROR_ID: string;
  ERROR_DESCRIPTION_THAI: string;
  ERROR_DESCRIPTION_ENG: string;
  CASE?: string;
}
const error200: ISoapError = {
  ERROR_ID: `9721200`,
  ERROR_DESCRIPTION_ENG: "Permission denied",
  ERROR_DESCRIPTION_THAI: "รหัสผู้ใช้งานและรหัสผ่านไม่ถูกต้อง"
};

const error201: ISoapError = {
  ERROR_ID: `9721201`,
  ERROR_DESCRIPTION_ENG: "Reference not found",
  ERROR_DESCRIPTION_THAI:
    "ไม่พบข้อมูลลูกหนี้จากหมายเลขอ้างอิง 1(หมายเลขบัตรประชาชน)"
};
const error202: ISoapError = {
  ERROR_ID: "9721202",
  ERROR_DESCRIPTION_ENG: "Reference does not matched",
  ERROR_DESCRIPTION_THAI:
    "ไม่พบข้อมูลลูกหนี้เนื่องจากหมายเลขอ้างอิงไม่สอดคล้อง(หมายเลขบัตรประชาชน + เลขที่สัญญา"
};
const error203: ISoapError = {
  ERROR_ID: "9721203",
  ERROR_DESCRIPTION_ENG: "",
  ERROR_DESCRIPTION_THAI:
    "พบข้อมูลลูกหนี้จากหมายเลขอ้างอิงมากกว่า 1 รายการ กรุณาติดต่อกองทุนผู้สูงอายุ"
};

const error301: ISoapError = {
  ERROR_ID: "9721301",
  ERROR_DESCRIPTION_ENG: "Reference payment transaction(TX_ID) is not found",
  ERROR_DESCRIPTION_THAI: "ไม่พบรายการชำระเงินที่อ้างอิง"
};
const error401: ISoapError = {
  ERROR_ID: "9721401",
  ERROR_DESCRIPTION_ENG:
    "This TX_ID has not been requested yet, please call it before confirm",
  ERROR_DESCRIPTION_THAI:
    "ไม่สามารถยืนยันได้เนื่องจากไม่พบรายการตรวจสอบข้อมูลเบื้องต้น"
};
const error402: ISoapError = {
  ERROR_ID: "9721402",
  ERROR_DESCRIPTION_ENG:
    "This confirm operation is terminated due to fail result of previous one",
  ERROR_DESCRIPTION_THAI:
    "ไม่สามารถยืนยันการชำระเงินได้เนื่องจากการตรวจสอบข้อมูลเบื้องต้นไม่สำเร็จ"
};
const error403: ISoapError = {
  ERROR_ID: "9721403",
  ERROR_DESCRIPTION_ENG:
    "This confirm operation is terminated because payment amount is greater than outstandingdebtbalance",
  ERROR_DESCRIPTION_THAI:
    "ไม่สามารถทำรายการได้เนื่องจากจำนวนที่ชำระมากกว่ายอดหนี้คงค้าง"
};
const error404: ISoapError = {
  ERROR_ID: "9721404",
  ERROR_DESCRIPTION_ENG:
    "This confirm operation is terminated because it already been done",
  ERROR_DESCRIPTION_THAI: "ไม่สามารถทำรายการเดิมซ้ำได้"
};
const error405: ISoapError = {
  ERROR_ID: "9721405",
  ERROR_DESCRIPTION_ENG:
    "This confirm operation is terminated because AMOUNT_RECEIVED is wrong format",
  ERROR_DESCRIPTION_THAI:
    "ไม่สามารถทำรายการได้เนื่องจากรูปแแบบข้อมูล AMOUNT_RECEIVED ไม่ถูกต้อง"
};
const error406: ISoapError = {
  ERROR_ID: "9721406",
  ERROR_DESCRIPTION_ENG:
    "This confirm operation is terminated because SYSTEM_DATE_TIME is wrong format",
  ERROR_DESCRIPTION_THAI:
    "ไม่สามารถทำรายการได้เนื่องจากรูปแแบบข้อมูล SYSTEM_DATE_TIME ไม่ถูกต้อง"
};
const error500: ISoapError = {
  ERROR_ID: "9721500",
  ERROR_DESCRIPTION_ENG:
    "The operation is not complete due to the technical issue",
  ERROR_DESCRIPTION_THAI: "ทำรายการไม่สำเร็จเนื่องจากปัญหาทางเทคนิค"
};
const error501: ISoapError = {
  ERROR_ID: "9721501",
  ERROR_DESCRIPTION_ENG: "Serivce not found",
  ERROR_DESCRIPTION_THAI: "ไม่พบบริการที่คุณเรียกใช้ กรุณาติดต่อผู้ดูแลระบบ"
};

const dataExchange = async (args: ICounterServiceReq) => {
  try {
    const response: ICounterServiceRes = initResponse(
      args,
      counterServiceOperationSet.dataExchange
    );
    // // find ar
    const [ars, total] = await PaymentService.verifyAccount(
      args.REFERENCE_1,
      args.REFERENCE_2
    );

    if (!total) {
      response.SUCCESS = false;
      if (!args.REFERENCE_2) {
        response.CODE = error201.ERROR_ID;
        response.DESC = error201.ERROR_DESCRIPTION_THAI;
      } else {
        response.CODE = error202.ERROR_ID;
        response.DESC = error202.ERROR_DESCRIPTION_THAI;
      }
    } else if (total >= 1) {
      response.SUCCESS = true;
      response.CODE = "100";
      response.CUSTOMER_NAME = ars[0].name;
      response.CUSTOMER_TEL_NO = ars[0].borrowerContactTelephone;
      response.REFERENCE_2 = `${ars[0].agreementId}`.padStart(8, "0");
      response.REFERENCE_3 = `${ars[0].agreement.documentNumber}`;
      response.REFERENCE_4 = `${ars[0].organization.telephone}`;
      response.RETURN1 = ars[0].outstandingDebtBalance.toString();
      response.RETURN2 = ars[0].loanAmount.toString();
      response.RETURN3 = `${ars[0].id}`; // for query
      response.AMOUNT_RECEIVED = ars[0].installmentAmount.toString();
      // } else if (total > 1) {
      //   response.SUCCESS = false;
      //   response.CODE = error203.ERROR_ID;
      //   response.DESC = error203.ERROR_DESCRIPTION_THAI;
    }

    return response;
  } catch (err) {
    throw err;
  }
};

const dataExchangeConfirm = async (
  args: ICounterServiceReq,
  reqCSId: number
) => {
  try {
    // console.log("dataExchangeConfirm", args);
    const csRepo = getRepository(CounterService);
    // init response
    const response: ICounterServiceRes = initResponse(
      args,
      counterServiceOperationSet.dataExchangeConfirm
    );

    // validate TX_ID
    const cs = await csRepo.findOne({
      TX_ID: args.TX_ID,
      METHOD: counterServiceOperationSet.dataExchange,
      type: "RES",
      SUCCESS: true
    });

    if (!cs) {
      response.SUCCESS = false;
      response.CODE = error402.ERROR_ID;
      response.DESC = error402.ERROR_DESCRIPTION_THAI;
    } else if (isNaN(+args.AMOUNT_RECEIVED) || !args.AMOUNT_RECEIVED) {
      response.SUCCESS = false;
      response.CODE = error405.ERROR_ID;
      response.DESC = error405.ERROR_DESCRIPTION_THAI;
    } else if (
      !args.SYSTEM_DATE_TIME ||
      !moment(args.SYSTEM_DATE_TIME, "YYYY/MM/DD hh:mm:ss", true).isValid()
    ) {
      response.SUCCESS = false;
      response.CODE = error406.ERROR_ID;
      response.DESC = error406.ERROR_DESCRIPTION_THAI;
    } else {
      const [error, ar, transaction] = await PaymentService.createTransaction(
        +cs.RETURN3,
        paymentTypeSet.counterService,
        reqCSId,
        paymentMethodSet.transfer,
        cs.TX_ID,
        new Date(args.SYSTEM_DATE_TIME),
        +args.AMOUNT_RECEIVED
      );

      if (error) {
        if (error === 403) {
          response.SUCCESS = false;
          response.CODE = error403.ERROR_ID;
          response.DESC = error403.ERROR_DESCRIPTION_THAI;
        }
        if (error === 404) {
          response.SUCCESS = false;
          response.CODE = error404.ERROR_ID;
          response.DESC = error404.ERROR_DESCRIPTION_THAI;
        }
      } else {
        // set respones
        response.SUCCESS = true;
        response.CODE = "100";
        response.CUSTOMER_NAME = ar.name;
        response.CUSTOMER_TEL_NO = ar.borrowerContactTelephone;
        response.RETURN1 = ar.outstandingDebtBalance.toString();
        response.RETURN2 = ar.loanAmount.toString();
        response.RETURN3 = transaction.id.toString();
        response.AMOUNT_RECEIVED = transaction.paidAmount.toString();
      }
    }

    return response;
  } catch (err) {
    throw err;
  }
};

const or = async (args: ICounterServiceReq) => {
  try {
    // init response
    const response: ICounterServiceRes = initResponse(
      args,
      counterServiceOperationSet.or
    );

    // find tr to cancel
    const transactionRepo = getRepository(AccountReceivableTransaction);
    const atr = await transactionRepo.findOne(
      {
        paymentType: paymentTypeSet.counterService,
        status: arTransactionStatusSet.normal,
        paymentReferenceNo: args.R_SERVICE_RUNNO
      },
      { relations: ["accountReceivable"] }
    );

    if (!atr) {
      response.SUCCESS = false;
      response.CODE = error301.ERROR_ID;
      response.DESC = error301.ERROR_DESCRIPTION_THAI;
    } else {
      // set response
      response.SUCCESS = true;
      response.CODE = "100";
      response.CUSTOMER_NAME = atr.accountReceivable.name;
      response.CUSTOMER_TEL_NO = atr.accountReceivable.borrowerContactTelephone;
      response.RETURN1 = atr.id.toString(); // for query
      response.AMOUNT_RECEIVED = atr.paidAmount.toString();
    }

    return response;
  } catch (err) {
    throw err;
  }
};

const orConfirm = async (args: ICounterServiceReq, reqCSId: number) => {
  try {
    // console.log("dataExchangeConfirm", args);
    const csRepo = getRepository(CounterService);
    // init response
    const response: ICounterServiceRes = initResponse(
      args,
      counterServiceOperationSet.orConfirm
    );

    // validate TX_ID
    const cs = await csRepo.findOne({
      TX_ID: args.TX_ID,
      METHOD: counterServiceOperationSet.or,
      type: "RES",
      SUCCESS: true
    });

    if (!cs) {
      response.SUCCESS = false;
      response.CODE = error401.ERROR_ID;
      response.DESC = error401.ERROR_DESCRIPTION_THAI;
    } else if (
      !args.SYSTEM_DATE_TIME ||
      !moment(args.SYSTEM_DATE_TIME, "YYYY/MM/DD hh:mm:ss", true).isValid()
    ) {
      response.SUCCESS = false;
      response.CODE = error406.ERROR_ID;
      response.DESC = error406.ERROR_DESCRIPTION_THAI;
    } else {
      const [
        error,
        accountReceivable,
        atr
      ] = await PaymentService.cancelTransaction(
        +cs.RETURN1,
        reqCSId,
        new Date(args.SYSTEM_DATE_TIME)
      );

      if (error) {
        if (error === 404) {
          response.SUCCESS = false;
          response.CODE = error404.ERROR_ID;
          response.DESC = error404.ERROR_DESCRIPTION_THAI;
        }
      } else {
        // set response
        response.SUCCESS = true;
        response.CODE = "100";
        response.CUSTOMER_NAME = accountReceivable.name;
        response.CUSTOMER_TEL_NO = accountReceivable.borrowerContactTelephone;
        response.RETURN1 = atr.id.toString();
        response.AMOUNT_RECEIVED = atr.paidAmount.toString();
      }
    }

    return response;
  } catch (err) {
    throw err;
  }
};

const initResponse = (args, method?: counterServiceOperationSet) => {
  return {
    TX_ID: args.TX_ID,
    LOG_ID: args.LOG_ID,
    VENDOR_ID: process.env.TAX_ID,
    SERVICE_ID: args.SERVICE_ID,
    METHOD: method || "",
    SUCCESS: false,
    CODE: "",
    DESC: "",
    REFERENCE_1: args.REFERENCE_1,
    REFERENCE_2: args.REFERENCE_2,
    REFERENCE_3: args.REFERENCE_3,
    REFERENCE_4: "",
    CUSTOMER_NAME: "",
    CUSTOMER_ADDR_1: "",
    CUSTOMER_ADDR_2: "",
    CUSTOMER_ADDR_3: "",
    CUSTOMER_TEL_NO: "",
    RETURN1: "",
    RETURN2: "",
    RETURN3: "",
    AMOUNT_RECEIVED: "",
    PRINT_SLIP: ""
  };
};

const algorithm = "aes-256-cbc";

const encrypt = (password: string) => {
  const cipher = crypto.createCipher(algorithm, password);
  let crypted = cipher.update(password, "utf8", "hex");
  crypted += cipher.final("hex");
  return crypted;
};

const decrypt = (encrypted: string) => {
  const decipher = crypto.createDecipher(algorithm, encrypted);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

const authenticate = (username: string, password: string) => {
  if (username !== process.env.COUNTER_SERVICE_USER) {
    return false;
  }
  const encrypted = encrypt(password);
  if (encrypted !== process.env.COUNTER_SERVICE_PASS) {
    return false;
  }
  return true;
};
const validateReq = (args: ICounterServiceReq) => {
  return args.SERVICE_ID === "00" ? true : false;
};
const logReq = async (csRepo: any, args: ICounterServiceReq) => {
  // log request
  const reqCS = csRepo.create({
    ...args,
    type: "REQ"
  });
  await csRepo.save(reqCS);
  return reqCS.id;
};
const logRes = (
  csRepo: Repository<CounterService>,
  args: ICounterServiceReq,
  response: ICounterServiceRes
) => {
  // log response
  delete args.PASSWORD;
  const resCS = csRepo.create({
    ...args,
    type: "RES",
    csMethod: response.METHOD,
    ...response
  });
  csRepo.save(resCS);
};

const switchService = async (args: ICounterServiceReq) => {
  // console.log("dataExchange", args);
  const csRepo = getRepository(CounterService);
  // init response
  let response: ICounterServiceRes = initResponse(args);

  try {
    // log request
    const reqCSId = await logReq(csRepo, args);
    // check permission
    if (!authenticate(args.USERID, args.PASSWORD)) {
      response.SUCCESS = false;
      response.CODE = error200.ERROR_ID;
      response.DESC = error200.ERROR_DESCRIPTION_THAI;
      return response;
    }
    // validate request
    if (!validateReq(args)) {
      response.SUCCESS = false;
      response.CODE = error501.ERROR_ID;
      response.DESC = error501.ERROR_DESCRIPTION_THAI;
      return response;
    }
    // definde operation service
    let operationResponse: any;

    switch (args.METHOD) {
      case counterServiceOperationSet.dataExchange:
        operationResponse = await dataExchange(args);
        response = {
          ...response,
          METHOD: counterServiceOperationSet.dataExchange,
          ...operationResponse
        };
        break;
      case counterServiceOperationSet.dataExchangeConfirm:
        operationResponse = await dataExchangeConfirm(args, reqCSId);
        response = {
          ...response,
          METHOD: counterServiceOperationSet.dataExchangeConfirm,
          ...operationResponse
        };
        break;
      case counterServiceOperationSet.or:
        operationResponse = await or(args);
        response = {
          ...response,
          METHOD: counterServiceOperationSet.or,
          ...operationResponse
        };
        break;
      case counterServiceOperationSet.orConfirm:
        operationResponse = await orConfirm(args, reqCSId);
        response = {
          ...response,
          METHOD: counterServiceOperationSet.orConfirm,
          ...operationResponse
        };
        break;
      default:
        response.SUCCESS = false;
        response.CODE = error501.ERROR_ID;
        response.DESC = error501.ERROR_DESCRIPTION_THAI;
        return response;
    }
    return response;
  } catch {
    response.SUCCESS = false;
    response.CODE = error500.ERROR_ID;
    response.DESC = error500.ERROR_DESCRIPTION_THAI;
    return response;
  } finally {
    logRes(csRepo, args, response);
  }
};

export const serviceObject = {
  CounterService: {
    CounterServiceSoap: {
      CounterServiceOperation: switchService
    }
  }
};
