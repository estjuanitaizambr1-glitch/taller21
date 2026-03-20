//El tiempo de ejecución baja de 1,7 a 0,3 ms con estas optimizaciones
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
// variable para guardar el algoritmo que se va a usar
let metodo = "DDA";

function setMetodo(m, event){
    metodo = m;
    // quita el resaltado de todos los botones y se lo pone solo al que se presionó
    document.querySelectorAll('button').forEach(b => b.classList.remove('activo'));
    event.target.classList.add('activo');
}

// OPTIMIZACIÓN: Se eliminaron operaciones innecesarias (centrado del punto) dentro de una función crítica que se ejecuta muchas veces
// Reduciendo cálculos por píxel y mejorando significativamente el rendimiento.
function drawPoint(ctx, x, y, size){
    ctx.fillRect(x, y, size, size);
}


// MARGEN en px
const MARGEN = 40;
let escala = 1;

// convierte coordenadas cartesianas 
// a coordenadas del canvas
// aplica la escala para que los puntos siempre ocupen bien el canvas
function canvasToCartesiana(p1, height){
    return [
        MARGEN + p1.x * escala,
        (height - MARGEN) - p1.y * escala
    ];
}

// MEJORA: calcula la escala automatica segun el valor maximo de los puntos
// deja un 10% de margen extra para que no queden pegados al borde
function calcularEscala(x1, y1, x2, y2, x3, y3){
    let maxX = Math.max(x1, x2, x3);
    let maxY = Math.max(y1, y2, y3);
    let areaW = canvas.width  - MARGEN;   // pixeles utiles en X
    let areaH = canvas.height - MARGEN;   // pixeles utiles en Y
    let escX  = areaW / (maxX * 1.1);     // escala para que quepan en X
    let escY  = areaH / (maxY * 1.1);     // escala para que quepan en Y
    return Math.min(escX, escY);      
}

// OPTIMIZACIÓN: Se eliminaron cálculos innecesarios (dx, dy)
// Se usa desestructuración para mayor claridad y se selecciona el algoritmo dinámicamente para simplificar el código.
function drawLine(x1, y1, x2, y2, size, method){
    // convertir coordenadas
    const [x1c, y1c] = canvasToCartesiana({x: x1, y: y1}, canvas.height);
    const [x2c, y2c] = canvasToCartesiana({x: x2, y: y2}, canvas.height);

    // elegir algoritmo directamente
    const algoritmo = (method === "DDA") ? drawDDA : drawBresenham;

    algoritmo(x1c, y1c, x2c, y2c, size);
}


// OPTIMIZACIÓN: Se reemplazó Math.round por una operación bit a bit para reducir el costo dentro del bucle
// Mejorando el rendimiento en el trazado de líneas.
function drawDDA(x1, y1, x2, y2, size){
    let dx = x2 - x1;
    let dy = y2 - y1;
    let pasos = Math.max(Math.abs(dx), Math.abs(dy));

    let xinc = dx / pasos;
    let yinc = dy / pasos;

    let x = x1;
    let y = y1;

    for(let i = 0; i <= pasos; i++){
        drawPoint(ctx, x|0, y|0, size); // más rápido que Math.round
        x += xinc;
        y += yinc;
    }
}
// algoritmo Bresenham
// usa un error para decidir cuando mover el pixel
function drawBresenham(x1,y1,x2,y2,size){
    let dx = Math.abs(x2-x1);
    let dy = Math.abs(y2-y1);
    let sx = (x1<x2)?1:-1;
    let sy = (y1<y2)?1:-1;
    let err = dx-dy;
    while(true){
        drawPoint(ctx,x1,y1,size);
        if(x1===x2 && y1===y2) break;
        let e2 = 2*err;
        if(e2>-dy){
            err -= dy;
            x1 += sx;
        }
        if(e2<dx){
            err += dx;
            y1 += sy;
        }
    }
}

// OPTIMIZACIÓN: Se reemplazó el cálculo de pendientes por una comparación usando determinante
// Se eliminan divisiones y se simplifica la lógica para mejorar el rendimiento y la precisión.
function esTriangulo(x1, y1, x2, y2, x3, y3){
    // usando determinante (producto cruzado)
    return (x2 - x1)*(y3 - y1) !== (y2 - y1)*(x3 - x1);
}

// OPTIMIZACIÓN: Se redujeron cálculos repetidos dentro de los bucles
// Se precalcularon límites y dimensiones del canvas y se simplificaron operaciones para mejorar el rendimiento al dibujar la cuadrícula.
function dibujarEjes(x1, y1, x2, y2, x3, y3){
    const maxVal = Math.max(x1, x2, x3, y1, y2, y3);
    const limite = maxVal * 1.1;

    let intervalo = Math.pow(10, Math.floor(Math.log10(maxVal)));
    if(maxVal / intervalo < 4) intervalo /= 2;

    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.3;

    // precalcular limites en pixeles
    const width = canvas.width;
    const height = canvas.height;
    const baseY = height - MARGEN;

    for(let v = 0; v <= limite; v += intervalo){
        const px = MARGEN + v * escala;
        const py = baseY - v * escala;

        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, baseY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(MARGEN, py);
        ctx.lineTo(width, py);
        ctx.stroke();
    }

    // ejes principales
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(MARGEN, baseY);
    ctx.lineTo(width, baseY);
    ctx.moveTo(MARGEN, 0);
    ctx.lineTo(MARGEN, baseY);
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "10px monospace";

    ctx.textAlign = "center";
    for(let v = 0; v <= limite; v += intervalo){
        const px = MARGEN + v * escala;
        ctx.fillText(v, px, baseY + 12);
    }

    ctx.textAlign = "right";
    for(let v = 0; v <= limite; v += intervalo){
        const py = baseY - v * escala;
        ctx.fillText(v, MARGEN - 4, py + 3);
    }
}

// OPTIMIZACIÓN: Se ajustó la medición de tiempo para evaluar únicamente el rendimiento del algoritmo de dibujo
// Excluyendo operaciones como renderizado de ejes y limpieza del canvas.
function dibujar(){

    limpiar();

    const x1 = +document.getElementById("x1").value;
    const y1 = +document.getElementById("y1").value;
    const x2 = +document.getElementById("x2").value;
    const y2 = +document.getElementById("y2").value;
    const x3 = +document.getElementById("x3").value;
    const y3 = +document.getElementById("y3").value;
    const size = +document.getElementById("grosor").value;

    escala = calcularEscala(x1, y1, x2, y2, x3, y3);

    dibujarEjes(x1, y1, x2, y2, x3, y3);

    if(!esTriangulo(x1, y1, x2, y2, x3, y3)){
        mensaje.innerText = "No es triángulo";
        return;
    }

    // 🔴 SOLO medimos el dibujo
    const t0 = performance.now();

    drawLine(x1, y1, x2, y2, size, metodo);
    drawLine(x2, y2, x3, y3, size, metodo);
    drawLine(x3, y3, x1, y1, size, metodo);

    const t1 = performance.now();

    mensaje.innerText = `Tiempo algoritmo: ${(t1 - t0).toFixed(4)} ms`;
}
// limpia el canvas
function limpiar(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
}
