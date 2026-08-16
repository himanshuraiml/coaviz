import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Pen, 
  Highlighter, 
  Flame, 
  Eraser, 
  Trash2, 
  X, 
  Undo2,
  Redo2,
  Minus,
  Plus,
  Download
} from 'lucide-react';

export type ToolType = 'pen' | 'highlighter' | 'laser' | 'eraser';

export interface WhiteboardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  tool: ToolType;
  color: string;
  width: number;
  points: Point[];
}

export const WhiteboardOverlay: React.FC<WhiteboardOverlayProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#f59e0b'); // amber
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  
  // Ref mirrors to avoid stale closures in event listeners & animation loops
  const strokesRef = useRef<Stroke[]>([]);
  strokesRef.current = strokes;

  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const laserPointsRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const dprRef = useRef<number>(1);

  const colors = [
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Cyan', value: '#0284c7' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'White', value: '#ffffff' },
    { label: 'Charcoal', value: '#0f172a' },
  ];

  // Draw a single stroke onto a 2D context
  const drawSingleStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const pts = stroke.points;
    if (!pts || pts.length === 0) return;

    ctx.save();

    if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color + '55'; // ~33% opacity
      ctx.fillStyle = stroke.color + '55';
      ctx.lineWidth = stroke.width * 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = stroke.width * 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      // Pen
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    if (pts.length === 1) {
      // Single tap dot
      const radius = Math.max(1, (stroke.tool === 'highlighter' ? stroke.width * 1.75 : stroke.tool === 'eraser' ? stroke.width * 2.5 : stroke.width / 2));
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (pts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
    } else {
      // Smooth curve using quadratic bezier interpolation
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }
      const last = pts[pts.length - 1];
      const secondLast = pts[pts.length - 2];
      ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  // Redraw all strokes from a provided list or current strokesRef
  const redrawAllStrokes = useCallback((strokeList?: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    // Reset transform to identity before clearing entire physical canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Re-apply High-DPI scale
    const dpr = dprRef.current;
    ctx.scale(dpr, dpr);

    const list = strokeList ?? strokesRef.current;
    for (let i = 0; i < list.length; i++) {
      drawSingleStroke(ctx, list[i]);
    }
    ctx.restore();
  }, [drawSingleStroke]);

  // Sizing and initialization of both canvases (Only runs on open / window resize)
  useEffect(() => {
    if (!isOpen) return;

    const setupCanvases = () => {
      const canvas = canvasRef.current;
      const laserCanvas = laserCanvasRef.current;
      if (!canvas || !laserCanvas) return;

      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Set physical buffer size
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      laserCanvas.width = Math.floor(width * dpr);
      laserCanvas.height = Math.floor(height * dpr);

      // Set CSS display size
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      laserCanvas.style.width = `${width}px`;
      laserCanvas.style.height = `${height}px`;

      // Scale contexts for High-DPI
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      const laserCtx = laserCanvas.getContext('2d');
      if (laserCtx) {
        laserCtx.scale(dpr, dpr);
      }

      // Redraw any existing strokes
      redrawAllStrokes();
    };

    setupCanvases();

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setupCanvases, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, redrawAllStrokes]);

  // Laser Pointer Animation Loop
  useEffect(() => {
    if (!isOpen) return;
    let animationFrameId: number;

    const renderLaser = () => {
      const laserCanvas = laserCanvasRef.current;
      if (laserCanvas) {
        const ctx = laserCanvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, laserCanvas.width, laserCanvas.height);
          const dpr = dprRef.current;
          ctx.scale(dpr, dpr);

          const nowPoints = laserPointsRef.current;
          for (let i = 0; i < nowPoints.length; i++) {
            const pt = nowPoints[i];
            pt.alpha -= 0.035;

            if (pt.alpha > 0) {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(239, 68, 68, ${Math.max(0, pt.alpha)})`;
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 12;
              ctx.fill();
            }
          }
          laserPointsRef.current = nowPoints.filter((pt) => pt.alpha > 0);
          ctx.restore();
        }
      }
      animationFrameId = requestAnimationFrame(renderLaser);
    };

    animationFrameId = requestAnimationFrame(renderLaser);
    return () => {
      cancelAnimationFrame(animationFrameId);
      laserPointsRef.current = [];
    };
  }, [isOpen]);

  // Pointer event handlers with proper capture & delta drawing
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Left click or touch/pen only
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if capture unsupported
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const point: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (currentTool === 'laser') {
      laserPointsRef.current.push({ ...point, alpha: 1.0 });
      return;
    }

    isDrawingRef.current = true;
    const newStroke: Stroke = {
      tool: currentTool,
      color: currentColor,
      width: strokeWidth,
      points: [point],
    };
    currentStrokeRef.current = newStroke;

    // Draw initial dot immediately
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawSingleStroke(ctx, newStroke);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const point: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (currentTool === 'laser') {
      // Laser moves on hover / drag
      if (laserPointsRef.current.length < 80) {
        laserPointsRef.current.push({ ...point, alpha: 1.0 });
      }
      return;
    }

    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    const stroke = currentStrokeRef.current;
    stroke.points.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pts = stroke.points;
    const len = pts.length;

    if (len >= 2) {
      ctx.save();
      if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color + '55';
        ctx.lineWidth = stroke.width * 3.5;
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = stroke.width * 5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      if (len === 2) {
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        const p1 = pts[len - 2];
        const p2 = pts[len - 1];
        const prevMid = {
          x: (pts[len - 3].x + p1.x) / 2,
          y: (pts[len - 3].y + p1.y) / 2,
        };
        const currentMid = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
        ctx.moveTo(prevMid.x, prevMid.y);
        ctx.quadraticCurveTo(p1.x, p1.y, currentMid.x, currentMid.y);
      }
      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }

    if (isDrawingRef.current && currentStrokeRef.current) {
      const finishedStroke = currentStrokeRef.current;
      if (finishedStroke.points.length > 0) {
        setStrokes((prev) => [...prev, finishedStroke]);
        setRedoStack([]); // Clear redo on new stroke
      }
    }
    isDrawingRef.current = false;
    currentStrokeRef.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }
    isDrawingRef.current = false;
    currentStrokeRef.current = null;
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const lastStroke = strokes[strokes.length - 1];
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    setRedoStack((prev) => [...prev, lastStroke]);
    redrawAllStrokes(newStrokes);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const restoredStroke = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    const newStrokes = [...strokes, restoredStroke];
    setRedoStack(newRedo);
    setStrokes(newStrokes);
    redrawAllStrokes(newStrokes);
  };

  const handleClear = () => {
    setStrokes([]);
    setRedoStack([]);
    redrawAllStrokes([]);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `coaviz-whiteboard-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto select-none">
      {/* Interactive Drawing Canvas Layer */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="absolute inset-0 cursor-crosshair touch-none bg-slate-900/10 dark:bg-slate-950/20 backdrop-blur-[1px]"
      />

      {/* Laser Canvas Layer */}
      <canvas
        ref={laserCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Floating Smartboard Toolbar */}
      <div 
        className="absolute top-4 left-1/2 -translate-x-1/2 panel-card rounded-2xl p-2.5 flex items-center gap-2.5 shadow-2xl backdrop-blur-2xl border-2 border-cyan-500/30 max-w-[95vw] overflow-x-auto"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Tool Selectors */}
        <div className="flex items-center gap-1 sub-panel p-1 border">
          <button
            onClick={() => setCurrentTool('pen')}
            title="Pen Tool (P)"
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              currentTool === 'pen' ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Pen className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('highlighter')}
            title="Highlighter Tool (H)"
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              currentTool === 'highlighter' ? 'bg-amber-400 text-slate-950 font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('laser')}
            title="Laser Pointer (Fading Trail)"
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              currentTool === 'laser' ? 'bg-red-500 text-white font-bold shadow-md animate-pulse' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('eraser')}
            title="Eraser Tool (E)"
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              currentTool === 'eraser' ? 'bg-indigo-500 text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette */}
        {currentTool !== 'eraser' && currentTool !== 'laser' && (
          <div className="flex items-center gap-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => setCurrentColor(c.value)}
                title={c.label}
                className={`w-6 h-6 rounded-full transition-transform border border-black/20 dark:border-white/30 cursor-pointer ${
                  currentColor === c.value ? 'scale-125 ring-2 ring-cyan-500 shadow-md' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        )}

        {/* Stroke Width */}
        <div className="flex items-center gap-1 px-2 border-l border-slate-300 dark:border-slate-700">
          <button
            onClick={() => setStrokeWidth((w) => Math.max(2, w - 2))}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            title="Decrease Width"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 w-5 text-center">{strokeWidth}</span>
          <button
            onClick={() => setStrokeWidth((w) => Math.min(24, w + 2))}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            title="Increase Width"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo, Redo, Clear & Download */}
        <div className="flex items-center gap-1 px-2 border-l border-slate-300 dark:border-slate-700">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            title="Undo (Ctrl+Z)"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Y)"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportPNG}
            disabled={strokes.length === 0}
            title="Export Annotation PNG"
            className="p-2 rounded-xl text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            disabled={strokes.length === 0}
            title="Clear Whiteboard Canvas"
            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Close Whiteboard */}
        <button
          onClick={onClose}
          title="Exit Whiteboard Layer (W or Esc)"
          className="p-2 rounded-xl sub-panel border hover:border-cyan-500 text-slate-700 dark:text-slate-300 ml-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

