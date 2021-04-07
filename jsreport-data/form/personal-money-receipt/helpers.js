function sumValueSubtotal(list) {
  if (list.length > 0) {
    const sumVal = list.reduce((sum, item) => sum + +item.subtotal,0);
    if (sumVal === 0) return "0";
    return currency(sumVal);
  } else {
    return "-";
  }
}