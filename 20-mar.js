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

// funcion para dibujar un punto
function drawPoint(ctx, x, y, size){
    ctx.fillRect(x - size/2, y - size/2, size, size);
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

// funcion general para dibujar linea
// contiene las operaciones comunes a DDA y Bresenham
// llama al algoritmo que corresponda
function drawLine(x1, y1, x2, y2, size, method){
    // operacion comun 1: convertir coordenadas canvas a cartesianas
    let p1 = canvasToCartesiana({x: x1, y: y1}, canvas.height);
    let p2 = canvasToCartesiana({x: x2, y: y2}, canvas.height);
    // operacion comun 2: calcular deltas
    let dx = p2[0] - p1[0];
    let dy = p2[1] - p1[1];

    if(method === "DDA"){
        drawDDA(p1[0], p1[1], p2[0], p2[1], size);
    }
    else{
        drawBresenham(p1[0], p1[1], p2[0], p2[1], size);
    }
}

// algoritmo DDA
// se basa en avanzar poco a poco usando incrementos
function drawDDA(x1,y1,x2,y2,size){
    let dx = x2-x1;
    let dy = y2-y1;
    let pasos = Math.max(Math.abs(dx),Math.abs(dy));
    let xinc = dx/pasos;
    let yinc = dy/pasos;
    let x = x1;
    let y = y1;
    for(let i=0;i<=pasos;i++){
        drawPoint(ctx,Math.round(x),Math.round(y),size);
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

// funcion para saber si los puntos forman triangulo
// se comparan las pendientes
// si las pendientes son iguales los puntos estan en la misma linea
function esTriangulo(x1,y1,x2,y2,x3,y3){
    let m1;
    let m2;
    if(x2-x1===0){
        m1 = Infinity;
    }
    else{
        m1 = (y2-y1)/(x2-x1);
    }
    if(x3-x2===0){
        m2 = Infinity;
    }
    else{
        m2 = (y3-y2)/(x3-x2);
    }
    if(m1===m2){
        return false;
    }
    return true;
}

// dibuja ejes con numeros para saber las posiciones
// el origen esta en la esquina inferior izquierda con un margen
// los numeros y la cuadricula se ajustan segun la escala calculada
function dibujarEjes(x1, y1, x2, y2, x3, y3){
    let maxVal = Math.max(x1, x2, x3, y1, y2, y3);

    // intervalo de cuadricula: se ajusta para que haya entre 4 y 8 divisiones
    let intervalo = Math.pow(10, Math.floor(Math.log10(maxVal)));
    if(maxVal / intervalo < 4) intervalo /= 2;

    // cuadricula de fondo
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.3;
    for(let v = 0; v <= maxVal * 1.1; v += intervalo){
        let px = MARGEN + v * escala;
        let py = (canvas.height - MARGEN) - v * escala;
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height - MARGEN); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(MARGEN, py); ctx.lineTo(canvas.width, py); ctx.stroke();
    }

    // ejes principales
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGEN, canvas.height - MARGEN);
    ctx.lineTo(canvas.width, canvas.height - MARGEN);
    ctx.moveTo(MARGEN, 0);
    ctx.lineTo(MARGEN, canvas.height - MARGEN);
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "10px monospace";

    // numeros eje X
    ctx.textAlign = "center";
    for(let v = 0; v <= maxVal * 1.1; v += intervalo){
        let px = MARGEN + v * escala;
        ctx.fillText(v, px, canvas.height - MARGEN + 12);
    }

    // numeros eje Y
    ctx.textAlign = "right";
    for(let v = 0; v <= maxVal * 1.1; v += intervalo){
        let py = (canvas.height - MARGEN) - v * escala;
        ctx.fillText(v, MARGEN - 4, py + 3);
    }
}

// funcion principal
function dibujar(){
    limpiar();
    let x1 = parseInt(document.getElementById("x1").value);
    let y1 = parseInt(document.getElementById("y1").value);
    let x2 = parseInt(document.getElementById("x2").value);
    let y2 = parseInt(document.getElementById("y2").value);
    let x3 = parseInt(document.getElementById("x3").value);
    let y3 = parseInt(document.getElementById("y3").value);
    let size = parseInt(document.getElementById("grosor").value);

    // calcular escala antes de dibujar ejes o lineas
    escala = calcularEscala(x1, y1, x2, y2, x3, y3);

    dibujarEjes(x1, y1, x2, y2, x3, y3);

    // revisa si se forma triangulo
    if(!esTriangulo(x1,y1,x2,y2,x3,y3)){
        document.getElementById("mensaje").innerText =
        "Los puntos no forman un triángulo";
        return;
    }
    document.getElementById("mensaje").innerText =
    "Sí se forma un triángulo";
    drawLine(x1,y1,x2,y2,size,metodo);
    drawLine(x2,y2,x3,y3,size,metodo);
    drawLine(x3,y3,x1,y1,size,metodo);
}

// limpia el canvas
function limpiar(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
}
