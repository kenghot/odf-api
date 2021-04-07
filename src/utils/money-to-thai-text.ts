// options

const MAX_POSITION = 6;
const UNIT_POSITION = 0;
const TEN_POSITION = 1;

const primaryCurrency = "บาท";
const secondaryCurrency = "สตางค์";
const fullMoney = "ถ้วน";

const numbersText = "ศูนย์,หนึ่ง,สอง,สาม,สี่,ห้า,หก,เจ็ด,แปด,เก้า,สิบ".split(
  ","
);
const unitsText = "สิบ,ร้อย,พัน,หมื่น,แสน,ล้าน".split(",");

const getFractionalDigits = (numberStr: string) => {
  return numberStr.split(".")[1];
};

const hasFractionalDigits = (numberInput) => {
  return numberInput !== undefined && numberInput !== "00";
};

const getIntegerDigits = (numberStr: string) => {
  return numberStr.split(".")[0];
};

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

const getBathUnit = (position: number, numberChar: string) => {
  let unitText = "";

  if (!isUnitPostition(position)) {
    unitText = unitsText[Math.abs(position - 1) % MAX_POSITION];
  }

  if (isZeroValue(numberChar) && !isMillionsPosition(position)) {
    unitText = "";
  }

  return unitText;
};

const getBathText = (position: number, numberChar: string, lengthOfDigits) => {
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
      getBathText(i, numberChar, numberStrReverse.length) +
      getBathUnit(i, numberChar) +
      textOutput;
  });
  return textOutput;
};

export const convertFullMoney = (money: number) => {
  const numberStr = money.toFixed(2);

  const integerDigits = getIntegerDigits(numberStr);
  const fractionalDigits = getFractionalDigits(numberStr);

  let textOutput = convert(integerDigits);

  if (hasFractionalDigits(fractionalDigits)) {
    textOutput = `${textOutput}${primaryCurrency}${convert(
      fractionalDigits
    )}${secondaryCurrency}`;
  } else {
    textOutput = `${textOutput}${primaryCurrency}${fullMoney}`;
  }
  return textOutput;
};
