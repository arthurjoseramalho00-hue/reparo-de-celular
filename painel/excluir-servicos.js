// ============================================================
// EXCLUSÃO EM MASSA DE SERVIÇOS
// ============================================================
// Todas as funções ficam em window. para funcionar com onclick
// ============================================================

console.log("🗑️ Módulo de exclusão em massa carregado.");


// ============================================================
// ABRIR MODAL
// ============================================================

window.abrirModalExclusao = function () {

    console.log("🔓 abrirModalExclusao chamado");

    const modal = document.getElementById("modalExclusao");

    if (!modal) {
        console.error("❌ Modal não encontrado!");
        alert("Erro: modal de exclusão não encontrado.");
        return;
    }

    // Verifica se tem serviços
    const servicos = (typeof todosServicos !== "undefined" && Array.isArray(todosServicos))
        ? todosServicos
        : [];

    if (servicos.length === 0) {
        alert("Não há serviços cadastrados para excluir.");
        return;
    }

    // Reset
    const input = document.getElementById("confirmarExclusao");
    const btnConfirmar = document.getElementById("btnConfirmarExclusao");
    const status = document.getElementById("statusExclusao");

    if (input) input.value = "";
    if (btnConfirmar) {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = `🗑️ Excluir ${servicos.length} serviços`;
    }
    if (status) status.innerHTML = "";

    modal.classList.remove("hidden");

    setTimeout(function () {
        if (input) input.focus();
    }, 100);
};


// ============================================================
// FECHAR MODAL
// ============================================================

window.fecharModalExclusao = function () {

    const modal = document.getElementById("modalExclusao");
    if (!modal) return;

    modal.classList.add("hidden");

    const input = document.getElementById("confirmarExclusao");
    const btnConfirmar = document.getElementById("btnConfirmarExclusao");
    const status = document.getElementById("statusExclusao");

    if (input) input.value = "";
    if (btnConfirmar) btnConfirmar.disabled = true;
    if (status) status.innerHTML = "";
};


// ============================================================
// VALIDAR DIGITAÇÃO
// ============================================================

window.validarExclusao = function () {

    const input = document.getElementById("confirmarExclusao");
    const btnConfirmar = document.getElementById("btnConfirmarExclusao");

    if (!input || !btnConfirmar) return;

    const texto = input.value.trim().toUpperCase();

    btnConfirmar.disabled = (texto !== "EXCLUIR");
};


// ============================================================
// BACKUP ANTES DE EXCLUIR
// ============================================================

window.baixarBackupAntesExcluir = async function () {

    const btn = document.getElementById("btnBackupAntesExcluir");
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = "⏳ Gerando backup...";

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
        const dataStr = agora.toISOString().slice(0, 10);
        const horaStr = agora.toTimeString().slice(0, 8).replace(/:/g, "-");
        const nomeArquivo = `servicos-backup-${dataStr}_${horaStr}.json`;

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nomeArquivo;
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
        btn.textContent = "❌ Erro no backup";
        setTimeout(function () {
            btn.disabled = false;
            btn.textContent = "💾 Baixar backup agora";
        }, 3000);
    }
};


// ============================================================
// CONFIRMAR EXCLUSÃO
// ============================================================

window.confirmarExclusao = async function () {

    const input = document.getElementById("confirmarExclusao");
    const btnConfirmar = document.getElementById("btnConfirmarExclusao");
    const status = document.getElementById("statusExclusao");

    if (!input || !btnConfirmar) return;

    const texto = input.value.trim().toUpperCase();

    if (texto !== "EXCLUIR") {
        if (status) {
            status.innerHTML = `<span style="color: #dc2626;">⚠️ Digite EXCLUIR em maiúsculas para confirmar.</span>`;
        }
        return;
    }

    const total = (typeof todosServicos !== "undefined" && Array.isArray(todosServicos))
        ? todosServicos.length
        : 0;

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "⏳ Excluindo...";

    if (status) {
        status.innerHTML = `<span style="color: #dc2626;">Excluindo ${total} serviços...</span>`;
    }

    try {
        const { error } = await supabaseClient
            .from("servicos")
            .delete()
            .neq("id", 0);

        if (error) throw error;

        if (status) {
            status.innerHTML = `<span style="color: #16a34a;">✅ ${total} serviços excluídos com sucesso!</span>`;
        }
        btnConfirmar.textContent = "✅ Excluído";

        setTimeout(async function () {
            window.fecharModalExclusao();
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
        if (status) {
            status.innerHTML = `<span style="color: #dc2626;">❌ Erro: ${erro.message || "Falha ao excluir"}</span>`;
        }
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "🗑️ Tentar novamente";
    }
};


console.log("✅ Funções globais registradas: abrirModalExclusao, fecharModalExclusao, validarExclusao, confirmarExclusao, baixarBackupAntesExcluir");