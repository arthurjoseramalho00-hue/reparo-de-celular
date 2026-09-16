// ============================================================
// CONSULTA DE PREÇOS INTERATIVA (v2 — com Qualidade)
// ============================================================

const CONSULTA_URL = "https://ggdzzmekaxrovmuyvxyn.supabase.co";
const CONSULTA_KEY = "sb_publishable_EyZOeqOCjgq_9RjBCUfa8w_121a85zK";

let consultaMarca = null;
let consultaModelo = null;
let consultaServico = null;
let consultaQualidade = null;
let consultaResultado = null;

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

    consultaMarca = document.getElementById("consultaMarca");
    consultaModelo = document.getElementById("consultaModelo");
    consultaServico = document.getElementById("consultaServico");
    consultaQualidade = document.getElementById("consultaQualidade");
    consultaResultado = document.getElementById("consultaResultado");

    if (!consultaMarca || !consultaResultado) return;

    const pronto = await esperarSupabase();
    if (!pronto) {
        consultaMarca.innerHTML = `<option value="">Erro ao carregar</option>`;
        return;
    }

    try {
        const sb = window.supabase.createClient(CONSULTA_URL, CONSULTA_KEY);

        const [resServicos, resPrecos, resConfig] = await Promise.all([
            sb.from("servicos").select("id, marca, modelo, tipo_servico, qualidade, observacao_tecnica, status, prazo, preco").eq("status", "ativo"),
            sb.from("precos").select("servico_id, preco_final"),
            sb.from("configuracoes").select("chave, valor").eq("chave", "empresa_garantia")
        ]);

        servicosCache = resServicos.data || [];
        precosCache = resPrecos.data || [];

        if (resConfig.data && resConfig.data.length > 0) {
            garantiaEmpresa = resConfig.data[0].valor || "90 dias";
        }

        if (servicosCache.length === 0) {
            consultaMarca.innerHTML = `<option value="">Nenhum serviço disponível</option>`;
            return;
        }

        const marcas = [...new Set(servicosCache.map(s => s.marca).filter(Boolean))].sort();

        consultaMarca.innerHTML = `<option value="">Selecione a marca</option>`;
        marcas.forEach(function (m) {
            const o = document.createElement("option");
            o.value = m;
            o.textContent = m;
            consultaMarca.appendChild(o);
        });

        configurarEventos();

        console.log("✅ Consulta carregada. " + servicosCache.length + " serviços.");

    } catch (erro) {
        console.error("Erro na consulta:", erro);
        consultaMarca.innerHTML = `<option value="">Erro ao carregar</option>`;
    }
}


function configurarEventos() {

    // MARCA → MODELOS
    consultaMarca.addEventListener("change", function () {

        const marca = consultaMarca.value;

        consultaModelo.innerHTML = `<option value="">Selecione o modelo</option>`;
        consultaServico.innerHTML = `<option value="">Escolha o modelo primeiro</option>`;
        consultaServico.disabled = true;
        resetarQualidade();
        mostrarPlaceholder();

        if (!marca) {
            consultaModelo.disabled = true;
            consultaModelo.innerHTML = `<option value="">Escolha a marca primeiro</option>`;
            return;
        }

        const modelos = [...new Set(
            servicosCache.filter(s => s.marca === marca).map(s => s.modelo).filter(Boolean)
        )].sort();

        consultaModelo.disabled = false;
        modelos.forEach(function (m) {
            const o = document.createElement("option");
            o.value = m;
            o.textContent = m;
            consultaModelo.appendChild(o);
        });
    });

    // MODELO → SERVIÇOS
    consultaModelo.addEventListener("change", function () {

        const marca = consultaMarca.value;
        const modelo = consultaModelo.value;

        consultaServico.innerHTML = `<option value="">Selecione o serviço</option>`;
        resetarQualidade();
        mostrarPlaceholder();

        if (!modelo) {
            consultaServico.disabled = true;
            consultaServico.innerHTML = `<option value="">Escolha o modelo primeiro</option>`;
            return;
        }

        const servicos = servicosCache.filter(s => s.marca === marca && s.modelo === modelo);

        // Remove duplicatas de tipo_servico
        const tiposUnicos = [...new Set(servicos.map(s => s.tipo_servico))];

        consultaServico.disabled = false;
        tiposUnicos.forEach(function (tipo) {
            const o = document.createElement("option");
            o.value = tipo;
            o.textContent = tipo;
            consultaServico.appendChild(o);
        });
    });

    // SERVIÇO → QUALIDADE ou RESULTADO
    consultaServico.addEventListener("change", function () {

        const tipoServico = consultaServico.value;
        const marca = consultaMarca.value;
        const modelo = consultaModelo.value;

        if (!tipoServico) {
            resetarQualidade();
            mostrarPlaceholder();
            return;
        }

        // Filtra serviços deste modelo + tipo
        const variacoes = servicosCache.filter(s =>
            s.marca === marca &&
            s.modelo === modelo &&
            s.tipo_servico === tipoServico
        );

        // Se há mais de 1 variação de qualidade, mostra o 4º select
        if (variacoes.length > 1) {
            consultaQualidade.disabled = false;
            consultaQualidade.innerHTML = `<option value="">Escolha a qualidade</option>`;

            variacoes.forEach(function (v) {
                const o = document.createElement("option");
                o.value = v.id;
                o.textContent = v.qualidade || "Padrão";
                consultaQualidade.appendChild(o);
            });

            mostrarPlaceholder();
            return;
        }

        // Se só tem 1, mostra direto
        resetarQualidade();
        if (variacoes.length === 1) {
            mostrarResultado(variacoes[0]);
        }
    });

    // QUALIDADE → RESULTADO
    if (consultaQualidade) {
        consultaQualidade.addEventListener("change", function () {

            const id = consultaQualidade.value;

            if (!id) {
                mostrarPlaceholder();
                return;
            }

            const servico = servicosCache.find(s => Number(s.id) === Number(id));
            if (!servico) return;

            mostrarResultado(servico);
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

    const preco = precosCache.find(p => Number(p.servico_id) === Number(servico.id));

    let valor = null;
    if (preco && Number(preco.preco_final) > 0) {
        valor = Number(preco.preco_final);
    } else if (servico.preco && Number(servico.preco) > 0) {
        valor = Number(servico.preco);
    }

    const valorFormatado = valor !== null
        ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : "Sob consulta";

    const prazo = servico.prazo || "A definir";
    const qualidade = servico.qualidade || null;
    const obsTecnica = servico.observacao_tecnica || null;

    let msg = `Olá! Quero um orçamento:\n\n`;
    msg += `📱 ${servico.marca} ${servico.modelo}\n`;
    msg += `🔧 ${servico.tipo_servico}\n`;
    if (qualidade) msg += `⭐ Qualidade: ${qualidade}\n`;
    msg += `💰 ${valorFormatado}\n\n`;
    msg += `Podemos agendar?`;

    const numeroWhats = (typeof WHATSAPP_NUMBER !== "undefined") ? WHATSAPP_NUMBER : "";
    const urlWhats = numeroWhats
        ? `https://wa.me/${numeroWhats}?text=${encodeURIComponent(msg)}`
        : "#";

    const blocoObs = obsTecnica ? `
        <div class="preco-card-obs">
            <span>ℹ️</span>
            <div>
                <strong>Importante</strong>
                ${escapar(obsTecnica)}
            </div>
        </div>
    ` : "";

    const blocoQualidade = qualidade ? `
        <div class="preco-card-info-item" style="grid-column: 1 / -1;">
            <span>⭐</span>
            <div>
                <strong>Qualidade da peça</strong>
                ${escapar(qualidade)}
            </div>
        </div>
    ` : "";

    consultaResultado.innerHTML = `
        <div class="preco-card">
            <div class="preco-card-aparelho">
                <span class="preco-card-aparelho-icon">📱</span>
                <strong>${escapar(servico.marca)} ${escapar(servico.modelo)}</strong>
            </div>

            <div class="preco-card-servico">
                🔧 ${escapar(servico.tipo_servico)}
            </div>

            <div class="preco-card-valor">
                <span class="preco-card-valor-label">Valor estimado</span>
                <span class="preco-card-valor-numero">${valorFormatado}</span>
            </div>

            <div class="preco-card-info">
                <div class="preco-card-info-item">
                    <span>⏱️</span>
                    <div>
                        <strong>Prazo</strong>
                        ${escapar(prazo)}
                    </div>
                </div>
                <div class="preco-card-info-item">
                    <span>🛡️</span>
                    <div>
                        <strong>Garantia</strong>
                        ${escapar(garantiaEmpresa)}
                    </div>
                </div>
                ${blocoQualidade}
            </div>

            ${blocoObs}

            <div class="preco-card-aviso">
                💡 O valor pode variar após avaliação presencial do aparelho.
            </div>

            <div class="preco-card-acoes">
                <a href="${urlWhats}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                    💬 Solicitar orçamento
                </a>
            </div>
        </div>
    `;

    setTimeout(function () {
        consultaResultado.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
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

console.log("🔍 Consulta v2 com qualidade carregada.");