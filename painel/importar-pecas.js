// ============================================================
// IMPORTAÇÃO E EXCLUSÃO EM MASSA DE PEÇAS
// ============================================================

let dadosPreviewPecas = [];

const importarPecasBtn = document.getElementById("importarPecas");
const modalImportacaoPecas = document.getElementById("modalImportacaoPecas");
const fecharModalImportacaoPecas = document.getElementById("fecharModalImportacaoPecas");
const importarTextoPecas = document.getElementById("importarTextoPecas");
const btnPreviewImportacaoPecas = document.getElementById("btnPreviewImportacaoPecas");
const btnImportarTudoPecas = document.getElementById("btnImportarTudoPecas");
const btnLimparImportacaoPecas = document.getElementById("btnLimparImportacaoPecas");
const previewImportacaoPecas = document.getElementById("previewImportacaoPecas");
const statusImportacaoPecas = document.getElementById("statusImportacaoPecas");


// ============================================================
// ABRIR / FECHAR MODAL
// ============================================================

if (importarPecasBtn) {
    importarPecasBtn.addEventListener("click", function () {
        modalImportacaoPecas.classList.remove("hidden");
        importarTextoPecas.value = "";
        previewImportacaoPecas.innerHTML = "";
        statusImportacaoPecas.innerHTML = "";
        btnImportarTudoPecas.disabled = true;
        dadosPreviewPecas = [];
    });
}

if (fecharModalImportacaoPecas) {
    fecharModalImportacaoPecas.addEventListener("click", function () {
        modalImportacaoPecas.classList.add("hidden");
    });
}

if (modalImportacaoPecas) {
    modalImportacaoPecas.addEventListener("click", function (e) {
        if (e.target === modalImportacaoPecas) {
            modalImportacaoPecas.classList.add("hidden");
        }
    });
}


// ============================================================
// PARSEAR LINHAS
// ============================================================

function parsearLinhasPecas(texto) {

    const linhas = texto
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

    const resultado = [];

    linhas.forEach(function (linha, index) {

        const linhaLower = linha.toLowerCase();
        if (linhaLower.startsWith("nome") || linhaLower.startsWith("peça") || linhaLower.startsWith("peca")) {
            return;
        }

        let partes;
        if (linha.includes("\t")) {
            partes = linha.split("\t");
        } else if (linha.includes(";")) {
            partes = linha.split(";");
        } else {
            partes = linha.split(",");
        }

        partes = partes.map(p => p.trim());

        if (partes.length < 4) {
            resultado.push({
                linha: index + 1,
                erro: "Formato incompleto (mínimo: nome, categoria, marca, quantidade)",
                dados: partes
            });
            return;
        }

        const nome = partes[0] || "";
        const categoria = partes[1] || "";
        const marca = partes[2] || "";
        const modeloCompativel = partes[3] || "";
        const quantidade = parseInt((partes[4] || "0").replace(/[^\d]/g, "")) || 0;
        const estoqueMinimo = parseInt((partes[5] || "1").replace(/[^\d]/g, "")) || 1;
        const precoCusto = parseFloat((partes[6] || "0").replace(",", ".").replace(/[^\d.]/g, "")) || 0;
        const precoVenda = parseFloat((partes[7] || "0").replace(",", ".").replace(/[^\d.]/g, "")) || 0;
        const fornecedor = partes[8] || "";
        const observacoes = partes[9] || "";

        if (!nome) {
            resultado.push({
                linha: index + 1,
                erro: "Nome da peça é obrigatório",
                dados: partes
            });
            return;
        }

        resultado.push({
            linha: index + 1,
            ok: true,
            nome,
            categoria: categoria || null,
            marca: marca || null,
            modelo_compativel: modeloCompativel || null,
            quantidade,
            estoque_minimo: estoqueMinimo,
            preco_custo: precoCusto,
            preco_venda: precoVenda,
            fornecedor: fornecedor || null,
            observacoes: observacoes || null
        });
    });

    return resultado;
}


// ============================================================
// PRÉ-VISUALIZAR
// ============================================================

if (btnPreviewImportacaoPecas) {
    btnPreviewImportacaoPecas.addEventListener("click", function () {

        const texto = importarTextoPecas.value.trim();

        if (!texto) {
            statusImportacaoPecas.innerHTML = `<span style="color: #c53030;">⚠️ Cole os dados primeiro.</span>`;
            btnImportarTudoPecas.disabled = true;
            return;
        }

        const parsed = parsearLinhasPecas(texto);
        dadosPreviewPecas = parsed.filter(p => p.ok);
        const erros = parsed.filter(p => !p.ok);

        if (parsed.length === 0) {
            statusImportacaoPecas.innerHTML = `<span style="color: #c53030;">⚠️ Nenhuma linha válida.</span>`;
            btnImportarTudoPecas.disabled = true;
            return;
        }

        let html = `<div class="preview-tabela"><table>`;
        html += `<thead><tr>
            <th>#</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Marca</th>
            <th>Qtd</th>
            <th>Custo</th>
            <th>Venda</th>
        </tr></thead><tbody>`;

        parsed.forEach(function (p) {
            if (p.ok) {
                html += `<tr>
                    <td>${p.linha}</td>
                    <td>${escaparPeca(p.nome)}</td>
                    <td>${escaparPeca(p.categoria || "-")}</td>
                    <td>${escaparPeca(p.marca || "-")}</td>
                    <td>${p.quantidade}</td>
                    <td>${formatarMoedaPeca(p.preco_custo)}</td>
                    <td>${formatarMoedaPeca(p.preco_venda)}</td>
                </tr>`;
            } else {
                html += `<tr class="linha-erro">
                    <td>${p.linha}</td>
                    <td colspan="6">❌ ${escaparPeca(p.erro)}: ${escaparPeca(p.dados.join(" | "))}</td>
                </tr>`;
            }
        });

        html += `</tbody></table></div>`;

        html += `<div class="preview-resumo">
            <span class="preview-resumo-item ok">✅ ${dadosPreviewPecas.length} válidos</span>
            ${erros.length > 0 ? `<span class="preview-resumo-item erro">❌ ${erros.length} com erro</span>` : ""}
        </div>`;

        previewImportacaoPecas.innerHTML = html;
        statusImportacaoPecas.innerHTML = "";

        if (dadosPreviewPecas.length > 0) {
            btnImportarTudoPecas.disabled = false;
            btnImportarTudoPecas.textContent = `📥 Importar ${dadosPreviewPecas.length} peças`;
        } else {
            btnImportarTudoPecas.disabled = true;
        }
    });
}


// ============================================================
// IMPORTAR TUDO
// ============================================================

if (btnImportarTudoPecas) {
    btnImportarTudoPecas.addEventListener("click", async function () {

        if (dadosPreviewPecas.length === 0) return;

        const confirmar = confirm(
            `Vai cadastrar ${dadosPreviewPecas.length} peças.\n\nDeseja continuar?`
        );

        if (!confirmar) return;

        btnImportarTudoPecas.disabled = true;
        btnImportarTudoPecas.textContent = "⏳ Importando...";
        statusImportacaoPecas.innerHTML = `<span style="color: #198cff;">Importando...</span>`;

        try {
            const registros = dadosPreviewPecas.map(function (d) {
                return {
                    nome: d.nome,
                    categoria: d.categoria,
                    marca: d.marca,
                    modelo_compativel: d.modelo_compativel,
                    quantidade: d.quantidade,
                    estoque_minimo: d.estoque_minimo,
                    preco_custo: d.preco_custo,
                    preco_venda: d.preco_venda,
                    fornecedor: d.fornecedor,
                    observacoes: d.observacoes
                };
            });

            const TAMANHO_LOTE = 100;
            let totalInserido = 0;

            for (let i = 0; i < registros.length; i += TAMANHO_LOTE) {
                const lote = registros.slice(i, i + TAMANHO_LOTE);

                statusImportacaoPecas.innerHTML = `<span style="color: #198cff;">Importando lote ${Math.floor(i / TAMANHO_LOTE) + 1}...</span>`;

                const { data, error } = await supabaseClient
                    .from("pecas")
                    .insert(lote)
                    .select();

                if (error) throw error;
                totalInserido += (data || []).length;
            }

            statusImportacaoPecas.innerHTML = `<span style="color: #16a34a;">✅ ${totalInserido} peças importadas!</span>`;
            btnImportarTudoPecas.textContent = `✅ Importados`;

            setTimeout(function () {
                if (typeof carregarPecas === "function") carregarPecas();
                modalImportacaoPecas.classList.add("hidden");
                alert(`✅ ${totalInserido} peças cadastradas com sucesso!`);
            }, 1500);

        } catch (erro) {
            console.error("Erro na importação:", erro);
            statusImportacaoPecas.innerHTML = `<span style="color: #c53030;">❌ Erro: ${erro.message}</span>`;
            btnImportarTudoPecas.disabled = false;
            btnImportarTudoPecas.textContent = `📥 Tentar novamente`;
        }
    });
}


// ============================================================
// LIMPAR
// ============================================================

if (btnLimparImportacaoPecas) {
    btnLimparImportacaoPecas.addEventListener("click", function () {
        importarTextoPecas.value = "";
        previewImportacaoPecas.innerHTML = "";
        statusImportacaoPecas.innerHTML = "";
        btnImportarTudoPecas.disabled = true;
        dadosPreviewPecas = [];
    });
}


// ============================================================
// EXCLUSÃO EM MASSA
// ============================================================

window.abrirModalExclusaoPecas = function () {
    const modal = document.getElementById("modalExclusaoPecas");
    if (!modal) return;

    const pecas = (typeof todasPecas !== "undefined" && Array.isArray(todasPecas)) ? todasPecas : [];

    if (pecas.length === 0) {
        alert("Não há peças cadastradas para excluir.");
        return;
    }

    document.getElementById("confirmarExclusaoPecas").value = "";
    document.getElementById("btnConfirmarExclusaoPecas").disabled = true;
    document.getElementById("btnConfirmarExclusaoPecas").textContent = `🗑️ Excluir ${pecas.length} peças`;
    document.getElementById("statusExclusaoPecas").innerHTML = "";

    modal.classList.remove("hidden");
};

window.fecharModalExclusaoPecas = function () {
    const modal = document.getElementById("modalExclusaoPecas");
    if (!modal) return;
    modal.classList.add("hidden");
    document.getElementById("confirmarExclusaoPecas").value = "";
    document.getElementById("btnConfirmarExclusaoPecas").disabled = true;
};

window.validarExclusaoPecas = function () {
    const input = document.getElementById("confirmarExclusaoPecas");
    const btn = document.getElementById("btnConfirmarExclusaoPecas");
    if (!input || !btn) return;
    btn.disabled = (input.value.trim().toUpperCase() !== "EXCLUIR");
};

window.baixarBackupAntesExcluirPecas = async function () {
    const btn = document.getElementById("btnBackupAntesExcluirPecas");
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = "⏳ Gerando backup...";

    try {
        const { data, error } = await supabaseClient.from("pecas").select("*");
        if (error) throw error;

        const backup = {
            versao: "1.0",
            tipo: "backup-pecas",
            exportado_em: new Date().toISOString(),
            total_pecas: (data || []).length,
            pecas: data || []
        };

        const agora = new Date();
        const dataStr = agora.toISOString().slice(0, 10);
        const horaStr = agora.toTimeString().slice(0, 8).replace(/:/g, "-");

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pecas-backup-${dataStr}_${horaStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        btn.textContent = "✅ Backup baixado";
        setTimeout(function () {
            btn.disabled = false;
            btn.textContent = "💾 Baixar backup agora";
        }, 3000);

    } catch (erro) {
        console.error("Erro no backup:", erro);
        btn.textContent = "❌ Erro";
        setTimeout(function () {
            btn.disabled = false;
            btn.textContent = "💾 Baixar backup agora";
        }, 3000);
    }
};

window.confirmarExclusaoPecas = async function () {
    const input = document.getElementById("confirmarExclusaoPecas");
    const btn = document.getElementById("btnConfirmarExclusaoPecas");
    const status = document.getElementById("statusExclusaoPecas");

    if (!input || !btn) return;

    if (input.value.trim().toUpperCase() !== "EXCLUIR") {
        if (status) status.innerHTML = `<span style="color: #dc2626;">⚠️ Digite EXCLUIR em maiúsculas.</span>`;
        return;
    }

    const total = (typeof todasPecas !== "undefined" && Array.isArray(todasPecas)) ? todasPecas.length : 0;

    btn.disabled = true;
    btn.textContent = "⏳ Excluindo...";
    if (status) status.innerHTML = `<span style="color: #dc2626;">Excluindo ${total} peças...</span>`;

    try {
        const { error } = await supabaseClient
            .from("pecas")
            .delete()
            .neq("id", 0);

        if (error) throw error;

        if (status) status.innerHTML = `<span style="color: #16a34a;">✅ ${total} peças excluídas!</span>`;
        btn.textContent = "✅ Excluído";

        setTimeout(async function () {
            window.fecharModalExclusaoPecas();
            if (typeof carregarPecas === "function") await carregarPecas();
            alert(`✅ ${total} peças foram excluídas.`);
        }, 1500);

    } catch (erro) {
        console.error("Erro ao excluir peças:", erro);
        if (status) status.innerHTML = `<span style="color: #dc2626;">❌ Erro: ${erro.message}</span>`;
        btn.disabled = false;
        btn.textContent = "🗑️ Tentar novamente";
    }
};


// ============================================================
// HELPERS
// ============================================================

function escaparPeca(v) {
    if (v === null || v === undefined) return "";
    return String(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatarMoedaPeca(v) {
    return Number(v || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

console.log("📥 Módulo importação de peças carregado.");