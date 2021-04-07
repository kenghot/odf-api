import * as iconv from "iconv-lite";

export const fullNameFormatting = (
  title: string,
  firstname: string,
  lastname: string
) => {
  return `${title ? title : ""}${firstname ? firstname : ""}${
    lastname ? `${" "}${lastname}` : ""
  }`.trim();
};

export const idcardFormatting = (original: any) => {
  const cleaned = ("" + original).replace(/\D/g, "");
  let formated = cleaned;
  const conditionList = [
    /^(\d{1})(\d{1,4})$/,
    /^(\d{1})(\d{1,4})(\d{1,5})$/,
    /^(\d{1})(\d{1,4})(\d{1,5})(\d{1,2})$/,
    /^(\d{1})(\d{1,4})(\d{1,5})(\d{1,2})(\d{1})$/
  ];
  const BreakException = {};
  try {
    conditionList.forEach((condition: any, index: number) => {
      const match = cleaned.match(condition);
      if (match) {
        formated = match.slice(1, match.length).join("-");
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) throw e;
  }
  return formated;
};

export const phoneNumberFormatting = (phoneNumberString: string): string => {
  const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
  let match;
  // ความยาวเบอร์มือถือมากกว่า 9 เป็นเบอร์ mobile
  if (cleaned.length > 9) {
    match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  } else {
    match = cleaned.match(/^(\d{2})(\d{3})(\d{4})$/);
  }
  if (match) {
    return match[1] + "-" + match[2] + "-" + match[3];
  }
  return phoneNumberString;
};

export const validateUpper = (char: number) => {
  return (
    char === 209 || (char >= 212 && char <= 215) || (char >= 231 && char <= 238)
  );
};
export const validateLower = (char: number) => {
  return char >= 216 && char <= 218;
};
export const calMainChar = (text: string) => {
  let count = 0;
  const ascii = iconv.encode(text, "TIS-620");
  const length = Array.from(Array(+ascii.length).keys());
  length.forEach((index: number) => {
    if (!(validateUpper(ascii[index]) || validateLower(ascii[index]))) {
      count += 1;
    }
  });
  return count;
};
