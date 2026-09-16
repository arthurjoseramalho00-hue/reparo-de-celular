// ============================================================
// MÓDULO FINANCEIRO
// ============================================================

let financeiroIniciado = false;
let finPeriodoAtual = "mes";
let finAbaAtiva = "movimentacoes";
let finDadosCache = {
    despesas: [],
    receitas: [],
    ordens: []
};

// Elementos
const finPeriodo = document.getElementById("finPeriodo");
const finAtualizar = document.getElementById("finAtualizar");
const finExportarCSV = document.getElementById("finExportarCSV");
const finGrafico = document.getElementById("finGrafico");
const novaDespesa = document.getElementById("novaDespesa");
const novaReceita = document.getElementById("novaReceita");


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function iniciarFinanceiro() {

    if (financeiroIniciado) {
        await carregarFinanceiro();
        return;
    }

    financeiroIniciado = true;

    // Eventos
    if (finPeriodo) {
        finPeriodo.addEventListener("change", function () {
            finPeriodoAtual = this.value;
            carregarFinanceiro();
        });
    }

    if (finAtualizar) {
        finAtualizar.addEventListener("click", carregarFinanceiro);
    }

    if (finExportarCSV) {
        finExportarCSV.addEventListener("click", exportarFinanceiroCSV);
    }

    // Abas
    document.querySelectorAll(".fin-tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
            document.querySelectorAll(".fin-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            finAbaAtiva = tab.dataset.tab;
            renderizarListaFinanceira();
        });
    });

    // Modais
    if (novaDespesa) {
        novaDespesa.addEventListener("click", function () {
            resetarFormularioDespesa();
            document.getElementById("modalDespesa").classList.remove("hidden");
        });
    }

    if (novaReceita) {
        novaReceita.addEventListener("click", function () {
            resetarFormularioReceita();
            document.getElementById("modalReceita").classList.remove("hidden");
        });
    }

    configurarModais();

    // Carrega dados
    await carregarFinanceiro();
}


// ============================================================
// CARREGAR DADOS
// ============================================================

async function carregarFinanceiro() {

    try {

        const [resDesp, resRec, resOS] = await Promise.all([
            supabaseClient.from("despesas").select("*").order("data_vencimento", { ascending: false }),
            supabaseClient.from("receitas").select("*").order("data", { ascending: false }),
            supabaseClient.from("ordens_servico").select("*")
        ]);

        finDadosCache.despesas = resDesp.data || [];
        finDadosCache.receitas = resRec.data || [];
        finDadosCache.ordens = resOS.data || [];

        calcularResumo();
        renderizarGrafico();
        renderizarListaFinanceira();

    } catch (erro) {
        console.error("Erro ao carregar financeiro:", erro);
    }
}


// ============================================================
// FILTRO DE PERÍODO
// ============================================================

function obterIntervaloPeriodo(periodo) {

    const agora = new Date();
    let inicio, fim = agora;

    if (periodo === "hoje") {
        inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    } else if (periodo === "semana") {
        const dia = agora.getDay();
        inicio = new Date(agora);
        inicio.setDate(agora.getDate() - dia);
        inicio.setHours(0, 0, 0, 0);
    } else if (periodo === "mes") {
        inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    } else if (periodo === "mes_passado") {
        inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
        fim = new Date(agora.getFullYear(), agora.getMonth(), 0);
    } else if (periodo === "ano") {
        inicio = new Date(agora.getFullYear(), 0, 1);
    } else {
        // todos
        inicio = new Date(2000, 0, 1);
    }

    fim.setHours(23, 59, 59, 999);
    return { inicio, fim };
}


function filtrarPorPeriodo(itens, campoData) {
    const { inicio, fim } = obterIntervaloPeriodo(finPeriodoAtual);

    return itens.filter(function (item) {
        const dataStr = item[campoData];
        if (!dataStr) return false;
        const data = new Date(dataStr + (dataStr.length === 10 ? "T12:00:00" : ""));
        return data >= inicio && data <= fim;
    });
}


// ============================================================
// RESUMO
// ============================================================

function calcularResumo() {

    // ============== ENTRADAS ==============
    // Receitas registradas
    const receitasPeriodo = filtrarPorPeriodo(finDadosCache.receitas, "data");
    let totalReceitas = receitasPeriodo.reduce((s, r) => s + Number(r.valor || 0), 0);

    // OS pagas no período
    const osPagasPeriodo = filtrarPorPeriodo(
        finDadosCache.ordens.filter(o => o.status_pagamento === "pago"),
        "data_entrada"
    );
    let totalOSPagas = osPagasPeriodo.reduce((s, o) => s + Number(o.valor_total || 0), 0);

    const totalEntradas = totalReceitas + totalOSPagas;
    const countEntradas = receitasPeriodo.length + osPagasPeriodo.length;

    // ============== SAÍDAS ==============
    const despesasPeriodo = filtrarPorPeriodo(finDadosCache.despesas, "data_vencimento");
    const totalDespesas = despesasPeriodo.reduce((s, d) => s + Number(d.valor || 0), 0);

    // ============== LUCRO ==============
    const lucro = totalEntradas - totalDespesas;
    const margem = totalEntradas > 0 ? (lucro / totalEntradas * 100) : 0;

    // ============== A RECEBER ==============
    const osPendentes = finDadosCache.ordens.filter(
        o => o.status_pagamento !== "pago" && o.status !== "cancelado"
    );
    const totalAReceber = osPendentes.reduce((s, o) => s + Number(o.valor_total || 0), 0);

    // Atualiza tela
    if (document.getElementById("finTotalEntradas")) {
        document.getElementById("finTotalEntradas").textContent = formatarMoedaFin(totalEntradas);
    }
    if (document.getElementById("finCountEntradas")) {
        document.getElementById("finCountEntradas").textContent = countEntradas + " registros";
    }
    if (document.getElementById("finTotalSaidas")) {
        document.getElementById("finTotalSaidas").textContent = formatarMoedaFin(totalDespesas);
    }
    if (document.getElementById("finCountSaidas")) {
        document.getElementById("finCountSaidas").textContent = despesasPeriodo.length + " registros";
    }
    if (document.getElementById("finLucro")) {
        document.getElementById("finLucro").textContent = formatarMoedaFin(lucro);
    }
    if (document.getElementById("finMargem")) {
        document.getElementById("finMargem").textContent = "Margem: " + margem.toFixed(1) + "%";
    }
    if (document.getElementById("finAReceber")) {
        document.getElementById("finAReceber").textContent = formatarMoedaFin(totalAReceber);
    }
}


// ============================================================
// GRÁFICO (últimos 6 meses)
// ============================================================

function renderizarGrafico() {

    if (!finGrafico) return;

    const meses = [];
    const agora = new Date();

    for (let i = 5; i >= 0; i--) {
        const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        meses.push({
            nome: data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
            ano: data.getFullYear(),
            mes: data.getMonth(),
            entradas: 0,
            saidas: 0
        });
    }

    // Receitas
    finDadosCache.receitas.forEach(function (r) {
        if (!r.data) return;
        const d = new Date(r.data + "T12:00:00");
        const m = meses.find(x => x.ano === d.getFullYear() && x.mes === d.getMonth());
        if (m) m.entradas += Number(r.valor || 0);
    });

    // OS pagas
    finDadosCache.ordens.forEach(function (o) {
        if (o.status_pagamento !== "pago" || !o.data_entrada) return;
        const d = new Date(o.data_entrada);
        const m = meses.find(x => x.ano === d.getFullYear() && x.mes === d.getMonth());
        if (m) m.entradas += Number(o.valor_total || 0);
    });

    // Despesas
    finDadosCache.despesas.forEach(function (d) {
        const dataStr = d.data_pagamento || d.data_vencimento;
        if (!dataStr) return;
        const dt = new Date(dataStr + "T12:00:00");
        const m = meses.find(x => x.ano === dt.getFullYear() && x.mes === dt.getMonth());
        if (m) m.saidas += Number(d.valor || 0);
    });

    const maxValor = Math.max(
        1,
        ...meses.map(m => Math.max(m.entradas, m.saidas))
    );

    finGrafico.innerHTML = meses.map(function (m) {
        const alturaEntrada = (m.entradas / maxValor) * 100;
        const alturaSaida = (m.saidas / maxValor) * 100;

        return `
            <div class="fin-grafico-item">
                <div class="fin-grafico-barras">
                    <div
                        class="fin-grafico-barra entrada"
                        style="height: ${Math.max(alturaEntrada, 3)}%;"
                        data-valor="📥 ${formatarMoedaFin(m.entradas)}"
                    ></div>
                    <div
                        class="fin-grafico-barra saida"
                        style="height: ${Math.max(alturaSaida, 3)}%;"
                        data-valor="📤 ${formatarMoedaFin(m.saidas)}"
                    ></div>
                </div>
                <div class="fin-grafico-label">${m.nome}</div>
            </div>
        `;
    }).join("");
}


// ============================================================
// LISTA
// ============================================================

function renderizarListaFinanceira() {

    const container = document.getElementById("finListaMovimentacoes");
    if (!container) return;

    if (finAbaAtiva === "movimentacoes") {
        renderizarMovimentacoes(container);
    } else if (finAbaAtiva === "despesas") {
        renderizarDespesas(container);
    } else if (finAbaAtiva === "receitas") {
        renderizarReceitas(container);
    } else if (finAbaAtiva === "a_receber") {
        renderizarAReceber(container);
    }
}


function renderizarMovimentacoes(container) {

    const receitasPeriodo = filtrarPorPeriodo(finDadosCache.receitas, "data");
    const despesasPeriodo = filtrarPorPeriodo(finDadosCache.despesas, "data_vencimento");
    const osPagasPeriodo = filtrarPorPeriodo(
        finDadosCache.ordens.filter(o => o.status_pagamento === "pago"),
        "data_entrada"
    );

    // Junta tudo
    const movs = [];

    receitasPeriodo.forEach(r => {
        movs.push({
            tipo: "receita",
            data: r.data,
            descricao: r.descricao,
            categoria: r.categoria || "Receita",
            valor: Number(r.valor || 0),
            status: r.status,
            id: r.id,
            origem: "receita"
        });
    });

    osPagasPeriodo.forEach(o => {
        movs.push({
            tipo: "receita",
            data: o.data_entrada?.slice(0, 10),
            descricao: "OS " + (o.numero_os || "#" + o.id) + " - " + o.aparelho_marca + " " + o.aparelho_modelo,
            categoria: "Ordem de serviço",
            valor: Number(o.valor_total || 0),
            status: "pago",
            id: o.id,
            origem: "os"
        });
    });

    despesasPeriodo.forEach(d => {
        movs.push({
            tipo: "despesa",
            data: d.data_vencimento,
            descricao: d.descricao,
            categoria: d.categoria || "Despesa",
            valor: Number(d.valor || 0),
            status: d.status,
            id: d.id,
            origem: "despesa"
        });
    });

    // Ordena por data (mais recente primeiro)
    movs.sort((a, b) => (b.data || "").localeCompare(a.data || ""));

    if (movs.length === 0) {
        container.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 40px;">💰</div>
                <h3>Nenhuma movimentação no período</h3>
                <p>Cadastre despesas ou receitas para começar.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = movs.map(function (m) {
        const icone = m.tipo === "receita" ? "📥" : "📤";
        const sinal = m.tipo === "receita" ? "+" : "-";
        const classe = m.tipo === "receita" ? "receita" : "despesa";
        const dataFormatada = m.data ? new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR") : "-";
        const statusBadge = obterStatusBadge(m.status);

        return `
            <div class="fin-item">
                <div class="fin-item-icon">${icone}</div>

                <div class="fin-item-desc">
                    <strong>${escaparFin(m.descricao)}</strong>
                    <small>${dataFormatada} • ${escaparFin(m.categoria)}</small>
                </div>

                <div style="text-align: right;">
                    <div class="fin-item-valor ${classe}">${sinal} ${formatarMoedaFin(m.valor)}</div>
                    <div style="margin-top: 3px;">${statusBadge}</div>
                </div>

                <div class="fin-item-acoes">
                    ${m.origem === "os" ? "" : `
                        <button class="btn-del-fin" onclick="excluirMovimentacao('${m.origem}', ${m.id})" title="Excluir">🗑️</button>
                    `}
                </div>
            </div>
        `;
    }).join("");
}


function renderizarDespesas(container) {

    const despesasPeriodo = filtrarPorPeriodo(finDadosCache.despesas, "data_vencimento");

    if (despesasPeriodo.length === 0) {
        container.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 40px;">📤</div>
                <h3>Nenhuma despesa no período</h3>
                <p>Clique em "Nova despesa" para cadastrar.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = despesasPeriodo.map(function (d) {
        const dataFormatada = d.data_vencimento
            ? new Date(d.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")
            : "-";

        return `
            <div class="fin-item">
                <div class="fin-item-icon">📤</div>
                <div class="fin-item-desc">
                    <strong>${escaparFin(d.descricao)}</strong>
                    <small>${dataFormatada} • ${escaparFin(d.categoria || "Sem categoria")}</small>
                </div>
                <div style="text-align: right;">
                    <div class="fin-item-valor despesa">- ${formatarMoedaFin(d.valor)}</div>
                    <div style="margin-top: 3px;">${obterStatusBadge(d.status)}</div>
                </div>
                <div class="fin-item-acoes">
                    <button class="btn-del-fin" onclick="excluirMovimentacao('despesa', ${d.id})" title="Excluir">🗑️</button>
                </div>
            </div>
        `;
    }).join("");
}


function renderizarReceitas(container) {

    const receitasPeriodo = filtrarPorPeriodo(finDadosCache.receitas, "data");

    if (receitasPeriodo.length === 0) {
        container.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 40px;">📥</div>
                <h3>Nenhuma receita no período</h3>
                <p>Clique em "Nova receita" para cadastrar.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = receitasPeriodo.map(function (r) {
        const dataFormatada = r.data
            ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")
            : "-";

        return `
            <div class="fin-item">
                <div class="fin-item-icon">📥</div>
                <div class="fin-item-desc">
                    <strong>${escaparFin(r.descricao)}</strong>
                    <small>${dataFormatada} • ${escaparFin(r.categoria || "Receita")}</small>
                </div>
                <div style="text-align: right;">
                    <div class="fin-item-valor receita">+ ${formatarMoedaFin(r.valor)}</div>
                    <div style="margin-top: 3px;">${obterStatusBadge(r.status)}</div>
                </div>
                <div class="fin-item-acoes">
                    <button class="btn-del-fin" onclick="excluirMovimentacao('receita', ${r.id})" title="Excluir">🗑️</button>
                </div>
            </div>
        `;
    }).join("");
}


function renderizarAReceber(container) {

    const osPendentes = finDadosCache.ordens.filter(
        o => o.status_pagamento !== "pago" && o.status !== "cancelado"
    );

    if (osPendentes.length === 0) {
        container.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 40px;">✅</div>
                <h3>Tudo em dia!</h3>
                <p>Nenhuma OS pendente de pagamento.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = osPendentes.map(function (o) {
        const dataFormatada = o.data_entrada
            ? new Date(o.data_entrada).toLocaleDateString("pt-BR")
            : "-";

        return `
            <div class="fin-item">
                <div class="fin-item-icon">⏳</div>
                <div class="fin-item-desc">
                    <strong>OS ${escaparFin(o.numero_os || "#" + o.id)} - ${escaparFin(o.aparelho_marca)} ${escaparFin(o.aparelho_modelo)}</strong>
                    <small>${dataFormatada} • ${escaparFin(o.status)}</small>
                </div>
                <div style="text-align: right;">
                    <div class="fin-item-valor">${formatarMoedaFin(o.valor_total)}</div>
                    <div style="margin-top: 3px;"><span class="fin-status pendente">PENDENTE</span></div>
                </div>
                <div class="fin-item-acoes">
                    <button class="btn-edit-fin" onclick="marcarOSComoPaga(${o.id})" title="Marcar como paga">✅</button>
                </div>
            </div>
        `;
    }).join("");
}


// ============================================================
// AÇÕES
// ============================================================

window.excluirMovimentacao = async function (tipo, id) {

    const confirmar = confirm(`Deseja excluir esta ${tipo}?`);
    if (!confirmar) return;

    const tabela = tipo === "despesa" ? "despesas" : "receitas";

    const { error } = await supabaseClient.from(tabela).delete().eq("id", id);

    if (error) {
        alert("Erro ao excluir: " + error.message);
        return;
    }

    await carregarFinanceiro();
};


window.marcarOSComoPaga = async function (id) {

    const { error } = await supabaseClient
        .from("ordens_servico")
        .update({
            status_pagamento: "pago",
            atualizado_em: new Date().toISOString()
        })
        .eq("id", id);

    if (error) {
        alert("Erro ao marcar como paga: " + error.message);
        return;
    }

    await carregarFinanceiro();
};


// ============================================================
// MODAIS
// ============================================================

function configurarModais() {

    // Despesa
    document.getElementById("fecharModalDespesa")?.addEventListener("click", fecharModalDespesa);
    document.getElementById("cancelarDespesa")?.addEventListener("click", fecharModalDespesa);
    document.getElementById("modalDespesa")?.addEventListener("click", function (e) {
        if (e.target === this) fecharModalDespesa();
    });

    document.getElementById("despesaForm")?.addEventListener("submit", salvarDespesa);

    // Receita
    document.getElementById("fecharModalReceita")?.addEventListener("click", fecharModalReceita);
    document.getElementById("cancelarReceita")?.addEventListener("click", fecharModalReceita);
    document.getElementById("modalReceita")?.addEventListener("click", function (e) {
        if (e.target === this) fecharModalReceita();
    });

    document.getElementById("receitaForm")?.addEventListener("submit", salvarReceita);
}


function fecharModalDespesa() {
    document.getElementById("modalDespesa")?.classList.add("hidden");
}

function fecharModalReceita() {
    document.getElementById("modalReceita")?.classList.add("hidden");
}

function resetarFormularioDespesa() {
    document.getElementById("despesaForm")?.reset();
    const hoje = new Date().toISOString().slice(0, 10);
    document.getElementById("despVencimento").value = hoje;
}

function resetarFormularioReceita() {
    document.getElementById("receitaForm")?.reset();
    const hoje = new Date().toISOString().slice(0, 10);
    document.getElementById("recData").value = hoje;
}


async function salvarDespesa(evento) {

    evento.preventDefault();

    const dados = {
        descricao: document.getElementById("despDescricao").value.trim(),
        categoria: document.getElementById("despCategoria").value || null,
        valor: Number(document.getElementById("despValor").value || 0),
        data_vencimento: document.getElementById("despVencimento").value || null,
        data_pagamento: document.getElementById("despPagamento").value || null,
        status: document.getElementById("despStatus").value,
        forma_pagamento: document.getElementById("despForma").value || null,
        fornecedor: document.getElementById("despFornecedor").value.trim() || null,
        observacoes: document.getElementById("despObservacoes").value.trim() || null
    };

    if (!dados.descricao || dados.valor <= 0) {
        alert("Preencha descrição e valor.");
        return;
    }

    const { error } = await supabaseClient.from("despesas").insert(dados);

    if (error) {
        alert("Erro: " + error.message);
        return;
    }

    fecharModalDespesa();
    await carregarFinanceiro();
}


async function salvarReceita(evento) {

    evento.preventDefault();

    const dados = {
        descricao: document.getElementById("recDescricao").value.trim(),
        categoria: document.getElementById("recCategoria").value || null,
        valor: Number(document.getElementById("recValor").value || 0),
        data: document.getElementById("recData").value || new Date().toISOString().slice(0, 10),
        status: document.getElementById("recStatus").value,
        forma_pagamento: document.getElementById("recForma").value || null,
        observacoes: document.getElementById("recObservacoes").value.trim() || null
    };

    if (!dados.descricao || dados.valor <= 0) {
        alert("Preencha descrição e valor.");
        return;
    }

    const { error } = await supabaseClient.from("receitas").insert(dados);

    if (error) {
        alert("Erro: " + error.message);
        return;
    }

    fecharModalReceita();
    await carregarFinanceiro();
}


// ============================================================
// EXPORTAR CSV
// ============================================================

function exportarFinanceiroCSV() {

    const receitas = filtrarPorPeriodo(finDadosCache.receitas, "data");
    const despesas = filtrarPorPeriodo(finDadosCache.despesas, "data_vencimento");
    const osPagas = filtrarPorPeriodo(
        finDadosCache.ordens.filter(o => o.status_pagamento === "pago"),
        "data_entrada"
    );

    const linhas = [
        ["Tipo", "Data", "Descrição", "Categoria", "Valor", "Status"]
    ];

    receitas.forEach(r => {
        linhas.push(["Receita", r.data || "", r.descricao, r.categoria || "", r.valor, r.status]);
    });

    osPagas.forEach(o => {
        linhas.push([
            "Receita (OS)",
            o.data_entrada?.slice(0, 10) || "",
            "OS " + (o.numero_os || o.id),
            "Ordem de serviço",
            o.valor_total || 0,
            "pago"
        ]);
    });

    despesas.forEach(d => {
        linhas.push(["Despesa", d.data_vencimento || "", d.descricao, d.categoria || "", d.valor, d.status]);
    });

    const csv = linhas.map(l =>
        l.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// ============================================================
// HELPERS
// ============================================================

function formatarMoedaFin(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


function obterStatusBadge(status) {
    if (!status) return "";
    const labels = {
        pago: "Pago",
        pendente: "Pendente",
        atrasado: "Atrasado",
        recebido: "Recebido"
    };
    return `<span class="fin-status ${status}">${labels[status] || status}</span>`;
}


function escaparFin(v) {
    if (v === null || v === undefined) return "";
    return String(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// AUTO-INICIALIZAÇÃO
// ============================================================

console.log("💰 Módulo financeiro carregado.");