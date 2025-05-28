// script.js

// URL de tu Web App de Apps Script
const SHEET_API = 'https://script.google.com/macros/s/AKfycby7SmXZXV7ywLaoGARohcKe1wgd9zo7bTG1dqAJSQXionzeArxhEOKeIA0FXMo7ObSErg/exec';

// Carga JSONP y resuelve con el objeto recibido
function loadJSONP(url) {
  return new Promise((resolve, reject) => {
    const cbName = 'cb_' + Math.random().toString(36).substr(2);
    window[cbName] = data => {
      delete window[cbName];
      document.body.removeChild(script);
      resolve(data);
    };
    const script = document.createElement('script');
    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cbName;
    script.onerror = err => {
      delete window[cbName];
      document.body.removeChild(script);
      reject(err);
    };
    document.body.appendChild(script);
  });
}

// Lee cuántas veces ha salido la categoría
async function fetchCount(category) {
  const data = await loadJSONP(
    `${SHEET_API}?category=${encodeURIComponent(category)}`
  );
  if (data.count == null) throw new Error(data.error || 'Error leyendo contador');
  return data.count;
}

// Incrementa el contador en 1
async function incCount(category) {
  const data = await loadJSONP(
    `${SHEET_API}?action=inc&category=${encodeURIComponent(category)}`
  );
  if (data.newCount == null) throw new Error(data.error || 'Error actualizando contador');
  return data.newCount;
}

// Categorías, colores y elementos del DOM
const categories = ['Categoría 1','Categoría 2','Categoría 3','Categoría 4','Categoría 5'];
const colors     = ['#e6194b','#3cb44b','#ffe119','#4363d8','#f58231'];
const canvas     = document.getElementById('wheel');
const ctx        = canvas.getContext('2d');
const resultEl   = document.getElementById('result');
let size, center, radius;
let angle = 0, angularVelocity = 0;

// Ajusta tamaño y dibuja la ruleta
function resize() {
  size = Math.min(window.innerWidth * 0.9, 600);
  canvas.width = canvas.height = size;
  center = size / 2;
  radius = center - 10;
  drawWheel();
}
window.addEventListener('resize', resize);
resize();

function drawWheel() {
  ctx.clearRect(0, 0, size, size);
  const segAngle = 2 * Math.PI / categories.length;

  categories.forEach((cat, i) => {
    const start = angle + i * segAngle;
    // Sector
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, start + segAngle);
    ctx.fillStyle = colors[i];
    ctx.fill();
    // Texto
    ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.floor(size / 20)}px sans-serif`;
      ctx.fillText(cat, radius - 10, 5);
    ctx.restore();
  });

  // Marcador
  ctx.beginPath();
  ctx.moveTo(center + radius + 5, center);
  ctx.lineTo(center + radius + 25, center - 10);
  ctx.lineTo(center + radius + 25, center + 10);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();
}

// Convierte la animación en una promesa que devuelve el índice ganador
function spinAnimation() {
  return new Promise(resolve => {
    function frame() {
      if (Math.abs(angularVelocity) > 0.001) {
        angle += angularVelocity;
        angularVelocity *= 0.97;
        drawWheel();
        requestAnimationFrame(frame);
      } else {
        angularVelocity = 0;
        const finalAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor((2 * Math.PI - finalAngle) / (2 * Math.PI / categories.length)) % categories.length;
        resolve(idx);
      }
    }
    frame();
  });
}

// Dispara el giro con cualquier tecla y gestiona límite de 5 apariciones
window.addEventListener('keydown', async () => {
  if (angularVelocity !== 0) return;  // ya está girando
  resultEl.textContent = 'Girando...';
  const vueltas = Math.random() * 3 + 3;
  angularVelocity = vueltas * (2 * Math.PI) / 60;

  try {
    const idx = await spinAnimation();
    const cat = categories[idx];
    const count = await fetchCount(cat);

    if (count >= 5) {
      resultEl.textContent = `Límite de 5 alcanzado para ${cat}`;
    } else {
      await incCount(cat);
      resultEl.textContent = `Resultado: ${cat}`;
    }
  } catch {
    resultEl.textContent = 'Error de conexión';
  }
});
