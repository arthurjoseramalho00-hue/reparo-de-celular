// ============================================================
// MÓDULO CLIENTES
// ============================================================

const novoCliente = document.getElementById("novoCliente");
const formularioCliente = document.getElementById("formularioCliente");
const fecharFormularioCliente = document.getElementById("fecharFormularioCliente");
const cancelarCliente = document.getElementById("cancelarCliente");
const clienteForm = document.getElementById("clienteForm");
const listaClientes = document.getElementById("listaClientes");
const contadorClientes = document.getElementById("contadorClientes");
const clientePesquisa = document.getElementById("clientePesquisa");

const cliNome = document.getElementById("cliNome");
const cliTelefone = document.getElementById("cliTelefone");
const cliEmail = document.getElementById("cliEmail");
const cliCpf = document.getElementById("cliCpf");
const cliEndereco = document.getElementById("cliEndereco");
const cliObservacoes = document.getElementById("cliObservacoes");

let todosClientes = [];
let termoPesquisaCliente = "";
let clienteEditandoId = null;


// ============================================================
// ABRIR / FECHAR FORMULÁRIO
// ============================================================

function abrirFormularioCliente() {
    if (formularioCliente) {
        formularioCliente.classList.remove("hidden");
    }
}

function fecharFormularioClienteFunc() {

    if (formularioCliente) {
        formularioCliente.classList.add("hidden");
    }

    if (clienteForm) {
        clienteForm.reset();
    }

    clienteEditandoId = null;

    const titulo = formularioCliente?.querySelector(".form-header h3");
    if (titulo) titulo.textContent = "Novo cliente";
}

if (novoCliente) {
    novoCliente.addEventListener("click", function () {
        if (clienteForm) clienteForm.reset();
        clienteEditandoId = null;

        const titulo = formularioCliente?.querySelector(".form-header h3");
        if (titulo) titulo.textContent = "Novo cliente";

        abrirFormularioCliente();
    });
}

if (fecharFormularioCliente) {
    fecharFormularioCliente.addEventListener("click", fecharFormularioClienteFunc);
}

if (cancelarCliente) {
    cancelarCliente.addEventListener("click", fecharFormularioClienteFunc);
}


// ============================================================
// CARREGAR CLIENTES
// ============================================================

async function carregarClientes() {

    if (!listaClientes) return;

    listaClientes.innerHTML = `
        <div class="lista-vazia">
            <div style="font-size: 35px;">⏳</div>
            <p>Carregando clientes...</p>
        </div>
    `;

    try {

        const { data, error } = await supabaseClient
            .from("clientes")
            .select("*")
            .order("nome", { ascending: true });

        if (error) throw error;

        todosClientes = data || [];

        renderizarClientes();
        atualizarContadorClientes();

        // Também atualiza o select da OS
        carregarClientesParaSelect();

    } catch (erro) {

        console.error("Erro ao carregar clientes:", erro);

        listaClientes.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 35px;">⚠️</div>
                <h3>Não foi possível carregar os clientes</h3>
                <p>${escaparHTML(erro.message || "Erro desconhecido.")}</p>
            </div>
        `;
    }
}


// ============================================================
// RENDERIZAR CLIENTES
// ============================================================

function renderizarClientes() {

    if (!listaClientes) return;

    let resultado = [...todosClientes];

    // Filtro de pesquisa
    if (termoPesquisaCliente) {
        resultado = resultado.filter(function (c) {
            const texto = (
                (c.nome || "") + " " +
                (c.telefone || "") + " " +
                (c.email || "") + " " +
                (c.cpf || "")
            ).toLowerCase();

            return texto.includes(termoPesquisaCliente);
        });
    }

    if (resultado.length === 0) {

        listaClientes.innerHTML = `
            <div class="lista-vazia">
                <div style="font-size: 40px;">👤</div>
                <h3>${termoPesquisaCliente ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</h3>
                <p>${termoPesquisaCliente ? "Tente alterar a busca." : "Clique em \"+ Novo cliente\" para cadastrar."}</p>
            </div>
        `;

        return;
    }

    const grid = document.createElement("div");
    grid.className = "servicos-grid";

    resultado.forEach(function (c) {

        const item = document.createElement("div");
        item.className = "servico-item";

        // Conta quantas OS o cliente tem
        const totalOS = (typeof todasOS !== "undefined" && Array.isArray(todasOS))
            ? todasOS.filter(os => Number(os.cliente_id) === Number(c.id)).length
            : 0;

        item.innerHTML = `
            <div class="servico-info">

                <h3>👤 ${escaparHTML(c.nome)}</h3>

                <div style="margin-top:8px; line-height:1.7; font-size:13px; color:#4a5568;">
                    ${c.telefone ? `<div>📞 ${escaparHTML(c.telefone)}</div>` : ""}
                    ${c.email ? `<div>✉️ ${escaparHTML(c.email)}</div>` : ""}
                    ${c.cpf ? `<div>🆔 ${escaparHTML(c.cpf)}</div>` : ""}
                    ${c.endereco ? `<div>📍 ${escaparHTML(c.endereco)}</div>` : ""}
                </div>

                ${c.observacoes ? `<p style="margin-top:8px; font-size:12px; color:#718096;">📝 ${escaparHTML(c.observacoes)}</p>` : ""}

                <div style="margin-top:10px;">
                    <span class="status-servico">
                        📋 ${totalOS} ${totalOS === 1 ? "ordem" : "ordens"}
                    </span>
                </div>

            </div>

            <div class="servico-acoes">
                <button
                    type="button"
                    class="btn-editar"
                    onclick="editarCliente(${c.id})"
                >
                    ✏️ Editar
                </button>

                <button
                    type="button"
                    class="btn-danger"
                    onclick="excluirCliente(${c.id})"
                >
                    🗑️ Excluir
                </button>
            </div>
        `;

        grid.appendChild(item);
    });

    listaClientes.innerHTML = "";
    listaClientes.appendChild(grid);
}


// ============================================================
// SALVAR CLIENTE
// ============================================================

if (clienteForm) {

    clienteForm.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        const botaoSalvar = clienteForm.querySelector('button[type="submit"]');

        const nome = cliNome.value.trim();

        if (!nome) {
            alert("Informe o nome do cliente.");
            return;
        }

        const dados = {
            nome,
            telefone: cliTelefone.value.trim() || null,
            email: cliEmail.value.trim() || null,
            cpf: cliCpf.value.trim() || null,
            endereco: cliEndereco.value.trim() || null,
            observacoes: cliObservacoes.value.trim() || null
        };

        try {

            if (botaoSalvar) {
                botaoSalvar.disabled = true;
                botaoSalvar.textContent = "Salvando...";
            }

            let resultado;

            if (clienteEditandoId) {
                resultado = await supabaseClient
                    .from("clientes")
                    .update(dados)
                    .eq("id", clienteEditandoId)
                    .select();
            } else {
                resultado = await supabaseClient
                    .from("clientes")
                    .insert([dados])
                    .select();
            }

            if (resultado.error) throw resultado.error;

            alert(clienteEditandoId
                ? "Cliente atualizado com sucesso!"
                : "Cliente cadastrado com sucesso!"
            );

            fecharFormularioClienteFunc();
            await carregarClientes();

        } catch (erro) {

            console.error("Erro ao salvar cliente:", erro);
            alert("Erro ao salvar cliente.\n\n" + (erro.message || "Erro desconhecido."));

        } finally {

            if (botaoSalvar) {
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = "Salvar cliente";
            }
        }
    });
}


// ============================================================
// EDITAR CLIENTE
// ============================================================

async function editarCliente(id) {

    try {

        const { data, error } = await supabaseClient
            .from("clientes")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;

        cliNome.value = data.nome || "";
        cliTelefone.value = data.telefone || "";
        cliEmail.value = data.email || "";
        cliCpf.value = data.cpf || "";
        cliEndereco.value = data.endereco || "";
        cliObservacoes.value = data.observacoes || "";

        clienteEditandoId = id;

        const titulo = formularioCliente?.querySelector(".form-header h3");
        if (titulo) titulo.textContent = "Editar cliente";

        abrirFormularioCliente();

    } catch (erro) {

        console.error("Erro ao editar cliente:", erro);
        alert("Não foi possível carregar o cliente.");
    }
}


// ============================================================
// EXCLUIR CLIENTE
// ============================================================

async function excluirCliente(id) {

    const confirmar = confirm(
        "Tem certeza que deseja excluir este cliente?\n\nAs ordens de serviço vinculadas NÃO serão excluídas, mas perderão o vínculo."
    );

    if (!confirmar) return;

    try {

        const { error } = await supabaseClient
            .from("clientes")
            .delete()
            .eq("id", id);

        if (error) throw error;

        alert("Cliente excluído com sucesso!");
        await carregarClientes();

    } catch (erro) {

        console.error("Erro ao excluir cliente:", erro);
        alert("Não foi possível excluir o cliente.\n\n" + (erro.message || ""));
    }
}


// ============================================================
// CONTADOR
// ============================================================

function atualizarContadorClientes() {

    if (!contadorClientes) return;

    const total = todosClientes.length;

    contadorClientes.textContent = total === 1
        ? "1 cliente"
        : `${total} clientes`;
}


// ============================================================
// PESQUISA
// ============================================================

if (clientePesquisa) {
    clientePesquisa.addEventListener("input", function () {
        termoPesquisaCliente = this.value.trim().toLowerCase();
        renderizarClientes();
    });
}


// ============================================================
// FIM DO MÓDULO CLIENTES
// ============================================================