export const getHours = (timeStr: string) => {
  const regex = /\b\d{2}:\d{2}\b/g;
  const timeList = timeStr.match(regex);
  if (!timeList) return '配送時間指定なし';
  return `${timeList[0] ?? ''} - ${timeList[1] ?? ''}`
}

// const testStr = '20241226 19:00-20241226 21:00';
// const time = getHours(testStr);
// console.log(time);