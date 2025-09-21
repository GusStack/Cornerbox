/* CornerBox Generator — no deps, client-only */
const el = (id) => document.getElementById(id);
const canvas = el('canvas');
const ctx = canvas.getContext('2d');

const state = {
  title: el('title').value,
  issue: +el('issue').value,
  price: el('price').value,
  publisher: el('publisher').value,
  style: el('style').value,
  outline: +el('outline').value,
  bg: el('bg').value,
  accent: el('accent').value,
  textColor: el('textColor').value,
  headImg: null,
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
  await document.fonts.ready; // ensure web fonts loaded
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  // background
  ctx.fillStyle = state.bg;
  drawRoundRect(8,8,W-16,H-16,18);
  ctx.fill();

  // accent panel
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
  } else { // classic top bar
    ctx.fillStyle = state.accent;
    ctx.fillRect(24, 24, W-48, 96);
  }

  // outer outline
  ctx.lineWidth = state.outline;
  ctx.strokeStyle = '#000';
  drawRoundRect(8,8,W-16,H-16,18);
  ctx.stroke();

  // title
  ctx.fillStyle = state.textColor;
  ctx.textBaseline = 'top';
  ctx.font = '48px Bangers, sans-serif';
  const title = state.title.toUpperCase();
  const maxW = W - 48;
  let size = 64;
  ctx.font = `${size}px Bangers, sans-serif`;
  while (ctx.measureText(title).width > maxW && size > 28){
    size -= 2; ctx.font = `${size}px Bangers, sans-serif`;
  }
  const titleY = state.style === 'classic' ? 36 : 40;
  ctx.fillText(title, 32, titleY);

  // publisher small text
  ctx.font = '12px Inter, sans-serif';
  ctx.globalAlpha = 0.9;
  ctx.fillText(state.publisher, 32, 24 + 96 + 8);
  ctx.globalAlpha = 1;

  // issue box
  const issueBox = { x: 32, y: H-140, w: 120, h: 60 };
  ctx.fillStyle = '#fff';
  drawRoundRect(issueBox.x, issueBox.y, issueBox.w, issueBox.h, 10);
  ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('ISSUE', issueBox.x + 10, issueBox.y + 10);
  ctx.font = 'bold 30px Inter, sans-serif';
  ctx.fillText(String(state.issue), issueBox.x + 10, issueBox.y + 28);

  // price box
  const priceBox = { x: W-152, y: H-140, w: 120, h: 60 };
  ctx.fillStyle = '#fff';
  drawRoundRect(priceBox.x, priceBox.y, priceBox.w, priceBox.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#000'; ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('PRICE', priceBox.x + 10, priceBox.y + 10);
  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.fillText(state.price, priceBox.x + 10, priceBox.y + 30);

  // character head (circular mask)
  const cx = W/2, cy = H-112, r = 84;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.closePath();
  ctx.clip();
  // frame circle background if no image
  ctx.fillStyle = '#ddd';
  ctx.fillRect(cx-r, cy-r, 2*r, 2*r);
  if (state.headImg){
    // cover fit
    const img = state.headImg;
    const scale = Math.max((2*r)/img.width, (2*r)/img.height);
    const w = img.width * scale, h = img.height * scale;
    const dx = cx - w/2, dy = cy - h/2;
    ctx.drawImage(img, dx, dy, w, h);
  }
  ctx.restore();
  // circle outline
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
  return '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
}

// Wire up controls
['title','issue','price','publisher','style','outline','bg','accent','textColor'].forEach(id=>{
  el(id).addEventListener('input', ()=>{
    state[id === 'issue' || id === 'outline' ? id : id] = (id==='issue'||id==='outline') ? +el(id).value : el(id).value;
    render();
  });
});

el('head').addEventListener('change', async (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  const img = await readFileToImage(file);
  state.headImg = img;
  render();
});

el('randomize').addEventListener('click', ()=>{
  el('bg').value = randomHex();
  el('accent').value = randomHex();
  el('textColor').value = '#000000';
  state.bg = el('bg').value;
  state.accent = el('accent').value;
  state.textColor = el('textColor').value;
  render();
});

// Robust download (toBlob with dataURL fallback + iOS open-in-new-tab)
el('download').addEventListener('click', () => {
  const doDataURLFallback = () => {
    try {
      const href = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = href;
      a.download = `cornerbox-issue-${state.issue}.png`;
      // iOS Safari ignores download; open in new tab so user can long-press save
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert('Export blocked. If you added an external image URL, the canvas may be "tainted" by the browser for security reasons. Use the file upload, or host images with CORS enabled.');
      console.error(e);
    }
  };

  try {
    // This avoids huge base64 strings and plays nicer with some mobile browsers
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
    // If the canvas is tainted (e.g., cross‑origin image without CORS), toBlob/toDataURL throws
    console.warn('toBlob failed, falling back to dataURL', e);
    doDataURLFallback();
  }
});

render();
  // price box
  const priceBox = { x: W-152, y: H-140, w: 120, h: 60 };
  ctx.fillStyle = '#fff';
  drawRoundRect(priceBox.x, priceBox.y, priceBox.w, priceBox.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#000'; ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('PRICE', priceBox.x + 10, priceBox.y + 10);
  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.fillText(state.price, priceBox.x + 10, priceBox.y + 30);

  // character head (circular mask)
  const cx = W/2, cy = H-112, r = 84;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.closePath();
  ctx.clip();
  // frame circle background if no image
  ctx.fillStyle = '#ddd';
  ctx.fillRect(cx-r, cy-r, 2*r, 2*r);
  if (state.headImg){
    // cover fit
    const img = state.headImg;
    const scale = Math.max((2*r)/img.width, (2*r)/img.height);
    const w = img.width * scale, h = img.height * scale;
    const dx = cx - w/2, dy = cy - h/2;
    ctx.drawImage(img, dx, dy, w, h);
  }
  ctx.restore();
  // circle outline
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
  return '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
}

// Wire up controls
['title','issue','price','publisher','style','outline','bg','accent','textColor'].forEach(id=>{
  el(id).addEventListener('input', ()=>{
    state[id === 'issue' || id === 'outline' ? id : id] = (id==='issue'||id==='outline') ? +el(id).value : el(id).value;
    render();
  });
});

el('head').addEventListener('change', async (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  const img = await readFileToImage(file);
  state.headImg = img;
  render();
});

el('randomize').addEventListener('click', ()=>{
  el('bg').value = randomHex();
  el('accent').value = randomHex();
  el('textColor').value = '#000000';
  state.bg = el('bg').value;
  state.accent = el('accent').value;
  state.textColor = el('textColor').value;
  render();
});

el('download').addEventListener('click', ()=>{
  const link = document.createElement('a');
  link.download = `cornerbox-issue-${state.issue}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

render();
```
