export const getEntryFee = (olympiad) => {
  const value = Number(olympiad?.entryFeeCoins ?? 50);
  return Number.isSafeInteger(value) && value >= 0 ? value : 50;
};