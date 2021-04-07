import moment = require("moment");
import { DeepPartial } from "typeorm";
import {
  BUDDHIST_DATE_FORMAT,
  LAST_GOVERNMENT_FISCAL_MONTH,
} from "./constants";

// export const getFiscalYear = (date: Date, fiscalYear: number): number => {
//     const [month, year] = getMonthYear(date);
//     if (month > LAST_GOVERNMENT_FISCAL_MONTH && year === fiscalYear) {
//         fiscalYear += 1;
//         return fiscalYear;
//     }
//     return fiscalYear;
// };

// tslint:disable-next-line: no-var-requires
require("node-datetime-thai");

const thaiDate = new Date() as any;
const thaiPattern = thaiDate.getThaiPattern();

export const getThaiPartialDate = (date: Date | string | null): Date | null => {
  if (date === null) {
    return null;
  } else {
    const dateObj = new Date(date) as any;
    if (isNaN(dateObj)) {
      return null;
    }
    return dateObj.toThaiString(thaiPattern.partial);
  }
};

export const getFiscalYear = (date: Date): number => {
  let [month, year] = getMonthYear(date);
  if (month > LAST_GOVERNMENT_FISCAL_MONTH) {
    year += 1;
    return year;
  }
  return year;
};

const getMonthYear = (date: Date): [number, number] => {
  const dateObj = new Date(date);
  const month = dateObj.getMonth() + 1;
  const year = dateObj.toLocaleDateString(BUDDHIST_DATE_FORMAT, {
    year: "numeric",
  });
  return [month, +year];
};
export const getMonthYearText = (date: Date | string): string => {
  const thaiDate: any = getThaiPartialDate(date);
  if (thaiDate) {
    const [day, ...rest] = thaiDate.split(" ");
    return rest.join(" ");
  }
  return "";
};

export const getAge = (birthday: Date, date: Date) => {
  const birthdayDate = moment(birthday);
  const currentDate = moment(date);
  const age = currentDate.diff(birthdayDate, "years");
  return age;
};

export type monthIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
