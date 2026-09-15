// ============================================================
// MÓDULO ORDENS DE SERVIÇO
// ============================================================

// Elementos
const novaOS = document.getElementById("novaOS");
const formularioOS = document.getElementById("formularioOS");
const fecharFormularioOS = document.getElementById("fecharFormularioOS");
const cancelarOS = document.getElementById("cancelarOS");
const osForm = document.getElementById("osForm");
const listaOS = document.getElementById("listaOS");
const contadorOS = document.getElementById("contadorOS");

const osCliente = document.getElementById("osCliente");
const osNovoCliente = document.getElementById("osNovoCliente");
const osMarca = document.getElementById("osMarca");
const osModelo = document.getElementById("osModelo");
const osImei = document.getElementById("osImei");
const osServico = document.getElementById("osServico");
const osDefeito = document.getElementById("osDefeito");
const osDiagnostico = document.getElementById("osDiagnostico");
const osValorServico = document.getElementById("osValorServico");
const osValorPecas = document.getElementById("osValorPecas");
const osDesconto = document.getElementById("osDesconto");
const osValorTotal = document.getElementById("osValorTotal");
const osStatus = document.getElementById("osStatus");
const osPrevisao = document.getElementById("osPrevisao");
const osObservacoes = document.getElementById("osObservacoes");

const osPesquisa = document.getElementById("osPesquisa");
const osFiltroStatus = document.getElementById("osFiltroStatus");

// Estado
let todasOS = [];
let termoPesquisaOS = "";
let filtroStatusOS = "todos";
let osEditandoId = null;


// ============================================================
// ABRIR / FECHAR FORMULÁRIO
// ============================================================

async function abrirFormularioOS() {
    await carregarClientesParaSelect();
    await carregarServicosParaSelectOS();
    if (formularioOS) formularioOS.classList.remove("hidden");
}

function fecharFormularioOSFunc() {
    if (formularioOS) formularioOS.classList.add("hidden");
    if (osForm) osForm.reset();
    osEditandoId = null;

    const titulo = formularioOS?.querySelector(".form-header h3");
    if (titulo) titulo.textContent = "Nova Ordem de Serviço";

    atualizarTotalOS();
}

if (novaOS) {
    novaOS.addEventListener("click", async function () {
        if (osForm) osForm.reset();
        osEditandoId = null;

        const titulo = formularioOS?.querySelector(".form-header h3");
        if (titulo) titulo.textContent = "Nova Ordem de Serviço";

        if (osValorServico) osValorServico.value = "0";
        if (osValorPecas) osValorPecas.value = "0";
        if (osDesconto) osDesconto.value = "0";

        await abrirFormularioOS();
        atualizarTotalOS();
    });
}

if (fecharFormularioOS) {
    fecharFormularioOS.addEventListener("click", fecharFormularioOSFunc);
}

if (cancelarOS) {
    cancelarOS.addEventListener("click", fecharFormularioOSFunc);
}

// Botão "+ Novo cliente" dentro do form de OS
if (osNovoCliente) {
    osNovoCliente.addEventListener("click", function () {
        // Fecha o form de OS e abre o de cliente
        fecharFormularioOSFunc();
        abrirPagina("clientes");

        // Dispara o botão de novo cliente
        setTimeout(function () {
            const btn = document.getElementById("novoCliente");
            if (btn) btn.click();
        }, 100);
    });
}


// ============================================================
// ATUALIZAR TOTAL
// ============================================================

function atualizarTotalOS() {
    const vServico = Number(osValorServico?.value || 0);
    const vPecas = Number(osValorPecas?.value || 0);
    const desc = Number(osDesconto?.value || 0);

    const total = vServico + vPecas - desc;

    if (osValorTotal) {
        osValorTotal.value = total.toFixed(2);
    }
}

[osValorServico, osValorPecas, osDesconto].forEach(function (campo) {
    if (campo) campo.addEventListener("input", atualizarTotalOS);
});


// ============================================================
// CARREGAR CLIENTES NO SELECT
// ============================================================

async function carregarClientesParaSelect() {

    if (!osCliente) return;

    const valorAtual = osCliente.value;

    try {
        const { data, error } = await supabaseClient
            .from("clientes")
            .select("id, nome, telefone")
            .order("nome", { ascending: true });

        if (error) throw error;

        osCliente.innerHTML = `<option value="">Selecione um cliente</option>`;

        (data || []).forEach(function (c) {
            const option = document.createElement("option");
            option.value = c.id;
            option.textContent = c.nome + (c.telefone ? ` (${c.telefone})` : "");
            osCliente.appendChild(option);
        });

        if (valorAtual) osCliente.value = valorAtual;

    } catch (erro) {
        console.error("Erro ao carregar clientes para select:", erro);
    }
}


// ============================================================
// CARREGAR SERVIÇOS NO SELECT
// ============================================================

async function carregarServicosParaSelectOS() {

    if (!osServico) return;

    const valorAtual = osServico.value;

    try {
        const { data, error } = await supabaseClient
            .from("servicos")
            .select("id, marca, modelo, tipo_servico, preco")
            .order("marca", { ascending: true });

        if (error) throw error;

        osServico.innerHTML = `<option value="">Nenhum</option>`;

        (data || []).forEach(function (s) {
            const option = document.createElement("option");
            option.value = s.id;
            option.textContent = `${s.marca} ${s.modelo} - ${s.tipo_servico}`;
            option.dataset.preco = s.preco || 0;
            osServico.appendChild(option);
        });

        if (valorAtual) osServico.value = valorAtual;

    } catch (erro) {
        console.error("Erro ao carregar serviços para select:", erro);
    }
}

// Ao selecionar um serviço, sugere preencher valores
if (osServico) {
    osServico.addEventListener("change", function () {
        const option = osServico.options[osServico.selectedIndex];
        const preco = option?.dataset?.preco;

        if (preco && Number(preco) > 0) {
            if (osValorServico) osValorServico.value = Number(preco).toFixed(2);
            atualizarTotalOS();
        }
    });
}


// ============================================================
// GERAR NÚMERO DE OS
// ============================================================

function gerarNumeroOS() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    const hora = String(agora.getHours()).padStart(2, "0");
    const min = String(agora.getMinutes()).padStart(2, "0");
    const seg = String(agora.getSeconds()).padStart(2, "0");

    return `OS${ano}${mes}${dia}-${hora}${min}${seg}`;
}


// ============================================================
// CARREGAR ORDENS
// ============================================================

async function carregarOS() {

    if (!listaOS) return;

    listaOS.innerHTML = `
        <div class="lista-vazia">
            <div style="font-size: 35px;">⏳</div>
            <p>Carregando ordens...</p>
        </div>
    `;

    try {

        // Busca clientes primeiro (para ter nomes)
        if (!todosClientes || todosClientes.length === 0) {
            const { data: cli } = await supabaseClient
                .from("clientes")
                .select("id, nome, telefone");
            if (cli) todosClientes = cli;
        }

        const { data, error } = await supabaseClient
            .from("ordens_servico")
            .select("*")
            .order("id", { ascending: false });

        if (error) throw error;

        todasOS = data || [];

        atualizarResumoOS();
        renderizarOS();
        atualizarContadorOS();

    } catch (erro) {

        console.error("Erro ao carregar OS:", erro);

        listaOS.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 35px;">⚠️</div>
                <h3>Não foi possível carregar as ordens</h3>
                <p>${escaparHTML(erro.message || "Erro desconhecido.")}</p>
            </div>
        `;
    }
}


// ============================================================
// ATUALIZAR RESUMO POR STATUS
// ============================================================

function atualizarResumoOS() {
    const contarPor = (status) => todasOS.filter(o => o.status === status).length;

    const el = (id) => document.getElementById(id);
    if (el("osCountRecebido")) el("osCountRecebido").textContent = contarPor("recebido");
    if (el("osCountAnalise")) el("osCountAnalise").textContent = contarPor("analise");
    if (el("osCountAguardando")) el("osCountAguardando").textContent = contarPor("aguardando_peca");
    if (el("osCountReparo")) el("osCountReparo").textContent = contarPor("reparo");
    if (el("osCountPronto")) el("osCountPronto").textContent = contarPor("pronto");
    if (el("osCountEntregue")) el("osCountEntregue").textContent = contarPor("entregue");
}


// ============================================================
// RENDERIZAR ORDENS
// ============================================================

function renderizarOS() {

    if (!listaOS) return;

    let resultado = [...todasOS];

    // Filtro de status
    if (filtroStatusOS !== "todos") {
        resultado = resultado.filter(o => o.status === filtroStatusOS);
    }

    // Pesquisa
    if (termoPesquisaOS) {
        resultado = resultado.filter(function (o) {

            const cliente = todosClientes.find(c => Number(c.id) === Number(o.cliente_id));
            const nomeCliente = cliente ? cliente.nome : "";

            const texto = (
                (o.numero_os || "") + " " +
                (o.aparelho_marca || "") + " " +
                (o.aparelho_modelo || "") + " " +
                (o.imei || "") + " " +
                nomeCliente
            ).toLowerCase();

            return texto.includes(termoPesquisaOS);
        });
    }

    if (resultado.length === 0) {

        listaOS.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 40px;">📋</div>
                <h3>${todasOS.length === 0 ? "Nenhuma ordem cadastrada" : "Nenhuma ordem encontrada"}</h3>
                <p>${todasOS.length === 0 ? "Clique em \"+ Nova OS\" para criar a primeira." : "Ajuste os filtros e tente novamente."}</p>
            </div>
        `;

        return;
    }

    listaOS.innerHTML = "";

    resultado.forEach(function (os) {

        const cliente = todosClientes.find(c => Number(c.id) === Number(os.cliente_id));
        const nomeCliente = cliente ? cliente.nome : "Cliente não vinculado";
        const telCliente = cliente && cliente.telefone ? cliente.telefone : "";

        const valor = Number(os.valor_total || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

        const dataEntrada = os.data_entrada
            ? new Date(os.data_entrada).toLocaleDateString("pt-BR")
            : "-";

        const labelStatus = {
            recebido: "📥 Recebido",
            analise: "🔍 Em análise",
            aguardando_peca: "📦 Aguardando peça",
            reparo: "🔧 Em reparo",
            pronto: "✅ Pronto",
            entregue: "📤 Entregue",
            cancelado: "❌ Cancelado"
        }[os.status] || os.status;

        const item = document.createElement("div");
        item.className = "os-item";

        item.innerHTML = `
            <div class="os-numero">
                ${escaparHTML(os.numero_os || "#" + os.id)}
            </div>

            <div class="os-info-cliente">
                <strong>${escaparHTML(nomeCliente)}</strong>
                <small>${telCliente ? "📞 " + escaparHTML(telCliente) : "Sem telefone"}</small>
                <div style="margin-top:6px;">
                    <span class="os-status ${os.status}">${labelStatus}</span>
                </div>
            </div>

            <div class="os-info-aparelho">
                <strong>${escaparHTML(os.aparelho_marca || "")} ${escaparHTML(os.aparelho_modelo || "")}</strong>
                <div>📅 Entrada: ${dataEntrada}</div>
                ${os.previsao_entrega ? `<div>🎯 Previsão: ${new Date(os.previsao_entrega + "T12:00:00").toLocaleDateString("pt-BR")}</div>` : ""}
            </div>

            <div>
                <div class="os-valor">${valor}</div>
<div class="os-acoes">
    <button
        type="button"
        onclick="editarOS(${os.id})"
        title="Editar OS"
        style="background:#edf5ff; color:#1677ff;"
    >
        ✏️
    </button>
    <button
        type="button"
        onclick="imprimirOS(${os.id})"
        title="Imprimir comprovante"
        style="background:#f0fdf4; color:#16a34a;"
    >
        🖨️
    </button>
    <button
        type="button"
        onclick="enviarOSWhatsApp(${os.id})"
        title="Enviar por WhatsApp"
        style="background:#e7f9ee; color:#25d366;"
    >
        📲
    </button>
    <button
        type="button"
        onclick="excluirOS(${os.id})"
        title="Excluir OS"
        style="background:#fff0f0; color:#d64545;"
    >
        🗑️
    </button>
</div>
            </div>
        `;

        listaOS.appendChild(item);
    });
}


// ============================================================
// SALVAR OS
// ============================================================

if (osForm) {

    osForm.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        const botaoSalvar = osForm.querySelector('button[type="submit"]');

        const clienteId = osCliente.value;
        const marca = osMarca.value.trim();
        const modelo = osModelo.value.trim();
        const defeito = osDefeito.value.trim();

        if (!clienteId) {
            alert("Selecione um cliente.");
            return;
        }

        if (!marca || !modelo || !defeito) {
            alert("Preencha marca, modelo e defeito relatado.");
            return;
        }

        const dados = {
            cliente_id: Number(clienteId),
            servico_id: osServico.value ? Number(osServico.value) : null,
            aparelho_marca: marca,
            aparelho_modelo: modelo,
            imei: osImei.value.trim() || null,
            defeito_relatado: defeito,
            diagnostico: osDiagnostico.value.trim() || null,
            valor_servico: Number(osValorServico.value || 0),
            valor_pecas: Number(osValorPecas.value || 0),
            desconto: Number(osDesconto.value || 0),
            valor_total: Number(osValorTotal.value || 0),
            status: osStatus.value,
            previsao_entrega: osPrevisao.value || null,
            observacoes: osObservacoes.value.trim() || null,
            atualizado_em: new Date().toISOString()
        };

        // Se está entregue, registra data de entrega
        if (osStatus.value === "entregue") {
            dados.data_entrega = new Date().toISOString();
        }

        try {

            if (botaoSalvar) {
                botaoSalvar.disabled = true;
                botaoSalvar.textContent = "Salvando...";
            }

            let resultado;

            if (osEditandoId) {
                resultado = await supabaseClient
                    .from("ordens_servico")
                    .update(dados)
                    .eq("id", osEditandoId)
                    .select();
            } else {
                dados.numero_os = gerarNumeroOS();
                resultado = await supabaseClient
                    .from("ordens_servico")
                    .insert([dados])
                    .select();
            }

            if (resultado.error) throw resultado.error;

            alert(osEditandoId
                ? "Ordem atualizada com sucesso!"
                : "Ordem criada com sucesso! ✅"
            );

            fecharFormularioOSFunc();
            await carregarOS();

        } catch (erro) {

            console.error("Erro ao salvar OS:", erro);
            alert("Erro ao salvar ordem.\n\n" + (erro.message || "Erro desconhecido."));

        } finally {

            if (botaoSalvar) {
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = "Salvar OS";
            }
        }
    });
}


// ============================================================
// EDITAR OS
// ============================================================

async function editarOS(id) {

    try {

        const { data, error } = await supabaseClient
            .from("ordens_servico")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;

        await carregarClientesParaSelect();
        await carregarServicosParaSelectOS();

        osCliente.value = data.cliente_id || "";
        osMarca.value = data.aparelho_marca || "";
        osModelo.value = data.aparelho_modelo || "";
        osImei.value = data.imei || "";
        osServico.value = data.servico_id || "";
        osDefeito.value = data.defeito_relatado || "";
        osDiagnostico.value = data.diagnostico || "";
        osValorServico.value = data.valor_servico || 0;
        osValorPecas.value = data.valor_pecas || 0;
        osDesconto.value = data.desconto || 0;
        osStatus.value = data.status || "recebido";
        osPrevisao.value = data.previsao_entrega || "";
        osObservacoes.value = data.observacoes || "";

        osEditandoId = id;

        const titulo = formularioOS?.querySelector(".form-header h3");
        if (titulo) titulo.textContent = "Editar Ordem de Serviço";

        atualizarTotalOS();

        if (formularioOS) formularioOS.classList.remove("hidden");

    } catch (erro) {

        console.error("Erro ao editar OS:", erro);
        alert("Não foi possível carregar a ordem.");
    }
}


// ============================================================
// EXCLUIR OS
// ============================================================

async function excluirOS(id) {

    const confirmar = confirm("Tem certeza que deseja excluir esta ordem?");
    if (!confirmar) return;

    try {

        const { error } = await supabaseClient
            .from("ordens_servico")
            .delete()
            .eq("id", id);

        if (error) throw error;

        alert("Ordem excluída com sucesso!");
        await carregarOS();

    } catch (erro) {

        console.error("Erro ao excluir OS:", erro);
        alert("Erro ao excluir ordem.\n\n" + (erro.message || ""));
    }
}


// ============================================================
// IMPRIMIR OS (comprovante)
// ============================================================

function imprimirOS(id) {

    const os = todasOS.find(o => Number(o.id) === Number(id));
    if (!os) return;

    const cliente = todosClientes.find(c => Number(c.id) === Number(os.cliente_id));
    const nomeCliente = cliente ? cliente.nome : "Cliente";
    const telCliente = cliente && cliente.telefone ? cliente.telefone : "";

    const valor = Number(os.valor_total || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    const dataEntrada = os.data_entrada
        ? new Date(os.data_entrada).toLocaleString("pt-BR")
        : "-";

    const previsao = os.previsao_entrega
        ? new Date(os.previsao_entrega + "T12:00:00").toLocaleDateString("pt-BR")
        : "-";

    const labelStatus = {
        recebido: "Recebido",
        analise: "Em análise",
        aguardando_peca: "Aguardando peça",
        reparo: "Em reparo",
        pronto: "Pronto para retirada",
        entregue: "Entregue",
        cancelado: "Cancelado"
    }[os.status] || os.status;

    // Busca configurações da empresa do banco
    supabaseClient
        .from("configuracoes")
        .select("*")
        .then(function (res) {

            const cfg = {};
            (res.data || []).forEach(c => cfg[c.chave] = c.valor);

            const empresa = cfg.empresa_nome || "Reparo de Celular";
            const cnpj = cfg.empresa_cnpj || "";
            const endereco = [cfg.empresa_endereco, cfg.empresa_bairro, cfg.empresa_cidade, cfg.empresa_estado]
                .filter(Boolean).join(", ");
            const telefone = cfg.empresa_telefone || "";
            const whatsapp = cfg.empresa_whatsapp || "";
            const email = cfg.empresa_email || "";
            const slogan = cfg.empresa_slogan || "";
            const garantia = cfg.empresa_garantia || "Garantia de 90 dias sobre os serviços executados.";
            const termos = cfg.empresa_termos || "Aparelhos não retirados em até 90 dias estarão sujeitos a cobrança de armazenagem.";

            abrirJanelaImpressao({
                empresa, cnpj, endereco, telefone, whatsapp, email, slogan,
                garantia, termos,
                os, nomeCliente, telCliente, valor, dataEntrada, previsao, labelStatus
            });

        })
        .catch(function (e) {
            console.warn("Não foi possível carregar config:", e);
            // Fallback sem config
            abrirJanelaImpressao({
                empresa: "Reparo de Celular", cnpj: "", endereco: "",
                telefone: "", whatsapp: "", email: "", slogan: "",
                garantia: "Garantia de 90 dias.",
                termos: "Aparelhos não retirados em 90 dias estão sujeitos a cobrança.",
                os, nomeCliente, telCliente, valor, dataEntrada, previsao, labelStatus
            });
        });
}


function abrirJanelaImpressao(d) {

    const janela = window.open("", "_blank", "width=800,height=900");

    janela.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>${d.os.numero_os || "OS"}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 40px; color: #111; font-size: 14px; }
                .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 15px; margin-bottom: 20px; }
                .header h1 { font-size: 22px; margin-bottom: 4px; }
                .header p { font-size: 12px; color: #555; margin-bottom: 2px; }
                .slogan { font-style: italic; color: #666; margin-top: 6px; font-size: 12px; }
                .os-numero { text-align: right; font-size: 13px; margin-bottom: 15px; }
                .os-numero strong { font-size: 16px; }
                .secao { margin-bottom: 15px; }
                .secao h3 { background: #f0f0f0; padding: 6px 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .campo { padding: 4px 10px; }
                .campo strong { display: inline-block; min-width: 130px; }
                .total { background: #111; color: white; padding: 15px; text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; }
                .termos { margin-top: 30px; font-size: 11px; color: #555; line-height: 1.6; border-top: 1px solid #ccc; padding-top: 15px; }
                .assinatura { margin-top: 60px; display: flex; justify-content: space-between; }
                .linha { border-top: 1px solid #333; width: 45%; text-align: center; padding-top: 5px; font-size: 11px; }
                @media print { body { padding: 20px; } }
            </style>
        </head>
        <body>

            <div class="header">
                <h1>${d.empresa}</h1>
                ${d.cnpj ? `<p>CNPJ: ${d.cnpj}</p>` : ""}
                ${d.endereco ? `<p>${d.endereco}</p>` : ""}
                ${d.telefone || d.whatsapp ? `<p>${[d.telefone, d.whatsapp].filter(Boolean).join(" | ")}</p>` : ""}
                ${d.email ? `<p>${d.email}</p>` : ""}
                ${d.slogan ? `<div class="slogan">"${d.slogan}"</div>` : ""}
            </div>

            <div class="os-numero">
                Nº <strong>${d.os.numero_os || "#" + d.os.id}</strong><br>
                Entrada: ${d.dataEntrada}
            </div>

            <div class="secao">
                <h3>👤 Cliente</h3>
                <div class="campo"><strong>Nome:</strong> ${d.nomeCliente}</div>
                ${d.telCliente ? `<div class="campo"><strong>Telefone:</strong> ${d.telCliente}</div>` : ""}
            </div>

            <div class="secao">
                <h3>📱 Aparelho</h3>
                <div class="campo"><strong>Marca:</strong> ${d.os.aparelho_marca || "-"}</div>
                <div class="campo"><strong>Modelo:</strong> ${d.os.aparelho_modelo || "-"}</div>
                ${d.os.imei ? `<div class="campo"><strong>IMEI:</strong> ${d.os.imei}</div>` : ""}
            </div>

            <div class="secao">
                <h3>🔍 Diagnóstico</h3>
                <div class="campo"><strong>Defeito:</strong> ${d.os.defeito_relatado || "-"}</div>
                ${d.os.diagnostico ? `<div class="campo"><strong>Diagnóstico:</strong> ${d.os.diagnostico}</div>` : ""}
            </div>

            <div class="secao">
                <h3>⚙️ Status</h3>
                <div class="campo"><strong>Situação:</strong> ${d.labelStatus}</div>
                <div class="campo"><strong>Previsão:</strong> ${d.previsao}</div>
            </div>

            <div class="secao">
                <h3>💰 Valores</h3>
                <div class="campo"><strong>Serviço:</strong> ${Number(d.os.valor_servico || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                <div class="campo"><strong>Peças:</strong> ${Number(d.os.valor_pecas || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                ${Number(d.os.desconto) > 0 ? `<div class="campo"><strong>Desconto:</strong> -${Number(d.os.desconto).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>` : ""}
            </div>

            <div class="total">TOTAL: ${d.valor}</div>

            <div class="termos">
                <strong>Garantia:</strong> ${d.garantia}<br><br>
                ${d.termos}
            </div>

            <div class="assinatura">
                <div class="linha">Assinatura do Cliente</div>
                <div class="linha">Assinatura do Técnico</div>
            </div>

        </body>
        </html>
    `);

    janela.document.close();
    setTimeout(function () { janela.print(); }, 300);
}

// ============================================================
// ENVIAR OS POR WHATSAPP
// ============================================================

async function enviarOSWhatsApp(id) {

    const os = todasOS.find(o => Number(o.id) === Number(id));

    if (!os) {
        alert("OS não encontrada.");
        return;
    }

    // Pega o cliente vinculado
    const cliente = todosClientes.find(c => Number(c.id) === Number(os.cliente_id));

    if (!cliente) {
        alert("Esta OS não tem cliente vinculado.\n\nEdite a OS e selecione um cliente.");
        return;
    }

    // Número do cliente (só dígitos)
    let numeroCliente = (cliente.telefone || "").replace(/\D/g, "");

    if (!numeroCliente) {
        const digitar = prompt(
            `O cliente ${cliente.nome} não tem telefone cadastrado.\n\n` +
            `Digite o número do WhatsApp (com DDD):\n` +
            `Ex: 87999999999`,
            ""
        );

        if (!digitar) return;

        numeroCliente = digitar.replace(/\D/g, "");
    }

    // Adiciona 55 (Brasil) se não tiver
    if (!numeroCliente.startsWith("55")) {
        numeroCliente = "55" + numeroCliente;
    }

    // Valida tamanho
    if (numeroCliente.length < 12 || numeroCliente.length > 13) {
        const confirmar = confirm(
            `O número "${numeroCliente}" parece estar incorreto.\n\n` +
            `Deseja continuar mesmo assim?`
        );
        if (!confirmar) return;
    }

    // Busca configurações da empresa
    let nomeEmpresa = "Reparo de Celular";
    let telefoneEmpresa = "";

    try {
        const { data } = await supabaseClient
            .from("configuracoes")
            .select("chave, valor");

        (data || []).forEach(function (item) {
            if (item.chave === "empresa_nome") nomeEmpresa = item.valor || nomeEmpresa;
            if (item.chave === "empresa_whatsapp") telefoneEmpresa = item.valor || "";
        });
    } catch (e) {
        console.warn("Não foi possível carregar config:", e);
    }

    // Formata valor
    const valor = Number(os.valor_total || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    // Status amigável
    const statusLabel = {
        recebido: "📥 Recebido",
        analise: "🔍 Em análise",
        aguardando_peca: "📦 Aguardando peça",
        reparo: "🔧 Em reparo",
        pronto: "✅ Pronto para retirada",
        entregue: "📤 Entregue",
        cancelado: "❌ Cancelado"
    }[os.status] || os.status;

    // Previsão
    const previsao = os.previsao_entrega
        ? new Date(os.previsao_entrega + "T12:00:00").toLocaleDateString("pt-BR")
        : "-";

    // Monta mensagem
    const primeiroNome = cliente.nome.split(" ")[0] || cliente.nome;

    let mensagem = `Olá ${primeiroNome}! 👋\n\n`;

    if (os.status === "pronto") {
        mensagem += `Boa notícia! Seu aparelho está *PRONTO* para retirada ✅\n\n`;
    } else if (os.status === "entregue") {
        mensagem += `Obrigado pela preferência! 🙏\n\n`;
    } else {
        mensagem += `Atualização da sua ordem de serviço:\n\n`;
    }

    mensagem += `📋 *OS ${os.numero_os || "#" + os.id}*\n`;
    mensagem += `📱 ${os.aparelho_marca || ""} ${os.aparelho_modelo || ""}\n`;
    mensagem += `🔧 ${os.defeito_relatado || "-"}\n`;
    mensagem += `⚙️ Status: ${statusLabel}\n`;
    mensagem += `💰 Valor: ${valor}\n`;

    if (os.status !== "entregue" && previsao !== "-") {
        mensagem += `📅 Previsão: ${previsao}\n`;
    }

    mensagem += `\n_${nomeEmpresa}_`;

    if (telefoneEmpresa) {
        mensagem += `\n📞 ${telefoneEmpresa}`;
    }

    // Abre o WhatsApp
    const url = `https://wa.me/${numeroCliente}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank", "noopener,noreferrer");
}


console.log("📲 Módulo WhatsApp OS carregado.");

// ============================================================
// CONTADOR DE OS
// ============================================================

function atualizarContadorOS() {
    if (!contadorOS) return;
    const total = todasOS.length;
    contadorOS.textContent = total === 1 ? "1 ordem" : `${total} ordens`;
}