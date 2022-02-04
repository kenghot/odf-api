import moment = require("moment");
import Big from "big.js";


enum interestTypeSet {
  fix = "FIX"
}

enum calculateTypeSet {
  flat = "FLAT"
}

export const interestCalculate = async (req, res, next) => {
  const {
    startDate,
    endDate,
    interestType = interestTypeSet.fix,
    calculateType = calculateTypeSet.flat,
    interestRate,
    debtAmount
  } = req.query;
  try {
    let interest = "";
    switch (interestType) {
      case interestTypeSet.fix:
        interest = withFixRate(startDate, endDate, interestRate, debtAmount);
    }

    res.locals.data = interest;
    next();
  } catch (e) {
    return next(e);
  }
};

const withFixRate = (startDate, endDate, rate, debtAmount) => {
  const sd = moment(startDate);
  const ed = moment(endDate);
  const days = ed.diff(sd, "days");
  // const months = ed.diff(sd, "months");
  const years = ed.diff(sd, "years", true);
  // console.log(days, months, years);
  // console.log(debtAmount * (rate / 100) * years);
  // const interest = Big(debtAmount).times(rate).div(100).times(years).toFixed(2)
  const interest = (debtAmount * ((days+1)/365) * (rate/100)).toFixed(2)
  return interest;
};
