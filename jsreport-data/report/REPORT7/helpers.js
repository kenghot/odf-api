function isFirstOfRegion(data, index) {
    const length = data.length;
    if(index === 0 || data[index].orgName !== data[index-1].orgName ) {
        return true;
    } else {
        return false;
    }
}

function renderFirstRegionText(data, index) {
    const length = data.length;    
    return isFirstOfRegion(data, index) ? data[index].region : "";
}

let totalAllOutstandingDebtBalance = 0;
let totalAllAllOutstandingDebtBalance = 0;

function getTotalOutstandingDebtBalance(totalARLoanAmount, totalPaidAmount){
    const totalOutstandingDebtBalance = +totalARLoanAmount - +totalPaidAmount
    totalAllOutstandingDebtBalance += totalOutstandingDebtBalance
    totalAllAllOutstandingDebtBalance += totalOutstandingDebtBalance
    return totalOutstandingDebtBalance
}

function resetTotalAllOutstandingDebtBalance(){
    totalAllOutstandingDebtBalance = 0;
}

function renderTotalAllOutstandingDebtBalance(){
    return totalAllOutstandingDebtBalance
}

function renderTotalAllAllOutstandingDebtBalance(){
    return totalAllAllOutstandingDebtBalance
}