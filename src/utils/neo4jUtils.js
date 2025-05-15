export function parseNeo4jInt(n) {
  if (typeof n === "number") return n;
  if (n && typeof n.low === "number" && typeof n.high === "number") {
    const isNegative = n.high < 0;
    const lowUnsigned = n.low >>> 0;
    const highAbs = isNegative ? ~n.high + 1 : n.high;
    // 64비트 정수 계산
    const result = highAbs * 2 ** 32 + lowUnsigned;
    // 음수 보정
    return isNegative ? -result : result;
  }
  return 0;
}
