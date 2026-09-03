import floorPlan5F from '../assets/floor-plan-5f-network.png';

const office2_2fSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 420" fill="none">
  <rect width="960" height="420" fill="#fafafa"/>
  <rect x="24" y="24" width="912" height="372" stroke="#333" stroke-width="2" fill="#fff"/>
  <rect x="24" y="180" width="912" height="48" fill="#f0f0f0" stroke="#999"/>
  <text x="480" y="210" text-anchor="middle" fill="#666" font-size="14">走廊</text>
  <rect x="80" y="240" width="120" height="100" stroke="#333" fill="#fff"/>
  <rect x="240" y="240" width="120" height="100" stroke="#333" fill="#fff"/>
  <rect x="400" y="240" width="280" height="100" stroke="#333" fill="#fff"/>
  <text x="140" y="300" text-anchor="middle" fill="#333" font-size="14">2202</text>
  <text x="300" y="300" text-anchor="middle" fill="#333" font-size="14">2204</text>
  <text x="540" y="300" text-anchor="middle" fill="#333" font-size="14">2210报告厅</text>
  <text x="480" y="40" text-anchor="middle" fill="#333" font-size="18" font-weight="700">综合办公楼2# 2F 平面图</text>
</svg>`;

const office1_1fSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 420" fill="none">
  <rect width="960" height="420" fill="#fafafa"/>
  <rect x="24" y="24" width="912" height="372" stroke="#333" stroke-width="2" fill="#fff"/>
  <rect x="24" y="180" width="912" height="48" fill="#f0f0f0" stroke="#999"/>
  <text x="480" y="210" text-anchor="middle" fill="#666" font-size="14">走廊</text>
  <rect x="120" y="240" width="200" height="120" stroke="#333" fill="#fff"/>
  <rect x="360" y="240" width="200" height="120" stroke="#333" fill="#fff"/>
  <text x="220" y="310" text-anchor="middle" fill="#333" font-size="14">1103</text>
  <text x="460" y="310" text-anchor="middle" fill="#333" font-size="14">1104</text>
  <text x="480" y="40" text-anchor="middle" fill="#333" font-size="18" font-weight="700">综合办公楼1# 1F 平面图</text>
</svg>`;

const office1_3fSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 420" fill="none">
  <rect width="960" height="420" fill="#fafafa"/>
  <rect x="24" y="24" width="912" height="372" stroke="#333" stroke-width="2" fill="#fff"/>
  <rect x="24" y="180" width="912" height="48" fill="#f0f0f0" stroke="#999"/>
  <text x="480" y="210" text-anchor="middle" fill="#666" font-size="14">走廊</text>
  <rect x="200" y="240" width="240" height="120" stroke="#333" fill="#fff"/>
  <text x="320" y="310" text-anchor="middle" fill="#333" font-size="14">1304</text>
  <text x="480" y="40" text-anchor="middle" fill="#333" font-size="18" font-weight="700">综合办公楼1# 3F 平面图</text>
</svg>`;

const lab8_3fSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 420" fill="none">
  <rect width="960" height="420" fill="#fafafa"/>
  <rect x="24" y="24" width="912" height="372" stroke="#333" stroke-width="2" fill="#fff"/>
  <rect x="24" y="180" width="912" height="48" fill="#f0f0f0" stroke="#999"/>
  <text x="480" y="210" text-anchor="middle" fill="#666" font-size="14">走廊</text>
  <rect x="80" y="240" width="140" height="100" stroke="#333" fill="#fff"/>
  <rect x="260" y="240" width="140" height="100" stroke="#333" fill="#fff"/>
  <rect x="440" y="240" width="140" height="100" stroke="#333" fill="#fff"/>
  <text x="150" y="300" text-anchor="middle" fill="#333" font-size="14">8331</text>
  <text x="330" y="300" text-anchor="middle" fill="#333" font-size="14">8301</text>
  <text x="510" y="300" text-anchor="middle" fill="#333" font-size="14">8304</text>
  <text x="480" y="40" text-anchor="middle" fill="#333" font-size="18" font-weight="700">分子医学楼8# 3F 平面图</text>
</svg>`;

function svgUrl(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const foundationFloorPlanUrls: Record<string, string> = {
  'office2-2f': svgUrl(office2_2fSvg),
  'office1-1f': svgUrl(office1_1fSvg),
  'office1-3f': svgUrl(office1_3fSvg),
  'lab8-3f': svgUrl(lab8_3fSvg),
  'b8-5f': floorPlan5F,
};

export function getFoundationFloorPlanUrl(floorPlanId: string): string {
  return foundationFloorPlanUrls[floorPlanId] ?? '';
}
