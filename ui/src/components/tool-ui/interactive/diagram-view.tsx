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
import type { DiagramData } from './schema';

const HORIZONTAL_GAP = 280;
const VERTICAL_GAP = 140;

function buildDiagramLayout(data: DiagramData): { nodes: Node[]; edges: Edge[] } {
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  data.nodes.forEach(node => {
    indegree.set(node.id, 0);
    adjacency.set(node.id, []);
  });

  data.edges.forEach(edge => {
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
  });

  const queue = data.nodes.filter(node => (indegree.get(node.id) ?? 0) === 0).map(node => node.id);
  const depthMap = new Map<string, number>();
  const visited = new Set<string>();

  queue.forEach(id => depthMap.set(id, 0));

  while (queue.length > 0) {
    const current = queue.shift()!;
    visited.add(current);
    const currentDepth = depthMap.get(current) ?? 0;

    for (const neighbor of adjacency.get(current) ?? []) {
      depthMap.set(neighbor, Math.max(depthMap.get(neighbor) ?? 0, currentDepth + 1));
      indegree.set(neighbor, (indegree.get(neighbor) ?? 1) - 1);
      if ((indegree.get(neighbor) ?? 0) <= 0) {
        queue.push(neighbor);
      }
    }
  }

  data.nodes.forEach((node, index) => {
    if (!depthMap.has(node.id)) {
      depthMap.set(node.id, index % 2);
    }
  });

  const layers = new Map<number, typeof data.nodes>();
  data.nodes.forEach(node => {
    const depth = depthMap.get(node.id) ?? 0;
    const layer = layers.get(depth) ?? [];
    layer.push(node);
    layers.set(depth, layer);
  });

  const direction = data.direction ?? 'TB';
  const nodes: Node[] = [];

  Array.from(layers.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([depth, layer]) => {
      const layerOffset = ((layer.length - 1) * (direction === 'LR' ? VERTICAL_GAP : HORIZONTAL_GAP)) / 2;

      layer.forEach((node, index) => {
        const primary = depth * (direction === 'LR' ? HORIZONTAL_GAP : VERTICAL_GAP);
        const secondary = index * (direction === 'LR' ? VERTICAL_GAP : HORIZONTAL_GAP) - layerOffset;

        const x = direction === 'LR' ? primary : secondary;
        const y = direction === 'LR' ? secondary : primary;

        nodes.push({
          id: node.id,
          position: { x, y },
          data: { label: node.label, description: node.description },
          draggable: true,
          style: {
            width: 220,
            borderRadius: 24,
            border: '1px solid #E5D8CC',
            background: '#FFFDF9',
            color: '#231B16',
            fontWeight: 600,
            padding: '16px 18px',
            lineHeight: 1.35,
            boxShadow: '0 14px 34px rgba(42, 28, 21, 0.08)',
            textAlign: 'center',
          },
        });
      });
    });

  const edges: Edge[] = data.edges.map((edge, index) => ({
    id: `${edge.from}-${edge.to}-${index}`,
    source: edge.from,
    target: edge.to,
    label: edge.label,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#D36A3A', width: 18, height: 18 },
    style: { stroke: '#D36A3A', strokeWidth: 2.2 },
    labelStyle: {
      fill: '#7A675D',
      fontSize: 12,
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: '#FFF8F1',
      stroke: '#ECDDD1',
      rx: 8,
      ry: 8,
    },
    labelBgPadding: [6, 3],
  }));

  return { nodes, edges };
}

function DiagramCanvas({
  sourceNodes,
  sourceEdges,
  onSelectNode,
  selectedNodeId,
  viewportKey,
  className,
}: {
  sourceNodes: Node[];
  sourceEdges: Edge[];
  onSelectNode: (nodeId: string | null) => void;
  selectedNodeId: string | null;
  viewportKey: string;
  className?: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(sourceNodes);
  const [edges, , onEdgesChange] = useEdgesState(sourceEdges);
  const { fitView } = useReactFlow();

  useEffect(() => {
    setNodes(
      sourceNodes.map(node => ({
        ...node,
        style: {
          ...node.style,
          border: node.id === selectedNodeId ? '1px solid #D36A3A' : '1px solid #E5D8CC',
          boxShadow: node.id === selectedNodeId
            ? '0 18px 42px rgba(211,106,58,0.18)'
            : '0 14px 34px rgba(42, 28, 21, 0.08)',
          background: node.id === selectedNodeId ? '#FFF6EE' : '#FFFDF9',
        },
      })),
    );
  }, [selectedNodeId, setNodes, sourceNodes]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fitView({ padding: 0.18, minZoom: 0.35, maxZoom: 1.1, duration: 0 });
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
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        fitView
        fitViewOptions={{ padding: 0.18, minZoom: 0.35, maxZoom: 1.1 }}
        minZoom={0.25}
        maxZoom={1.8}
        panOnDrag
        panOnScroll
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

export function DiagramView({
  data,
  className,
}: {
  data: DiagramData;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const layout = useMemo(() => buildDiagramLayout(data), [data]);
  const selectedNode = useMemo(
    () => data.nodes.find(node => node.id === selectedNodeId) ?? null,
    [data.nodes, selectedNodeId],
  );

  return (
    <ReactFlowProvider>
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[#E6D8CC] bg-[#FFFAF4] px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-[#2C2019]">Interactive diagram</p>
            <p className="text-xs text-[#7B675D]">Pan, zoom, click nodes for details, or open a larger canvas.</p>
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
                    <Dialog.Title className="text-lg font-semibold text-[#201813]">Diagram</Dialog.Title>
                    <Dialog.Description className="text-sm text-[#6E5C53]">
                      Full-screen canvas for exploring the structure and relationships in the lesson.
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
                <DiagramCanvas
                  sourceNodes={layout.nodes}
                  sourceEdges={layout.edges}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  viewportKey={expanded ? 'dialog-open' : 'dialog-closed'}
                  className="h-[calc(100vh-12rem)]"
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <DiagramCanvas
          sourceNodes={layout.nodes}
          sourceEdges={layout.edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          viewportKey={expanded ? 'inline-hidden' : 'inline-visible'}
        />

        {selectedNode?.description && (
          <div className="rounded-[22px] border border-[#E6D8CC] bg-[#FFFBF7] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#8B776C]">Selected Node</p>
            <p className="mt-2 text-sm font-semibold text-[#241B17]">{selectedNode.label}</p>
            <p className="mt-1 text-sm leading-6 text-[#68584F]">{selectedNode.description}</p>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}
