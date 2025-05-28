// script.js
const SHEET_API = 'https://script.google.com/macros/s/AKfycby7SmXZXV7ywLaoGARohcKe1wgd9zo7bTG1dqAJSQXionzeArxhEOKeIA0FXMo7ObSErg/exec';
const categories = [ 'Categoría 1','Categoría 2','Categoría 3','Categoría 4','Categoría 5' ];
const colors     = [ '#e6194b','#3cb44b','#ffe119','#4363d8','#f58231' ];
const canvas     = document.getElementById('wheel');
const ctx        = canvas.getContext('2d');
const resultEl   = document.getElementById('result');
let size, center, radius;
let angle = 0, angularVelocity = 0;

// — UTILITARIOS DE SHEETS —
async function fetchCount(category) {
  const res = await fetch(
    `${SHEET_API}?category=${encodeURIComponent(category)}`,
    { redirect: 'follow' }
  );
  if (!res.ok) throw new Error('Error leyendo contador');
  return (await res.json()).count;
}

async function incCount(category) {
  const res = await fetch(SHEET_API, {
    method: 'POST',
    // no headers personalizados → body tipo application/x-www-form-urlencoded
    body: new URLSearchParams({ category }),
    redirect: 'follow'      // importante, hace que siga la redirección a script.googleusercontent.com
  });
  if (!res.ok) throw new Error('Error actualizando contador');
  return (await res.json()).newCount;
}


// — LÓGICA DE DIBUJO —
function resize() {
  size   = Math.min(window.innerWidth * 0.9, 600);
  canvas.width = canvas.height = size;
  center = size/2;
  radius = center - 10;
  drawWheel();
}
window.addEventListener('resize', resize);
resize();

function drawWheel() {
  ctx.clearRect(0,0,size,size);
  const segAngle = 2*Math.PI/categories.length;
  categories.forEach((cat,i) => {
    const start = angle + i*segAngle;
    ctx.beginPath();
      ctx.moveTo(center,center);
      ctx.arc(center,center,radius,start,start+segAngle);
      ctx.fillStyle = colors[i];
      ctx.fill();
    ctx.save();
      ctx.translate(center,center);
      ctx.rotate(start+segAngle/2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.floor(size/20)}px sans-serif`;
      ctx.fillText(cat, radius-10, 5);
    ctx.restore();
  });
  // marcador
  ctx.beginPath();
    ctx.moveTo(center+radius+5,center);
    ctx.lineTo(center+radius+25,center-10);
    ctx.lineTo(center+radius+25,center+10);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
}

// — ANIMACIÓN CON PROMESA —
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
        // cálculo de índice ganador
        const finalAngle = ((angle % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
        const idx = Math.floor((2*Math.PI - finalAngle)/(2*Math.PI/categories.length)) % categories.length;
        resolve(idx);
      }
    }
    frame();
  });
}

// — DISPARADOR DE GIRO —
window.addEventListener('keydown', async () => {
  if (angularVelocity !== 0) return;            // ya girando
  resultEl.textContent = 'Girando...';
  const vueltas = Math.random()*3 + 3;
  angularVelocity = vueltas*(2*Math.PI)/60;

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
  } catch (err) {
    console.error(err);
    resultEl.textContent = 'Error de conexión';
  }
});

