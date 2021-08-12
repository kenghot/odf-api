import {
  accountReceiviableStatusSet,
  addressTypeSet,
  agreementStatusSet,
  arTransactionStatusSet,
  bankSet,
  guaranteeStatusSet,
  guarantorBorrowerRelationshipSet,
  loanTypeSet,
  marriageStatusSet,
  occupationTypeSet,
  paymentMethodSet,
  paymentTypeSet,
  requestStatusSet,
  residenceStatusTypeSet,
  residenceTypeSet,
  residenceWithSet,
  resultTypeSet,
  sequenceTypeSet,
  voucherStatusSet
} from "../src/enumset";

export const enum_set = [
  {
    type: "loanType",
    items: [
      { key: "0", text: "รายบุคคล", value: loanTypeSet.personal }
      // { key: "1", text: "รายกลุ่ม", value: loanTypeSet.group }
    ]
  },
  {
    type: "resultType",
    items: [
      { key: "0", text: "อนุมัติ", value: resultTypeSet.approve },
      { key: "1", text: "ปรับปรุง", value: resultTypeSet.adjust },
      { key: "2", text: "ไม่อนุมัติ", value: resultTypeSet.reject }
    ]
  },
  {
    type: "requestStatus",
    items: [
      { key: "0", text: "แบบร่างคำร้อง", value: requestStatusSet.draft },
      { key: "1", text: "ยื่นคำร้องใหม่", value: requestStatusSet.new },
      { key: "2", text: "แบบร่างคำร้องออนไลน์", value: requestStatusSet.draftOnline },
      { key: "3", text: "ยื่นคำร้องใหม่ออนไลน์", value: requestStatusSet.newOnline },
      {
        key: "4",
        text: "ตรวจสอบผ่านคุณสมบัติ",
        value: requestStatusSet.qualified
      },
      {
        key: "5",
        text: "อนุมัติโดยหัวหน้างาน/กลุ่ม",
        value: requestStatusSet.approve1
      },
      {
        key: "6",
        text: "อนุมัติโดยคณะอนุกรรมการกลั่นกรอง",
        value: requestStatusSet.approve2
      },
      {
        key: "7",
        text: "อนุมัติโดยคณะกรรมการบริหารกองทุนฯ",
        value: requestStatusSet.approve3
      },
      { key: "8", text: "ส่งทำสัญญา", value: requestStatusSet.done },
      { key: "9", text: "ยกเลิกคำร้อง", value: requestStatusSet.cancel },
      {
        key: "10",
        text: "ไม่ผ่านคุณสมบัติ",
        value: requestStatusSet.disqualified
      },
      { key: "11", text: "คำร้องไม่อนุมัติ", value: requestStatusSet.reject }
    ]
  },
  {
    type: "agreementStatus",
    items: [
      { key: "0", text: "เตรียมทำสัญญา", value: agreementStatusSet.new },
      { key: "1", text: "รอโอนเงิน", value: agreementStatusSet.duringPayment },
      {
        key: "2",
        text: "โอนเงินไม่สำเร็จ",
        value: agreementStatusSet.failPayment
      },
      { key: "3", text: "ทำสัญญาแล้ว", value: agreementStatusSet.done },
      { key: "4", text: "สละสิทธิ์", value: agreementStatusSet.disclaim },
      { key: "5", text: "ยกเลิก", value: agreementStatusSet.cancel },
      { key: "6", text: "ปิด", value: agreementStatusSet.close },
      { key: "7", text: "ปรับสภาพหนี้", value: agreementStatusSet.adjusted }
    ]
  },
  {
    type: "guaranteeStatus",
    items: [
      { key: "0", text: "เตรียมทำสัญญา", value: agreementStatusSet.new },
      { key: "1", text: "ปกติ", value: guaranteeStatusSet.normal },
      { key: "2", text: "ยกเลิก", value: guaranteeStatusSet.cancel }
    ]
  },
  {
    type: "accountReceivableStatus",
    items: [
      { key: "0", text: "ปกติ", value: accountReceiviableStatusSet.normal },
      {
        key: "1",
        text: "ค้างชำระเกิน 90 วัน",
        value: accountReceiviableStatusSet.unpaid
      },
      { key: "2", text: "ปิดบัญชี", value: accountReceiviableStatusSet.close },
      {
        key: "3",
        text: "อยู่ในกระบวนการทางกฎหมาย",
        value: accountReceiviableStatusSet.collection
      }
    ]
  },
  {
    type: "arTransactionStatus",
    items: [
      { key: "0", text: "ปกติ", value: arTransactionStatusSet.normal },
      { key: "1", text: "ยกเลิก", value: arTransactionStatusSet.cancel }
    ]
  },
  {
    type: "voucherStatus",
    items: [
      { key: "0", text: "รอดำเนินการ", value: voucherStatusSet.waiting },
      { key: "1", text: "จ่ายแล้ว", value: voucherStatusSet.paid }
    ]
  },
  {
    type: "paymentType",
    items: [
      { key: "0", text: "สำนักงาน", value: paymentTypeSet.office },
      { key: "1", text: "กรุงไทย", value: paymentTypeSet.ktb },
      {
        key: "0",
        text: "เคาเตอร์เซอร์วิส",
        value: paymentTypeSet.counterService
      }
    ]
  },
  {
    type: "paymentMethod",
    items: [
      { key: "0", text: "เงินสด", value: paymentMethodSet.cash },
      { key: "1", text: "โอนเงิน", value: paymentMethodSet.transfer },
      //
      { key: "2", text: "???", value: paymentMethodSet.directDebit },
      { key: "3", text: "???", value: paymentMethodSet.billPayment }
    ]
  },
  {
    type: "guarantorBorrowerRelationship",
    items: [
      {
        key: "0",
        text: "ลูก",
        value: guarantorBorrowerRelationshipSet.children
      },
      {
        key: "1",
        text: "ญาติ",
        value: guarantorBorrowerRelationshipSet.relative
      },
      {
        key: "2",
        text: "เพื่อน",
        value: guarantorBorrowerRelationshipSet.friend
      }
    ]
  },
  {
    type: "marriageStatus",
    items: [
      { key: "0", text: "โสด", value: marriageStatusSet.single },
      { key: "1", text: "สมรส", value: marriageStatusSet.married },
      {
        key: "2",
        text: "อยู่ด้วยกันโดยไม่จดทะเบียนสมรส",
        value: marriageStatusSet.unregisted
      },
      { key: "3", text: "หย่าร้าง", value: marriageStatusSet.divorce },
      { key: "4", text: "หม้าย", value: marriageStatusSet.widow }
    ]
  },
  {
    type: "addressType",
    items: [
      {
        key: "0",
        text: "ที่เดียวกับบัตรประชาชน",
        value: addressTypeSet.asIdCard
      },
      {
        key: "1",
        text: "ที่เดียวกับที่อยู่ปัจจุบัน",
        value: addressTypeSet.asRegistered
      },
      { key: "2", text: "อื่นๆ", value: addressTypeSet.other }
    ]
  },
  {
    type: "residenceType",
    items: [
      { key: "0", text: "บ้าน", value: residenceTypeSet.house },
      { key: "1", text: "ทาวน์เฮาส์", value: residenceTypeSet.townhouse },
      { key: "2", text: "คอนโดมิเนียม", value: residenceTypeSet.condo },
      {
        key: "3",
        text: "อพาร์ทเม้นท์/หอพัก/แฟลต",
        value: residenceTypeSet.apartment
      },
      { key: "4", text: "อื่น", value: residenceTypeSet.other }
    ]
  },
  {
    type: "residenceStatusType",
    items: [
      { key: "0", text: "เช่า", value: residenceStatusTypeSet.rent },
      { key: "1", text: "ผ่อน", value: residenceStatusTypeSet.installment },
      {
        key: "2",
        text: "เป็นของตนเองปลอดภาระ",
        value: residenceStatusTypeSet.owner
      },
      {
        key: "3",
        text: "เป็นของบุคคลอื่น",
        value: residenceStatusTypeSet.relyOnOther
      },
      {
        key: "4",
        text: "อาศัยอยู่กับบุตรหลาน/ญาติ",
        value: residenceStatusTypeSet.relyOnRelative
      },
      {
        key: "5",
        text: "บ้านพักสวัสดิการ",
        value: residenceStatusTypeSet.relyOnWelfare
      },
      { key: "6", text: "อื่น", value: residenceStatusTypeSet.other }
    ]
  },
  {
    type: "residenceWith",
    items: [
      { key: "0", text: "คู่สมรส", value: residenceWithSet.spouse },
      { key: "1", text: "บุตร", value: residenceWithSet.child },
      { key: "2", text: "อื่นๆ", value: residenceWithSet.other }
    ]
  },
  {
    type: "occupationType",
    items: [
      { key: "0", text: "ผู้กู้", value: occupationTypeSet.borrower },
      { key: "1", text: "ผู้ค้ำประกัน", value: occupationTypeSet.guarantor },
      { key: "2", text: "อาชีพที่ขอกู้", value: occupationTypeSet.request }
    ]
  },
  {
    type: "bank",
    items: [{ key: "0", text: "ธนาคารกรุงไทย", value: bankSet.KTB }]
  },
  {
    type: "sequenceType",
    items: [
      { key: "0", text: "เอกสารคำร้อง", value: sequenceTypeSet.request },
      { key: "1", text: "เอกสารคำร้องออนไลน์", value: sequenceTypeSet.requestOnline },
      {
        key: "2",
        text: "เอกสารสัญญาเงินกู้",
        value: sequenceTypeSet.agreement
      },
      {
        key: "3",
        text: "เอกสารสัญญาค้ำประกัน",
        value: sequenceTypeSet.guarantee
      },
      {
        key: "4",
        text: "เอกสารใบสำคัญรับ/จ่าย",
        value: sequenceTypeSet.voucher
      }
    ]
  }
];
