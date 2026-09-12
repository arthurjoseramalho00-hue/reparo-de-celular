// ============================================================
// DASHBOARD — Dados reais na tela inicial
// ============================================================

async function carregarDashboard() {

    try {

        // ============================================================
        // BUSCA DADOS EM PARALELO
        // ============================================================

        const [resServicos, resClientes, resOS, resPecas] = await Promise.all([

            supabaseClient.from("servicos").select("id"),

            supabaseClient.from("clientes").select("id, nome"),

            supabaseClient.from("ordens_servico").select("*"),

            supabaseClient.from("pecas").select("*")

        ]);

        const servicos = resServicos.data || [];
        const clientes = resClientes.data || [];
        const ordens = resOS.data || [];
        const pecas = resPecas.data || [];


        // ============================================================
        // CARD 1 — SERVIÇOS CADASTRADOS
        // ============================================================

        const elServicos = document.getElementById("totalServicos");
        if (elServicos) elServicos.textContent = servicos.length;


        // ============================================================
        // CARD 2 — CLIENTES
        // ============================================================

        const elClientes = document.getElementById("dashClientes");
        if (elClientes) elClientes.textContent = clientes.length;


        // ============================================================
        // CARD 3 — ORDENS ABERTAS
        // ============================================================

        const statusAbertos = ["recebido", "analise", "aguardando_peca", "reparo", "pronto"];
        const osAbertas = ordens.filter(o => statusAbertos.includes(o.status));

        const elOSAbertas = document.getElementById("dashOSAbertas");
        if (elOSAbertas) elOSAbertas.textContent = osAbertas.length;


        // ============================================================
        // CARD 4 — FATURAMENTO DO MÊS
        // ============================================================

        const agora = new Date();
        const mesAtual = agora.getMonth();
        const anoAtual = agora.getFullYear();

        const osDoMes = ordens.filter(function (o) {
            if (!o.data_entrada) return false;
            const data = new Date(o.data_entrada);
            return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
        });

        const faturamento = osDoMes.reduce(function (soma, o) {
            return soma + Number(o.valor_total || 0);
        }, 0);

        const elFaturamento = document.getElementById("dashFaturamento");
        if (elFaturamento) {
            elFaturamento.textContent = faturamento.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });
        }


        // ============================================================
        // CARD 5 — ENTREGUES NO MÊS
        // ============================================================

        const entreguesNoMes = osDoMes.filter(o => o.status === "entregue").length;

        const elEntregues = document.getElementById("dashEntregues");
        if (elEntregues) elEntregues.textContent = entreguesNoMes;


        // ============================================================
        // CARD 6 — EM REPARO
        // ============================================================

        const emReparo = ordens.filter(o => o.status === "reparo").length;

        const elEmReparo = document.getElementById("dashEmReparo");
        if (elEmReparo) elEmReparo.textContent = emReparo;


        // ============================================================
        // CARD 7 — PEÇAS EM ESTOQUE
        // ============================================================

        const totalPecas = pecas.reduce(function (soma, p) {
            return soma + Number(p.quantidade || 0);
        }, 0);

        const elPecas = document.getElementById("dashPecas");
        if (elPecas) elPecas.textContent = totalPecas;


        // ============================================================
        // CARD 8 — ESTOQUE BAIXO
        // ============================================================

        const estoqueBaixo = pecas.filter(function (p) {
            const qtd = Number(p.quantidade || 0);
            const min = Number(p.estoque_minimo || 1);
            return qtd <= min;
        }).length;

        const elEstoqueBaixo = document.getElementById("dashEstoqueBaixo");
        if (elEstoqueBaixo) elEstoqueBaixo.textContent = estoqueBaixo;


        // ============================================================
        // ORDENS RECENTES (5 últimas)
        // ============================================================

        const recentes = [...ordens].slice(0, 5);

        const container = document.getElementById("dashOrdensRecentes");

        if (container) {

            if (recentes.length === 0) {

                container.innerHTML = `
                    <div class="lista-vazia" style="padding: 30px 15px;">
                        <div style="font-size: 35px;">📋</div>
                        <h3>Nenhuma ordem registrada</h3>
                        <p>Clique em "+ Nova OS" para começar.</p>
                    </div>
                `;

            } else {

                container.innerHTML = "";

                recentes.forEach(function (os) {

                    // Nome do cliente
                    let nomeCliente = "Cliente #" + (os.cliente_id || "?");

                    if (typeof todosClientes !== "undefined" && Array.isArray(todosClientes)) {
                        const cli = todosClientes.find(c => Number(c.id) === Number(os.cliente_id));
                        if (cli) nomeCliente = cli.nome;
                    } else if (clientes.length > 0) {
                        const cli = clientes.find(c => Number(c.id) === Number(os.cliente_id));
                        if (cli) nomeCliente = cli.nome;
                    }

                    const valor = Number(os.valor_total || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                    });

                    const labelStatus = {
                        recebido: "📥 Recebido",
                        analise: "🔍 Em análise",
                        aguardando_peca: "📦 Aguardando peça",
                        reparo: "🔧 Em reparo",
                        pronto: "✅ Pronto",
                        entregue: "📤 Entregue",
                        cancelado: "❌ Cancelado"
                    }[os.status] || os.status;

                    const div = document.createElement("div");
                    div.className = "dash-os-item";

                    div.onclick = function () {
                        if (typeof abrirPagina === "function") {
                            abrirPagina("ordens");
                        }
                    };

                    div.innerHTML = `
                        <div class="dash-os-numero">
                            ${escaparHTML(os.numero_os || "#" + os.id)}
                        </div>

                        <div class="dash-os-info">
                            <strong>${escaparHTML(nomeCliente)}</strong>
                            <small>${escaparHTML(os.aparelho_marca || "")} ${escaparHTML(os.aparelho_modelo || "")}</small>
                        </div>

                        <div>
                            <span class="os-status ${os.status}">
                                ${labelStatus}
                            </span>
                        </div>

                        <div class="dash-os-valor">
                            ${valor}
                        </div>
                    `;

                    container.appendChild(div);
                });
            }
        }

    } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro);
    }
}


// ============================================================
// FIM DO DASHBOARD
// ============================================================