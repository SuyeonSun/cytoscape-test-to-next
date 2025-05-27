export const importantNameMap = {
    매출이익: 'salesProfit',
    매출액: 'revenue',
    영업이익: 'operatingProfit',
    순이익: 'netIncome',
};

export function updateMetricDataHelper(name, amount, setMetricData) {
    const key = importantNameMap[name];
    if (!key) return;

    setMetricData((prev) => ({
        ...prev,
        [key]: amount,
    }));
}
