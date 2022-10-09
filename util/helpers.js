export const formatDate = (date) => {
  const newDate = new Date(date * 1000).toUTCString();

  return newDate;
};
