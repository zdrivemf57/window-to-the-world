export function buildSkylineUrl(city: string): string {
  const urlBase = "https://www.skylinewebcams.com/en/webcam";
  const cityMap: Record<string, string> = {
    tokyo: "japan/tokyo/shinjuku.html",
    paris: "france/ile-de-france/paris/eiffel-tower.html",
    rome: "italia/lazio/roma/colosseo.html",
    newyork: "usa/new-york/times-square.html",
    hawaii: "usa/hawaii/honolulu.html",
  };
  const key = city.toLowerCase();
  return cityMap[key] ? `${urlBase}/${cityMap[key]}` : "";
}
