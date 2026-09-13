// ============================================================
// PROTEÇÃO DO PAINEL — Supabase Auth + Botão Sair na Topbar
// ============================================================
// ⚠️ Este arquivo usa variáveis únicas com prefixo "PAINEL_" 
// para não conflitar com o script.js
// ============================================================

(function () {

    const PAINEL_SUPABASE_URL = "https://ggdzzmekaxrovmuyvxyn.supabase.co";
    const PAINEL_SUPABASE_KEY = "sb_publishable_EyZOeqOCjgq_9RjBCUfa8w_121a85zK";


    // ============================================================
    // 1. BOTÃO DE LOGOUT (dentro da topbar)
    // ============================================================

    function criarBotaoLogout() {

        if (document.getElementById("btnLogoutTopbar")) return;

        const statusEl = document.querySelector(".topbar .status");

        if (!statusEl) {
            console.warn("⚠️ Topbar não encontrada.");
            return;
        }

        const botao = document.createElement("button");
        botao.id = "btnLogoutTopbar";
        botao.type = "button";
        botao.innerHTML = "🚪 Sair";
        botao.title = "Sair do painel";

        botao.style.cssText = `
            background: rgba(239, 68, 68, .1);
            border: 1px solid rgba(239, 68, 68, .35);
            color: #fca5a5;
            padding: 9px 16px;
            border-radius: 20px;
            font-family: inherit;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all .2s;
            white-space: nowrap;
        `;

        botao.addEventListener("mouseenter", function () {
            this.style.background = "rgba(239, 68, 68, .25)";
            this.style.color = "#fff";
        });

        botao.addEventListener("mouseleave", function () {
            this.style.background = "rgba(239, 68, 68, .1)";
            this.style.color = "#fca5a5";
        });

        botao.addEventListener("click", fazerLogout);

        const wrapper = document.createElement("div");
        wrapper.style.cssText = "display: flex; gap: 12px; align-items: center;";

        statusEl.parentNode.insertBefore(wrapper, statusEl);
        wrapper.appendChild(botao);
        wrapper.appendChild(statusEl);

        console.log("✅ Botão de logout criado na topbar.");
    }

    if (document.body) {
        criarBotaoLogout();
    } else {
        document.addEventListener("DOMContentLoaded", criarBotaoLogout);
    }


    // ============================================================
    // 2. FUNÇÃO DE LOGOUT (global para uso em qualquer lugar)
    // ============================================================

    window.fazerLogout = async function () {

        if (!confirm("Deseja sair do painel?")) return;

        try {
            const sb = window.supabase.createClient(PAINEL_SUPABASE_URL, PAINEL_SUPABASE_KEY);
            await sb.auth.signOut();
            try { localStorage.removeItem("usuario"); } catch (e) {}
        } catch (e) {
            console.error("Erro no logout:", e);
        }

        window.location.href = "login.html";
    };


    // ============================================================
    // 3. VERIFICA AUTENTICAÇÃO
    // ============================================================

    async function verificarAcesso() {

        let tentativas = 0;

        while (typeof window.supabase === "undefined" || !window.supabase.createClient) {
            if (tentativas > 50) {
                console.error("❌ Supabase não carregou.");
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            tentativas++;
        }

        console.log("🔍 Verificando autenticação...");

        const supabaseAuth = window.supabase.createClient(PAINEL_SUPABASE_URL, PAINEL_SUPABASE_KEY);

        try {

            const { data, error } = await supabaseAuth.auth.getSession();

            if (error || !data?.session) {
                console.warn("⚠️ Sem sessão — redirecionando para login.");
                window.location.href = "login.html";
                return;
            }

            const { data: perfil, error: erroPerfil } = await supabaseAuth
                .from("perfis")
                .select("ativo, role, nome")
                .eq("id", data.session.user.id)
                .single();

            if (erroPerfil || !perfil || !perfil.ativo) {
                console.warn("⚠️ Perfil inativo ou não encontrado.");
                await supabaseAuth.auth.signOut();
                window.location.href = "login.html";
                return;
            }

            window.usuarioLogado = {
                id: data.session.user.id,
                email: data.session.user.email,
                nome: perfil.nome,
                role: perfil.role
            };

            console.log("✅ Autenticado:", window.usuarioLogado.email);

        } catch (erro) {
            console.error("❌ Erro na verificação:", erro);
        }
    }

    verificarAcesso();

})();