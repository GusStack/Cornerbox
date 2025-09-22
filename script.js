/* CornerBox Generator — no deps, client-only */
document.addEventListener('DOMContentLoaded', () => {
  const el = (id) => document.getElementById(id);
  const toNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  // --- Canvas + DPR-safe sizing (1 canvas unit = 1 CSS px) ---
  const canvas = el('canvas');
  if (!canvas) { console.error('No <canvas id="canvas">'); return; }
  const ctx = canvas.getContext('2d');
  const hint = el('hint');

  function sizeCanvasToDisplay() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect(); // CSS px
    const wDev = Math.max(1, Math.floor(rect.width * dpr));
    const hDev = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== wDev || canvas.height !== hDev) {
      canvas.width = wDev;
      canvas.height = hDev;
    }
    // Make 1 canvas unit = 1 CSS pixel
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Update hint text
    if (hint) hint.setAttribute('data-size', `${Math.round(rect.width)}×${Math.round(rect.height)}`);
  }
  sizeCanvasToDisplay();
  window.addEventListener('resize', () => { sizeCanvasToDisplay(); render(); });

  const getInput = (id, fallback = '') => (el(id)?.value ?? fallback);

  const state = {
    title:      getInput('title', ''),
    issue:      toNum(getInput('issue'), 1),
    price:      getInput('price', '12¢'),
    publisher:  getInput('publisher', ''),
    style:      getInput('style', 'classic'),
    outline:    toNum(getInput('outline'), 6),
    bg:         getInput('bg', '#ffffff'),
    accent:     getInput('accent', '#ffeb3b'),
    textColor:  getInput('textColor', '#000000'),
    headImg:    null,
  };

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function drawRoundRect(x,y,w,h,r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }

  async function render(){
    try { if (document.fonts?.ready) await document.fonts.ready; } catch(_) {}
    sizeCanvasToDisplay();

    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0,0,W,H);

    // Background card
    ctx.fillStyle = state.bg;
    drawRoundRect(8,8,W-16,H-16,18);
    ctx.fill();

    // Accent panel
    if (state.style === 'slanted'){
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(24,24);
      ctx.lineTo(W-24, 64);
      ctx.lineTo(W-24, 220);
      ctx.lineTo(24, 180);
      ctx.closePath();
      ctx.fillStyle = state.accent;
      ctx.fill();
      ctx.restore();
    } else if (state.style === 'circle'){
      ctx.save();
      ctx.fillStyle = state.accent;
      ctx.beginPath();
      ctx.arc(W-96, 96, 72, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = state.accent;
      ctx.fillRect(24, 24, Math.max(0, W-48), 96);
    }

    // Outer outline
    ctx.lineWidth = clamp(Number(state.outline) || 0, 0, 20);
    ctx.strokeStyle = '#000';
    drawRoundRect(8,8,W-16,H-16,18);
    ctx.stroke();

    // Title
    const title = String(state.title || '').toUpperCase();
    const maxW = Math.max(0, W - 48);
    let size = 64, minSize = 28;
    ctx.fillStyle = state.textColor;
    ctx.textBaseline = 'top';
    ctx.font = `${size}px Bangers, sans-serif`;
    while (title && ctx.measureText(title).width > maxW && size > minSize){
      size -= 2; ctx.font = `${size}px Bangers, sans-serif`;
    }
    const titleY = state.style === 'classic' ? 36 : 40;
    ctx.fillText(title, 32, titleY);

    // Publisher small text
    ctx.font = '12px Inter, sans-serif';
    ctx.globalAlpha = 0.9;
    ctx.fillText(state.publisher || '', 32, 24 + 96 + 8);
    ctx.globalAlpha = 1;

    // Issue box
    const issueBox = { x: 32, y: H-140, w: 120, h: 60 };
    ctx.fillStyle = '#fff';
    drawRoundRect(issueBox.x, issueBox.y, issueBox.w, issueBox.h, 10);
    ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('ISSUE', issueBox.x + 10, issueBox.y + 10);
    ctx.font = 'bold 30px Inter, sans-serif';
    ctx.fillText(String(clamp(toNum(state.issue, 1), 1, 9999)), issueBox.x + 10, issueBox.y + 28);

    // Price box
    const priceBox = { x: W-152, y: H-140, w: 120, h: 60 };
    ctx.fillStyle = '#fff';
    drawRoundRect(priceBox.x, priceBox.y, priceBox.w, priceBox.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#000'; ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('PRICE', priceBox.x + 10, priceBox.y + 10);
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(String(state.price || ''), priceBox.x + 10, priceBox.y + 30);

    // Character head (circular mask)
    const cx = W/2, cy = H-112, r = 84;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.closePath();
    ctx.clip();
    ctx.fillStyle = '#ddd';
    ctx.fillRect(cx-r, cy-r, 2*r, 2*r);

    if (state.headImg){
      const img = state.headImg;
      const scale = Math.max((2*r)/img.width, (2*r)/img.height);
      const w = img.width * scale, h = img.height * scale;
      const dx = cx - w/2, dy = cy - h/2;
      ctx.drawImage(img, dx, dy, w, h);
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.closePath();
    ctx.lineWidth = 8; ctx.strokeStyle = '#000'; ctx.stroke();
  }

  function readFileToImage(file){
    return new Promise((resolve, reject)=>{
      const fr = new FileReader();
      fr.onload = ()=>{
        const img = new Image();
        img.onload = ()=> resolve(img);
        img.onerror = reject;
        img.src = fr.result;
      };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  function randomHex(){
    return '#' + Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
  }

  // --- Wire up controls ---
  ;['title','issue','price','publisher','style','outline','bg','accent','textColor'].forEach(id=>{
    const node = el(id);
    if (!node) return;
    node.addEventListener('input', ()=>{
      if (id === 'issue' || id === 'outline') {
        state[id] = toNum(node.value, id === 'issue' ? 1 : 6);
      } else {
        state[id] = node.value;
      }
      render();
    });
  });

  // Head image upload
  const headInput = el('head');
  if (headInput) {
    headInput.addEventListener('change', async (e)=>{
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const img = await readFileToImage(file);
        state.headImg = img;
        render();
      } catch (err) {
        console.error('Image load failed:', err);
        alert('Could not load image. Try a different file.');
      }
    });
  }

  // Randomize colors
  el('randomize')?.addEventListener('click', ()=>{
    const bg = randomHex();
    const ac = randomHex();
    const tc = '#000000';
    if (el('bg')) el('bg').value = bg;
    if (el('accent')) el('accent').value = ac;
    if (el('textColor')) el('textColor').value = tc;
    state.bg = bg; state.accent = ac; state.textColor = tc;
    render();
  });

  // Download PNG
  el('download')?.addEventListener('click', () => {
    const alertOnce = (msg) => { try { alert(msg); } catch (_) {} };

    const doDataURLFallback = () => {
      try {
        const href = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = href;
        a.download = `cornerbox-issue-${state.issue}.png`;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        alertOnce("Opened image in a new tab. Use your browser's Share/Save to keep it.");
      } catch (e) {
        alertOnce('Export failed: ' + e.message);
        console.error(e);
      }
    };

    try {
      if (!('toBlob' in HTMLCanvasElement.prototype)) return doDataURLFallback();
      canvas.toBlob((blob) => {
        if (!blob) return doDataURLFallback();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cornerbox-issue-${state.issue}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'image/png');
    } catch (e) {
      console.warn('toBlob threw; using dataURL fallback', e);
      alertOnce('Download failed; trying alternate method…');
      doDataURLFallback();
    }
  });

  // First render
  render();
});
