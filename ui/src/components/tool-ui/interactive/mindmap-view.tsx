import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  MarkerType,
  useReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import { Expand, X } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { cn } from './_adapter';
import type { MindmapData } from './schema';

const BRANCH_COLORS = [
  '#D36A3A',
  '#2F6E6A',
  '#7A56D8',
  '#D97706',
  '#C2410C',
  '#0F766E',
  '#BE185D',
  '#2563EB',
];

type LayoutBranch = {
  label: string;
  children?: LayoutBranch[];
};

type LayoutResult = {
  nodes: Node[];
  edges: Edge[];
};

function countLeaves(branch: LayoutBranch): number {
  if (!branch.children?.length) return 1;
  return branch.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

function buildMindmapLayout(data: MindmapData): LayoutResult {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const horizontalGap = 260;
  const verticalGap = 120;
  const totalLeaves = Math.max(
    1,
    data.branches.reduce((sum, branch) => sum + countLeaves(branch), 0),
  );

  const centerY = ((totalLeaves - 1) * verticalGap) / 2;

  nodes.push({
    id: 'root',
    position: { x: 0, y: centerY },
    data: { label: data.center },
    draggable: true,
    style: {
      width: 210,
      borderRadius: 24,
      border: '1px solid #E8D7CB',
      background: 'linear-gradient(160deg,#231915 0%,#433027 100%)',
      color: '#FFF9F5',
      fontWeight: 700,
      boxShadow: '0 18px 48px rgba(42, 28, 21, 0.14)',
      padding: '18px 20px',
      fontSize: 16,
      textAlign: 'center',
    },
  });

  const visitBranch = (
    branch: LayoutBranch,
    parentId: string,
    depth: number,
    leafStart: number,
    topLevelIndex: number,
  ): number => {
    const leafCount = countLeaves(branch);
    const leafEnd = leafStart + leafCount - 1;
    const y = ((leafStart + leafEnd) / 2) * verticalGap;
    const x = depth * horizontalGap;
    const nodeId = `${parentId}-${depth}-${branch.label}-${leafStart}`.replace(/\s+/g, '-').toLowerCase();
    const color = BRANCH_COLORS[topLevelIndex % BRANCH_COLORS.length];
    const isPrimary = depth === 1;

    nodes.push({
      id: nodeId,
      position: { x, y },
      data: { label: branch.label },
      draggable: true,
      style: {
        width: isPrimary ? 200 : 180,
        borderRadius: isPrimary ? 22 : 20,
        border: `1px solid ${isPrimary ? color : `${color}55`}`,
        background: isPrimary ? `${color}14` : '#FFFDF9',
        color: '#241B17',
        fontWeight: isPrimary ? 700 : 600,
        boxShadow: isPrimary ? `0 14px 36px ${color}22` : '0 10px 26px rgba(42, 28, 21, 0.06)',
        padding: isPrimary ? '16px 18px' : '14px 16px',
        fontSize: isPrimary ? 15 : 14,
        lineHeight: 1.35,
        textAlign: 'center',
      },
    });

    edges.push({
      id: `${parentId}->${nodeId}`,
      source: parentId,
      target: nodeId,
      type: 'smoothstep',
      animated: false,
      style: { stroke: color, strokeWidth: isPrimary ? 2.5 : 1.7, opacity: isPrimary ? 0.95 : 0.7 },
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color },
    });

    let cursor = leafStart;
    branch.children?.forEach(child => {
      const childLeaves = countLeaves(child);
      visitBranch(child, nodeId, depth + 1, cursor, topLevelIndex);
      cursor += childLeaves;
    });

    return leafCount;
  };

  let currentLeaf = 0;
  data.branches.forEach((branch, index) => {
    const leaves = countLeaves(branch);
    visitBranch(branch, 'root', 1, currentLeaf, index);
    currentLeaf += leaves;
  });

  return { nodes, edges };
}

function MindmapCanvas({
  nodes: sourceNodes,
  edges: sourceEdges,
  viewportKey,
  className,
}: {
  nodes: Node[];
  edges: Edge[];
  viewportKey: string;
  className?: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(sourceNodes);
  const [edges, , onEdgesChange] = useEdgesState(sourceEdges);
  const { fitView } = useReactFlow();

  useEffect(() => {
    setNodes(sourceNodes);
  }, [sourceNodes, setNodes]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fitView({ padding: 0.16, minZoom: 0.4, maxZoom: 1.1, duration: 0 });
    }, 30);

    return () => window.clearTimeout(timeout);
  }, [fitView, viewportKey]);

  return (
    <div className={cn('h-[540px] w-full overflow-hidden rounded-[28px] border border-[#E6D8CC] bg-[#FCF7F1]', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.16, minZoom: 0.4, maxZoom: 1.1 }}
        minZoom={0.3}
        maxZoom={1.8}
        panOnDrag
        panOnScroll
        selectionOnDrag={false}
        nodesDraggable
        proOptions={{ hideAttribution: true }}
        className="bg-[radial-gradient(circle_at_top,#FFF8F1_0%,#FCF7F1_55%,#F6EDE4_100%)]"
      >
        <MiniMap
          pannable
          zoomable
          nodeBorderRadius={14}
          maskColor="rgba(248,241,234,0.75)"
          style={{
            background: '#FFFDF9',
            border: '1px solid #E7DCD2',
            borderRadius: 16,
          }}
        />
        <Controls
          showInteractive={false}
          position="bottom-left"
          className="[&>button]:border-[#E5D7CB] [&>button]:bg-white [&>button]:text-[#6B574D] [&>button:hover]:bg-[#FFF4EB]"
        />
        <Background color="#E8D7CB" gap={22} size={1.2} />
      </ReactFlow>
    </div>
  );
}

export function MindmapView({
  data,
  className,
}: {
  data: MindmapData;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const layout = useMemo(() => buildMindmapLayout(data), [data]);

  return (
    <ReactFlowProvider>
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[#E6D8CC] bg-[#FFFAF4] px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-[#2C2019]">Interactive mind map</p>
            <p className="text-xs text-[#7B675D]">Drag to pan, zoom to explore, or open a larger canvas.</p>
          </div>
          <Dialog.Root open={expanded} onOpenChange={setExpanded}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E4D6CB] bg-white px-3 py-2 text-xs font-medium text-[#4B382E] transition-colors hover:bg-[#FFF3EA]"
              >
                <Expand className="h-3.5 w-3.5" />
                Large View
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-[#120C0A]/65 backdrop-blur-sm" />
              <Dialog.Content className="fixed inset-6 z-50 rounded-[32px] border border-[#D8CBC0] bg-[#FFFDF9] p-4 shadow-[0_32px_100px_rgba(24,14,10,0.28)] outline-none">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-[#201813]">Mind map</Dialog.Title>
                    <Dialog.Description className="text-sm text-[#6E5C53]">
                      Full-screen canvas for panning, zooming, and exploring the topic structure.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E4D6CB] bg-white text-[#5A473D] transition-colors hover:bg-[#FFF2E8]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                </div>
                <MindmapCanvas nodes={layout.nodes} edges={layout.edges} viewportKey={expanded ? 'dialog-open' : 'dialog-closed'} className="h-[calc(100vh-9rem)]" />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <MindmapCanvas nodes={layout.nodes} edges={layout.edges} viewportKey={expanded ? 'inline-hidden' : 'inline-visible'} />
      </div>
    </ReactFlowProvider>
  );
}
