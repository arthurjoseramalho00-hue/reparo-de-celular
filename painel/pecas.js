// ============================================================
// MÓDULO PEÇAS E ESTOQUE — TABELA + BUSCA + IMPORTAÇÃO
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
// ABRIR / FECHAR FORMULÁRIO
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
                <p>${escapar(erro.message || "Erro desconhecido.")}</p>
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
// RENDERIZAR PEÇAS — TABELA
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
                (p.fornecedor || "") + " " +
                (p.categoria || "")
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

    // Monta tabela
    let html = `
        <div class="tabela-wrapper">
            <table class="tabela-pecas">
                <thead>
                    <tr>
                        <th>Peça</th>
                        <th>Categoria</th>
                        <th>Compatível</th>
                        <th>Fornecedor</th>
                        <th style="text-align:center;">Qtd</th>
                        <th style="text-align:right;">Custo</th>
                        <th style="text-align:right;">Venda</th>
                        <th style="text-align:right;">Lucro</th>
                        <th style="text-align:center;">Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;

    resultado.forEach(function (p) {

        const qtd = Number(p.quantidade || 0);
        const min = Number(p.estoque_minimo || 1);
        const custo = Number(p.preco_custo || 0);
        const venda = Number(p.preco_venda || 0);
        const lucro = venda - custo;
        const margemLucro = custo > 0 ? ((lucro / custo) * 100).toFixed(0) : "-";

        let classeEstoque = "";
        let statusQtd = "";

        if (qtd === 0) {
            classeEstoque = "linha-sem-estoque";
            statusQtd = "🔴";
        } else if (qtd <= min) {
            classeEstoque = "linha-estoque-baixo";
            statusQtd = "🟡";
        } else {
            statusQtd = "🟢";
        }

        const modeloComp = p.modelo_compativel || "-";
        const fornecedor = p.fornecedor || "-";

        html += `
            <tr class="${classeEstoque}">
                <td>
                    <div class="tabela-nome">
                        <strong>${escapar(p.nome || "")}</strong>
                        ${p.marca ? `<small>${escapar(p.marca)}</small>` : ""}
                    </div>
                </td>
                <td>
                    ${p.categoria ? `<span class="tag-categoria">${escapar(p.categoria)}</span>` : '<span class="vazio-texto">—</span>'}
                </td>
                <td>
                    <span class="texto-truncado" title="${escapar(modeloComp)}">${escapar(modeloComp)}</span>
                </td>
                <td>
                    <span class="texto-truncado" title="${escapar(fornecedor)}">${escapar(fornecedor)}</span>
                </td>
                <td style="text-align:center;">
                    <span class="badge-estoque ${classeEstoque ? classeEstoque.replace('linha-', '') : ''}">
                        ${statusQtd} ${qtd}
                    </span>
                </td>
                <td style="text-align:right;">
                    ${formatarMoeda(custo)}
                </td>
                <td style="text-align:right;">
                    <strong>${formatarMoeda(venda)}</strong>
                </td>
                <td style="text-align:right;">
                    ${lucro > 0
                        ? `<span class="valor-lucro">+${formatarMoeda(lucro)}</span>
                           <small class="margem-info">${margemLucro}%</small>`
                        : '<span class="vazio-texto">—</span>'}
                </td>
                <td style="text-align:center;">
                    <div class="tabela-acoes">
                        <button
                            type="button"
                            onclick="ajustarEstoque(${p.id})"
                            title="Movimentar estoque"
                            class="btn-acao-estoque"
                        >📦</button>
                        <button
                            type="button"
                            onclick="editarPeca(${p.id})"
                            title="Editar peça"
                            class="btn-acao-editar"
                        >✏️</button>
                        <button
                            type="button"
                            onclick="excluirPeca(${p.id})"
                            title="Excluir peça"
                            class="btn-acao-excluir"
                        >🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>

        <div class="tabela-rodape">
            <span>Mostrando <strong>${resultado.length}</strong> de <strong>${todasPecas.length}</strong> peças</span>
        </div>
    `;

    listaPecas.innerHTML = html;
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
// MOVIMENTAR ESTOQUE
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
        const { error: erroPeca } = await supabaseClient
            .from("pecas")
            .update({
                quantidade: novaQtd,
                atualizado_em: new Date().toISOString()
            })
            .eq("id", id);

        if (erroPeca) throw erroPeca;

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
// FILTROS E PESQUISA
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
// HELPERS
// ============================================================

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escapar(v) {
    if (v === null || v === undefined) return "";
    return String(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

console.log("🔩 Módulo peças (tabela) carregado.");