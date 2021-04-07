function renderInstallmentsAmountDueCell(data, index) {
    return data[index].installmentsDue * data[index].installmentAmount;
}

function renderInstallmentsOverDueCell(data, index) {
    const installmentsOverDue = Math.ceil(data[index].installmentsDue - (data[index].totalPaidAllMonth / data[index].installmentAmount));
    return installmentsOverDue < 0 ? 0 : installmentsOverDue;
}

function renderInstallmentsAmountOverDueCell(data, index) {
    const installmentsAmountOverDue = renderInstallmentsOverDueCell(data, index) * data[index].installmentAmount;
    return installmentsAmountOverDue < 0 ? 0 : installmentsAmountOverDue;
}