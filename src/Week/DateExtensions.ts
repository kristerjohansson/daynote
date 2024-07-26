/**
 * Returns the week number for the specified date.
 * This function uses the ISO 8601 standard to calculate the week number of the year.
 * The first week of the year is the one that contains the first Thursday. The function
 * takes a Date object as input and returns the week number as a number.
 */
export const getWeekNumber = (date: Date) => {
  const dt = new Date(date.valueOf());
  const dayNum = (date.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - dayNum + 3);
  const firstThursday = dt.valueOf();
  dt.setMonth(0, 1);
  if (dt.getDay() !== 4) {
    dt.setMonth(0, 1 + ((4 - dt.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - dt.valueOf()) / 604800000);
};

export const getLastWeekNumberOfYear = (year: number) => {
  let week = 1;
  let day = 31;
  while (week === 1) {
    week = getWeekNumber(new Date(year, 11, day));
    day -= 1;
  }
  return week;
};

export const getFirstDateOfWeek = (year: number, weekNo: number) => {
  // Get a starting date
  let day = 1 + (weekNo - 1) * 7; // 1st of January + 7 days for each week
  let firstDateOfWeek = new Date(year, 0, day);
  if (getWeekNumber(firstDateOfWeek) < weekNo) {
    do {
      day += 1;
      firstDateOfWeek = new Date(year, 0, day);
    } while (getWeekNumber(firstDateOfWeek) < weekNo);
  } else if (getWeekNumber(firstDateOfWeek) > weekNo) {
    do {
      day -= 1;
      firstDateOfWeek = new Date(year, 0, day);
    } while (getWeekNumber(firstDateOfWeek) > weekNo);
    day -= 6;
    firstDateOfWeek = new Date(year, 0, day);
  } else {
    while (getWeekNumber(new Date(year, 0, day - 1)) === weekNo) {
      day -= 1;
    }
    firstDateOfWeek = new Date(year, 0, day);
  }
  return firstDateOfWeek;
};

export const getWeekDates = (year: number, weekNo: number) => {
  const firstDateOfWeek = getFirstDateOfWeek(year, weekNo);
  return [
    firstDateOfWeek,
    new Date(firstDateOfWeek.getFullYear(), firstDateOfWeek.getMonth(), firstDateOfWeek.getDate() + 1),
    new Date(firstDateOfWeek.getFullYear(), firstDateOfWeek.getMonth(), firstDateOfWeek.getDate() + 2),
    new Date(firstDateOfWeek.getFullYear(), firstDateOfWeek.getMonth(), firstDateOfWeek.getDate() + 3),
    new Date(firstDateOfWeek.getFullYear(), firstDateOfWeek.getMonth(), firstDateOfWeek.getDate() + 4),
    new Date(firstDateOfWeek.getFullYear(), firstDateOfWeek.getMonth(), firstDateOfWeek.getDate() + 5),
    new Date(firstDateOfWeek.getFullYear(), firstDateOfWeek.getMonth(), firstDateOfWeek.getDate() + 6),
  ];
};
