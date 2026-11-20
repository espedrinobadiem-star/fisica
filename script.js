
/* =========================================
   PHYSICS LAB PRO
   SIMULADOR DE CAIDA LIBRE
========================================= */

// =========================================
// 1. ELEMENTOS DEL HTML
// =========================================

const pelota = document.getElementById("pelota");
const escenario = document.querySelector(".escenario");

const masaInput = document.getElementById("masa");
const alturaInput = document.getElementById("altura");
const gravedadInput = document.getElementById("gravedad");
const friccionInput = document.getElementById("friccion");

const velocidadSimulacion = document.getElementById("velocidadSimulacion");
const valorFriccion = document.getElementById("valorFriccion");
const alturaGuia = document.getElementById("alturaGuia");

const tiempoTexto = document.getElementById("tiempo");
const velocidadTexto = document.getElementById("velocidad");
const alturaTexto = document.getElementById("alturaActual");
const aceleracionTexto = document.getElementById("aceleracion");

const epTexto = document.getElementById("ep");
const ecTexto = document.getElementById("ec");
const emTexto = document.getElementById("em");

const estado = document.getElementById("estado");
const tabla = document.getElementById("tabla");

const canvas = document.getElementById("grafica");
const ctx = canvas.getContext("2d");

const tiempoFinal = document.getElementById("tiempoFinal");
const velocidadFinal = document.getElementById("velocidadFinal");
const distancia = document.getElementById("distancia");
const conclusion = document.getElementById("conclusion");

const iniciar = document.getElementById("iniciar");
const pausar = document.getElementById("pausar");
const reiniciar = document.getElementById("reiniciar");

// =========================================
// 2. VARIABLES DE LA SIMULACIÓN
// =========================================

let masa = 2;
let gravedad = 9.8;
let resistencia = 0;

let alturaInicial = 20;
let alturaActual = 20;

let tiempo = 0;
let velocidad = 0;
let aceleracion = 9.8;

let energiaDisipada = 0;

let activo = false;
let finalizado = false;

let ultimoFrame = 0;
let acumulador = 0;
let ultimoRegistro = 0;
let ultimoGrafico = 0;

const PASO = 0.01;

let animacion = null;

let datosTabla = [];
let datosGrafica = [];

// =========================================
// 3. FUNCIONES AUXILIARES
// =========================================

function formato(numero) {
    return Number(numero).toFixed(2);
}

function leerConfiguracion() {

    const nuevaMasa = Number(masaInput.value);
    const nuevaAltura = Number(alturaInput.value);
    const nuevaGravedad = Number(gravedadInput.value);
    const nuevaResistencia = Number(friccionInput.value);

    if (
        !Number.isFinite(nuevaMasa) ||
        !Number.isFinite(nuevaAltura) ||
        !Number.isFinite(nuevaGravedad) ||
        !Number.isFinite(nuevaResistencia) ||
        nuevaMasa <= 0 ||
        nuevaAltura <= 0 ||
        nuevaGravedad <= 0 ||
        nuevaResistencia < 0 ||
        nuevaResistencia > 100
    ) {
        alert("Por favor, introduce valores válidos.");
        return false;
    }

    masa = nuevaMasa;
    alturaInicial = nuevaAltura;
    gravedad = nuevaGravedad;
    resistencia = nuevaResistencia;

    return true;
}

// =========================================
// 4. CÁLCULO DE ENERGÍAS
// =========================================

function calcularEnergias() {

    const potencial = masa * gravedad * alturaActual;

    const cinetica = 0.5 * masa * velocidad ** 2;

    const mecanica = potencial + cinetica;

    epTexto.textContent = formato(potencial) + " J";
    ecTexto.textContent = formato(cinetica) + " J";
    emTexto.textContent = formato(mecanica) + " J";

    return {
        ep: potencial,
        ec: cinetica,
        em: mecanica
    };
}

// =========================================
// 5. ACTUALIZAR INDICADORES
// =========================================

function actualizarIndicadores() {

    tiempoTexto.textContent = formato(tiempo) + " s";
    velocidadTexto.textContent = formato(velocidad) + " m/s";
    alturaTexto.textContent = formato(alturaActual) + " m";
    aceleracionTexto.textContent = formato(aceleracion) + " m/s²";

    calcularEnergias();
}

// =========================================
// 6. MOVIMIENTO DE LA PELOTA
// =========================================

function moverPelota() {

    const espacioDisponible =
        escenario.clientHeight -
        pelota.offsetHeight -
        20;

    const recorrido = Math.max(0, espacioDisponible - 10);

    const progreso = Math.min(
        1,
        Math.max(0, (alturaInicial - alturaActual) / alturaInicial)
    );

    pelota.style.top = (10 + progreso * recorrido) + "px";
}

// =========================================
// 7. REGISTRAR DATOS
// =========================================

function guardarDatos() {

    const energias = calcularEnergias();

    // Registrar en la gráfica
    datosGrafica.push({
        tiempo: tiempo,
        ep: energias.ep,
        ec: energias.ec,
        em: energias.em
    });

    // Evitar filas repetidas
    const ultimo = datosTabla[datosTabla.length - 1];

    if (ultimo && Math.abs(ultimo.tiempo - tiempo) < 0.000001) {
        return;
    }

    const registro = {
        tiempo: tiempo,
        altura: alturaActual,
        velocidad: velocidad,
        ep: energias.ep,
        ec: energias.ec,
        em: energias.em
    };

    datosTabla.push(registro);

    const fila = document.createElement("tr");

    const valores = [
        registro.tiempo,
        registro.altura,
        registro.velocidad,
        registro.ep,
        registro.ec,
        registro.em
    ];

    valores.forEach(valor => {

        const celda = document.createElement("td");

        celda.textContent = formato(valor);

        fila.appendChild(celda);
    });

    tabla.appendChild(fila);
}

// =========================================
// 8. DIBUJAR GRÁFICA
// =========================================

function dibujarGrafica() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const margenIzquierdo = 65;
    const margenInferior = 45;
    const margenSuperior = 25;
    const margenDerecho = 25;

    const ancho = canvas.width - margenIzquierdo - margenDerecho;
    const alto = canvas.height - margenSuperior - margenInferior;

    const energiaInicial = masa * gravedad * alturaInicial;

    const energiaMaxima = Math.max(
        energiaInicial,
        ...datosGrafica.map(d => d.em),
        1
    ) * 1.15;

    const tiempoMaximo = Math.max(tiempo, 1);

    // Fondo de la gráfica
    ctx.fillStyle = "#121d33";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cuadrícula
    ctx.strokeStyle = "rgba(145,160,186,0.15)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {

        const y = margenSuperior + (alto / 5) * i;

        ctx.beginPath();
        ctx.moveTo(margenIzquierdo, y);
        ctx.lineTo(canvas.width - margenDerecho, y);
        ctx.stroke();

        const valor = energiaMaxima * (1 - i / 5);

        ctx.fillStyle = "#91a0ba";
        ctx.font = "12px Inter, Arial";
        ctx.textAlign = "right";

        ctx.fillText(formato(valor), margenIzquierdo - 10, y + 4);
    }

    // Ejes
    ctx.strokeStyle = "#91a0ba";
    ctx.beginPath();

    ctx.moveTo(margenIzquierdo, margenSuperior);
    ctx.lineTo(margenIzquierdo, canvas.height - margenInferior);
    ctx.lineTo(canvas.width - margenDerecho, canvas.height - margenInferior);

    ctx.stroke();

    // Etiquetas
    ctx.fillStyle = "#91a0ba";
    ctx.textAlign = "center";
    ctx.fillText("Tiempo (s)", canvas.width / 2, canvas.height - 10);

    ctx.save();
    ctx.translate(17, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Energía (J)", 0, 0);
    ctx.restore();

    // Dibujar las tres energías
    const series = [
        { nombre: "ep", color: "#20c8ff" },
        { nombre: "ec", color: "#21dfae" },
        { nombre: "em", color: "#a477ff" }
    ];

    series.forEach(serie => {

        if (datosGrafica.length === 0) return;

        ctx.beginPath();
        ctx.strokeStyle = serie.color;
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        datosGrafica.forEach((dato, indice) => {

            const x = margenIzquierdo +
                (dato.tiempo / tiempoMaximo) * ancho;

            const y = margenSuperior +
                (1 - dato[serie.nombre] / energiaMaxima) * alto;

            if (indice === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Punto final
        const ultimo = datosGrafica[datosGrafica.length - 1];

        const x = margenIzquierdo +
            (ultimo.tiempo / tiempoMaximo) * ancho;

        const y = margenSuperior +
            (1 - ultimo[serie.nombre] / energiaMaxima) * alto;

        ctx.fillStyle = serie.color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

// =========================================
// 9. FÍSICA DE LA CAÍDA
// =========================================

function avanzarFisica(dt) {

    // Coeficiente educativo de resistencia
    const coeficiente = (resistencia / 100) * 1.5;

    // Aceleración con resistencia del aire
    aceleracion = gravedad - coeficiente * velocidad;

    const velocidadAnterior = velocidad;
    const alturaAnterior = alturaActual;

    // Actualizar velocidad
    velocidad = Math.max(
        0,
        velocidad + aceleracion * dt
    );

    // Velocidad media durante el paso
    const velocidadMedia = (velocidadAnterior + velocidad) / 2;

    // Calcular nueva altura
    const desplazamiento = velocidadMedia * dt;

    alturaActual -= desplazamiento;

    // Energía disipada por resistencia
    const velocidadMediaCuadrada =
        (velocidadAnterior ** 2 + velocidad ** 2) / 2;

    energiaDisipada +=
        masa * coeficiente * velocidadMediaCuadrada * dt;

    tiempo += dt;

    // Detectar el impacto con el suelo
    if (alturaActual <= 0) {

        const fraccion =
            desplazamiento > 0
                ? Math.min(1, alturaAnterior / desplazamiento)
                : 1;

        tiempo -= dt * (1 - fraccion);
        energiaDisipada -=
            masa * coeficiente * velocidadMediaCuadrada * dt * (1 - fraccion);

        alturaActual = 0;

        finalizarSimulacion();

        return;
    }

    // Registrar datos cada segundo
    if (tiempo - ultimoRegistro >= 1) {
        ultimoRegistro = tiempo;
        guardarDatos();
    }

    // Actualizar gráfica cada décima de segundo
    if (tiempo - ultimoGrafico >= 0.1) {
        ultimoGrafico = tiempo;

        const energias = calcularEnergias();

        datosGrafica.push({
            tiempo: tiempo,
            ep: energias.ep,
            ec: energias.ec,
            em: energias.em
        });
    }
}

// =========================================
// 10. CICLO DE ANIMACIÓN
// =========================================

function animar(marcaTiempo) {

    if (!activo) return;

    if (ultimoFrame === 0) {
        ultimoFrame = marcaTiempo;
    }

    const tiempoReal = Math.min(
        (marcaTiempo - ultimoFrame) / 1000,
        0.1
    );

    ultimoFrame = marcaTiempo;

    const multiplicador = Number(velocidadSimulacion.value);

    acumulador += tiempoReal * multiplicador;

    while (acumulador >= PASO && activo) {

        avanzarFisica(PASO);

        acumulador -= PASO;
    }

    actualizarIndicadores();
    moverPelota();
    dibujarGrafica();

    if (activo) {
        animacion = requestAnimationFrame(animar);
    }
}

// =========================================
// 11. INICIAR SIMULACIÓN
// =========================================

function iniciarSimulacion() {

    if (activo || finalizado) return;

    if (tiempo === 0 && !leerConfiguracion()) {
        return;
    }

    activo = true;

    estado.textContent = "EN CURSO";
    iniciar.textContent = "▶ Continuar";

    ultimoFrame = 0;

    animacion = requestAnimationFrame(animar);
}

// =========================================
// 12. PAUSAR SIMULACIÓN
// =========================================

function pausarSimulacion() {

    if (!activo) return;

    activo = false;

    cancelAnimationFrame(animacion);

    estado.textContent = "PAUSADO";

    ultimoFrame = 0;
}

// =========================================
// 13. FINALIZAR SIMULACIÓN
// =========================================

function finalizarSimulacion() {

    activo = false;
    finalizado = true;

    cancelAnimationFrame(animacion);

    estado.textContent = "FINALIZADO";

    // Guardar el último registro
    guardarDatos();

    actualizarIndicadores();
    moverPelota();
    dibujarGrafica();

    // Mostrar resultados
    tiempoFinal.textContent = formato(tiempo) + " s";

    velocidadFinal.textContent =
        formato(velocidad) + " m/s";

    distancia.textContent =
        formato(alturaInicial) + " m";

    // Conclusión
    if (resistencia > 0) {

        conclusion.textContent =
            "La resistencia del aire disminuyó la energía mecánica. " +
            "Durante la caída, parte de la energía se disipó por el rozamiento. " +
            "Energía disipada aproximada: " +
            formato(energiaDisipada) + " J.";

    } else {

        conclusion.textContent =
            "La energía potencial gravitatoria se transformó en energía cinética. " +
            "Sin resistencia del aire, la energía mecánica se mantiene aproximadamente constante.";
    }
}

// =========================================
// 14. REINICIAR SIMULACIÓN
// =========================================

function reiniciarSimulacion() {

    if (!leerConfiguracion()) return;

    activo = false;
    finalizado = false;

    cancelAnimationFrame(animacion);

    tiempo = 0;
    velocidad = 0;
    aceleracion = gravedad;

    alturaActual = alturaInicial;

    energiaDisipada = 0;

    acumulador = 0;
    ultimoFrame = 0;
    ultimoRegistro = 0;
    ultimoGrafico = 0;

    datosTabla = [];
    datosGrafica = [];

    tabla.innerHTML = "";

    tiempoFinal.textContent = "0.00 s";
    velocidadFinal.textContent = "0.00 m/s";
    distancia.textContent = "0.00 m";

    conclusion.textContent =
        "Configuración lista. Inicia la simulación para obtener resultados.";

    estado.textContent = "EN ESPERA";

    iniciar.textContent = "▶ Iniciar";

    alturaGuia.textContent = alturaInicial + " m";

    // Guardar estado inicial
    guardarDatos();

    actualizarIndicadores();
    moverPelota();
    dibujarGrafica();
}

// =========================================
// 15. EVENTOS DE LOS CONTROLES
// =========================================

iniciar.addEventListener("click", iniciarSimulacion);

pausar.addEventListener("click", pausarSimulacion);

reiniciar.addEventListener("click", reiniciarSimulacion);

// Actualizar porcentaje de resistencia
friccionInput.addEventListener("input", () => {

    valorFriccion.textContent = friccionInput.value + "%";

});

// =========================================
// 16. INICIALIZAR EL SISTEMA
// =========================================

reiniciarSimulacion();
