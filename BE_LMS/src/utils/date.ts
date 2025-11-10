export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const onYearFromNow = () => {
  return new Date(Date.now() + 360 * 24 * 60 * 60 * 1000);
};

export const thirtyDaysFromNow = () => {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
};

export const fifteenMinutesFromNow = () => {
  return new Date(Date.now() + 15 * 60 * 1000);
};

export const fiveMinutesAgo = () => {
  return new Date(Date.now() - 5 * 60 * 1000);
};
export const oneHourFromNow = () => {
  return new Date(Date.now() + 1 * 60 * 60 * 1000);
};

export const isDateInFuture = (val: Date) => {
  if (!val) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // đầu ngày hôm nay

  const dateToCheck = new Date(val);
  dateToCheck.setHours(0, 0, 0, 0); // đầu ngày của val

  return dateToCheck > today;
};
