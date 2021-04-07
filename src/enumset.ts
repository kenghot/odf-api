export enum loanTypeSet {
  personal = "P",
  group = "G",
}

export enum resultTypeSet {
  approve = "AP",
  adjust = "AJ",
  reject = "RJ",
}
export enum requestStatusSet {
  draft = "DF",
  new = "NW",
  qualified = "QF",
  approve1 = "AP1",
  approve2 = "AP2",
  approve3 = "AP3",
  done = "DN",
  cancel = "CL",
  disqualified = "DQF",
  reject = "RJ",
}
export enum agreementStatusSet {
  new = "NW",
  duringPayment = "DP",
  failPayment = "FP",
  done = "DN",
  disclaim = "DC",
  cancel = "CL",
  close = "CS",
  adjusted = "AJ",
}
export enum guaranteeStatusSet {
  new = "NW",
  duringPayment = "DP",
  normal = "NM",
  cancel = "CL",
}

export enum accountReceiviableStatusSet {
  normal = "10",
  unpaid = "20",
  close = "11",
  collection = "30",
  badDebt = "33",
}
export enum arTransactionStatusSet {
  normal = "NM",
  cancel = "CL",
  return = "RT",
  adjust = "AJ",
}
export enum creditStatusSet {
  overdue0 = "0", // ไม่ค้างชำระหรือค้างชำระไม่เกิน 30วัน
  overdue1 = "1", // ค้างชำระ 31-60 วัน
  overdue2 = "2", // ค้างชำระ 61-90 วัน
  overdue3 = "3", // ค้างชำระ 91-120 วัน
  overdue4 = "4", // ค้างชำระ 121-150 วัน
  overdue5 = "5", // ค้างชำระ 151-180 วัน
  overdue6 = "6", // ค้างชำระ 181-210 วัน
  overdue7 = "7", // ค้างชำระ 211-240 วัน
  overdue8 = "8", // ค้างชำระ 241-270 วัน
  overdue9 = "9", // ค้างชำระ 271-300 วัน
  overdue10 = "F", // ค้างชำระมากกว่า 300 วัน
}
export enum voucherStatusSet {
  waiting = "WT",
  paid = "PD",
  cancel = "CL",
}
export enum voucherTypeSet {
  payment = "PAYMENT",
  receive = "RECEIVE",
}
export enum paymentTypeSet {
  office = "OFFICE",
  ktb = "KTB",
  counterService = "CS",
  system = "SYSTEM",
}
export enum paymentMethodSet {
  cash = "CASH",
  transfer = "TRANSFER",
  directDebit = "DIRECTDEBIT",
  billPayment = "BILLPAYMENT",
  promtPay = "PROMTPAY",
  notDeclare = "",
}
export enum officePaymentMethodSet {
  cash = "CASH",
  moneyOrder = "MONEYORDER",
  check = "CHECK",
  transfer = "TRANSFER",
}

export enum guarantorBorrowerRelationshipSet {
  children = 0,
  relative = 1,
  friend = 2,
}
export enum marriageStatusSet {
  single = 0,
  married = 1,
  unregisted = 2,
  divorce = 3,
  widow = 4,
}

export enum addressTypeSet {
  asIdCard = 0,
  asRegistered = 1,
  other = 99,
}

export enum residenceTypeSet {
  house = 0,
  townhouse = 1,
  condo = 2,
  apartment = 3,
  other = 99,
}
export enum residenceStatusTypeSet {
  rent = 0,
  installment = 1,
  owner = 2,
  relyOnOther = 3,
  relyOnRelative = 4,
  relyOnWelfare = 5,
  other = 99,
}
export enum residenceWithSet {
  spouse = 0,
  child = 1,
  other = 99,
}

export enum occupationTypeSet {
  borrower = 0,
  guarantor = 1,
  request = 2,
}

export enum bankSet {
  KTB = "KTB",
}

export enum sequenceTypeSet {
  request = "request",
  agreement = "agreement",
  guarantee = "guarantee",
  voucher = "voucher",
  receipt = "receipt",
}

export enum debtInterruptReasonSet {
  paid = "P",
  ackOfDebt = "AD",
  dead = "D",
  ackAfter = "AF",
}

export enum letterTypeSet {
  collectionLetterBorrower = "CLB",
  collectionLetterGuarantor = "CLG",
  cancelationLetterBorrower = "CCB",
  cancelationLetterGuarantor = "CCG",
  searchingHeritage = "CSH",
  searchingManager = "CSM",
  notification = "CLR",
}
export enum visitTypeSet {
  debtCollectionBorrower = "DCB",
  debCollectionGurantor = "DCG",
}
export enum letterSentBackReasonTypeSet {
  notClear = 1,
  noHomeNo = 2,
  notAccept = 3,
  noReciever = 4,
  overLimit = 5,
  close = 6,
  moved = 7,
  other = 99,
}

export enum memoInformerTypeSet {
  borrower = "B",
  guarantee = "G",
  borrowerWitness = "BW",
  guranteeWitness = "GW",
}
export enum recieptPrintTypeSet {
  initPrint = "IP",
  reprint = "RP",
  cancel = "CL",
  reprintCancel = "CRP",
}

export enum POSShiftLogActionSet {
  open = "OPEN",
  close = "CLOSE",
  count_cash = "COUNT",
  add_cash = "ADD",
  drop_cash = "DROP",
  cashier_login = "LOGIN",
  cashier_logout = "LOGOUT",
  swap_manager = "SWAPMNG",
  swap_cashier = "SWAPCSH",
}
export enum clientTypeSet {
  personal = "P",
  company = "C",
}
export enum receiptStatusSet {
  paid = "PD",
  cancel = "CL",
}
export enum receiptControlLogStatusSet {
  waiting = "WT",
  approve = "AP",
  reject = "RJ",
}
