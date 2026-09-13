// ============================================================
// BACKUP E RESTAURAÇÃO DE DADOS
// ============================================================

const btnExportarBackup = document.getElementById("btnExportarBackup");
const btnExportarCSV = document.getElementById("btnExportarCSV");
const btnImportarBackup = document.getElementById("btnImportarBackup");
const inputImportarBackup = document.getElementById("inputImportarBackup");
const backupStatus = document.getElementById("backupStatus");


// ============================================================
// HELPERS
// ============================================================

function mostrarStatus(mensagem, tipo) {
    if (!backupStatus) return;
    
    const cores = {
        ok: "#16a34a",
        erro: "#dc2626",
        info: "#2563eb"
    };
    
    backupStatus.innerHTML = `<span style="color: ${cores[tipo] || cores.info};">${mensagem}</span>`;
}


function gerarNomeArquivo(extensao) {
    const agora = new Date();
    const data = agora.toISOString().slice(0, 10);
    const hora = agora.toTimeString().slice(0, 8).replace(/:/g, "-");
    return `backup-reparo-celular-${data}_${hora}.${extensao}`;
}


function baixarArquivo(conteudo, nome) {
    const blob = new Blob([conteudo], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


function baixarCSV(conteudo, nome) {
    const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// ============================================================
// EXPORTAR BACKUP (JSON COMPLETO)
// ============================================================

if (btnExportarBackup) {
    btnExportarBackup.addEventListener("click", async function () {

        btnExportarBackup.disabled = true;
        btnExportarBackup.textContent = "⏳ Exportando...";
        mostrarStatus("Coletando dados...", "info");

        try {

            const tabelas = [
                "servicos",
                "precos",
                "clientes",
                "ordens_servico",
                "pecas",
                "movimentacoes_estoque",
                "configuracoes"
            ];

            const backup = {
                versao: "1.0",
                exportado_em: new Date().toISOString(),
                projeto: "Reparo de Celular",
                dados: {}
            };

            for (const tabela of tabelas) {
                const { data, error } = await supabaseClient
                    .from(tabela)
                    .select("*");

                if (error) {
                    console.warn(`Erro ao exportar ${tabela}:`, error);
                    backup.dados[tabela] = [];
                } else {
                    backup.dados[tabela] = data || [];
                }
            }

            // Conta registros
            let total = 0;
            Object.keys(backup.dados).forEach(function (t) {
                total += backup.dados[t].length;
            });

            baixarArquivo(
                JSON.stringify(backup, null, 2),
                gerarNomeArquivo("json")
            );

            mostrarStatus(`✅ Backup exportado com sucesso! ${total} registros em ${tabelas.length} tabelas.`, "ok");

        } catch (erro) {
            console.error("Erro no backup:", erro);
            mostrarStatus("❌ Erro ao exportar backup: " + erro.message, "erro");
        } finally {
            btnExportarBackup.disabled = false;
            btnExportarBackup.textContent = "📥 Exportar backup (JSON)";
        }
    });
}


// ============================================================
// EXPORTAR CSV (SERVIÇOS + ORDENS)
// ============================================================

if (btnExportarCSV) {
    btnExportarCSV.addEventListener("click", async function () {

        btnExportarCSV.disabled = true;
        btnExportarCSV.textContent = "⏳ Gerando...";
        mostrarStatus("Gerando CSV...", "info");

        try {

            const { data: ordens } = await supabaseClient
                .from("ordens_servico")
                .select("*")
                .order("id", { ascending: false });

            const { data: clientes } = await supabaseClient
                .from("clientes")
                .select("*");

            const mapaClientes = {};
            (clientes || []).forEach(c => mapaClientes[c.id] = c);

            // Monta CSV
            const linhas = [
                ["OS", "Data", "Cliente", "Aparelho", "Serviço", "Status", "Valor", "Previsão"]
            ];

            (ordens || []).forEach(function (o) {
                const cliente = mapaClientes[o.cliente_id];
                linhas.push([
                    o.numero_os || o.id,
                    o.data_entrada ? new Date(o.data_entrada).toLocaleDateString("pt-BR") : "",
                    cliente ? cliente.nome : "",
                    `${o.aparelho_marca || ""} ${o.aparelho_modelo || ""}`.trim(),
                    o.defeito_relatado || "",
                    o.status || "",
                    Number(o.valor_total || 0).toFixed(2).replace(".", ","),
                    o.previsao_entrega || ""
                ]);
            });

            // Converte para CSV
            const csv = linhas.map(linha =>
                linha.map(celula => {
                    const txt = String(celula || "").replace(/"/g, '""');
                    return `"${txt}"`;
                }).join(",")
            ).join("\n");

            baixarCSV(csv, gerarNomeArquivo("csv"));

            mostrarStatus(`✅ CSV exportado! ${ordens.length} ordens de serviço.`, "ok");

        } catch (erro) {
            console.error("Erro no CSV:", erro);
            mostrarStatus("❌ Erro: " + erro.message, "erro");
        } finally {
            btnExportarCSV.disabled = false;
            btnExportarCSV.textContent = "📊 Exportar CSV (planilha)";
        }
    });
}


// ============================================================
// IMPORTAR BACKUP
// ============================================================

if (btnImportarBackup && inputImportarBackup) {

    btnImportarBackup.addEventListener("click", function () {
        inputImportarBackup.click();
    });

    inputImportarBackup.addEventListener("change", async function (evento) {

        const arquivo = evento.target.files[0];
        if (!arquivo) return;

        const confirmar = confirm(
            "⚠️ ATENÇÃO!\n\n" +
            "Isso vai SUBSTITUIR os dados atuais pelas informações do backup.\n\n" +
            "Recomendamos fazer um backup antes.\n\n" +
            "Deseja continuar?"
        );

        if (!confirmar) {
            inputImportarBackup.value = "";
            return;
        }

        btnImportarBackup.disabled = true;
        mostrarStatus("Lendo arquivo...", "info");

        try {

            const texto = await arquivo.text();
            const backup = JSON.parse(texto);

            if (!backup.dados) {
                throw new Error("Arquivo inválido.");
            }

            let total = 0;

            for (const tabela of Object.keys(backup.dados)) {

                const registros = backup.dados[tabela];
                if (!registros || registros.length === 0) continue;

                mostrarStatus(`Importando ${tabela}...`, "info");

                // Apaga os dados atuais
                await supabaseClient.from(tabela).delete().neq("id", 0);

                // Insere os novos
                const { error } = await supabaseClient
                    .from(tabela)
                    .insert(registros);

                if (error) {
                    console.warn(`Erro em ${tabela}:`, error);
                } else {
                    total += registros.length;
                }
            }

            mostrarStatus(`✅ Backup restaurado! ${total} registros importados.`, "ok");
            alert("✅ Backup restaurado com sucesso!\n\nRecarregue a página para ver os dados.");

        } catch (erro) {
            console.error("Erro na importação:", erro);
            mostrarStatus("❌ Erro: " + erro.message, "erro");
            alert("❌ Erro ao importar backup.\n\n" + erro.message);
        } finally {
            btnImportarBackup.disabled = false;
            inputImportarBackup.value = "";
        }
    });
}


console.log("💾 Módulo de backup carregado.");