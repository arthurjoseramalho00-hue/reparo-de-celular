// ============================================================
// CONSULTA DE PREÇOS INTERATIVA
// ============================================================

const CONSULTA_URL = "https://ggdzzmekaxrovmuyvxyn.supabase.co";
const CONSULTA_KEY = "sb_publishable_EyZOeqOCjgq_9RjBCUfa8w_121a85zK";

const consultaMarca = document.getElementById("consultaMarca");
const consultaModelo = document.getElementById("consultaModelo");
const consultaServico = document.getElementById("consultaServico");
const consultaResultado = document.getElementById("consultaResultado");

let servicosCache = [];
let precosCache = [];
let garantiaEmpresa = "90 dias";


async function iniciarConsulta() {

    if (!consultaMarca) return;

    try {

        const sb = window.supabase.createClient(CONSULTA_URL, CONSULTA_KEY);

        const [resServicos, resPrecos, resConfig] = await Promise.all([
            sb.from("servicos").select("id, marca, modelo, tipo_servico, status, prazo, preco").eq("status", "ativo"),
            sb.from("precos").select("servico_id, preco_final, margem, mao_de_obra, preco_peca, frete"),
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

        const marcasUnicas = [...new Set(servicosCache.map(s => s.marca).filter(Boolean))].sort();

        consultaMarca.innerHTML = `<option value="">Selecione a marca</option>`;
        marcasUnicas.forEach(function (marca) {
            const opt = document.createElement("option");
            opt.value = marca;
            opt.textContent = marca;
            consultaMarca.appendChild(opt);
        });

        console.log("✅ Consulta de preços carregada. " + servicosCache.length + " serviços.");

    } catch (erro) {
        console.error("Erro ao carregar consulta:", erro);
        consultaMarca.innerHTML = `<option value="">Erro ao carregar</option>`;
    }
}


if (consultaMarca) {
    consultaMarca.addEventListener("change", function () {

        const marcaSelecionada = consultaMarca.value;

        consultaModelo.innerHTML = `<option value="">Selecione o modelo</option>`;
        consultaServico.innerHTML = `<option value="">Escolha o modelo primeiro</option>`;
        consultaServico.disabled = true;
        mostrarPlaceholder();

        if (!marcaSelecionada) {
            consultaModelo.disabled = true;
            consultaModelo.innerHTML = `<option value="">Escolha a marca primeiro</option>`;
            return;
        }

        const modelos = [...new Set(
            servicosCache
                .filter(s => s.marca === marcaSelecionada)
                .map(s => s.modelo)
                .filter(Boolean)
        )].sort();

        consultaModelo.disabled = false;

        modelos.forEach(function (modelo) {
            const opt = document.createElement("option");
            opt.value = modelo;
            opt.textContent = modelo;
            consultaModelo.appendChild(opt);
        });
    });
}


if (consultaModelo) {
    consultaModelo.addEventListener("change", function () {

        const marcaSelecionada = consultaMarca.value;
        const modeloSelecionado = consultaModelo.value;

        consultaServico.innerHTML = `<option value="">Selecione o serviço</option>`;
        mostrarPlaceholder();

        if (!modeloSelecionado) {
            consultaServico.disabled = true;
            consultaServico.innerHTML = `<option value="">Escolha o modelo primeiro</option>`;
            return;
        }

        const servicos = servicosCache.filter(
            s => s.marca === marcaSelecionada && s.modelo === modeloSelecionado
        );

        consultaServico.disabled = false;

        servicos.forEach(function (s) {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.tipo_servico;
            consultaServico.appendChild(opt);
        });
    });
}


if (consultaServico) {
    consultaServico.addEventListener("change", function () {

        const servicoId = consultaServico.value;

        if (!servicoId) {
            mostrarPlaceholder();
            return;
        }

        const servico = servicosCache.find(s => Number(s.id) === Number(servicoId));

        if (!servico) {
            mostrarPlaceholder();
            return;
        }

        const preco = precosCache.find(p => Number(p.servico_id) === Number(servicoId));

        let valorFinal;

        if (preco && Number(preco.preco_final) > 0) {
            valorFinal = Number(preco.preco_final);
        } else if (servico.preco && Number(servico.preco) > 0) {
            valorFinal = Number(servico.preco);
        } else {
            valorFinal = null;
        }

        mostrarResultado(servico, valorFinal);
    });
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


function mostrarResultado(servico, valor) {

    const valorFormatado = valor !== null
        ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : "Sob consulta";

    const prazo = servico.prazo || "A definir";

    const mensagem = `Olá! Quero um orçamento:\n\n` +
        `📱 ${servico.marca} ${servico.modelo}\n` +
        `🔧 ${servico.tipo_servico}\n` +
        `💰 ${valorFormatado}\n\n` +
        `Podemos agendar?`;

    const numeroWhats = (typeof WHATSAPP_NUMBER !== "undefined") ? WHATSAPP_NUMBER : "";
    const urlWhats = numeroWhats
        ? `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`
        : "#";

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
            </div>

            <div class="preco-card-aviso">
                💡 O valor pode variar após avaliação presencial do aparelho.
            </div>

            <div class="preco-card-acoes">
                <a
                    href="${urlWhats}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-primary"
                >
                    💬 Solicitar orçamento
                </a>
            </div>

        </div>
    `;

    setTimeout(function () {
        consultaResultado.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
}


function escapar(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarConsulta);
} else {
    iniciarConsulta();
}

console.log("🔍 Módulo de consulta de preços carregado.");