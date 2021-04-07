// options

const MAX_POSITION = 6;
const UNIT_POSITION = 0;
const TEN_POSITION = 1;

const numbersText = "ศูนย์,หนึ่ง,สอง,สาม,สี่,ห้า,หก,เจ็ด,แปด,เก้า,สิบ".split(
  ","
);
const unitsText = "สิบ,ร้อย,พัน,หมื่น,แสน,ล้าน".split(",");

const reverseNumber = (numberStr: string) => {
  return numberStr
    .split("")
    .reverse()
    .join("");
};

const isZeroValue = (numberChar) => {
  return numberChar === "0";
};

const isUnitPostition = (position: number): boolean => {
  return position === UNIT_POSITION;
};

const isTenPostition = (position: number) => {
  return position % MAX_POSITION === TEN_POSITION;
};

const isMillionsPosition = (position: number) => {
  return position >= MAX_POSITION && position % MAX_POSITION === 0;
};

const isLastPosition = (position, lengthOfDigits) => {
  return position + 1 < lengthOfDigits;
};

const getUnit = (position: number, numberChar: string) => {
  let unitText = "";

  if (!isUnitPostition(position)) {
    unitText = unitsText[Math.abs(position - 1) % MAX_POSITION];
  }

  if (isZeroValue(numberChar) && !isMillionsPosition(position)) {
    unitText = "";
  }

  return unitText;
};

const getText = (position: number, numberChar: string, lengthOfDigits) => {
  let numberText = numbersText[numberChar];

  if (isZeroValue(numberChar)) {
    return "";
  }

  if (isTenPostition(position) && numberChar === "1") {
    numberText = "";
  }

  if (isTenPostition(position) && numberChar === "2") {
    numberText = "ยี่";
  }

  if (
    isMillionsPosition(position) &&
    isLastPosition(position, lengthOfDigits) &&
    numberChar === "1"
  ) {
    numberText = "เอ็ด";
  }

  if (lengthOfDigits > 1 && isUnitPostition(position) && numberChar === "1") {
    numberText = "เอ็ด";
  }

  return numberText;
};

// convert function without async
const convert = (numberStr: string) => {
  const numberStrReverse = reverseNumber(numberStr);
  let textOutput = "";
  // console.log('>', numberReverse.split(''))
  numberStrReverse.split("").forEach((numberChar: string, i) => {
    textOutput =
      getText(i, numberChar, numberStrReverse.length) +
      getUnit(i, numberChar) +
      textOutput;
  });
  return textOutput;
};

export const convertNumberToText = (num: number | string) => {
  const numberStr = num.toString();
  const numberStrSplitIntAndDec = numberStr.split(".");
  let textOutput;
  if (numberStrSplitIntAndDec.length > 1) {
    const integer = numberStrSplitIntAndDec[0];
    const decimal = numberStrSplitIntAndDec[1];
    const textIntegerOutput = convert(integer);
    const textDecimalOutput = convert(decimal);
    textOutput = textDecimalOutput
      ? textIntegerOutput + "บาท" + textDecimalOutput + "สตางค์"
      : textIntegerOutput + "บาทถ้วน";
  } else {
    const integer = numberStrSplitIntAndDec[0];
    textOutput = convert(integer) + "บาทถ้วน";
  }

  return numberStr === "0.00" || num === 0 ? "ศูนย์บาทถ้วน" : textOutput;
};

export const convertIntToText = (num: number | string) => {
  const numberStr = num.toString();
  let textOutput;
  const integer = numberStr;
  textOutput = convert(integer);

  return numberStr === "0" || num === 0 ? "" : textOutput;
};
