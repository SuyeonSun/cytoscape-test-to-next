export function formatAmountWithMajorUnits(amount) {
  if (amount === 0) return "0원";

  const units = [
    { label: "조", value: 1_0000_0000_0000 },
    { label: "억", value: 1_0000_0000 },
    { label: "만", value: 1_0000 },
  ];
  const result = [];
  const [intStr, decimalStr = ""] = amount.toString().split("."); // 정수, 소수 분리
  let remaining = BigInt(intStr); // 2345678901234567890n

  for (const { label, value } of units) {
    const unitVal = remaining / BigInt(value);
    if (unitVal > 0n) {
      result.push(`${unitVal.toString()}${label}`);
    }
    remaining %= BigInt(value);
  }

  const lastInt = remaining.toString(); // 나머지 원 단위
  const decimal = decimalStr ? `.${decimalStr}` : "";

  if (lastInt === "0" && decimal === "") {
    // 0.0원
  } else if (lastInt === "0" && decimal !== "") {
    // 0.123원
    result.push(`${decimal}`);
  } else {
    // 123.123원
    result.push(`${lastInt}${decimal}`);
  }

  return result.join(" ") + "원";
}

export function formatExactNumber(num) {
  const parts = num.toString().split(".");
  const integer = Number(parts[0]).toLocaleString(); // 콤마 처리
  const decimal = parts[1] ? "." + parts[1] : "";
  return integer + decimal;
}
