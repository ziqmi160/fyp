import { useRef, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * SignaturePad — canvas-based signature component.
 *
 * Props:
 *   onChange(dataUrl | null) — called after each stroke ends or on clear
 *   initialValue — base64 data URL to pre-fill (optional)
 *   width / height — canvas CSS dimensions in px (defaults 400 × 160)
 *   disabled — when true, pad is read-only
 */
export default function SignaturePad({
  onChange,
  initialValue,
  width = 400,
  height = 160,
  disabled = false,
}) {
  const canvasRef    = useRef(null);
  const isDrawing    = useRef(false);
  const lastPos      = useRef(null);
  const hasContent   = useRef(false);

  // Convert a pointer/touch event to canvas buffer coordinates.
  // Uses getBoundingClientRect() at event-time so it's always correct
  // regardless of scroll, zoom, or DPR.
  function toCanvas(canvas, e) {
    const rect    = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width  / rect.width),
      y: (clientY - rect.top)  * (canvas.height / rect.height),
    };
  }

  // Initialise the canvas buffer once (or when size props change).
  // Buffer = width × height × dpr so strokes look crisp on HiDPI screens.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = width  * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth   = 2 * dpr;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    hasContent.current = false;

    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        hasContent.current = true;
      };
      img.src = initialValue;
    }
  }, [disabled, width, height]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDraw = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    isDrawing.current = true;
    lastPos.current   = toCanvas(canvas, e);
  }, [disabled]);

  const draw = useCallback((e) => {
    if (!isDrawing.current || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = toCanvas(canvas, e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current    = pos;
    hasContent.current = true;
  }, [disabled]);

  const endDraw = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPos.current   = null;
    if (hasContent.current) {
      onChange?.(canvasRef.current.toDataURL('image/png'));
    }
  }, [onChange]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasContent.current = false;
    onChange?.(null);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 rounded-lg overflow-hidden ${
          disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 bg-white cursor-crosshair'
        }`}
        style={{ width, height }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          onTouchCancel={endDraw}
        />
        {!disabled && (
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 p-1 rounded bg-white/80 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            title="Clear signature"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {!disabled && (
        <p className="text-xs text-gray-400">Draw your signature above using mouse or finger</p>
      )}
    </div>
  );
}
