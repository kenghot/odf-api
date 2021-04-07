function getCurrentDateTime() {
    const date = new Date();
    return `พิมพ์วันที่ ${formatThaiDate(date)} เวลา ${date.toLocaleTimeString("th-TH", {timeZone: "Asia/Bangkok", hour12: false})}`
}