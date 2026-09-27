// ============================================================
// REPARO TECH — SITE PÚBLICO
// ============================================================

const WHATSAPP_NUMBER = "5519982826005";


// ============================================================
// WHATSAPP
// ============================================================

function buildWhatsAppUrl(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

document.querySelectorAll(".whatsapp-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        const message = link.dataset.message || "Olá! Quero falar com a Reparo Tech.";
        const url = buildWhatsAppUrl(message);
        window.open(url, "_blank", "noopener,noreferrer");
    });
});


// ============================================================
// TABS DE CATEGORIA
// ============================================================

document.querySelectorAll(".cat-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
        const categoria = tab.dataset.categoria;

        document.querySelectorAll(".cat-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        document.querySelectorAll(".cat-panel").forEach(p => p.classList.remove("active"));
        const painel = document.querySelector(`.cat-panel[data-categoria="${categoria}"]`);
        if (painel) painel.classList.add("active");
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
        menuBtn.textContent = navLinks.classList.contains("open") ? "✕" : "☰";
    });

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("open");
            menuBtn.textContent = "☰";
        });
    });

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
// HEADER — SCROLL
// ============================================================

const header = document.querySelector(".header");
if (header) {
    window.addEventListener("scroll", () => {
        header.classList.toggle("scrolled", window.scrollY > 50);
    }, { passive: true });
}


// ============================================================
// ANO NO COPYRIGHT
// ============================================================

const copyright = document.querySelector(".copyright");
if (copyright) {
    const ano = new Date().getFullYear();
    copyright.innerHTML = copyright.innerHTML.replace(/\d{4}/, ano);
}

console.log("🔧 Site Reparo Tech carregado.");