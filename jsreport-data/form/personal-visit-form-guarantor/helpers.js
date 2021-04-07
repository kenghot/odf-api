function calculateInstallmentTimes(outstandingDebt,installmentAmount) {
  return Math.ceil(parseInt(outstandingDebt)/parseInt(installmentAmount));
} 