// ============================================================
// EXCLUSÃO EM MASSA DE SERVIÇOS
// ============================================================

const btnExcluirTodos = document.getElementById("excluirTodosServicos");
const modalExclusao = document.getElementById("modalExclusao");
const fecharModalExclusao = document.getElementById("fecharModalExclusao");
const btnCancelarExclusao = document.getElementById("btnCancelarExclusao");
const btnConfirmarExclusao = document.getElementById("btnConfirmarExclusao");
const confirmarExclusaoInput = document.getElementById("confirmarExclusao");
const statusExclusao = document.getElementById("statusExclusao");
const btnBackupAntesExcluir = document.getElementById("btnBackupAntesExcluir");


// ============================================================
// ABRIR MODAL
// ============================================================

if (btnExcluirTodos) {
    btnExcluirTodos.addEventListener("click", function () {

        // Verifica se tem serviços
        if (!todosServicos || todosServicos.length === 0) {
            alert("Não há serviços cadastrados para excluir.");
            return;
        }

        // Reset
        confirmarExclusaoInput.value = "";
        btnConfirmarExclusao.disabled = true;
        statusExclusao.innerHTML = "";

        // Atualiza o botão com a contagem
        btnConfirmarExclusao.textContent = `🗑️ Excluir ${todosServicos.length} serviços`;

        modalExclusao.classList.remove("hidden");
        setTimeout(function () {
            confirmarExclusaoInput.focus();
        }, 100);
    });
}


// ============================================================
// FECHAR MODAL
// ============================================================

function fecharModalExclusaoFunc() {
    modalExclusao.classList.add("hidden");
    confirmarExclusaoInput.value = "";
    btnConfirmarExclusao.disabled = true;
    statusExclusao.innerHTML = "";
}

if (fecharModalExclusao) {
    fecharModalExclusao.addEventListener("click", fecharModalExclusaoFunc);
}

if (btnCancelarExclusao) {
    btnCancelarExclusao.addEventListener("click", fecharModalExclusaoFunc);
}

// Fechar clicando fora
if (modalExclusao) {
    modalExclusao.addEventListener("click", function (e) {
        if (e.target === modalExclusao) {
            fecharModalExclusaoFunc();
        }
    });
}


// ============================================================
// VALIDAR DIGITAÇÃO
// ============================================================

if (confirmarExclusaoInput) {
    confirmarExclusaoInput.addEventListener("input", function () {
        const texto = confirmarExclusaoInput.value.trim().toUpperCase();

        if (texto === "EXCLUIR") {
            btnConfirmarExclusao.disabled = false;
        } else {
            btnConfirmarExclusao.disabled = true;
        }
    });
}


// ============================================================
// BAIXAR BACKUP ANTES DE EXCLUIR
// ============================================================

if (btnBackupAntesExcluir) {
    btnBackupAntesExcluir.addEventListener("click", async function () {

        btnBackupAntesExcluir.disabled = true;
        btnBackupAntesExcluir.textContent = "⏳ Gerando backup...";

        try {
            const { data, error } = await supabaseClient
                .from("servicos")
                .select("*");

            if (error) throw error;

            const backup = {
                versao: "1.0",
                tipo: "backup-antes-exclusao",
                exportado_em: new Date().toISOString(),
                total_servicos: (data || []).length,
                servicos: data || []
            };

            const agora = new Date();
            const data_str = agora.toISOString().slice(0, 10);
            const hora_str = agora.toTimeString().slice(0, 8).replace(/:/g, "-");
            const nomeArquivo = `servicos-backup-${data_str}_${hora_str}.json`;

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = nomeArquivo;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            btnBackupAntesExcluir.textContent = "✅ Backup baixado";

            setTimeout(function () {
                btnBackupAntesExcluir.disabled = false;
                btnBackupAntesExcluir.textContent = "💾 Baixar backup agora";
            }, 3000);

        } catch (erro) {
            console.error("Erro no backup:", erro);
            btnBackupAntesExcluir.textContent = "❌ Erro no backup";
            setTimeout(function () {
                btnBackupAntesExcluir.disabled = false;
                btnBackupAntesExcluir.textContent = "💾 Baixar backup agora";
            }, 3000);
        }
    });
}


// ============================================================
// CONFIRMAR EXCLUSÃO
// ============================================================

if (btnConfirmarExclusao) {
    btnConfirmarExclusao.addEventListener("click", async function () {

        const texto = confirmarExclusaoInput.value.trim().toUpperCase();

        if (texto !== "EXCLUIR") {
            statusExclusao.innerHTML = `<span style="color: #dc2626;">⚠️ Digite EXCLUIR em maiúsculas para confirmar.</span>`;
            return;
        }

        btnConfirmarExclusao.disabled = true;
        btnConfirmarExclusao.textContent = "⏳ Excluindo...";
        statusExclusao.innerHTML = `<span style="color: #dc2626;">Excluindo ${todosServicos.length} serviços...</span>`;

        try {
            const total = todosServicos.length;

            // Exclui TODOS os serviços (neq com valor que nunca existe)
            const { error } = await supabaseClient
                .from("servicos")
                .delete()
                .neq("id", 0);

            if (error) throw error;

            statusExclusao.innerHTML = `<span style="color: #16a34a;">✅ ${total} serviços excluídos com sucesso!</span>`;
            btnConfirmarExclusao.textContent = "✅ Excluído";

            // Recarrega a lista
            setTimeout(async function () {
                fecharModalExclusaoFunc();
                if (typeof carregarServicos === "function") {
                    await carregarServicos();
                }
                if (typeof carregarServicosParaPrecos === "function") {
                    await carregarServicosParaPrecos();
                }
                alert(`✅ ${total} serviços foram excluídos.`);
            }, 1500);

        } catch (erro) {
            console.error("Erro ao excluir serviços:", erro);
            statusExclusao.innerHTML = `<span style="color: #dc2626;">❌ Erro: ${erro.message || "Falha ao excluir"}</span>`;
            btnConfirmarExclusao.disabled = false;
            btnConfirmarExclusao.textContent = "🗑️ Tentar novamente";
        }
    });
}


console.log("🗑️ Módulo de exclusão em massa carregado.");