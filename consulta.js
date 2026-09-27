// ============================================================
// CONSULTA DE PREÇOS — MULTICATEGORIA (v3)
// ============================================================

const CONSULTA_URL = "https://ggdzzmekaxrovmuyvxyn.supabase.co";
const CONSULTA_KEY = "sb_publishable_EyZOeqOCjgq_9RjBCUfa8w_121a85zK";

let consultaCategoria, consultaMarca, consultaModelo, consultaServico, consultaQualidade, consultaResultado;
let servicosCache = [];
let precosCache = [];
let garantiaEmpresa = "90 dias";


async function esperarSupabase() {
    let t = 0;
    while (typeof window.supabase === "undefined" || !window.supabase.createClient) {
        if (t > 50) return false;
        await new Promise(r => setTimeout(r, 100));
        t++;
    }
    return true;
}


async function iniciarConsulta() {

    console.log("🔍 [v3] Iniciando consulta...");

    consultaCategoria = document.getElementById("consultaCategoria");
    consultaMarca = document.getElementById("consultaMarca");
    consultaModelo = document.getElementById("consultaModelo");
    consultaServico = document.getElementById("consultaServico");
    consultaQualidade = document.getElementById("consultaQualidade");
    consultaResultado = document.getElementById("consultaResultado");

    if (!consultaCategoria || !consultaResultado) {
        console.error("❌ Elementos não encontrados no HTML!");
        return;
    }

    const pronto = await esperarSupabase();
    if (!pronto) { console.error("❌ Supabase não carregou"); return; }

    try {
        const sb = window.supabase.createClient(CONSULTA_URL, CONSULTA_KEY);

        const resServicos = await sb.from("servicos").select("*").eq("status", "ativo");

        if (resServicos.error) {
            console.error("❌ Erro ao buscar:", resServicos.error);
            return;
        }

        servicosCache = resServicos.data || [];
        console.log(`✅ [v3] ${servicosCache.length} serviços ativos`);

        const categorias = {};
        servicosCache.forEach(s => {
            const c = s.categoria || "(SEM CATEGORIA)";
            categorias[c] = (categorias[c] || 0) + 1;
        });
        console.log("📊 [v3] Por categoria:", categorias);

        const resPrecos = await sb.from("precos").select("servico_id, preco_final");
        precosCache = resPrecos.data || [];

        const resConfig = await sb.from("configuracoes").select("chave, valor").eq("chave", "empresa_garantia");
        if (resConfig.data && resConfig.data.length > 0) {
            garantiaEmpresa = resConfig.data[0].valor || "90 dias";
        }

        if (servicosCache.length === 0) {
            consultaCategoria.innerHTML = `<option value="">Nenhum serviço ativo</option>`;
            return;
        }

        configurarEventos();
        console.log("✅ [v3] Consulta pronta");

    } catch (erro) {
        console.error("❌ Erro geral:", erro);
    }
}


function configurarEventos() {

    consultaCategoria.addEventListener("change", function () {

        const categoria = consultaCategoria.value;
        console.log("🖱️ [v3] Categoria:", categoria);

        consultaMarca.innerHTML = `<option value="">Escolha a marca</option>`;
        consultaMarca.disabled = true;
        consultaModelo.innerHTML = `<option value="">Escolha a marca primeiro</option>`;
        consultaModelo.disabled = true;
        consultaServico.innerHTML = `<option value="">Escolha o modelo primeiro</option>`;
        consultaServico.disabled = true;
        resetarQualidade();
        mostrarPlaceholder();

        if (!categoria) return;

        const marcas = [...new Set(
            servicosCache
                .filter(s => s.categoria === categoria)
                .map(s => s.marca)
                .filter(Boolean)
        )].sort();

        console.log(`   Marcas:`, marcas);

        if (marcas.length === 0) {
            consultaMarca.innerHTML = `<option value="">Nenhuma marca cadastrada</option>`;
            return;
        }

        consultaMarca.disabled = false;
        marcas.forEach(function (m) {
            const o = document.createElement("option");
            o.value = m;
            o.textContent = m;
            consultaMarca.appendChild(o);
        });
    });

    consultaMarca.addEventListener("change", function () {

        const categoria = consultaCategoria.value;
        const marca = consultaMarca.value;
        console.log("🖱️ [v3] Marca:", marca);

        consultaModelo.innerHTML = `<option value="">Selecione o modelo</option>`;
        consultaServico.innerHTML = `<option value="">Escolha o modelo primeiro</option>`;
        consultaServico.disabled = true;
        resetarQualidade();
        mostrarPlaceholder();

        if (!marca) return;

        const modelos = [...new Set(
            servicosCache
                .filter(s => s.categoria === categoria && s.marca === marca)
                .map(s => s.modelo)
                .filter(Boolean)
        )].sort();

        console.log(`   Modelos:`, modelos);

        consultaModelo.disabled = false;
        modelos.forEach(function (m) {
            const o = document.createElement("option");
            o.value = m;
            o.textContent = m;
            consultaModelo.appendChild(o);
        });
    });

    consultaModelo.addEventListener("change", function () {

        const categoria = consultaCategoria.value;
        const marca = consultaMarca.value;
        const modelo = consultaModelo.value;
        console.log("🖱️ [v3] Modelo:", modelo);

        consultaServico.innerHTML = `<option value="">Selecione o serviço</option>`;
        resetarQualidade();
        mostrarPlaceholder();

        if (!modelo) return;

        const servicos = servicosCache.filter(s =>
            s.categoria === categoria &&
            s.marca === marca &&
            s.modelo === modelo
        );

        const tiposUnicos = [...new Set(servicos.map(s => s.tipo_servico))];
        console.log(`   Serviços:`, tiposUnicos);

        consultaServico.disabled = false;
        tiposUnicos.forEach(function (tipo) {
            const o = document.createElement("option");
            o.value = tipo;
            o.textContent = tipo;
            consultaServico.appendChild(o);
        });
    });

    consultaServico.addEventListener("change", function () {

        const categoria = consultaCategoria.value;
        const marca = consultaMarca.value;
        const modelo = consultaModelo.value;
        const tipoServico = consultaServico.value;
        console.log("🖱️ [v3] Serviço:", tipoServico);

        if (!tipoServico) { resetarQualidade(); mostrarPlaceholder(); return; }

        const variacoes = servicosCache.filter(s =>
            s.categoria === categoria &&
            s.marca === marca &&
            s.modelo === modelo &&
            s.tipo_servico === tipoServico
        );

        if (variacoes.length > 1) {
            consultaQualidade.disabled = false;
            consultaQualidade.innerHTML = `<option value="">Escolha a qualidade</option>`;
            variacoes.forEach(function (v) {
                const o = document.createElement("option");
                o.value = v.id;
                o.textContent = v.qualidade || "Padrão";
                consultaQualidade.appendChild(o);
            });
            return;
        }

        resetarQualidade();
        if (variacoes.length === 1) mostrarResultado(variacoes[0]);
    });

    if (consultaQualidade) {
        consultaQualidade.addEventListener("change", function () {
            const id = consultaQualidade.value;
            if (!id) { mostrarPlaceholder(); return; }
            const servico = servicosCache.find(s => Number(s.id) === Number(id));
            if (servico) mostrarResultado(servico);
        });
    }
}


function resetarQualidade() {
    if (!consultaQualidade) return;
    consultaQualidade.innerHTML = `<option value="">Escolha a qualidade</option>`;
    consultaQualidade.disabled = true;
}

function mostrarPlaceholder() {
    consultaResultado.innerHTML = `
        <div class="consulta-vazia">
            <div style="font-size: 50px; margin-bottom: 15px;">🔍</div>
            <h3>Selecione as opções acima</h3>
            <p>Vamos mostrar o preço e a garantia do seu reparo.</p>
        </div>
    `;
}

function mostrarResultado(servico) {

    console.log("💰 [v3] Resultado:", servico);

    const preco = precosCache.find(p => Number(p.servico_id) === Number(servico.id));

    let valor = null;
    if (preco && Number(preco.preco_final) > 0) valor = Number(preco.preco_final);
    else if (servico.preco && Number(servico.preco) > 0) valor = Number(servico.preco);

    const valorFormatado = valor !== null
        ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : "Sob consulta";

    const iconeCat = { celular: "📱", computador: "💻", impressora: "🖨️" }[servico.categoria] || "🔧";

    let msg = `Olá! Quero um orçamento:\n\n${iconeCat} ${servico.marca} ${servico.modelo}\n🔧 ${servico.tipo_servico}\n`;
    if (servico.qualidade) msg += `⭐ ${servico.qualidade}\n`;
    msg += `💰 ${valorFormatado}\n\nPodemos agendar?`;

    const numeroWhats = (typeof WHATSAPP_NUMBER !== "undefined") ? WHATSAPP_NUMBER : "";
    const urlWhats = numeroWhats ? `https://wa.me/${numeroWhats}?text=${encodeURIComponent(msg)}` : "#";

    consultaResultado.innerHTML = `
        <div class="preco-card">
            <div class="preco-card-aparelho">
                <span class="preco-card-aparelho-icon">${iconeCat}</span>
                <strong>${escapar(servico.marca)} ${escapar(servico.modelo)}</strong>
            </div>
            <div class="preco-card-servico">🔧 ${escapar(servico.tipo_servico)}</div>
            <div class="preco-card-valor">
                <span class="preco-card-valor-label">Valor estimado</span>
                <span class="preco-card-valor-numero">${valorFormatado}</span>
            </div>
            <div class="preco-card-info">
                <div class="preco-card-info-item">
                    <span>⏱️</span><div><strong>Prazo</strong>${escapar(servico.prazo || "A definir")}</div>
                </div>
                <div class="preco-card-info-item">
                    <span>🛡️</span><div><strong>Garantia</strong>${escapar(garantiaEmpresa)}</div>
                </div>
            </div>
            <div class="preco-card-acoes">
                <a href="${urlWhats}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                    💬 Solicitar orçamento
                </a>
            </div>
        </div>
    `;

    setTimeout(() => consultaResultado.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
}

function escapar(v) {
    if (v === null || v === undefined) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarConsulta);
} else {
    iniciarConsulta();
}

console.log("🔍 [v3] Consulta multicategoria carregada.");