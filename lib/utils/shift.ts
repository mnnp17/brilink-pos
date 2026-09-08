export function getAutoShift(loginDate = new Date()) {
  const hours = loginDate.getHours();
  
  if (hours >= 6 && hours < 14) {
    return { name: "Shift 1 (Pagi)", timeRange: "06:00 - 14:00", color: "bg-amber-100 text-amber-800 border-amber-300" };
  } else if (hours >= 14 && hours < 22) {
    return { name: "Shift 2 (Siang/Sore)", timeRange: "14:00 - 22:00", color: "bg-blue-100 text-blue-800 border-blue-300" };
  } else {
    return { name: "Shift 3 (Malam)", timeRange: "22:00 - 06:00", color: "bg-indigo-100 text-indigo-800 border-indigo-300" };
  }
}
