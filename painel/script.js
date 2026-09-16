// ============================================================
// REPARO DE CELULAR - PAINEL PRINCIPAL
// ============================================================

// ============================================================
// 1. SUPABASE
// ============================================================

const SUPABASE_URL =
    "https://ggdzzmekaxrovmuyvxyn.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_EyZOeqOCjgq_9RjBCUfa8w_121a85zK";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ============================================================
// 2. ELEMENTOS DO PAINEL
// ============================================================

const botoesPagina = document.querySelectorAll("[data-page]");
const paginas = document.querySelectorAll(".pagina, #pagina-inicio");
const tituloPagina = document.getElementById("tituloPagina");
const descricaoPagina = document.getElementById("descricaoPagina");


// ============================================================
// 3. TÍTULOS DAS PÁGINAS
// ============================================================

const nomesPaginas = {
    inicio: {
        titulo: "Painel de Controle",
        descricao: "Gerencie sua assistência técnica."
    },
    servicos: {
        titulo: "Serviços",
        descricao: "Cadastre e gerencie os serviços da assistência."
    },
    precos: {
        titulo: "Preços",
        descricao: "Gerencie os preços dos serviços."
    },

       ordens: {
        titulo: "Ordens de Serviço",
        descricao: "Acompanhe os aparelhos em reparo."
    },

    clientes: {
        titulo: "Clientes",
        descricao: "Cadastro e histórico de clientes."
    },

    pecas: {
        titulo: "Peças",
        descricao: "Gerencie peças e estoque."
    },
    bot: {
        titulo: "Bot",
        descricao: "Configure o assistente automático."
    },
    whatsapp: {
        titulo: "WhatsApp",
        descricao: "Configure a integração com WhatsApp."
    },
    config: {
        titulo: "Configurações",
        descricao: "Configure o sistema."
    }
};


// ============================================================
// 4. NAVEGAÇÃO
// ============================================================

function abrirPagina(nome) {

    paginas.forEach(function (pagina) {
        pagina.classList.add("hidden");
    });

    const pagina = document.getElementById("pagina-" + nome);

    if (pagina) {
        pagina.classList.remove("hidden");
    }

    if (tituloPagina && nomesPaginas[nome]) {
        tituloPagina.textContent = nomesPaginas[nome].titulo;
    }

    if (descricaoPagina && nomesPaginas[nome]) {
        descricaoPagina.textContent = nomesPaginas[nome].descricao;
    }

    botoesPagina.forEach(function (botao) {
        botao.classList.remove("active");
        if (botao.dataset.page === nome) {
            botao.classList.add("active");
        }
    });

    // Ações ao abrir cada página
         if (nome === "servicos") {
        carregarServicos();
    }

        if (nome === "inicio") {
        carregarDashboard();
    }

    if (nome === "precos") {
        carregarServicosParaPrecos()
            .then(() => carregarPrecos());
    }

    if (nome === "ordens") {
        carregarOS();
    }

    if (nome === "clientes") {
        carregarClientes();
    }

    if (nome === "pecas") {
        carregarPecas();
    }

        if (nome === "config") {
        carregarConfiguracoes();
    }

    if (nome === "bot" && typeof iniciarBot === "function") {
        iniciarBot();
    }

   if (pagina === "inicio" && typeof carregarDashboard === "function") {
    carregarDashboard();
}

}

// ============================================================
// 5. MENUS
// ============================================================

botoesPagina.forEach(function (botao) {
    botao.addEventListener("click", function () {
        abrirPagina(botao.dataset.page);
    });
});


// ============================================================
// 6. ELEMENTOS DOS SERVIÇOS
// ============================================================

const formulario = document.getElementById("servicoForm");
const formularioServico = document.getElementById("formularioServico");
const novoServico = document.getElementById("novoServico");
const fecharFormulario = document.getElementById("fecharFormulario");
const cancelarServico = document.getElementById("cancelarServico");
const listaServicos = document.getElementById("listaServicos");
const contadorServicos = document.getElementById("contadorServicos");
const totalServicos = document.getElementById("totalServicos");

const campoMarca = document.getElementById("marca");
const campoModelo = document.getElementById("modelo");
const campoTipoServico = document.getElementById("tipoServico");
const campoPreco = document.getElementById("preco");
const campoPrazo = document.getElementById("prazo");
const campoStatus = document.getElementById("status");
const campoQualidade =
    document.getElementById("qualidade");

const campoObservacaoTecnica =
    document.getElementById("observacaoTecnica");


// ============================================================
// 7. CONTROLE DOS FILTROS
// ============================================================

let todosServicos = [];
let termoPesquisa = "";
let filtroMarca = "todas";


// ============================================================
// 8. ABRIR / FECHAR FORMULÁRIO
// ============================================================

function abrirFormulario() {
    if (formularioServico) {
        formularioServico.classList.remove("hidden");
    }
}

function fecharForm() {
    if (formularioServico) {
        formularioServico.classList.add("hidden");
    }

    if (formulario) {
        formulario.reset();
        formulario.dataset.editandoId = "";

        // Restaura o título do formulário
        const tituloFormulario = formularioServico?.querySelector(".form-header h3");
        if (tituloFormulario) {
            tituloFormulario.textContent = "Novo serviço";
        }
    }
}


// ============================================================
// 9. BOTÕES DO FORMULÁRIO
// ============================================================

if (novoServico) {
    novoServico.addEventListener("click", function () {
        if (formulario) {
            formulario.reset();
            formulario.dataset.editandoId = "";
        }

        const tituloFormulario = formularioServico?.querySelector(".form-header h3");
        if (tituloFormulario) {
            tituloFormulario.textContent = "Novo serviço";
        }

        abrirFormulario();
    });
}

if (fecharFormulario) {
    fecharFormulario.addEventListener("click", fecharForm);
}

if (cancelarServico) {
    cancelarServico.addEventListener("click", fecharForm);
}


// ============================================================
// 10. CARREGAR SERVIÇOS
// ============================================================

async function carregarServicos() {

    if (!listaServicos) return;

    listaServicos.innerHTML = `
        <div class="lista-vazia">
            <div style="font-size: 35px;">⏳</div>
            <p>Carregando serviços...</p>
        </div>
    `;

    try {

        const resultado = await supabaseClient
            .from("servicos")
            .select("*")
            .order("id", { ascending: false });

        if (resultado.error) throw resultado.error;

        todosServicos = resultado.data || [];

        atualizarContadores(todosServicos.length);

        criarFiltros();

        aplicarFiltros();

    } catch (erro) {

        console.error("Erro ao carregar serviços:", erro);

        listaServicos.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 35px;">⚠️</div>
                <h3>Não foi possível carregar os serviços</h3>
                <p>${escaparHTML(erro.message || "Erro desconhecido.")}</p>
            </div>
        `;
    }
}


// ============================================================
// 11. CRIAR PESQUISA E FILTRO
// ============================================================

function criarFiltros() {

    const listaCard = listaServicos.closest(".lista-card");
    if (!listaCard) return;

    let filtros = document.getElementById("filtrosServicos");

    if (filtros) {
        atualizarOpcoesMarca();
        return;
    }

    const listaHeader = listaCard.querySelector(".lista-header");
    if (!listaHeader) return;

    filtros = document.createElement("div");
    filtros.id = "filtrosServicos";
    filtros.style.display = "flex";
    filtros.style.gap = "10px";
    filtros.style.marginBottom = "15px";
    filtros.style.flexWrap = "wrap";

    filtros.innerHTML = `
        <input
            id="pesquisaServico"
            type="search"
            placeholder="🔎 Pesquisar serviço..."
            style="flex: 1; min-width: 220px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit;"
        >
        <select
            id="filtroMarca"
            style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit;"
        >
            <option value="todas">Todas as marcas</option>
        </select>
    `;

    listaHeader.after(filtros);

    const pesquisa = document.getElementById("pesquisaServico");
    const selectMarca = document.getElementById("filtroMarca");

    pesquisa.addEventListener("input", function () {
        termoPesquisa = pesquisa.value.trim().toLowerCase();
        aplicarFiltros();
    });

    selectMarca.addEventListener("change", function () {
        filtroMarca = selectMarca.value;
        aplicarFiltros();
    });

    atualizarOpcoesMarca();
}


// ============================================================
// 12. ATUALIZAR MARCAS
// ============================================================

function atualizarOpcoesMarca() {

    const select = document.getElementById("filtroMarca");
    if (!select) return;

    const marcaAtual = filtroMarca;

    const marcas = [
        ...new Set(
            todosServicos
                .map(servico => servico.marca)
                .filter(Boolean)
        )
    ].sort();

    select.innerHTML = `<option value="todas">Todas as marcas</option>`;

    marcas.forEach(function (marca) {
        const option = document.createElement("option");
        option.value = marca;
        option.textContent = marca;
        select.appendChild(option);
    });

    if (marcas.includes(marcaAtual)) {
        select.value = marcaAtual;
    } else {
        select.value = "todas";
    }
}


// ============================================================
// 13. APLICAR FILTROS
// ============================================================

function aplicarFiltros() {

    let resultado = [...todosServicos];

    if (termoPesquisa) {
        resultado = resultado.filter(function (servico) {
            const texto = (
                (servico.marca || "") + " " +
                (servico.modelo || "") + " " +
                (servico.tipo_servico || "")
            ).toLowerCase();

            return texto.includes(termoPesquisa);
        });
    }

    if (filtroMarca !== "todas") {
        resultado = resultado.filter(function (servico) {
            return servico.marca === filtroMarca;
        });
    }

    renderizarServicos(resultado);
}

// ============================================================
// 14. RENDERIZAR SERVIÇOS
// ============================================================

function renderizarServicos(servicos) {

    if (!listaServicos) return;

    listaServicos.innerHTML = "";

    if (servicos.length === 0) {

        listaServicos.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 40px;">📱</div>
                <h3>Nenhum serviço encontrado</h3>
                <p>Tente alterar a pesquisa ou cadastrar um novo serviço.</p>
            </div>
        `;

        return;
    }

    const grid = document.createElement("div");
    grid.className = "servicos-grid";

    servicos.forEach(function (servico) {

        const item = document.createElement("div");
        item.className = "servico-item";

        const preco = Number(servico.preco || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

        const statusNormalizado = String(servico.status || "").toLowerCase();
        const statusAtivo = statusNormalizado === "ativo";

        item.innerHTML = `
            <div class="servico-info">

                <div class="servico-titulo">
                    📱
                    <strong>
                        ${escaparHTML(servico.marca)}
                        ${escaparHTML(servico.modelo)}
                    </strong>
                </div>

                <div class="servico-detalhes">
    <span>🔧 ${escaparHTML(servico.tipo_servico)}</span>
    ${servico.qualidade ? `<span>⭐ ${escaparHTML(servico.qualidade)}</span>` : ""}
    <span>💰 ${preco}</span>
    <span>⏱️ ${escaparHTML(servico.prazo || "-")}</span>
</div>
                   
                <div>
                    <span class="status-servico">
                        ${statusAtivo ? "🟢 Ativo" : "🔴 Inativo"}
                    </span>
                </div>

            </div>

            <div class="servico-acoes">
                <button
                    type="button"
                    class="btn-editar"
                    onclick="editarServico(${servico.id})"
                >
                    ✏️ Editar
                </button>

                <button
                    type="button"
                    class="btn-danger"
                    onclick="excluirServico(${servico.id})"
                >
                    🗑️ Excluir
                </button>
            </div>
        `;

        grid.appendChild(item);
    });

    listaServicos.appendChild(grid);
}


// ============================================================
// 15. CADASTRAR / EDITAR SERVIÇO
// ============================================================

if (formulario) {

    formulario.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        const botaoSalvar = formulario.querySelector('button[type="submit"]');

        const marca = campoMarca.value.trim();
        const modelo = campoModelo.value.trim();
        const tipoServico = campoTipoServico.value.trim();
        const preco = Number(campoPreco.value);
        const prazo = campoPrazo.value;
        const status = campoStatus.value;
                   const qualidade =
                campoQualidade ? campoQualidade.value.trim() : "";

            const observacaoTecnica =
                campoObservacaoTecnica ? campoObservacaoTecnica.value.trim() : "";


        if (!marca || !modelo || !tipoServico || isNaN(preco) || !prazo) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        const dados = {

                marca,
                modelo,
                tipo_servico:
                    tipoServico,
                qualidade: qualidade || null,
                observacao_tecnica: observacaoTecnica || null,
                preco,
                prazo,
                status

            };

        const idEditando = formulario.dataset.editandoId;

        try {

            if (botaoSalvar) {
                botaoSalvar.disabled = true;
                botaoSalvar.textContent = idEditando ? "Salvando..." : "Cadastrando...";
            }

            let resultado;

            if (idEditando) {
                resultado = await supabaseClient
                    .from("servicos")
                    .update(dados)
                    .eq("id", idEditando)
                    .select();
            } else {
                resultado = await supabaseClient
                    .from("servicos")
                    .insert([dados])
                    .select();
            }

            if (resultado.error) throw resultado.error;

            alert(idEditando
                ? "Serviço atualizado com sucesso!"
                : "Serviço cadastrado com sucesso!"
            );

            fecharForm();
            await carregarServicos();

        } catch (erro) {

            console.error("Erro ao salvar serviço:", erro);

            alert("Erro ao salvar serviço.\n\n" + (erro.message || "Erro desconhecido."));

        } finally {

            if (botaoSalvar) {
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = "Salvar serviço";
            }
        }
    });
}


// ============================================================
// 16. EDITAR SERVIÇO
// ============================================================

async function editarServico(id) {

    try {

        const resultado = await supabaseClient
            .from("servicos")
            .select("*")
            .eq("id", id)
            .single();

        if (resultado.error) throw resultado.error;

        const servico = resultado.data;

        campoMarca.value = servico.marca || "";
        campoModelo.value = servico.modelo || "";
        campoTipoServico.value = servico.tipo_servico || "";
        campoPreco.value = servico.preco || 0;
        campoPrazo.value = servico.prazo || "";
        campoStatus.value = String(servico.status || "ativo").toLowerCase();
                if (campoQualidade) {
            campoQualidade.value =
                servico.qualidade || "";
        }

        if (campoObservacaoTecnica) {
            campoObservacaoTecnica.value =
                servico.observacao_tecnica || "";
        }

        formulario.dataset.editandoId = id;

        const tituloFormulario = formularioServico.querySelector(".form-header h3");
        if (tituloFormulario) {
            tituloFormulario.textContent = "Editar serviço";
        }

        abrirFormulario();

    } catch (erro) {

        console.error("Erro ao editar serviço:", erro);
        alert("Não foi possível carregar o serviço.\n\n" + (erro.message || "Erro desconhecido."));
    }
}


// ============================================================
// 17. EXCLUIR SERVIÇO
// ============================================================

async function excluirServico(id) {

    const confirmar = confirm("Tem certeza que deseja excluir este serviço?");
    if (!confirmar) return;

    try {

        const resultado = await supabaseClient
            .from("servicos")
            .delete()
            .eq("id", id);

        if (resultado.error) throw resultado.error;

        alert("Serviço excluído com sucesso!");
        await carregarServicos();

    } catch (erro) {

        console.error("Erro ao excluir:", erro);
        alert("Não foi possível excluir o serviço.\n\n" + (erro.message || "Erro desconhecido."));
    }
}


// ============================================================
// 18. CONTADORES
// ============================================================

function atualizarContadores(total) {

    if (contadorServicos) {
        contadorServicos.textContent = total === 1 ? "1 serviço" : `${total} serviços`;
    }

    if (totalServicos) {
        totalServicos.textContent = total;
    }
}


// ============================================================
// 19. PROTEÇÃO HTML
// ============================================================

function escaparHTML(valor) {

    if (valor === null || valor === undefined) return "";

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// 20. INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("🔧 Painel Reparo de Celular iniciado.");
    console.log("🗄️ Supabase:", SUPABASE_URL);

    abrirPagina("inicio");
    carregarServicos();
        carregarDashboard();
});


// ============================================================
// 21. MÓDULO DE PREÇOS
// ============================================================

const novoPreco = document.getElementById("novoPreco");
const formularioPreco = document.getElementById("formularioPreco");
const fecharFormularioPreco = document.getElementById("fecharFormularioPreco");
const cancelarPreco = document.getElementById("cancelarPreco");
const precoForm = document.getElementById("precoForm");

const servicoPreco = document.getElementById("servicoPreco");
const precoPeca = document.getElementById("precoPeca");
const maoDeObra = document.getElementById("maoDeObra");
const frete = document.getElementById("frete");
const margem = document.getElementById("margem");
const precoFinal = document.getElementById("precoFinal");

const resumoPeca = document.getElementById("resumoPeca");
const resumoMaoObra = document.getElementById("resumoMaoObra");
const resumoFrete = document.getElementById("resumoFrete");
const resumoMargem = document.getElementById("resumoMargem");
const resumoTotal = document.getElementById("resumoTotal");

const listaPrecos = document.getElementById("listaPrecos");
const contadorPrecos = document.getElementById("contadorPrecos");

let precosCadastrados = [];
let precoEditandoId = null;


// ============================================================
// 22. FORMATAR MOEDA
// ============================================================

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


// ============================================================
// 23. ABRIR FORMULÁRIO DE PREÇO
// ============================================================

if (novoPreco) {
    novoPreco.addEventListener("click", async function () {

        precoEditandoId = null;

        limparFormularioPreco();

        await carregarServicosParaPrecos();

        if (formularioPreco) {
            formularioPreco.classList.remove("hidden");
        }
    });
}


// ============================================================
// 24. FECHAR FORMULÁRIO DE PREÇO
// ============================================================

function fecharFormularioPrecoFunc() {

    if (formularioPreco) {
        formularioPreco.classList.add("hidden");
    }

    precoEditandoId = null;

    limparFormularioPreco();

    const tituloForm = formularioPreco?.querySelector(".form-header h3");
    if (tituloForm) {
        tituloForm.textContent = "Novo preço";
    }
}

if (fecharFormularioPreco) {
    fecharFormularioPreco.addEventListener("click", fecharFormularioPrecoFunc);
}

if (cancelarPreco) {
    cancelarPreco.addEventListener("click", fecharFormularioPrecoFunc);
}


// ============================================================
// 25. LIMPAR FORMULÁRIO DE PREÇO
// ============================================================

function limparFormularioPreco() {

    if (precoForm) precoForm.reset();

    if (precoPeca) precoPeca.value = "";
    if (maoDeObra) maoDeObra.value = "";
    if (frete) frete.value = "";
    if (margem) margem.value = "";
    if (precoFinal) precoFinal.value = "";

    atualizarResumoPreco();
}


// ============================================================
// 26. CARREGAR SERVIÇOS NO SELECT
// ============================================================

async function carregarServicosParaPrecos() {

    if (!servicoPreco) return;

    const valorSelecionado = servicoPreco.value;

    servicoPreco.innerHTML = `
        <option value="">Carregando serviços...</option>
    `;

    const { data, error } = await supabaseClient
        .from("servicos")
        .select("id, marca, modelo, tipo_servico, status")
        .order("marca", { ascending: true });

    if (error) {

        console.error("Erro ao carregar serviços:", error);

        servicoPreco.innerHTML = `
            <option value="">Erro ao carregar serviços</option>
        `;

        return;
    }

    servicoPreco.innerHTML = `
        <option value="">Selecione um serviço</option>
    `;

    (data || []).forEach(function (servico) {

        const option = document.createElement("option");

        option.value = servico.id;
        option.textContent = `${servico.marca} ${servico.modelo} - ${servico.tipo_servico}`;

        servicoPreco.appendChild(option);
    });

    // Restaura seleção anterior (se ainda existir)
    if (valorSelecionado) {
        servicoPreco.value = valorSelecionado;
    }
}


// ============================================================
// 27. CALCULAR PREÇO FINAL
// ============================================================

function calcularPrecoFinal() {

    const peca = Number(precoPeca?.value || 0);
    const mao = Number(maoDeObra?.value || 0);
    const valorFrete = Number(frete?.value || 0);
    const porcentagem = Number(margem?.value || 0);

    const custoBase = peca + mao + valorFrete;
    const total = custoBase * (1 + porcentagem / 100);

    return Number(total.toFixed(2));
}


// ============================================================
// 28. ATUALIZAR RESUMO
// ============================================================

function atualizarResumoPreco() {

    const peca = Number(precoPeca?.value || 0);
    const mao = Number(maoDeObra?.value || 0);
    const valorFrete = Number(frete?.value || 0);
    const porcentagem = Number(margem?.value || 0);
    const total = calcularPrecoFinal();

    if (resumoPeca) resumoPeca.textContent = formatarMoeda(peca);
    if (resumoMaoObra) resumoMaoObra.textContent = formatarMoeda(mao);
    if (resumoFrete) resumoFrete.textContent = formatarMoeda(valorFrete);
    if (resumoMargem) resumoMargem.textContent = `${porcentagem}%`;
    if (resumoTotal) resumoTotal.textContent = formatarMoeda(total);
    if (precoFinal) precoFinal.value = total.toFixed(2);
}


// ============================================================
// 29. ATUALIZAÇÃO AUTOMÁTICA
// ============================================================

[precoPeca, maoDeObra, frete, margem].forEach(function (campo) {
    if (campo) {
        campo.addEventListener("input", atualizarResumoPreco);
    }
});


// ============================================================
// 30. CARREGAR PREÇOS
// ============================================================

async function carregarPrecos() {

    if (!listaPrecos) return;

    if (!todosServicos || todosServicos.length === 0) {
        try {
            await carregarServicos();
        } catch (e) {
            console.warn("Não foi possível carregar serviços antes dos preços:", e);
        }
    }

    const { data, error } = await supabaseClient
        .from("precos")
        .select("*")
        .order("atualizado_em", { ascending: false });

    if (error) {

        console.error("Erro ao carregar preços:", error);

        listaPrecos.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size:40px;">⚠️</div>
                <h3>Erro ao carregar preços</h3>
                <p>Verifique a conexão com o banco.</p>
            </div>
        `;

        return;
    }

    precosCadastrados = data || [];

    renderizarPrecos();
}


// ============================================================
// 31. RENDERIZAR PREÇOS
// ============================================================

function renderizarPrecos() {

    if (!listaPrecos) return;

    if (precosCadastrados.length === 0) {

        listaPrecos.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size:40px;">💰</div>
                <h3>Nenhum preço cadastrado</h3>
                <p>Clique em "+ Novo preço" para cadastrar o primeiro.</p>
            </div>
        `;

        atualizarContadorPrecos();
        return;
    }

    const cards = precosCadastrados.map(function (preco) {

        const servico = todosServicos.find(
            s => Number(s.id) === Number(preco.servico_id)
        ) || null;

        const nomeServico = servico
            ? `${servico.marca} ${servico.modelo}`
            : "Serviço não encontrado";

        const tipoServico = servico ? servico.tipo_servico : "";

        return `
            <div class="servico-item">

                <div class="servico-info">

                    <h3>${escaparHTML(nomeServico)}</h3>
                    <p>${escaparHTML(tipoServico)}</p>

                    <div style="margin-top:10px; line-height:1.7; font-size:13px;">
                        <div>Peça: <strong>${formatarMoeda(preco.preco_peca)}</strong></div>
                        <div>Mão de obra: <strong>${formatarMoeda(preco.mao_de_obra)}</strong></div>
                        <div>Frete: <strong>${formatarMoeda(preco.frete)}</strong></div>
                        <div>Margem: <strong>${Number(preco.margem || 0)}%</strong></div>
                    </div>

                    <h2 style="margin-top:12px; color:#1677ff;">
                        ${formatarMoeda(preco.preco_final)}
                    </h2>

                </div>

                <div class="servico-actions">
                    <button
                        type="button"
                        class="btn-editar"
                        onclick="editarPreco(${preco.id})"
                    >
                        ✏️ Editar
                    </button>

                    <button
                        type="button"
                        class="btn-danger"
                        onclick="excluirPreco(${preco.id})"
                    >
                        🗑️ Excluir
                    </button>
                </div>

            </div>
        `;
    }).join("");

    listaPrecos.innerHTML = `
        <div class="servicos-grid">${cards}</div>
    `;

    atualizarContadorPrecos();
}


// ============================================================
// 32. CONTADOR DE PREÇOS
// ============================================================

function atualizarContadorPrecos() {

    if (!contadorPrecos) return;

    const total = precosCadastrados.length;

    contadorPrecos.textContent = total === 1
        ? "1 preço"
        : `${total} preços`;
}


// ============================================================
// 33. SALVAR PREÇO
// ============================================================

if (precoForm) {

    precoForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const botaoSalvar = precoForm.querySelector('button[type="submit"]');

        const servicoId = Number(servicoPreco.value);

        if (!servicoId) {
            alert("Selecione um serviço.");
            return;
        }

        const valorPeca = Number(precoPeca.value || 0);
        const valorMao = Number(maoDeObra.value || 0);
        const valorFrete = Number(frete.value || 0);
        const valorMargem = Number(margem.value || 0);
        const valorFinal = calcularPrecoFinal();

        try {

            if (botaoSalvar) {
                botaoSalvar.disabled = true;
                botaoSalvar.textContent = "Salvando...";
            }

            let resultado;

            // ------------------------------------------------
            // EDITANDO PREÇO EXISTENTE
            // ------------------------------------------------

            if (precoEditandoId) {

                resultado = await supabaseClient
                    .from("precos")
                    .update({
                        servico_id: servicoId,
                        preco_peca: valorPeca,
                        mao_de_obra: valorMao,
                        frete: valorFrete,
                        margem: valorMargem,
                        preco_final: valorFinal,
                        atualizado_em: new Date().toISOString()
                    })
                    .eq("id", precoEditandoId);

            }

            // ------------------------------------------------
            // NOVO PREÇO
            // ------------------------------------------------

            else {

                const { data: existente, error: erroBusca } =
                    await supabaseClient
                        .from("precos")
                        .select("id")
                        .eq("servico_id", servicoId)
                        .maybeSingle();

                if (erroBusca) throw erroBusca;

                if (existente) {

                    resultado = await supabaseClient
                        .from("precos")
                        .update({
                            preco_peca: valorPeca,
                            mao_de_obra: valorMao,
                            frete: valorFrete,
                            margem: valorMargem,
                            preco_final: valorFinal,
                            atualizado_em: new Date().toISOString()
                        })
                        .eq("id", existente.id);

                } else {

                    resultado = await supabaseClient
                        .from("precos")
                        .insert({
                            servico_id: servicoId,
                            preco_peca: valorPeca,
                            mao_de_obra: valorMao,
                            frete: valorFrete,
                            margem: valorMargem,
                            preco_final: valorFinal
                        });
                }
            }

            if (resultado.error) throw resultado.error;

            // ------------------------------------------------
            // ATUALIZAR PREÇO NO SERVIÇO VINCULADO
            // ------------------------------------------------

            const { error: erroServico } = await supabaseClient
                .from("servicos")
                .update({ preco: valorFinal })
                .eq("id", servicoId);

            if (erroServico) {
                console.error("Erro ao atualizar serviço:", erroServico);
            }

            alert("Preço salvo com sucesso! ✅");

            fecharFormularioPrecoFunc();

            await carregarPrecos();
            await carregarServicos();

        } catch (erro) {

            console.error("Erro ao salvar preço:", erro);

            alert("Erro ao salvar preço.\n\n" + (erro.message || "Erro desconhecido."));

        } finally {

            if (botaoSalvar) {
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = "Salvar preço";
            }
        }
    });
}


// ============================================================
// 34. EDITAR PREÇO
// ============================================================

async function editarPreco(id) {

    const preco = precosCadastrados.find(
        item => Number(item.id) === Number(id)
    );

    if (!preco) {
        alert("Preço não encontrado.");
        return;
    }

    await carregarServicosParaPrecos();

    servicoPreco.value = preco.servico_id || "";

    precoPeca.value = preco.preco_peca ?? "";
    maoDeObra.value = preco.mao_de_obra ?? "";
    frete.value = preco.frete ?? "";
    margem.value = preco.margem ?? "";

    precoEditandoId = preco.id;

    atualizarResumoPreco();

    const tituloForm = formularioPreco?.querySelector(".form-header h3");
    if (tituloForm) {
        tituloForm.textContent = "Editar preço";
    }

    if (formularioPreco) {
        formularioPreco.classList.remove("hidden");
    }
}


// ============================================================
// 35. EXCLUIR PREÇO
// ============================================================

async function excluirPreco(id) {

    const confirmar = confirm("Tem certeza que deseja excluir este preço?");
    if (!confirmar) return;

    const preco = precosCadastrados.find(
        item => Number(item.id) === Number(id)
    );

    if (!preco) return;

    try {

        const { error } = await supabaseClient
            .from("precos")
            .delete()
            .eq("id", id);

        if (error) throw error;

        // Zera o preço do serviço vinculado
        if (preco.servico_id) {

            const { error: erroServico } = await supabaseClient
                .from("servicos")
                .update({ preco: 0 })
                .eq("id", preco.servico_id);

            if (erroServico) {
                console.error("Erro ao zerar preço do serviço:", erroServico);
            }
        }

        alert("Preço excluído com sucesso! 🗑️");

        await carregarPrecos();
        await carregarServicos();

    } catch (erro) {

        console.error("Erro ao excluir preço:", erro);

        alert("Erro ao excluir preço.\n\n" + (erro.message || "Erro desconhecido."));
    }
}


// ============================================================
// FIM DO SCRIPT PRINCIPAL
// ============================================================