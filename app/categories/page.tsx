"use client";

import React, { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FolderTree, Plus, Trash2, X, Link2, MousePointer2, ZoomIn, ZoomOut } from "lucide-react";
import cn from "classnames";
import { useTheme } from "next-themes";
import { useAdminViewMode } from "@/components/AdminViewModeProvider";

type Category = {
  _id: Id<"categories">;
  _creationTime: number;
  name: string;
  parentId?: Id<"categories">;
  x?: number;
  y?: number;
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;
const DEFAULT_X = 100;
const DEFAULT_Y = 100;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function CategoriesPage() {
  const { isAdmin } = useAdminViewMode();
  const { theme } = useTheme();

  const categories = useQuery(api.myFunctions.listCategories, {});
  const createCategory = useMutation(api.myFunctions.createCategory);
  const updateCategory = useMutation(api.myFunctions.updateCategory);
  const deleteCategory = useMutation(api.myFunctions.deleteCategory);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [draggingId, setDraggingId] = useState<Id<"categories"> | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [selectedId, setSelectedId] = useState<Id<"categories"> | null>(null);
  const [editingId, setEditingId] = useState<Id<"categories"> | null>(null);
  const [editingName, setEditingName] = useState("");

  const [connectingFrom, setConnectingFrom] = useState<Id<"categories"> | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [addPosition, setAddPosition] = useState({ x: DEFAULT_X, y: DEFAULT_Y });

  const [error, setError] = useState<string | null>(null);

  const nodes = useMemo(() => {
    const list = (categories ?? []) as Category[];
    const nextX = DEFAULT_X;
    const nextY = DEFAULT_Y;
    return list.map((c, i) => {
      const x = c.x ?? nextX + i * 220;
      const y = c.y ?? nextY + Math.floor(i / 4) * 100;
      return { ...c, x, y };
    });
  }, [categories]);

  const nodesById = useMemo(() => {
    const map = new Map<Id<"categories">, Category & { x: number; y: number }>();
    for (const n of nodes) map.set(n._id, n);
    return map;
  }, [nodes]);

  const connections = useMemo(() => {
    const lines: { from: Id<"categories">; to: Id<"categories"> }[] = [];
    for (const n of nodes) {
      if (n.parentId) {
        lines.push({ from: n.parentId, to: n._id });
      }
    }
    return lines;
  }, [nodes]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas) {
      setSelectedId(null);
      setConnectingFrom(null);
      if (e.button === 0) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    if (draggingId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
      const y = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;
      updateCategory({ categoryId: draggingId, x, y });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingId(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: Category & { x: number; y: number }) => {
    e.stopPropagation();
    setSelectedId(node._id);

    if (connectingFrom && connectingFrom !== node._id) {
      handleConnect(connectingFrom, node._id);
      setConnectingFrom(null);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;
    setDragOffset({ x: mouseX - node.x, y: mouseY - node.y });
    setDraggingId(node._id);
  };

  const handleConnect = async (fromId: Id<"categories">, toId: Id<"categories">) => {
    setError(null);
    try {
      await updateCategory({ categoryId: toId, parentId: fromId });
    } catch (error: unknown) {
      setError(errorMessage(error, "Failed to connect"));
    }
  };

  const handleDisconnect = async (nodeId: Id<"categories">) => {
    setError(null);
    try {
      await updateCategory({ categoryId: nodeId, parentId: null });
    } catch (error: unknown) {
      setError(errorMessage(error, "Failed to disconnect"));
    }
  };

  const handleDelete = async (nodeId: Id<"categories">) => {
    setError(null);
    try {
      await deleteCategory({ categoryId: nodeId });
      setSelectedId(null);
    } catch (error: unknown) {
      setError(errorMessage(error, "Failed to delete"));
    }
  };

  const handleDoubleClick = (node: Category) => {
    setEditingId(node._id);
    setEditingName(node.name);
  };

  const handleRename = async () => {
    if (!editingId || !editingName.trim()) return;
    setError(null);
    try {
      await updateCategory({ categoryId: editingId, name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
    } catch (error: unknown) {
      setError(errorMessage(error, "Failed to rename"));
    }
  };

  const handleAddNode = async () => {
    if (!newName.trim()) return;
    setError(null);
    try {
      await createCategory({ name: newName.trim(), x: addPosition.x, y: addPosition.y });
      setNewName("");
      setShowAddModal(false);
    } catch (error: unknown) {
      setError(errorMessage(error, "Failed to create"));
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current && !(e.target as HTMLElement).dataset.canvas) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    setAddPosition({ x, y });
    setShowAddModal(true);
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] text-zinc-900 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-zinc-200/80 bg-white dark:bg-[#0A0A0C] dark:border-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-950 dark:text-white">Category Canvas</h1>
              <p className="text-xs text-zinc-500 dark:text-slate-400">Drag nodes, double-click to add/rename, connect parent→child</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={zoomOut} className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 transition-colors">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-zinc-500 dark:text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 transition-colors">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setAddPosition({ x: 200, y: 200 }); setShowAddModal(true); }}
              className="ml-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Node
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-200">×</button>
          </div>
        )}

        {!isAdmin ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              Admin access required.
            </div>
          </div>
        ) : (
          <div
            ref={canvasRef}
            data-canvas="true"
            className="flex-1 relative overflow-hidden bg-zinc-50 dark:bg-[#0d0d12] cursor-grab active:cursor-grabbing"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onDoubleClick={handleCanvasDoubleClick}
            style={{
              backgroundImage: theme === "dark"
                ? `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`
                : `radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
          >
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
            >
              {connections.map(({ from, to }) => {
                const fromNode = nodesById.get(from);
                const toNode = nodesById.get(to);
                if (!fromNode || !toNode) return null;
                const x1 = fromNode.x + NODE_WIDTH / 2;
                const y1 = fromNode.y + NODE_HEIGHT;
                const x2 = toNode.x + NODE_WIDTH / 2;
                const y2 = toNode.y;
                return (
                  <g key={`${from}-${to}`}>
                    <path
                      d={`M ${x1} ${y1} C ${x1} ${y1 + 40}, ${x2} ${y2 - 40}, ${x2} ${y2}`}
                      fill="none"
                      stroke="rgba(99, 102, 241, 0.5)"
                      strokeWidth={2}
                    />
                    <polygon
                      points={`${x2},${y2} ${x2 - 6},${y2 - 10} ${x2 + 6},${y2 - 10}`}
                      fill="rgba(99, 102, 241, 0.7)"
                    />
                  </g>
                );
              })}
            </svg>

            <div
              className="absolute"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
            >
              {nodes.map((node) => (
                <div
                  key={node._id}
                  className={cn(
                    "absolute rounded-xl border-2 bg-white text-zinc-950 shadow-sm transition-shadow cursor-pointer select-none dark:bg-[#1a1d2e] dark:text-white",
                    selectedId === node._id ? "border-indigo-500 shadow-indigo-500/30" : "border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20",
                    connectingFrom === node._id && "ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-[#0d0d12]"
                  )}
                  style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(node); }}
                >
                  <div className="flex items-center justify-center h-full px-3">
                    {editingId === node._id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setEditingId(null); setEditingName(""); } }}
                        className="w-full bg-transparent text-center text-sm font-semibold text-zinc-950 border-b border-indigo-500 outline-none dark:text-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{node.name}</span>
                    )}
                  </div>

                  {!node.parentId && (
                    <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center" title="Root category">
                      <span className="text-[8px] font-bold text-black">R</span>
                    </div>
                  )}

                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  </div>
                </div>
              ))}
            </div>

            {selectedId && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#1a1d2e]/95 dark:shadow-2xl">
                <span className="text-xs text-zinc-500 dark:text-slate-400 mr-2">Selected: <strong className="text-zinc-900 dark:text-white">{nodesById.get(selectedId)?.name}</strong></span>
                <button
                  onClick={() => setConnectingFrom(selectedId)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    connectingFrom === selectedId ? "bg-green-600 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  )}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {connectingFrom === selectedId ? "Click child..." : "Connect"}
                </button>
                {nodesById.get(selectedId)?.parentId && (
                  <button
                    onClick={() => handleDisconnect(selectedId)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Disconnect
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedId)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-650 hover:bg-red-500/20 dark:text-red-300 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}

            {connectingFrom && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs font-medium text-green-750 dark:text-green-300 backdrop-blur-sm">
                <MousePointer2 className="inline h-3.5 w-3.5 mr-1.5" />
                Click another node to set it as child of &quot;{nodesById.get(connectingFrom)?.name}&quot;
                <button onClick={() => setConnectingFrom(null)} className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200">Cancel</button>
              </div>
            )}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#131728]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">New Category Node</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-full text-zinc-450 hover:bg-zinc-100 hover:text-zinc-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddNode(); }}
                placeholder="Category name..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-black/40 dark:text-white dark:placeholder:text-slate-600"
              />
              <div className="mt-4 flex items-center justify-end gap-3">
                <button onClick={() => setShowAddModal(false)} className="rounded-full px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-slate-400 dark:hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleAddNode}
                  disabled={!newName.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
