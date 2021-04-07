import * as enum_set from "../../config-data/enum_set.json";

export type AllEnumType =
  | "loanType"
  | "resultType"
  | "requestStatus"
  | "agreementStatus"
  | "guaranteeStatus"
  | "accountReceivableStatus"
  | "arTransactionStatus"
  | "voucherStatus"
  | "paymentType"
  | "paymentMethod"
  | "guarantorBorrowerRelationship"
  | "marriageStatus"
  | "addressType"
  | "residenceType"
  | "residenceStatusType"
  | "residenceWith"
  | "occupationType"
  | "bank"
  | "sequenceType"
  | "committee"
  | "region"
  | "clientType"
  | "receiptStatus"
  | "posRefType"
  | "monthTH"
  | "monthEN"
  | "csZone"
  | "donationType";

export interface IItemSet {
  key: string;
  text: string;
  value: any;
}

export const getEnumSetText = (enumType: AllEnumType, value: any) => {
  const enumSet: any = enum_set;
  const findingEnumSet = enumSet.find((enumSet) => {
    return enumSet.type === enumType;
  });
  if (findingEnumSet) {
    const findingValue = findingEnumSet.items.find(
      (enumSetItem) => enumSetItem.value === value
    );
    return findingValue ? findingValue.text : undefined;
  } else {
    return undefined;
  }
};

export const getEnumSetList = (enumType: AllEnumType) => {
  const enumSet: any = enum_set;
  const findingEnumSet = enumSet.find((enumSet) => {
    return enumSet.type === enumType;
  });

  return findingEnumSet ? findingEnumSet.items : undefined;
};
