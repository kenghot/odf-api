function getInstallmentsTimesOverDue(value1, value2, value3, loanAmount, broughtForward){
    const installmentAmountOverDue = getInstallmentsAmountOverDue(value1, value2, loanAmount, broughtForward)
    return Math.ceil(installmentAmountOverDue / +value3);
}
function getInstallmentsAmountOverDue(installmentAmountDue, totalPaidAllMonth, loanAmount, broughtForward){
    const paidAmountBefore = +loanAmount - +broughtForward;
    const installmentAmountOverDue = +installmentAmountDue - +totalPaidAllMonth - paidAmountBefore ;
    return installmentAmountOverDue <= 0 ? 0 : installmentAmountOverDue;
}
