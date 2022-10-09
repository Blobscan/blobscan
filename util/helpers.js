export const formatDate = (date) => {
  const newDate = new Date(date * 1000).toDateString();

  return newDate;
};
