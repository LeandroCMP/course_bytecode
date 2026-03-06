(() => {
  const canvas = document.getElementById('board-canvas');
  if (!canvas) {
    return;
  }

  const surface = document.getElementById('board-surface');
  const toast = document.getElementById('toast');
  const toolButtons = Array.from(document.querySelectorAll('[data-tool]'));
  const colorButtons = Array.from(document.querySelectorAll('.swatch'));
  const colorPicker = document.getElementById('color-picker');
  const sizeRange = document.getElementById('size-range');
  const sizeValue = document.getElementById('size-value');
  const opacityRange = document.getElementById('opacity-range');
  const opacityValue = document.getElementById('opacity-value');
  const zoomRange = document.getElementById('zoom-range');
  const zoomValue = document.getElementById('zoom-value');
  const undoBtn = document.querySelector('[data-action="undo"]');
  const redoBtn = document.querySelector('[data-action="redo"]');
  const clearBtn = document.querySelector('[data-action="clear"]');
  const saveBtn = document.querySelector('[data-action="save"]');
  const loadBtn = document.querySelector('[data-action="load"]');
  const downloadBtn = document.querySelector('[data-action="download"]');
  const printBtn = document.querySelector('[data-action="print"]');
  const exportJsonBtn = document.querySelector('[data-action="export-json"]');
  const importJsonBtn = document.querySelector('[data-action="import-json"]');
  const importFileInput = document.getElementById('import-file');
  const zoomInBtn = document.querySelector('[data-action="zoom-in"]');
  const zoomOutBtn = document.querySelector('[data-action="zoom-out"]');
  const zoomResetBtn = document.querySelector('[data-action="zoom-reset"]');
  const gridBtn = document.querySelector('[data-toggle="grid"]');
  const themeBtn = document.querySelector('[data-toggle="theme"]');

  const textDialog = document.getElementById('text-dialog');
  const textInput = document.getElementById('text-input');
  const textCancel = document.querySelector('[data-action="cancel-text"]');
  const textConfirm = document.querySelector('[data-action="confirm-text"]');
  const textClose = document.querySelector('[data-action="close-text"]');

  const ctx = canvas.getContext('2d');

  const FONT_FAMILY = '"Space Grotesk", "Inter", sans-serif';
  const FONT_WEIGHT = 600;
  const STORAGE_KEY = 'lousa:lastState';
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 2.5;
  const ZOOM_STEP = 0.1;

  const activePointers = new Map();
  let isSpaceDown = false;
  let panStart = null;
  let panOrigin = null;
  let panPointerId = null;
  let pinchStartDistance = null;
  let pinchStartZoom = 1;
  let pinchStartCanvas = null;
  let dpr = window.devicePixelRatio || 1;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let pendingTextPoint = null;
  let lastFocused = null;
  let toastTimer = null;

  const state = {
    tool: 'pen',
    color: colorPicker.value,
    size: Number(sizeRange.value),
    opacity: Number(opacityRange.value),
    zoom: Number(zoomRange.value),
    panX: 0,
    panY: 0,
    grid: true,
    background: document.body.dataset.boardTheme === 'light' ? 'light' : 'dark',
    history: [],
    historyIndex: 0,
    isDrawing: false,
    isPanning: false,
    currentStroke: null,
    lastPoint: null
  };

  function getMinDim() {
    return Math.max(1, Math.min(canvasWidth, canvasHeight));
  }

  function getPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth ? rect.width / canvasWidth : 1;
    const scaleY = canvasHeight ? rect.height / canvasHeight : 1;
    const scale = Math.max(0.0001, Math.min(scaleX, scaleY));
    const rawX = (event.clientX - rect.left) / scale;
    const rawY = (event.clientY - rect.top) / scale;
    const x = Math.min(Math.max(rawX, 0), canvasWidth);
    const y = Math.min(Math.max(rawY, 0), canvasHeight);
    return {
      x,
      y,
      normX: canvasWidth ? x / canvasWidth : 0,
      normY: canvasHeight ? y / canvasHeight : 0
    };
  }

  function getSurfacePoint(clientX, clientY) {
    const rect = surface.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function getOrigin() {
    return {
      x: canvasWidth / 2,
      y: canvasHeight / 2
    };
  }

  function normToCanvas(point) {
    return {
      x: point.x * canvasWidth,
      y: point.y * canvasHeight
    };
  }

  function updateSizeValue() {
    sizeValue.textContent = `${state.size}`;
  }

  function updateOpacityValue() {
    opacityValue.textContent = `${Math.round(state.opacity * 100)}%`;
  }

  function updateZoomValue() {
    zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
    zoomRange.value = state.zoom.toFixed(2);
    zoomOutBtn.disabled = state.zoom <= ZOOM_MIN + 0.001;
    zoomInBtn.disabled = state.zoom >= ZOOM_MAX - 0.001;
    zoomResetBtn.disabled = Math.abs(state.zoom - 1) < 0.001;
  }

  function getPanLimits() {
    const extraX = Math.max(0, canvasWidth * state.zoom - canvasWidth);
    const extraY = Math.max(0, canvasHeight * state.zoom - canvasHeight);
    return {
      maxX: extraX / 2,
      maxY: extraY / 2
    };
  }

  function applyTransform() {
    canvas.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
  }

  function setPan(x, y) {
    const limits = getPanLimits();
    const clampedX = Math.min(limits.maxX, Math.max(-limits.maxX, x));
    const clampedY = Math.min(limits.maxY, Math.max(-limits.maxY, y));
    state.panX = clampedX;
    state.panY = clampedY;
    applyTransform();
  }

  function setZoomAndPan(value, panX, panY) {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
    state.zoom = clamped;
    setPan(panX, panY);
    updateZoomValue();
  }

  function applyZoom(value) {
    setZoomAndPan(value, state.panX, state.panY);
  }

  function applyZoomAt(value, clientX, clientY) {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
    const origin = getOrigin();
    const point = getSurfacePoint(clientX, clientY);
    const canvasX = ((point.x - state.panX - origin.x) / state.zoom) + origin.x;
    const canvasY = ((point.y - state.panY - origin.y) / state.zoom) + origin.y;
    const nextPanX = point.x - (canvasX - origin.x) * clamped - origin.x;
    const nextPanY = point.y - (canvasY - origin.y) * clamped - origin.y;
    setZoomAndPan(clamped, nextPanX, nextPanY);
  }

  function setPanHint(active) {
    surface.classList.toggle('can-pan', active);
  }

  function getPointersCenter() {
    const points = Array.from(activePointers.values());
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  function getPointersDistance() {
    const points = Array.from(activePointers.values());
    if (points.length < 2) {
      return 0;
    }
    const [a, b] = points;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function beginPan(clientX, clientY, pointerId = null) {
    state.isPanning = true;
    panPointerId = pointerId;
    panStart = { x: clientX, y: clientY };
    panOrigin = { x: state.panX, y: state.panY };
    surface.classList.add('is-panning');
  }

  function updatePan(clientX, clientY) {
    if (!state.isPanning || !panStart || !panOrigin) {
      return;
    }
    const dx = clientX - panStart.x;
    const dy = clientY - panStart.y;
    setPan(panOrigin.x + dx, panOrigin.y + dy);
  }

  function endPan() {
    state.isPanning = false;
    panStart = null;
    panOrigin = null;
    pinchStartDistance = null;
    pinchStartCanvas = null;
    if (panPointerId !== null && canvas.hasPointerCapture(panPointerId)) {
      canvas.releasePointerCapture(panPointerId);
    }
    panPointerId = null;
    surface.classList.remove('is-panning');
  }

  function updateColorUI() {
    colorButtons.forEach((btn) => {
      const isActive = btn.dataset.color.toLowerCase() === state.color.toLowerCase();
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.style.background = btn.dataset.color;
    });
    colorPicker.value = state.color;
  }

  function updateToolUI() {
    toolButtons.forEach((btn) => {
      const isActive = btn.dataset.tool === state.tool;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    surface.dataset.tool = state.tool;

    const opacityGroup = opacityRange.closest('.control-group');
    const isHighlighter = state.tool === 'highlighter';
    opacityRange.disabled = !isHighlighter;
    if (opacityGroup) {
      opacityGroup.classList.toggle('is-disabled', !isHighlighter);
    }
  }

  function updateHistoryButtons() {
    undoBtn.disabled = state.historyIndex === 0;
    redoBtn.disabled = state.historyIndex >= state.history.length;
  }

  function setGrid(enabled) {
    state.grid = enabled;
    surface.classList.toggle('show-grid', enabled);
    gridBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  function setTheme(mode) {
    state.background = mode === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = state.background;
    document.body.dataset.boardTheme = state.background;
    themeBtn.setAttribute('aria-pressed', state.background === 'light' ? 'true' : 'false');
    themeBtn.textContent = state.background === 'light' ? 'Fundo claro' : 'Fundo escuro';
  }

  function showToast(message) {
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  function resizeCanvas() {
    const rect = surface.getBoundingClientRect();
    canvasWidth = Math.max(1, Math.floor(rect.width));
    canvasHeight = Math.max(1, Math.floor(rect.height));
    dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(canvasWidth * dpr);
    canvas.height = Math.floor(canvasHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    renderAll();
    setPan(state.panX, state.panY);
  }

  function getStrokeWidth(action) {
    const size = (typeof action.size === 'number' ? action.size : state.size / getMinDim()) * getMinDim();
    if (action.tool === 'highlighter') {
      return size * 1.6;
    }
    if (action.tool === 'eraser') {
      return size * 1.2;
    }
    return size;
  }

  function applyStrokeStyle(action) {
    ctx.lineWidth = Math.max(1, getStrokeWidth(action));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (action.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
      return;
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = action.tool === 'highlighter' ? (action.opacity ?? state.opacity) : 1;
    ctx.strokeStyle = action.color || state.color;
  }

  function drawDot(action, point) {
    ctx.save();
    applyStrokeStyle(action);
    ctx.beginPath();
    ctx.fillStyle = action.tool === 'eraser' ? 'rgba(0, 0, 0, 1)' : (action.color || state.color);
    ctx.arc(point.x, point.y, getStrokeWidth(action) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSegment(action, from, to) {
    ctx.save();
    applyStrokeStyle(action);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  function renderStroke(action) {
    if (!Array.isArray(action.points) || action.points.length === 0) {
      return;
    }
    if (action.points.length === 1) {
      drawDot(action, normToCanvas(action.points[0]));
      return;
    }
    ctx.save();
    applyStrokeStyle(action);
    ctx.beginPath();
    const start = normToCanvas(action.points[0]);
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < action.points.length; i += 1) {
      const p = normToCanvas(action.points[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function renderText(action) {
    if (!action.text) {
      return;
    }
    const fontSize = Math.max(10, (action.size || 0.02) * getMinDim());
    const x = action.x * canvasWidth;
    const y = action.y * canvasHeight;
    const lines = String(action.text).replace(/\r\n/g, '\n').split('\n');

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = action.color || state.color;
    ctx.textBaseline = 'top';
    ctx.font = `${action.weight || FONT_WEIGHT} ${fontSize}px ${action.font || FONT_FAMILY}`;

    const lineHeight = fontSize * 1.3;
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight);
    });
    ctx.restore();
  }

  function renderAll() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < state.historyIndex; i += 1) {
      const action = state.history[i];
      if (!action) {
        continue;
      }
      if (action.type === 'clear') {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      } else if (action.type === 'stroke') {
        renderStroke(action);
      } else if (action.type === 'text') {
        renderText(action);
      }
    }
  }

  function commitAction(action) {
    if (state.historyIndex < state.history.length) {
      state.history = state.history.slice(0, state.historyIndex);
    }
    state.history.push(action);
    state.historyIndex = state.history.length;
    updateHistoryButtons();
  }

  function startStroke(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }

    if (state.tool === 'text') {
      const point = getPoint(event);
      pendingTextPoint = { x: point.normX, y: point.normY };
      openTextDialog();
      return;
    }

    event.preventDefault();
    state.isDrawing = true;

    const point = getPoint(event);
    const action = {
      type: 'stroke',
      tool: state.tool,
      color: state.color,
      size: state.size / getMinDim(),
      opacity: state.opacity,
      points: [{ x: point.normX, y: point.normY }]
    };

    state.currentStroke = action;
    state.lastPoint = { x: point.x, y: point.y };

    canvas.setPointerCapture(event.pointerId);
  }

  function moveStroke(event) {
    if (!state.isDrawing || !state.currentStroke) {
      return;
    }

    const point = getPoint(event);
    const current = { x: point.x, y: point.y };
    state.currentStroke.points.push({ x: point.normX, y: point.normY });

    drawSegment(state.currentStroke, state.lastPoint, current);
    state.lastPoint = current;
  }

  function endStroke(event) {
    if (!state.isDrawing || !state.currentStroke) {
      return;
    }

    if (state.currentStroke.points.length === 1) {
      drawDot(state.currentStroke, normToCanvas(state.currentStroke.points[0]));
    }

    commitAction(state.currentStroke);
    state.isDrawing = false;
    state.currentStroke = null;
    state.lastPoint = null;

    if (event && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function undo() {
    if (state.historyIndex === 0) {
      return;
    }
    state.historyIndex -= 1;
    renderAll();
    updateHistoryButtons();
  }

  function redo() {
    if (state.historyIndex >= state.history.length) {
      return;
    }
    state.historyIndex += 1;
    renderAll();
    updateHistoryButtons();
  }

  function clearBoard() {
    const shouldClear = window.confirm('Limpar toda a lousa?');
    if (!shouldClear) {
      return;
    }
    commitAction({ type: 'clear' });
    renderAll();
    showToast('Lousa limpa.');
  }

  function serializeState() {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      background: state.background,
      grid: state.grid,
      zoom: state.zoom,
      panX: state.panX,
      panY: state.panY,
      actions: state.history.slice(0, state.historyIndex)
    };
  }

  function normalizeAction(action) {
    if (!action || typeof action !== 'object') {
      return null;
    }

    if (action.type === 'clear') {
      return { type: 'clear' };
    }

    if (action.type === 'stroke' && Array.isArray(action.points)) {
      let size = typeof action.size === 'number' ? action.size : state.size / getMinDim();
      if (size > 1) {
        size = size / getMinDim();
      }
      return {
        type: 'stroke',
        tool: action.tool || 'pen',
        color: action.color || '#ffffff',
        size,
        opacity: typeof action.opacity === 'number' ? action.opacity : 0.35,
        points: action.points
          .map((point) => ({
            x: typeof point.x === 'number' ? Math.min(Math.max(point.x, 0), 1) : 0,
            y: typeof point.y === 'number' ? Math.min(Math.max(point.y, 0), 1) : 0
          }))
      };
    }

    if (action.type === 'text' && typeof action.text === 'string') {
      let size = typeof action.size === 'number' ? action.size : 0.02;
      if (size > 1) {
        size = size / getMinDim();
      }
      return {
        type: 'text',
        x: typeof action.x === 'number' ? Math.min(Math.max(action.x, 0), 1) : 0.1,
        y: typeof action.y === 'number' ? Math.min(Math.max(action.y, 0), 1) : 0.1,
        text: action.text,
        color: action.color || '#ffffff',
        size,
        font: action.font || FONT_FAMILY,
        weight: action.weight || FONT_WEIGHT
      };
    }

    return null;
  }

  function applyState(data) {
    const actions = Array.isArray(data.actions)
      ? data.actions.map(normalizeAction).filter(Boolean)
      : [];

    state.history = actions;
    state.historyIndex = actions.length;

    setGrid(Boolean(data.grid));
    setTheme(data.background === 'light' ? 'light' : 'dark');
    state.panX = typeof data.panX === 'number' ? data.panX : 0;
    state.panY = typeof data.panY === 'number' ? data.panY : 0;
    applyZoom(typeof data.zoom === 'number' ? data.zoom : 1);

    renderAll();
    updateHistoryButtons();
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
      showToast('Salvo no navegador.');
    } catch (error) {
      showToast('Falha ao salvar.');
    }
  }

  function loadFromStorage(showFeedback = true) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        if (showFeedback) {
          showToast('Nenhum rascunho salvo.');
        }
        return false;
      }
      const data = JSON.parse(raw);
      applyState(data);
      if (showFeedback) {
        showToast('Rascunho carregado.');
      }
      return true;
    } catch (error) {
      if (showFeedback) {
        showToast('Erro ao carregar.');
      }
      return false;
    }
  }

  function getGridSize() {
    const value = getComputedStyle(surface).getPropertyValue('--grid-size').trim();
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 32;
  }

  function getGridColor() {
    const value = getComputedStyle(surface).getPropertyValue('--grid-line').trim();
    return value || 'rgba(255, 255, 255, 0.08)';
  }

  function drawGrid(ctxToUse, width, height) {
    const size = getGridSize();
    ctxToUse.save();
    ctxToUse.strokeStyle = getGridColor();
    ctxToUse.lineWidth = 1;

    for (let x = 0; x <= width; x += size) {
      ctxToUse.beginPath();
      ctxToUse.moveTo(x, 0);
      ctxToUse.lineTo(x, height);
      ctxToUse.stroke();
    }

    for (let y = 0; y <= height; y += size) {
      ctxToUse.beginPath();
      ctxToUse.moveTo(0, y);
      ctxToUse.lineTo(width, y);
      ctxToUse.stroke();
    }

    ctxToUse.restore();
  }

  function createExportCanvas(includeGrid) {
    const exportCanvas = document.createElement('canvas');
    const scale = window.devicePixelRatio || 1;

    exportCanvas.width = Math.floor(canvasWidth * scale);
    exportCanvas.height = Math.floor(canvasHeight * scale);

    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.setTransform(scale, 0, 0, scale, 0, 0);

    const bg = getComputedStyle(document.body).getPropertyValue('--board-canvas').trim() || '#0b1018';
    exportCtx.fillStyle = bg;
    exportCtx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (includeGrid && state.grid) {
      drawGrid(exportCtx, canvasWidth, canvasHeight);
    }

    exportCtx.drawImage(canvas, 0, 0, canvasWidth, canvasHeight);

    return exportCanvas;
  }

  function getTimestamp() {
    return new Date()
      .toISOString()
      .replace(/[:]/g, '-')
      .replace('T', '-')
      .slice(0, 19);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadPNG() {
    const exportCanvas = createExportCanvas(true);
    exportCanvas.toBlob((blob) => {
      if (!blob) {
        showToast('Falha ao gerar PNG.');
        return;
      }
      downloadBlob(blob, `lousa-${getTimestamp()}.png`);
      showToast('PNG baixado.');
    }, 'image/png');
  }

  function printCanvas() {
    const exportCanvas = createExportCanvas(true);
    const dataUrl = exportCanvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up bloqueado.');
      return;
    }

    const doc = printWindow.document;
    doc.title = 'Lousa - Impressao';
    doc.body.style.margin = '0';
    doc.body.style.display = 'flex';
    doc.body.style.alignItems = 'center';
    doc.body.style.justifyContent = 'center';
    doc.body.style.background = '#ffffff';

    const img = doc.createElement('img');
    img.src = dataUrl;
    img.alt = 'Lousa';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    doc.body.appendChild(img);

    img.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }

  function exportJSON() {
    const data = serializeState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `lousa-${getTimestamp()}.json`);
    showToast('JSON exportado.');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        applyState(parsed);
        showToast('JSON importado.');
      } catch (error) {
        showToast('JSON invalido.');
      }
    };
    reader.readAsText(file);
  }

  function openTextDialog() {
    if (!textDialog) {
      return;
    }
    lastFocused = document.activeElement;
    textDialog.hidden = false;
    textInput.value = '';
    textInput.focus();
  }

  function closeTextDialog() {
    if (!textDialog) {
      return;
    }
    textDialog.hidden = true;
    pendingTextPoint = null;
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function confirmText() {
    if (!pendingTextPoint) {
      closeTextDialog();
      return;
    }
    const text = textInput.value.replace(/\r\n/g, '\n');
    if (!text.trim()) {
      showToast('Texto vazio.');
      closeTextDialog();
      return;
    }

    const action = {
      type: 'text',
      x: pendingTextPoint.x,
      y: pendingTextPoint.y,
      text,
      color: state.color,
      size: state.size / getMinDim(),
      font: FONT_FAMILY,
      weight: FONT_WEIGHT
    };

    commitAction(action);
    renderAll();
    closeTextDialog();
  }

  function shouldStartPan(event) {
    if (event.pointerType === 'touch') {
      return activePointers.size >= 2;
    }
    if (event.pointerType === 'mouse') {
      return isSpaceDown || event.button === 1 || event.button === 2;
    }
    return isSpaceDown;
  }

  function handlePointerDown(event) {
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (shouldStartPan(event)) {
      if (state.isDrawing) {
        state.isDrawing = false;
        state.currentStroke = null;
        state.lastPoint = null;
        renderAll();
      }
      activePointers.forEach((_, id) => {
        if (canvas.hasPointerCapture(id)) {
          canvas.releasePointerCapture(id);
        }
      });

      const startPoint = event.pointerType === 'touch' ? getPointersCenter() : { x: event.clientX, y: event.clientY };
      beginPan(startPoint.x, startPoint.y, event.pointerType === 'mouse' ? event.pointerId : null);

      if (event.pointerType === 'touch' && activePointers.size >= 2) {
        pinchStartDistance = getPointersDistance();
        pinchStartZoom = state.zoom;
        const centerLocal = getSurfacePoint(startPoint.x, startPoint.y);
        const origin = getOrigin();
        pinchStartCanvas = {
          x: (centerLocal.x - state.panX - (1 - state.zoom) * origin.x) / state.zoom,
          y: (centerLocal.y - state.panY - (1 - state.zoom) * origin.y) / state.zoom
        };
      }

      if (!canvas.hasPointerCapture(event.pointerId)) {
        canvas.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      return;
    }

    startStroke(event);
  }

  function handlePointerMove(event) {
    if (activePointers.has(event.pointerId)) {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (state.isPanning) {
      if (event.pointerType === 'touch') {
        if (activePointers.size >= 2 && pinchStartDistance && pinchStartCanvas) {
          const center = getPointersCenter();
          const centerLocal = getSurfacePoint(center.x, center.y);
          const distance = getPointersDistance();
          const ratio = distance / pinchStartDistance;
          const nextZoom = pinchStartZoom * ratio;
          const origin = getOrigin();
          const nextPanX = centerLocal.x - pinchStartCanvas.x * nextZoom - (1 - nextZoom) * origin.x;
          const nextPanY = centerLocal.y - pinchStartCanvas.y * nextZoom - (1 - nextZoom) * origin.y;
          setZoomAndPan(nextZoom, nextPanX, nextPanY);
        }
      } else if (event.pointerId === panPointerId) {
        updatePan(event.clientX, event.clientY);
      }
      event.preventDefault();
      return;
    }

    moveStroke(event);
  }

  function handlePointerUp(event) {
    if (activePointers.has(event.pointerId)) {
      activePointers.delete(event.pointerId);
    }

    if (state.isPanning) {
      if (event.pointerType === 'touch') {
        if (activePointers.size < 2) {
          endPan();
        }
      } else if (event.pointerId === panPointerId) {
        endPan();
      }
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      return;
    }

    endStroke(event);
  }

  toolButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.tool = btn.dataset.tool;
      updateToolUI();
    });
  });

  colorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.color = btn.dataset.color;
      updateColorUI();
    });
  });

  colorPicker.addEventListener('input', (event) => {
    state.color = event.target.value;
    updateColorUI();
  });

  sizeRange.addEventListener('input', (event) => {
    state.size = Number(event.target.value);
    updateSizeValue();
  });

  opacityRange.addEventListener('input', (event) => {
    state.opacity = Number(event.target.value);
    updateOpacityValue();
  });

  zoomRange.addEventListener('input', (event) => {
    applyZoom(Number(event.target.value));
  });

  zoomInBtn.addEventListener('click', () => {
    applyZoom(state.zoom + ZOOM_STEP);
  });

  zoomOutBtn.addEventListener('click', () => {
    applyZoom(state.zoom - ZOOM_STEP);
  });

  zoomResetBtn.addEventListener('click', () => {
    applyZoom(1);
  });

  gridBtn.addEventListener('click', () => {
    setGrid(!state.grid);
  });

  themeBtn.addEventListener('click', () => {
    setTheme(state.background === 'dark' ? 'light' : 'dark');
  });

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  clearBtn.addEventListener('click', clearBoard);
  saveBtn.addEventListener('click', saveToStorage);
  loadBtn.addEventListener('click', () => loadFromStorage(true));
  downloadBtn.addEventListener('click', downloadPNG);
  printBtn.addEventListener('click', printCanvas);
  exportJsonBtn.addEventListener('click', exportJSON);
  importJsonBtn.addEventListener('click', () => importFileInput.click());

  importFileInput.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    importJSON(file);
    event.target.value = '';
  });

  textCancel.addEventListener('click', closeTextDialog);
  textClose.addEventListener('click', closeTextDialog);
  textConfirm.addEventListener('click', confirmText);

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  canvas.addEventListener('wheel', (event) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    event.preventDefault();
    const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    applyZoomAt(state.zoom + delta, event.clientX, event.clientY);
  }, { passive: false });

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const isModifier = event.ctrlKey || event.metaKey;
    const isTyping = ['input', 'textarea'].includes(document.activeElement?.tagName?.toLowerCase());
    const isSpace = event.code === 'Space';

    if (isSpace && !isTyping) {
      isSpaceDown = true;
      setPanHint(true);
      event.preventDefault();
      return;
    }

    if (!isModifier) {
      if (key === 'escape' && !textDialog.hidden) {
        event.preventDefault();
        closeTextDialog();
      }
      return;
    }

    if (key === 's') {
      event.preventDefault();
      saveToStorage();
      return;
    }

    if (isTyping) {
      return;
    }

    if (key === 'z' && event.shiftKey) {
      event.preventDefault();
      redo();
      return;
    }

    if (key === 'z') {
      event.preventDefault();
      undo();
      return;
    }

    if (key === 'y') {
      event.preventDefault();
      redo();
    }
  });

  document.addEventListener('keyup', (event) => {
    if (event.code === 'Space') {
      isSpaceDown = false;
      setPanHint(false);
    }
  });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(resizeCanvas);
    });
    observer.observe(surface);
  } else {
    window.addEventListener('resize', resizeCanvas);
  }

  updateSizeValue();
  updateOpacityValue();
  updateZoomValue();
  updateColorUI();
  updateToolUI();
  updateHistoryButtons();
  setGrid(state.grid);
  setTheme(state.background);
  applyZoom(state.zoom);
  resizeCanvas();

  const loaded = loadFromStorage(false);
  if (loaded) {
    showToast('Rascunho recuperado.');
  }
})();
