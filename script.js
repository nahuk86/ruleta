// Configuración inicial
const categories = [
    { name: "Isla Ibupirac", color: "#FF6384", max: 0, current: 0 },
    { name: "Isla Nurtec", color: "#36A2EB", max: 0, current: 0 },
    { name: "Isla Braftovi", color: "#FFCE56", max: 0, current: 0 },
    { name: "Isla Abrysvo", color: "#4BC0C0", max: 0, current: 0 },
    { name: "Isla Zavicefta", color: "#9966FF", max: 0, current: 0 }
];

// Variables del juego
let wheel;
let spinning = false;
let currentRotation = 0;
const spinDuration = 5000; // 5 segundos
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJS_T0S-_ZGgmCN_T9KC8HdR63Upj_ZW5GPM-JHy74j-Em8_lK-WotjF4EvimsNaZJBw/exec';
const GITHUB_PAGES_URL = 'https://nahuk86.github.io/ruleta';

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await loadDataFromGoogleSheets();
    initializeWheel();
    updateCountersDisplay();
    
    document.getElementById('spin-btn').addEventListener('click', spinWheel);
    
    // Agregar botón de reinicio
    const resetBtn = document.createElement('button');
    resetBtn.id = 'reset-btn';
    resetBtn.textContent = 'Reiniciar Contadores';
    resetBtn.addEventListener('click', resetCounters);
    document.querySelector('.container').appendChild(resetBtn);
});

// Cargar datos desde Google Sheets (usando GET)
async function loadDataFromGoogleSheets() {
    try {
        const url = new URL(SCRIPT_URL);
        url.searchParams.append('origin', GITHUB_PAGES_URL);
        url.searchParams.append('cache', Date.now());
        
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const { data, status } = await response.json();
        
        if (status !== 'success') {
            throw new Error('Error en la respuesta del servidor');
        }
        
        handleDataLoad(data);
        console.log("Datos cargados correctamente desde Google Sheets");
    } catch (error) {
        console.error("Error al cargar datos:", error);
        // Usar valores por defecto si falla la conexión
        categories.forEach(cat => {
            cat.max = 10; // Valor por defecto
            cat.current = 0;
        });
    }
}

function handleDataLoad(data) {
    data.forEach(row => {
        const category = categories.find(cat => cat.name === row[0]);
        if (category) {
            category.max = parseInt(row[1]) || 0;
            category.current = parseInt(row[2]) || 0;
        }
    });
}

// Inicializar y dibujar la ruleta
function initializeWheel() {
    const canvas = document.getElementById('wheel');
    wheel = canvas.getContext('2d');
    drawWheel();
}

function drawWheel() {
    const centerX = wheel.canvas.width / 2;
    const centerY = wheel.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const arc = (2 * Math.PI) / categories.length;
    
    wheel.clearRect(0, 0, wheel.canvas.width, wheel.canvas.height);
    
    categories.forEach((category, index) => {
        const startAngle = index * arc + currentRotation;
        const endAngle = (index + 1) * arc + currentRotation;
        
        wheel.beginPath();
        wheel.moveTo(centerX, centerY);
        wheel.arc(centerX, centerY, radius, startAngle, endAngle);
        wheel.closePath();
        wheel.fillStyle = category.current < category.max ? category.color : '#CCCCCC';
        wheel.fill();
        
        // Texto
        wheel.save();
        wheel.translate(centerX, centerY);
        wheel.rotate(startAngle + arc / 2);
        wheel.textAlign = 'right';
        wheel.fillStyle = '#fff';
        wheel.font = 'bold 16px Arial';
        wheel.fillText(category.name, radius - 20, 5);
        wheel.restore();
    });
}

// Lógica para girar la ruleta
function spinWheel() {
    if (spinning) return;
    
    const availableCategories = categories.filter(cat => cat.current < cat.max);
    if (availableCategories.length === 0) {
        document.getElementById('result').textContent = "Todas las categorías han alcanzado su límite";
        return;
    }
    
    spinning = true;
    document.getElementById('spin-btn').disabled = true;
    document.getElementById('result').textContent = "";
    
    const segmentAngle = 360 / categories.length;
    const randomOffset = Math.random() * segmentAngle;
    const targetSegment = Math.floor(Math.random() * availableCategories.length);
    const targetCategory = availableCategories[targetSegment];
    const targetIndex = categories.findIndex(cat => cat.name === targetCategory.name);
    
    const targetRotation = currentRotation + 5 * 360 + (targetIndex * segmentAngle + randomOffset) * (Math.PI / 180);
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easeProgress = easeOutCubic(progress);
        currentRotation = easeProgress * (targetRotation - currentRotation) + currentRotation;
        
        drawWheel();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            finishSpin(targetCategory);
        }
    }
    
    animate();
}

function easeOutCubic(t) {
    return (--t) * t * t + 1;
}

// Finalizar giro y actualizar datos
async function finishSpin(selectedCategory) {
    spinning = false;
    document.getElementById('spin-btn').disabled = false;
    
    selectedCategory.current++;
    await updateCountersInGoogleSheets();
    updateCountersDisplay();
    
    document.getElementById('result').textContent = `¡Ha salido: ${selectedCategory.name}!`;
}

// Actualizar contadores (usando GET)
async function updateCountersInGoogleSheets() {
    const data = categories.map(cat => [cat.name, cat.max, cat.current]);
    
    try {
        const url = new URL(SCRIPT_URL);
        url.searchParams.append('action', 'update');
        url.searchParams.append('data', JSON.stringify(data));
        url.searchParams.append('origin', GITHUB_PAGES_URL);
        url.searchParams.append('cache', Date.now());
        
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Datos actualizados en Google Sheets:", result);
    } catch (error) {
        console.error("Error al actualizar Google Sheets:", error);
    }
}

function updateCountersDisplay() {
    const countersContainer = document.getElementById('counters');
    countersContainer.innerHTML = '';
    
    categories.forEach(category => {
        const counterItem = document.createElement('div');
        counterItem.className = 'counter-item';
        counterItem.innerHTML = `
            <div class="name">${category.name}</div>
            <div class="count">${category.current} / ${category.max}</div>
            <div class="status">${category.current < category.max ? '✅ Disponible' : '❌ Límite alcanzado'}</div>
        `;
        countersContainer.appendChild(counterItem);
    });
}

// Reiniciar contadores
async function resetCounters() {
    if (confirm("¿Estás seguro de que quieres reiniciar todos los contadores a cero?")) {
        categories.forEach(cat => cat.current = 0);
        await updateCountersInGoogleSheets();
        updateCountersDisplay();
        drawWheel();
    }
}
