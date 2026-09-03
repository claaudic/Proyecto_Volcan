const menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
const punteroFino = window.matchMedia("(hover: hover) and (pointer: fine)");

function movimientoPermitido() {
    return !menosMovimiento.matches && punteroFino.matches;
}

function iniciarRevelado() {
    const objetivos = document.querySelectorAll("[data-revelar]");

    if (objetivos.length === 0) {
        return;
    }

    if (menosMovimiento.matches || !("IntersectionObserver" in window)) {
        return;
    }

    const alto = window.innerHeight || document.documentElement.clientHeight;
    const pendientes = [];

    objetivos.forEach(function (elemento) {
        if (elemento.getBoundingClientRect().top < alto - 40) {
            return;
        }

        elemento.classList.add("revelar", "revelar-listo");
        pendientes.push(elemento);
    });

    if (pendientes.length === 0) {
        return;
    }

    const observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
            if (!entrada.isIntersecting) {
                return;
            }

            const elemento = entrada.target;
            const retraso = Number(elemento.dataset.retraso || 0);

            window.setTimeout(function () {
                elemento.classList.add("revelar-visible");
            }, retraso);

            observador.unobserve(elemento);
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

    pendientes.forEach(function (elemento) {
        observador.observe(elemento);
    });
}

function escalonarTarjetas() {
    const tarjetas = document.querySelectorAll(".productos-destacados li");

    tarjetas.forEach(function (tarjeta, indice) {
        tarjeta.setAttribute("data-revelar", "");
        tarjeta.dataset.retraso = String(Math.min(indice, 7) * 60);
    });
}

function iniciarParallaxRaton() {
    const hero = document.querySelector(".hero");

    if (!hero || !movimientoPermitido()) {
        return;
    }

    const capas = hero.querySelectorAll("[data-profundidad]");

    if (capas.length === 0) {
        return;
    }

    let pendiente = false;
    let x = 0;
    let y = 0;

    hero.addEventListener("mousemove", function (evento) {
        const caja = hero.getBoundingClientRect();
        x = (evento.clientX - caja.left) / caja.width - 0.5;
        y = (evento.clientY - caja.top) / caja.height - 0.5;

        if (!pendiente) {
            pendiente = true;
            window.requestAnimationFrame(aplicar);
        }
    }, { passive: true });

    hero.addEventListener("mouseleave", function () {
        x = 0;
        y = 0;
        window.requestAnimationFrame(aplicar);
    }, { passive: true });

    function aplicar() {
        pendiente = false;

        capas.forEach(function (capa) {
            const fuerza = Number(capa.dataset.profundidad);
            capa.style.setProperty("--px", (x * fuerza).toFixed(2) + "px");
            capa.style.setProperty("--py", (y * fuerza).toFixed(2) + "px");
            capa.style.transform = "translate3d(var(--px, 0), var(--py, 0), 0)";
        });
    }
}

function iniciarParallaxScroll() {
    const imagen = document.querySelector(".hero-imagen img");

    if (!imagen || menosMovimiento.matches) {
        return;
    }

    let pendiente = false;

    window.addEventListener("scroll", function () {
        if (pendiente) {
            return;
        }

        pendiente = true;

        window.requestAnimationFrame(function () {
            pendiente = false;
            const desplazamiento = Math.min(window.scrollY * 0.08, 40);
            imagen.style.transform = "rotate(-1.2deg) translate3d(0, " + desplazamiento.toFixed(1) + "px, 0)";
        });
    }, { passive: true });
}

function iniciarInclinacion() {
    if (!movimientoPermitido()) {
        return;
    }

    const tarjetas = document.querySelectorAll(".productos-destacados .tarjeta-producto");

    tarjetas.forEach(function (tarjeta) {
        let pendiente = false;
        let rx = 0;
        let ry = 0;

        tarjeta.addEventListener("mousemove", function (evento) {
            const caja = tarjeta.getBoundingClientRect();
            const px = (evento.clientX - caja.left) / caja.width - 0.5;
            const py = (evento.clientY - caja.top) / caja.height - 0.5;

            rx = (py * -6).toFixed(2);
            ry = (px * 6).toFixed(2);

            if (!pendiente) {
                pendiente = true;
                window.requestAnimationFrame(function () {
                    pendiente = false;
                    tarjeta.style.setProperty("--rx", rx + "deg");
                    tarjeta.style.setProperty("--ry", ry + "deg");
                });
            }
        }, { passive: true });

        tarjeta.addEventListener("mouseleave", function () {
            tarjeta.style.setProperty("--rx", "0deg");
            tarjeta.style.setProperty("--ry", "0deg");
        }, { passive: true });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    escalonarTarjetas();
    iniciarRevelado();
    iniciarParallaxRaton();
    iniciarParallaxScroll();
    iniciarInclinacion();
});


// ==========================================
// CARRUSEL DE LA PORTADA
// Si el sistema pide menos movimiento,
// no avanza solo: solo con las flechas.
// ==========================================

const carruselPortada = document.getElementById("carruselHero");

if (carruselPortada && menosMovimiento.matches && typeof bootstrap !== "undefined") {
    bootstrap.Carousel.getOrCreateInstance(carruselPortada).pause();
}
