// script.js
// Configuración de categorías y colores (sin cambios)
const categories = [
  'Categoría 1',
  'Categoría 2',
  'Categoría 3',
  'Categoría 4',
  'Categoría 5'
];
const colors = [
  '#e6194b',
  '#3cb44b',
  '#ffe119',
  '#4363d8',
  '#f58231'
];

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
let size, center, radius;
let angle = 0, angularVelocity = 0;

// Ajusta tamaño y dibuja
function resize() {
  size = Math.min(window.innerWidth * 0.9, 600);
  canvas.width = canvas.height = size;
  center = size / 2;
  radius = center - 10;
  drawWheel();
}
window.addEventListener('resize', resize);
resize();

// Dibuja la ruleta
function drawWheel() {
  ctx.clearRect(0, 0, size, size);
  const segAngle = 2 * Math.PI / categories.length;
  categories.forEach((cat, i) => {
    const start = angle + i * segAngle;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, start + segAngle);
    ctx.fillStyle = colors[i];
    ctx.fill();
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

// Animación de giro
function animate() {
  if (Math.abs(angularVelocity) > 0.001) {
    angle += angularVelocity;
    angularVelocity *= 0.97;
    drawWheel();
    requestAnimationFrame(animate);
  } else {
    angularVelocity = 0;
    const finalAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const index = Math.floor((2 * Math.PI - finalAngle) / (2 * Math.PI / categories.length)) % categories.length;
    document.getElementById('result').textContent = `Resultado: ${categories[index]}`;
  }
}

// Gira con cualquier tecla mientras no esté girando
window.addEventListener('keydown', () => {
  if (angularVelocity === 0) {
    document.getElementById('result').textContent = 'Girando...';
    const vueltas = Math.random() * 3 + 3;
    angularVelocity = vueltas * (2 * Math.PI) / 60;
    animate();
  }
});
