// ============================================================
// MÓDULO PEÇAS E ESTOQUE
// ============================================================

const novaPeca = document.getElementById("novaPeca");
const formularioPeca = document.getElementById("formularioPeca");
const fecharFormularioPeca = document.getElementById("fecharFormularioPeca");
const cancelarPeca = document.getElementById("cancelarPeca");
const pecaForm = document.getElementById("pecaForm");
const listaPecas = document.getElementById("listaPecas");
const contadorPecas = document.getElementById("contadorPecas");

const pecaNome = document.getElementById("pecaNome");
const pecaCategoria = document.getElementById("pecaCategoria");
const pecaMarca = document.getElementById("pecaMarca");
const pecaModeloCompativel = document.getElementById("pecaModeloCompativel");
const pecaQuantidade = document.getElementById("pecaQuantidade");
const pecaEstoqueMinimo = document.getElementById("pecaEstoqueMinimo");
const pecaPrecoCusto = document.getElementById("pecaPrecoCusto");
const pecaPrecoVenda = document.getElementById("pecaPrecoVenda");
const pecaFornecedor = document.getElementById("pecaFornecedor");
const pecaObservacoes = document.getElementById("pecaObservacoes");

const pecaPesquisa = document.getElementById("pecaPesquisa");
const pecaFiltroCategoria = document.getElementById("pecaFiltroCategoria");
const pecaFiltroEstoque = document.getElementById("pecaFiltroEstoque");

const pecasTotalItens = document.getElementById("pecasTotalItens");
const pecasEstoqueBaixo = document.getElementById("pecasEstoqueBaixo");
const pecasValorTotal = document.getElementById("pecasValorTotal");

let todasPecas = [];
let termoPesquisaPeca = "";
let filtroCategoriaPeca = "todas";
let filtroEstoquePeca = "todas";
let pecaEditandoId = null;


// ============================================================
// ABRIR / FECHAR
// ============================================================

function abrirFormularioPeca() {
    if (formularioPeca) formularioPeca.classList.remove("hidden");
}

function fecharFormularioPecaFunc() {
    if (formularioPeca) formularioPeca.classList.add("hidden");
    if (pecaForm) pecaForm.reset();
    pecaEditandoId = null;

    const titulo = formularioPeca?.querySelector(".form-header h3");
    if (titulo) titulo.textContent = "Nova peça";

    if (pecaQuantidade) pecaQuantidade.value = 0;
    if (pecaEstoqueMinimo) pecaEstoqueMinimo.value = 1;
    if (pecaPrecoCusto) pecaPrecoCusto.value = 0;
    if (pecaPrecoVenda) pecaPrecoVenda.value = 0;
}

if (novaPeca) {
    novaPeca.addEventListener("click", function () {
        if (pecaForm) pecaForm.reset();
        pecaEditandoId = null;

        if (pecaQuantidade) pecaQuantidade.value = 0;
        if (pecaEstoqueMinimo) pecaEstoqueMinimo.value = 1;
        if (pecaPrecoCusto) pecaPrecoCusto.value = 0;
        if (pecaPrecoVenda) pecaPrecoVenda.value = 0;

        const titulo = formularioPeca?.querySelector(".form-header h3");
        if (titulo) titulo.textContent = "Nova peça";

        abrirFormularioPeca();
    });
}

if (fecharFormularioPeca) fecharFormularioPeca.addEventListener("click", fecharFormularioPecaFunc);
if (cancelarPeca) cancelarPeca.addEventListener("click", fecharFormularioPecaFunc);


// ============================================================
// CARREGAR PEÇAS
// ============================================================

async function carregarPecas() {

    if (!listaPecas) return;

    listaPecas.innerHTML = `
        <div class="lista-vazia">
            <div style="font-size: 35px;">⏳</div>
            <p>Carregando peças...</p>
        </div>
    `;

    try {

        const { data, error } = await supabaseClient
            .from("pecas")
            .select("*")
            .order("nome", { ascending: true });

        if (error) throw error;

        todasPecas = data || [];

        atualizarResumoPecas();
        renderizarPecas();
        atualizarContadorPecas();

    } catch (erro) {

        console.error("Erro ao carregar peças:", erro);

        listaPecas.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 35px;">⚠️</div>
                <h3>Não foi possível carregar as peças</h3>
                <p>${escaparHTML(erro.message || "Erro desconhecido.")}</p>
            </div>
        `;
    }
}


// ============================================================
// RESUMO
// ============================================================

function atualizarResumoPecas() {

    const total = todasPecas.length;

    const estoqueBaixo = todasPecas.filter(p => {
        const qtd = Number(p.quantidade || 0);
        const min = Number(p.estoque_minimo || 1);
        return qtd > 0 && qtd <= min;
    }).length;

    const valorTotal = todasPecas.reduce(function (soma, p) {
        const qtd = Number(p.quantidade || 0);
        const custo = Number(p.preco_custo || 0);
        return soma + (qtd * custo);
    }, 0);

    if (pecasTotalItens) pecasTotalItens.textContent = total;
    if (pecasEstoqueBaixo) pecasEstoqueBaixo.textContent = estoqueBaixo;
    if (pecasValorTotal) {
        pecasValorTotal.textContent = valorTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }
}


// ============================================================
// RENDERIZAR
// ============================================================

function renderizarPecas() {

    if (!listaPecas) return;

    let resultado = [...todasPecas];

    // Pesquisa
    if (termoPesquisaPeca) {
        resultado = resultado.filter(function (p) {
            const texto = (
                (p.nome || "") + " " +
                (p.marca || "") + " " +
                (p.modelo_compativel || "") + " " +
                (p.fornecedor || "")
            ).toLowerCase();
            return texto.includes(termoPesquisaPeca);
        });
    }

    // Categoria
    if (filtroCategoriaPeca !== "todas") {
        resultado = resultado.filter(p => p.categoria === filtroCategoriaPeca);
    }

    // Estoque
    if (filtroEstoquePeca === "baixo") {
        resultado = resultado.filter(p => {
            const qtd = Number(p.quantidade || 0);
            const min = Number(p.estoque_minimo || 1);
            return qtd > 0 && qtd <= min;
        });
    }

    if (filtroEstoquePeca === "zerado") {
        resultado = resultado.filter(p => Number(p.quantidade || 0) === 0);
    }

    if (resultado.length === 0) {

        listaPecas.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 40px;">🔩</div>
                <h3>${todasPecas.length === 0 ? "Nenhuma peça cadastrada" : "Nenhuma peça encontrada"}</h3>
                <p>${todasPecas.length === 0 ? "Clique em \"+ Nova peça\" para começar." : "Ajuste os filtros e tente novamente."}</p>
            </div>
        `;

        return;
    }

    listaPecas.innerHTML = "";

    resultado.forEach(function (p) {

        const qtd = Number(p.quantidade || 0);
        const min = Number(p.estoque_minimo || 1);
        const custo = Number(p.preco_custo || 0);
        const venda = Number(p.preco_venda || 0);

        let classeEstoque = "";
        let classeQtd = "";

        if (qtd === 0) {
            classeEstoque = "sem-estoque";
            classeQtd = "zerado";
        } else if (qtd <= min) {
            classeEstoque = "estoque-baixo";
            classeQtd = "baixo";
        }

        const item = document.createElement("div");
        item.className = "peca-item " + classeEstoque;

        item.innerHTML = `
            <div class="peca-info">

                <h3>🔩 ${escaparHTML(p.nome)}</h3>

                <div class="peca-meta">
                    ${p.categoria ? `<span>📂 ${escaparHTML(p.categoria)}</span>` : ""}
                    ${p.marca ? `<span>🏷️ ${escaparHTML(p.marca)}</span>` : ""}
                    ${p.fornecedor ? `<span>🏢 ${escaparHTML(p.fornecedor)}</span>` : ""}
                </div>

                ${p.modelo_compativel ? `<div style="font-size:12px; color:#718096; margin-top:4px;">📱 Compatível: ${escaparHTML(p.modelo_compativel)}</div>` : ""}

                <div class="peca-precos">
                    ${custo > 0 ? `<span>Custo: <strong>${custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></span>` : ""}
                    ${venda > 0 ? `<span>Venda: <strong style="color:#16a34a;">${venda.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></span>` : ""}
                </div>

                <div class="peca-acoes">
                    <button
                        type="button"
                        onclick="ajustarEstoque(${p.id})"
                        style="background:#f0fdf4; color:#16a34a;"
                    >
                        ➕ Movimentar
                    </button>
                    <button
                        type="button"
                        onclick="editarPeca(${p.id})"
                        style="background:#edf5ff; color:#1677ff;"
                    >
                        ✏️ Editar
                    </button>
                    <button
                        type="button"
                        onclick="excluirPeca(${p.id})"
                        style="background:#fff0f0; color:#d64545;"
                    >
                        🗑️ Excluir
                    </button>
                </div>

            </div>

            <div class="peca-qtd ${classeQtd}">
                <div class="qtd-numero">${qtd}</div>
                <div class="qtd-label">em estoque</div>
            </div>
        `;

        listaPecas.appendChild(item);
    });
}


// ============================================================
// SALVAR PEÇA
// ============================================================

if (pecaForm) {

    pecaForm.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        const botaoSalvar = pecaForm.querySelector('button[type="submit"]');

        const nome = pecaNome.value.trim();

        if (!nome) {
            alert("Informe o nome da peça.");
            return;
        }

        const dados = {
            nome,
            categoria: pecaCategoria.value || null,
            marca: pecaMarca.value.trim() || null,
            modelo_compativel: pecaModeloCompativel.value.trim() || null,
            quantidade: Number(pecaQuantidade.value || 0),
            estoque_minimo: Number(pecaEstoqueMinimo.value || 1),
            preco_custo: Number(pecaPrecoCusto.value || 0),
            preco_venda: Number(pecaPrecoVenda.value || 0),
            fornecedor: pecaFornecedor.value.trim() || null,
            observacoes: pecaObservacoes.value.trim() || null,
            atualizado_em: new Date().toISOString()
        };

        try {

            if (botaoSalvar) {
                botaoSalvar.disabled = true;
                botaoSalvar.textContent = "Salvando...";
            }

            let resultado;

            if (pecaEditandoId) {
                resultado = await supabaseClient
                    .from("pecas")
                    .update(dados)
                    .eq("id", pecaEditandoId)
                    .select();
            } else {
                resultado = await supabaseClient
                    .from("pecas")
                    .insert([dados])
                    .select();
            }

            if (resultado.error) throw resultado.error;

            alert(pecaEditandoId
                ? "Peça atualizada com sucesso!"
                : "Peça cadastrada com sucesso!"
            );

            fecharFormularioPecaFunc();
            await carregarPecas();

        } catch (erro) {

            console.error("Erro ao salvar peça:", erro);
            alert("Erro ao salvar peça.\n\n" + (erro.message || ""));

        } finally {

            if (botaoSalvar) {
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = "Salvar peça";
            }
        }
    });
}


// ============================================================
// EDITAR PEÇA
// ============================================================

async function editarPeca(id) {

    try {

        const { data, error } = await supabaseClient
            .from("pecas")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;

        pecaNome.value = data.nome || "";
        pecaCategoria.value = data.categoria || "";
        pecaMarca.value = data.marca || "";
        pecaModeloCompativel.value = data.modelo_compativel || "";
        pecaQuantidade.value = data.quantidade || 0;
        pecaEstoqueMinimo.value = data.estoque_minimo || 1;
        pecaPrecoCusto.value = data.preco_custo || 0;
        pecaPrecoVenda.value = data.preco_venda || 0;
        pecaFornecedor.value = data.fornecedor || "";
        pecaObservacoes.value = data.observacoes || "";

        pecaEditandoId = id;

        const titulo = formularioPeca?.querySelector(".form-header h3");
        if (titulo) titulo.textContent = "Editar peça";

        abrirFormularioPeca();

    } catch (erro) {
        console.error("Erro ao editar peça:", erro);
        alert("Não foi possível carregar a peça.");
    }
}


// ============================================================
// EXCLUIR PEÇA
// ============================================================

async function excluirPeca(id) {

    const confirmar = confirm("Tem certeza que deseja excluir esta peça?");
    if (!confirmar) return;

    try {

        const { error } = await supabaseClient
            .from("pecas")
            .delete()
            .eq("id", id);

        if (error) throw error;

        alert("Peça excluída com sucesso!");
        await carregarPecas();

    } catch (erro) {
        console.error("Erro ao excluir peça:", erro);
        alert("Erro ao excluir peça.\n\n" + (erro.message || ""));
    }
}


// ============================================================
// MOVIMENTAR ESTOQUE (entrada/saída)
// ============================================================

async function ajustarEstoque(id) {

    const peca = todasPecas.find(p => Number(p.id) === Number(id));
    if (!peca) return;

    const opcao = prompt(
        `Movimentar estoque de:\n\n"${peca.nome}"\n\n` +
        `Estoque atual: ${peca.quantidade}\n\n` +
        `Digite a quantidade (use NEGATIVO para saída):\n` +
        `Ex.: 10 (entrada) ou -3 (saída)`,
        "0"
    );

    if (opcao === null) return;

    const quantidade = Number(opcao);

    if (isNaN(quantidade) || quantidade === 0) {
        alert("Digite um número válido (diferente de zero).");
        return;
    }

    const novaQtd = Number(peca.quantidade || 0) + quantidade;

    if (novaQtd < 0) {
        alert("A quantidade em estoque não pode ficar negativa.");
        return;
    }

    const motivo = prompt(
        quantidade > 0
            ? "Motivo da ENTRADA (ex: compra, devolução):"
            : "Motivo da SAÍDA (ex: uso em OS, venda):",
        quantidade > 0 ? "Compra de fornecedor" : "Uso em serviço"
    );

    if (motivo === null) return;

    try {

        // Atualiza a peça
        const { error: erroPeca } = await supabaseClient
            .from("pecas")
            .update({
                quantidade: novaQtd,
                atualizado_em: new Date().toISOString()
            })
            .eq("id", id);

        if (erroPeca) throw erroPeca;

        // Registra a movimentação
        const { error: erroMov } = await supabaseClient
            .from("movimentacoes_estoque")
            .insert({
                peca_id: id,
                tipo: quantidade > 0 ? "entrada" : "saida",
                quantidade: Math.abs(quantidade),
                motivo: motivo || null
            });

        if (erroMov) console.warn("Movimentação não registrada:", erroMov);

        alert(
            (quantidade > 0 ? "✅ Entrada registrada!" : "✅ Saída registrada!") +
            `\n\nNova quantidade: ${novaQtd}`
        );

        await carregarPecas();

    } catch (erro) {
        console.error("Erro ao movimentar estoque:", erro);
        alert("Erro ao movimentar estoque.\n\n" + (erro.message || ""));
    }
}


// ============================================================
// CONTADOR
// ============================================================

function atualizarContadorPecas() {
    if (!contadorPecas) return;
    const total = todasPecas.length;
    contadorPecas.textContent = total === 1 ? "1 peça" : `${total} peças`;
}


// ============================================================
// FILTROS
// ============================================================

if (pecaPesquisa) {
    pecaPesquisa.addEventListener("input", function () {
        termoPesquisaPeca = this.value.trim().toLowerCase();
        renderizarPecas();
    });
}

if (pecaFiltroCategoria) {
    pecaFiltroCategoria.addEventListener("change", function () {
        filtroCategoriaPeca = this.value;
        renderizarPecas();
    });
}

if (pecaFiltroEstoque) {
    pecaFiltroEstoque.addEventListener("change", function () {
        filtroEstoquePeca = this.value;
        renderizarPecas();
    });
}


// ============================================================
// FIM DO MÓDULO PEÇAS
// ============================================================