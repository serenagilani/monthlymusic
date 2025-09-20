export function currentMonthCode(date = new Date()) {
  const mmm = date.toLocaleString("en-US", { month: "short" }).toLowerCase(); // sep
  const yy = date.getFullYear().toString().slice(-2);                          // 25
  return `${mmm}${yy}`;                                                        // sep25
}
