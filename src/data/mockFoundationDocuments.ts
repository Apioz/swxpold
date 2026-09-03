import photo2204 from '../assets/meeting-rooms/r-2204.jpg';
import photo2202 from '../assets/meeting-rooms/r-2106.jpg';
import photo1103 from '../assets/meeting-rooms/r-2108.jpg';
import photo1104 from '../assets/meeting-rooms/r-3102.jpg';
import photo1304 from '../assets/meeting-rooms/r-3105.jpg';
import photoLecture from '../assets/meeting-rooms/r-5211.jpg';
import photo8331 from '../assets/meeting-rooms/r-5201.jpg';
import photo8301 from '../assets/meeting-rooms/r-5201.jpg';
import photo8304 from '../assets/meeting-rooms/r-5211.jpg';
import type { DocumentNode, SelectedDocumentImage, SelectedFloorPlan } from '../types/foundationDocument';
import { getFoundationFloorPlanUrl } from './foundationDocumentFloorPlans';

const CAMPUS = '生物芯片智慧园区';

function floorFolder(
  id: string,
  name: string,
  building: string,
  floor: string,
  floorPlanId: string,
  images: { id: string; name: string; url: string }[],
): DocumentNode {
  const floorPlanUrl = getFoundationFloorPlanUrl(floorPlanId);
  return {
    id,
    name,
    type: 'folder',
    floorMeta: { campus: CAMPUS, building, floor, floorPlanId },
    floorPlanUrl,
    children: [
      {
        id: `${id}-arch`,
        name: '01-建筑装修',
        type: 'folder',
        floorMeta: { campus: CAMPUS, building, floor, floorPlanId },
        floorPlanUrl,
        children: [
          {
            id: `${id}-plan`,
            name: `${floor}-平面图.png`,
            type: 'image',
            url: floorPlanUrl,
            uploadDate: '2023-08-12 10:00:00',
          },
          ...images.map((img) => ({
            id: img.id,
            name: img.name,
            type: 'image' as const,
            url: img.url,
            uploadDate: '2023-08-15 14:30:00',
          })),
        ],
      },
      { id: `${id}-elec`, name: '02-电气', type: 'folder', children: [] },
      { id: `${id}-water`, name: '03-给排水', type: 'folder', children: [] },
      { id: `${id}-hvac`, name: '04-暖通', type: 'folder', children: [] },
    ],
  };
}

/** 文档中心目录树（与底座文档中心页面共用） */
export const foundationDocumentTree: DocumentNode[] = [
  {
    id: 'campus-root',
    name: CAMPUS,
    type: 'campus',
    children: [
      {
        id: 'ref-drawings',
        name: '生物芯片-参考图纸',
        type: 'folder',
        uploadDate: '2023-08-12 09:00:00',
        children: [
          {
            id: 'building-office2',
            name: '综合办公楼2#',
            type: 'folder',
            children: [
              floorFolder('office2-2f', '2F', '综合办公楼2#', '2F', 'office2-2f', [
                { id: 'img-2204', name: '2204室-室内全景.jpg', url: photo2204 },
                { id: 'img-2202', name: '2202室-室内全景.jpg', url: photo2202 },
                { id: 'img-2210', name: '2210报告厅-室内全景.jpg', url: photoLecture },
              ]),
            ],
          },
          {
            id: 'building-office1',
            name: '综合办公楼1#',
            type: 'folder',
            children: [
              floorFolder('office1-1f', '1F', '综合办公楼1#', '1F', 'office1-1f', [
                { id: 'img-1103', name: '1103室-室内全景.jpg', url: photo1103 },
                { id: 'img-1104', name: '1104室-室内全景.jpg', url: photo1104 },
              ]),
              floorFolder('office1-3f', '3F', '综合办公楼1#', '3F', 'office1-3f', [
                { id: 'img-1304', name: '1304室-室内全景.jpg', url: photo1304 },
              ]),
            ],
          },
          {
            id: 'building-lab8',
            name: '8#分子医学实验室',
            type: 'folder',
            children: [
              floorFolder('lab8-3f', '3F', '分子医学楼8#', '3F', 'lab8-3f', [
                { id: 'img-8331', name: '8331室-室内全景.jpg', url: photo8331 },
                { id: 'img-8301', name: '8301室-室内全景.jpg', url: photo8301 },
                { id: 'img-8304', name: '8304室-室内全景.jpg', url: photo8304 },
              ]),
            ],
          },
          { id: 'building-office7', name: '7#办公综合楼', type: 'folder', children: [] },
          { id: 'building-rd456', name: '4,5,6#研发楼', type: 'folder', children: [] },
        ],
      },
      {
        id: 'acceptance-docs',
        name: '智慧园区平台验收文件',
        type: 'folder',
        uploadDate: '2023-09-01 11:20:00',
        children: [],
      },
    ],
  },
];

export function findDocumentNode(
  nodes: DocumentNode[],
  id: string,
): DocumentNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findDocumentNode(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function getDocumentChildren(nodeId: string): DocumentNode[] {
  const node = findDocumentNode(foundationDocumentTree, nodeId);
  return node?.children ?? [];
}

export function getDocumentPath(nodeId: string): string {
  const parts: string[] = [];

  function walk(nodes: DocumentNode[], trail: string[]): boolean {
    for (const node of nodes) {
      const next = [...trail, node.name];
      if (node.id === nodeId) {
        parts.push(...next);
        return true;
      }
      if (node.children && walk(node.children, next)) return true;
    }
    return false;
  }

  walk(foundationDocumentTree, []);
  return parts.join(' / ');
}

type FloorContext = {
  campus: string;
  building: string;
  floor: string;
  floorPlanId: string;
  floorPlanUrl: string;
};

function resolveFloorContext(node: DocumentNode): FloorContext | null {
  if (node.floorMeta && node.floorPlanUrl) {
    return {
      campus: node.floorMeta.campus,
      building: node.floorMeta.building,
      floor: node.floorMeta.floor,
      floorPlanId: node.floorMeta.floorPlanId,
      floorPlanUrl: node.floorPlanUrl,
    };
  }
  return null;
}

export function buildSelectedFloorPlan(node: DocumentNode): SelectedFloorPlan | null {
  if (node.type !== 'image' || !node.url || !node.id.endsWith('-plan')) return null;

  function walkWithContext(nodes: DocumentNode[], inherited: FloorContext | null): FloorContext | null {
    for (const n of nodes) {
      const ctx = resolveFloorContext(n) ?? inherited;
      if (n.id === node.id) return ctx;
      if (n.children) {
        const found = walkWithContext(n.children, ctx);
        if (found) return found;
      }
    }
    return null;
  }

  const context = walkWithContext(foundationDocumentTree, null);
  if (!context) return null;

  return {
    imageId: node.id,
    imageName: node.name,
    imageUrl: node.url,
    documentPath: getDocumentPath(node.id),
    campus: context.campus,
    building: context.building,
    floor: context.floor,
    floorPlanId: context.floorPlanId,
  };
}

export function buildSelectedDocumentImage(node: DocumentNode): SelectedDocumentImage | null {
  if (node.type !== 'image' || !node.url) return null;
  if (node.id.endsWith('-plan')) return null;

  function walkWithContext(nodes: DocumentNode[], inherited: FloorContext | null): FloorContext | null {
    for (const n of nodes) {
      const ctx = resolveFloorContext(n) ?? inherited;
      if (n.id === node.id) return ctx;
      if (n.children) {
        const found = walkWithContext(n.children, ctx);
        if (found) return found;
      }
    }
    return null;
  }

  const context = walkWithContext(foundationDocumentTree, null);
  if (!context) return null;

  return {
    imageId: node.id,
    imageName: node.name,
    imageUrl: node.url,
    documentPath: getDocumentPath(node.id),
    campus: context.campus,
    building: context.building,
    floor: context.floor,
    floorPlanId: context.floorPlanId,
    floorPlanUrl: context.floorPlanUrl,
  };
}

export function filterDocumentTree(nodes: DocumentNode[], keyword: string): DocumentNode[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return nodes;

  const filterNode = (node: DocumentNode): DocumentNode | null => {
    if (node.name.toLowerCase().includes(q)) {
      return node;
    }
    if (node.children) {
      const children = node.children
        .map(filterNode)
        .filter((child): child is DocumentNode => child !== null);
      if (children.length > 0) return { ...node, children };
    }
    return null;
  };

  return nodes.map(filterNode).filter((node): node is DocumentNode => node !== null);
}

export function getRootFolderListing(): DocumentNode[] {
  const root = foundationDocumentTree[0];
  return root?.children ?? [];
}

/** 根据会议室地址推断文档中心默认展开的文件夹 */
export function guessDocumentFolderFromAddress(address: string): string | undefined {
  if (address.includes('分子医学楼8#') && address.includes('3F')) return 'lab8-3f-arch';
  if (address.includes('综合办公楼1#') && address.includes('1F')) return 'office1-1f-arch';
  if (address.includes('综合办公楼1#') && address.includes('3F')) return 'office1-3f-arch';
  if (address.includes('综合办公楼2#') && address.includes('2F')) return 'office2-2f-arch';
  return 'ref-drawings';
}
