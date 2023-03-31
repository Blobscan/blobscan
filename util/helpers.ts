export const formatDate = (date: number) => {
  const newDate = new Date(date * 1000).toUTCString();

  return newDate;
};
