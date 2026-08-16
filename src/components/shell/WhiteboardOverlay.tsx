import React, { useRef, useState, useEffect } from 'react';
import { 
  Pen, 
  Highlighter, 
  Flame, 
  Eraser, 
  Trash2, 
  X, 
  Undo2,
  Minus,
  Plus
} from 'lucide-react';

type ToolType = 'pen' | 'highlighter' | 'laser' | 'eraser';

interface WhiteboardOverlayProps {
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
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const laserPointsRef = useRef<{ x: number; y: number; alpha: number }[]>([]);

  const colors = [
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Cyan', value: '#0284c7' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Charcoal', value: '#0f172a' },
  ];

  // Adjust canvas size to window
  useEffect(() => {
    if (!isOpen) return;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const laserCanvas = laserCanvasRef.current;
      if (canvas && laserCanvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        laserCanvas.width = window.innerWidth;
        laserCanvas.height = window.innerHeight;
        redrawStrokes();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isOpen, strokes]);

  // Redraw all saved strokes on the static canvas
  const redrawStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      if (stroke.tool === 'highlighter') {
        ctx.strokeStyle = stroke.color + '66'; // semi-transparent
        ctx.lineWidth = stroke.width * 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.width * 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    });
  };

  // Laser Pointer Animation Loop
  useEffect(() => {
    if (!isOpen) return;
    let animationFrameId: number;

    const renderLaser = () => {
      const laserCanvas = laserCanvasRef.current;
      if (laserCanvas) {
        const ctx = laserCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, laserCanvas.width, laserCanvas.height);

          const nowPoints = laserPointsRef.current;
          for (let i = 0; i < nowPoints.length; i++) {
            const pt = nowPoints[i];
            pt.alpha -= 0.04;

            if (pt.alpha > 0) {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(239, 68, 68, ${pt.alpha})`;
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 15;
              ctx.fill();
            }
          }
          laserPointsRef.current = nowPoints.filter((pt) => pt.alpha > 0);
        }
      }
      animationFrameId = requestAnimationFrame(renderLaser);
    };

    animationFrameId = requestAnimationFrame(renderLaser);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (currentTool === 'laser') {
      laserPointsRef.current.push({ ...point, alpha: 1.0 });
    } else {
      currentStrokeRef.current = {
        tool: currentTool,
        color: currentColor,
        width: strokeWidth,
        points: [point],
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (currentTool === 'laser') {
      laserPointsRef.current.push({ ...point, alpha: 1.0 });
      return;
    }

    if (!isDrawing || !currentStrokeRef.current) return;
    currentStrokeRef.current.points.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stroke = currentStrokeRef.current;
    const len = stroke.points.length;
    if (len >= 2) {
      ctx.beginPath();
      ctx.moveTo(stroke.points[len - 2].x, stroke.points[len - 2].y);
      ctx.lineTo(stroke.points[len - 1].x, stroke.points[len - 1].y);

      if (stroke.tool === 'highlighter') {
        ctx.strokeStyle = stroke.color + '66';
        ctx.lineWidth = stroke.width * 3;
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.width * 4;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      setStrokes((prev) => [...prev, currentStrokeRef.current!]);
    }
    currentStrokeRef.current = null;
  };

  const handleUndo = () => {
    setStrokes((prev) => {
      const next = prev.slice(0, -1);
      setTimeout(redrawStrokes, 10);
      return next;
    });
  };

  const handleClear = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Interactive Drawing Canvas Layer */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 cursor-crosshair touch-none bg-slate-900/10 dark:bg-slate-950/20 backdrop-blur-[1px]"
      />

      {/* Laser Canvas Layer */}
      <canvas
        ref={laserCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Floating Smartboard Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 panel-card rounded-2xl p-2.5 flex items-center gap-3 shadow-2xl backdrop-blur-2xl border-2 border-cyan-500/30">
        {/* Tool Selectors */}
        <div className="flex items-center gap-1 sub-panel p-1 border">
          <button
            onClick={() => setCurrentTool('pen')}
            title="Pen Tool"
            className={`p-2 rounded-xl transition-all ${
              currentTool === 'pen' ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Pen className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('highlighter')}
            title="Highlighter Tool"
            className={`p-2 rounded-xl transition-all ${
              currentTool === 'highlighter' ? 'bg-amber-400 text-slate-950 font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('laser')}
            title="Laser Pointer (Fading Trail)"
            className={`p-2 rounded-xl transition-all ${
              currentTool === 'laser' ? 'bg-red-500 text-white font-bold shadow-md animate-pulse' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTool('eraser')}
            title="Eraser Tool"
            className={`p-2 rounded-xl transition-all ${
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
                className={`w-6 h-6 rounded-full transition-transform border border-black/10 dark:border-white/20 ${
                  currentColor === c.value ? 'scale-125 ring-2 ring-cyan-500 shadow-md' : 'opacity-75 hover:opacity-100'
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
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            title="Decrease Width"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 w-5 text-center">{strokeWidth}</span>
          <button
            onClick={() => setStrokeWidth((w) => Math.min(16, w + 2))}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            title="Increase Width"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo & Clear */}
        <div className="flex items-center gap-1 px-2 border-l border-slate-300 dark:border-slate-700">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            title="Undo Last Stroke"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white disabled:opacity-30"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            title="Clear Whiteboard Canvas"
            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Close Whiteboard */}
        <button
          onClick={onClose}
          title="Exit Whiteboard Layer"
          className="p-2 rounded-xl sub-panel border hover:border-cyan-500 text-slate-700 dark:text-slate-300 ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
