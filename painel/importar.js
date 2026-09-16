// ============================================================
// IMPORTAÇÃO EM MASSA DE SERVIÇOS
// ============================================================

const importarServicosBtn = document.getElementById("importarServicos");
const modalImportacao = document.getElementById("modalImportacao");
const fecharModalImportacao = document.getElementById("fecharModalImportacao");
const importarTexto = document.getElementById("importarTexto");
const btnPreviewImportacao = document.getElementById("btnPreviewImportacao");
const btnImportarTudo = document.getElementById("btnImportarTudo");
const btnLimparImportacao = document.getElementById("btnLimparImportacao");
const previewImportacao = document.getElementById("previewImportacao");
const statusImportacao = document.getElementById("statusImportacao");

let dadosPreview = [];


// ============================================================
// ABRIR / FECHAR MODAL
// ============================================================

if (importarServicosBtn) {
    importarServicosBtn.addEventListener("click", function () {
        modalImportacao.classList.remove("hidden");
        importarTexto.value = "";
        previewImportacao.innerHTML = "";
        statusImportacao.innerHTML = "";
        btnImportarTudo.disabled = true;
        dadosPreview = [];
    });
}

if (fecharModalImportacao) {
    fecharModalImportacao.addEventListener("click", function () {
        modalImportacao.classList.add("hidden");
    });
}

// Fechar clicando fora
if (modalImportacao) {
    modalImportacao.addEventListener("click", function (e) {
        if (e.target === modalImportacao) {
            modalImportacao.classList.add("hidden");
        }
    });
}


// ============================================================
// PARSEAR TEXTO COLADO
// ============================================================

function parsearLinhas(texto) {

    const linhas = texto
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

    const resultado = [];

    linhas.forEach(function (linha, index) {

        // Ignora cabeçalho
        const linhaLower = linha.toLowerCase();
        if (
            linhaLower.startsWith("marca") ||
            linhaLower.startsWith("marca,") ||
            linhaLower.startsWith("marca\t")
        ) {
            return;
        }

        // Detecta separador (vírgula ou tab)
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
                erro: "Formato incompleto (mínimo: marca, modelo, serviço, preço)",
                dados: partes
            });
            return;
        }

        const marca = partes[0] || "";
        const modelo = partes[1] || "";
        const tipoServico = partes[2] || "";
        const precoTexto = (partes[3] || "").replace(",", ".").replace(/[^\d.]/g, "");
        const prazo = partes[4] || "A definir";
        const qualidade = partes[6] || "";
        const observacaoTecnica = partes[7] || "";
        const status = (partes[5] || "ativo").toLowerCase();

        const preco = parseFloat(precoTexto);

        if (!marca || !modelo || !tipoServico) {
            resultado.push({
                linha: index + 1,
                erro: "Marca, modelo e serviço são obrigatórios",
                dados: partes
            });
            return;
        }

        if (isNaN(preco) || preco < 0) {
            resultado.push({
                linha: index + 1,
                erro: "Preço inválido: " + partes[3],
                dados: partes
            });
            return;
        }

        resultado.push({
            linha: index + 1,
            ok: true,
            marca,
            modelo,
            tipo_servico: tipoServico,
            qualidade: qualidade || null,
            observacao_tecnica: observacaoTecnica || null,
            preco,
            prazo,
            status: status === "inativo" ? "inativo" : "ativo"
        });
    });

    return resultado;
}


// ============================================================
// PRÉ-VISUALIZAR
// ============================================================

if (btnPreviewImportacao) {
    btnPreviewImportacao.addEventListener("click", function () {

        const texto = importarTexto.value.trim();

        if (!texto) {
            statusImportacao.innerHTML = `<span style="color: #c53030;">⚠️ Cole os dados primeiro.</span>`;
            btnImportarTudo.disabled = true;
            return;
        }

        const parsed = parsearLinhas(texto);
        dadosPreview = parsed.filter(p => p.ok);
        const erros = parsed.filter(p => !p.ok);

        if (parsed.length === 0) {
            statusImportacao.innerHTML = `<span style="color: #c53030;">⚠️ Nenhuma linha válida encontrada.</span>`;
            btnImportarTudo.disabled = true;
            return;
        }

        // Monta tabela preview
        let html = `<div class="preview-tabela"><table>`;
        html += `<thead><tr>
            <th>#</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Serviço</th>
            <th>Preço</th>
            <th>Prazo</th>
            <th>Status</th>
        </tr></thead><tbody>`;

        parsed.forEach(function (p) {
            if (p.ok) {
                html += `<tr>
                    <td>${p.linha}</td>
                    <td>${escapar(p.marca)}</td>
                    <td>${escapar(p.modelo)}</td>
                    <td>${escapar(p.tipo_servico)}</td>
                    <td>${p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    <td>${escapar(p.prazo)}</td>
                    <td>${p.status === "ativo" ? "🟢 Ativo" : "🔴 Inativo"}</td>
                </tr>`;
            } else {
                html += `<tr class="linha-erro">
                    <td>${p.linha}</td>
                    <td colspan="6">❌ ${escapar(p.erro)}: ${escapar(p.dados.join(" | "))}</td>
                </tr>`;
            }
        });

        html += `</tbody></table></div>`;

        html += `<div class="preview-resumo">
            <span class="preview-resumo-item ok">✅ ${dadosPreview.length} válidos</span>
            ${erros.length > 0 ? `<span class="preview-resumo-item erro">❌ ${erros.length} com erro</span>` : ""}
        </div>`;

        previewImportacao.innerHTML = html;

        statusImportacao.innerHTML = "";

        if (dadosPreview.length > 0) {
            btnImportarTudo.disabled = false;
            btnImportarTudo.textContent = `📥 Importar ${dadosPreview.length} serviços`;
        } else {
            btnImportarTudo.disabled = true;
        }
    });
}


// ============================================================
// IMPORTAR TUDO
// ============================================================

if (btnImportarTudo) {
    btnImportarTudo.addEventListener("click", async function () {

        if (dadosPreview.length === 0) return;

        const confirmar = confirm(
            `Vai cadastrar ${dadosPreview.length} serviços.\n\n` +
            `Deseja continuar?`
        );

        if (!confirmar) return;

        btnImportarTudo.disabled = true;
        btnImportarTudo.textContent = "⏳ Importando...";
        statusImportacao.innerHTML = `<span style="color: #198cff;">Importando ${dadosPreview.length} serviços...</span>`;

        try {

            // Monta array para o Supabase
const registros = dadosPreview.map(function (d) {
                return {
                    marca: d.marca,
                    modelo: d.modelo,
                    tipo_servico: d.tipo_servico,
                    qualidade: d.qualidade || null,
                    observacao_tecnica: d.observacao_tecnica || null,
                    preco: d.preco,
                    prazo: d.prazo,
                    status: d.status
                };
            });

            // Insere em lotes de 100 (evita erro com muitas linhas)
            const TAMANHO_LOTE = 100;
            let totalInserido = 0;

            for (let i = 0; i < registros.length; i += TAMANHO_LOTE) {

                const lote = registros.slice(i, i + TAMANHO_LOTE);

                statusImportacao.innerHTML = `<span style="color: #198cff;">Importando lote ${Math.floor(i / TAMANHO_LOTE) + 1}... (${i}/${registros.length})</span>`;

                const { data, error } = await supabaseClient
                    .from("servicos")
                    .insert(lote)
                    .select();

                if (error) {
                    console.error("Erro no lote:", error);
                    throw error;
                }

                totalInserido += (data || []).length;
            }

            statusImportacao.innerHTML = `<span style="color: #16a34a;">✅ ${totalInserido} serviços importados com sucesso!</span>`;

            btnImportarTudo.textContent = `✅ Importados`;

            // Recarrega a lista de serviços
            setTimeout(function () {
                if (typeof carregarServicos === "function") {
                    carregarServicos();
                }
                if (typeof carregarServicosParaPrecos === "function") {
                    carregarServicosParaPrecos();
                }
            }, 500);

            // Fecha o modal após 2 segundos
            setTimeout(function () {
                modalImportacao.classList.add("hidden");
                alert(`✅ ${totalInserido} serviços cadastrados com sucesso!`);
            }, 1500);

        } catch (erro) {

            console.error("Erro na importação:", erro);
            statusImportacao.innerHTML = `<span style="color: #c53030;">❌ Erro: ${erro.message || "Falha ao importar"}</span>`;

            btnImportarTudo.disabled = false;
            btnImportarTudo.textContent = `📥 Tentar novamente`;
        }
    });
}


// ============================================================
// LIMPAR
// ============================================================

if (btnLimparImportacao) {
    btnLimparImportacao.addEventListener("click", function () {
        importarTexto.value = "";
        previewImportacao.innerHTML = "";
        statusImportacao.innerHTML = "";
        btnImportarTudo.disabled = true;
        dadosPreview = [];
    });
}


// ============================================================
// PROTEÇÃO
// ============================================================

function escapar(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

console.log("📥 Módulo de importação em massa carregado.");