import floorPlan5F from '../assets/floor-plan-5f-network.png';

/** 楼层平面图资源映射（vite 静态导入） */
export const meetingFloorPlanImages: Record<string, string> = {
  'b8-5f': floorPlan5F,
};

/** 4F / 3F 简版示意图（SVG inline） */
export const meetingFloorPlanSvg: Record<string, string> = {
  'b8-4f': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 420" fill="none">
    <rect width="960" height="420" fill="#fafafa"/>
    <rect x="24" y="24" width="912" height="372" stroke="#333" stroke-width="2" fill="#fff"/>
    <rect x="24" y="180" width="912" height="48" fill="#f0f0f0" stroke="#999"/>
    <text x="480" y="210" text-anchor="middle" fill="#666" font-size="14">走廊</text>
    <rect x="48" y="260" width="200" height="120" stroke="#333" fill="#fff"/>
    <rect x="280" y="260" width="200" height="120" stroke="#333" fill="#fff"/>
    <rect x="512" y="260" width="200" height="120" stroke="#333" fill="#fff"/>
    <text x="148" y="330" text-anchor="middle" fill="#333" font-size="16" font-weight="600">8401</text>
    <text x="380" y="330" text-anchor="middle" fill="#333" font-size="16" font-weight="600">8402</text>
    <text x="612" y="330" text-anchor="middle" fill="#333" font-size="16" font-weight="600">8403</text>
    <text x="480" y="40" text-anchor="middle" fill="#333" font-size="18" font-weight="700">8号楼 4F 平面图</text>
  </svg>`,
  'b7-3f': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 420" fill="none">
    <rect width="960" height="420" fill="#fafafa"/>
    <rect x="24" y="24" width="912" height="372" stroke="#333" stroke-width="2" fill="#fff"/>
    <rect x="24" y="180" width="912" height="48" fill="#f0f0f0" stroke="#999"/>
    <text x="480" y="210" text-anchor="middle" fill="#666" font-size="14">走廊</text>
    <rect x="120" y="240" width="240" height="140" stroke="#333" fill="#fff"/>
    <rect x="480" y="240" width="240" height="140" stroke="#333" fill="#fff"/>
    <text x="240" y="320" text-anchor="middle" fill="#333" font-size="16" font-weight="600">7301</text>
    <text x="600" y="320" text-anchor="middle" fill="#333" font-size="16" font-weight="600">7302</text>
    <text x="480" y="40" text-anchor="middle" fill="#333" font-size="18" font-weight="700">7号楼 3F 平面图</text>
  </svg>`,
};

export function getFloorPlanImageSrc(floorPlanId: string): string {
  if (meetingFloorPlanImages[floorPlanId]) {
    return meetingFloorPlanImages[floorPlanId];
  }
  const svg = meetingFloorPlanSvg[floorPlanId];
  if (svg) {
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  return '';
}
