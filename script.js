// ============================================================
// REPARO DE CELULAR — SITE PÚBLICO
// ============================================================

// ⚠️ TROQUE AQUI PELO SEU NÚMERO (formato: 55 + DDD + número)
const WHATSAPP_NUMBER = "5519982826005";


// ============================================================
// WHATSAPP — LINKS AUTOMÁTICOS
// ============================================================

function buildWhatsAppUrl(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

document.querySelectorAll(".whatsapp-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        const message = link.dataset.message || "Olá! Quero falar com a Reparo de Celular.";
        const url = buildWhatsAppUrl(message);
        window.open(url, "_blank", "noopener,noreferrer");
    });
});


// ============================================================
// MENU MOBILE
// ============================================================

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {

    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("open");

        if (navLinks.classList.contains("open")) {
            menuBtn.textContent = "✕";
            menuBtn.setAttribute("aria-label", "Fechar menu");
        } else {
            menuBtn.textContent = "☰";
            menuBtn.setAttribute("aria-label", "Abrir menu");
        }
    });

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("open");
            menuBtn.textContent = "☰";
        });
    });

    // Fecha ao clicar fora
    document.addEventListener("click", (event) => {
        if (
            navLinks.classList.contains("open") &&
            !navLinks.contains(event.target) &&
            !menuBtn.contains(event.target)
        ) {
            navLinks.classList.remove("open");
            menuBtn.textContent = "☰";
        }
    });
}


// ============================================================
// HEADER — sombra ao rolar
// ============================================================

const header = document.querySelector(".header");

if (header) {
    window.addEventListener("scroll", () => {
        header.classList.toggle("scrolled", window.scrollY > 50);
    }, { passive: true });
}


// ============================================================
// ANO AUTOMÁTICO NO COPYRIGHT
// ============================================================

const copyright = document.querySelector(".copyright");
if (copyright) {
    const ano = new Date().getFullYear();
    copyright.innerHTML = copyright.innerHTML.replace(/\d{4}/, ano);
}


// ============================================================
console.log("🔧 Site Reparo de Celular carregado.");