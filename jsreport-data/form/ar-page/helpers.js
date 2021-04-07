function displayBarcode(value) {
    return value ? `display:block;position:absolute;padding-left:14;` : "display:none"
}
function getInstallmentLastAmount(installmentAmount, installmentLastAmount){
    return +installmentLastAmount > 0 ? installmentLastAmount : installmentAmount;
}