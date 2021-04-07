import { RequestHandler } from "express";
import * as builder from "xmlbuilder";

import { BaseController, IGetOptions } from "./base_controller";

interface ICSRequest {
  TX_ID: string; // length: 22
  LOG_ID: string; // length: 22
  VENDOR_ID: string; // length: 13
  SERVICE_ID: string; // length: 2
  METHOD: string; // length: 25
  COUNTER_NO: string; // 5
  TERM_NO: string; // 1
  POS_TAX_ID: string; // 20
  SERVICE_RUN_NO: string; // 6
  RECORD_STATUS: string; // 1 A=Action, C=CANCEL
  CLIENT_SERVICE_RUNNO: string; // 6
  AMOUNT_RECEIVED: number; // 5.2
  VAT_AMOUNT: number; // 5.2
  BILL_TYPE: string; // 1 H=ใบรับฝากชำระ, B=ใบเสร็จรับเงิน/ใบกำกับภาษีอย่างย่อ
  REFFERENCE_1: string; // 25
  REFFERENCE_2: string; // 25
  REFFERENCE_3: string; // 25
  REFFERENCE_4: string; // 25
  CUSTOMER_NAME: string; // 25
  CUSTOMER_ADDR_1: string; // 25
  CUSTOMER_ADDR_2: string; // 25
  CUSTOMER_ADDR_3: string; // 25
  CUSTOMER_TEL_NO: string; // 25
  ZONE: string; // 2 01=ส่วนกลาง, 02=ส่วนภูมิภาค
  R_SERVICE_RUNNO: string; // 22
  CANCEL_OPERATING: string; // yyyy/mm/dd hh:mm:ss
  OPERATE_BY_STAFF: string; // 10
  SYSTEM_DATE_TIME: string; // yyyy/mm/dd hh:mm:ss
  USERID: string; // 10
  PASSWORD: string; // 10
}
interface ITag {
  "#text": string | number | boolean;
}
interface ICSResponseTag {
  TX_ID: ITag; // length: 22
  // LOG_ID: ITag; // length: 22
  // VENDOR_ID: ITag; // length: 13
  // SERVICE_ID: ITag; // length: 2
  METHOD: ITag; // length: 25
  // SUCCESS: ITag;
  // CODE: ITag; // 10
  // DESC: ITag; // 250
  // REFFERENCE_1: ITag; // 25
  // REFFERENCE_2: ITag; // 25
  // REFFERENCE_3: ITag; // 25
  // REFFERENCE_4: ITag; // 25
  // CUSTOMER_NAME: ITag; // 25
  // CUSTOMER_ADDR_1: ITag; // 25
  // CUSTOMER_ADDR_2: ITag; // 25
  // CUSTOMER_ADDR_3: ITag; // 25
  // CUSTOMER_TEL_NO: ITag; // 25
  // RETURN1: ITag; // 25
  // RETURN2: ITag; // 25
  // RETURN3: ITag; // 25
  // AMOUNT_RECEIVED: ITag; // 5.2
  // PRINT_SLIP: ITag; // 250
}
interface ICSResponse {
  RESPONSE: ICSResponseTag;
}
export class CounterServiceController extends BaseController {
  static onDataExchangeConfirm: RequestHandler = async (req, res, next) => {
    console.log("confirm", req.body);

    let xmlObj: any;

    switch (req.body.REQUEST.METHOD) {
      case "DATAExchangeConfirm":
        // do something
        xmlObj = CounterServiceController.prepareDataExchangeConfirm(
          req.body.REQUEST
        );
        break;
      default:
        xmlObj = {};
    }

    const xml = CounterServiceController.createXmlResponse(xmlObj);

    res.setHeader("Content-Type", "text/xml");
    res.send(xml);
  };

  static onOR: RequestHandler = async (req, res, next) => {
    console.log("or", req.body);

    let obj: any;

    switch (req.body.REQUEST.METHOD) {
      case "OR":
        // do something
        obj = CounterServiceController.prepareDataExchangeConfirm(
          req.body.REQUEST
        );
        break;
      default:
        obj = {};
    }
    const xml = CounterServiceController.createXmlResponse(obj);

    res.setHeader("Content-Type", "text/xml");
    res.send(xml);
  };

  static onORConfirm: RequestHandler = async (req, res, next) => {
    console.log("orConfirm", req.body);

    let obj: any;

    switch (req.body.REQUEST.METHOD) {
      case "ORConfirm":
        // do something
        obj = CounterServiceController.prepareDataExchangeConfirm(
          req.body.REQUEST
        );
        break;
      default:
        obj = {};
    }

    const xml = CounterServiceController.createXmlResponse(obj);

    res.setHeader("Content-Type", "text/xml");
    res.send(xml);
  };

  static onCancel: RequestHandler = async (req, res, next) => {
    console.log("cancel", req.body);

    let obj: any;

    switch (req.body.REQUEST.METHOD) {
      case "ORCancel":
        // do something
        obj = CounterServiceController.prepareDataExchangeConfirm(
          req.body.REQUEST
        );
        break;
      default:
        obj = {};
    }

    const xml = CounterServiceController.createXmlResponse(obj);

    res.setHeader("Content-Type", "text/xml");
    res.send(xml);
  };

  private static prepareDataExchangeConfirm = (
    request: ICSRequest
  ): ICSResponse => {
    const { TX_ID, METHOD } = request;
    const response: ICSResponseTag = {
      TX_ID: { "#text": TX_ID },
      METHOD: { "#text": METHOD }
    };
    return { RESPONSE: response };
  };

  private static createXmlResponse = (obj: any) => {
    const xml = builder
      .create(obj, { encoding: "ISO-8859-1" })
      .end({ pretty: true });
    return xml;
  };
}
