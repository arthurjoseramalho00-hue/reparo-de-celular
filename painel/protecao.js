// ============================================================
// PROTEÇÃO DO PAINEL — Supabase Auth + Botão Sair
// ============================================================

const SUPABASE_URL = "https://ggdzzmekaxrovmuyvxyn.supabase.co";
const SUPABASE_KEY = "sb_publishable_EyZOeqOCjgq_9RjBCUfa8w_121a85zK";


// ============================================================
// 1. BOTÃO DE LOGOUT (independente)
// ============================================================

function criarBotaoLogout() {

    if (document.getElementById("btnLogoutFlutuante")) return;

    const botao = document.createElement("button");
    botao.id = "btnLogoutFlutuante";
    botao.type = "button";
    botao.innerHTML = "🚪 Sair";

    botao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(239, 68, 68, .15);
        border: 1px solid rgba(239, 68, 68, .4);
        color: #fca5a5;
        padding: 10px 18px;
        border-radius: 25px;
        font-family: 'Inter', Arial, sans-serif;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        z-index: 99999;
        transition: all .25s;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, .3);
    `;

    botao.addEventListener("mouseenter", function () {
        this.style.background = "rgba(239, 68, 68, .35)";
        this.style.color = "#fff";
    });

    botao.addEventListener("mouseleave", function () {
        this.style.background = "rgba(239, 68, 68, .15)";
        this.style.color = "#fca5a5";
    });

    botao.addEventListener("click", fazerLogout);

    document.body.appendChild(botao);
}

if (document.body) {
    criarBotaoLogout();
} else {
    document.addEventListener("DOMContentLoaded", criarBotaoLogout);
}


// ============================================================
// 2. FUNÇÃO DE LOGOUT
// ============================================================

async function fazerLogout() {

    if (!confirm("Deseja sair do painel?")) return;

    try {
        const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        await sb.auth.signOut();
        try { localStorage.removeItem("usuario"); } catch (e) {}
    } catch (e) {
        console.error("Erro no logout:", e);
    }

    window.location.href = "login.html";
}


// ============================================================
// 3. VERIFICA AUTENTICAÇÃO
// ============================================================

async function verificarAcesso() {

    // Aguarda o Supabase carregar (até 5 segundos)
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

    const supabaseAuth = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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