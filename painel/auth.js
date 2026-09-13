// ============================================================
// AUTENTICAÇÃO DO PAINEL — Supabase Auth
// ============================================================

// ⚠️ MESMAS CHAVES DO PAINEL
const SUPABASE_URL = "https://ggdzzmekaxrovmuyvxyn.supabase.co";
const SUPABASE_KEY = "sb_publishable_EyZOeqOCjgq_9RjBCUfa8w_121a85zK";

const supabaseAuth = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// ============================================================
// ELEMENTOS DO LOGIN
// ============================================================

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const btnLogin = document.getElementById("btnLogin");
const erroBox = document.getElementById("erro");


// ============================================================
// HELPERS
// ============================================================

function mostrarErro(mensagem) {
    if (!erroBox) return;

    erroBox.textContent = mensagem;
    erroBox.classList.add("ativo");

    setTimeout(() => erroBox.classList.remove("ativo"), 5000);
}

function traduzirErro(erro) {
    const msg = (erro.message || "").toLowerCase();

    if (msg.includes("invalid login credentials")) {
        return "❌ E-mail ou senha incorretos.";
    }

    if (msg.includes("email not confirmed")) {
        return "⚠️ E-mail não confirmado. Fale com o administrador.";
    }

    if (msg.includes("too many requests")) {
        return "🕐 Muitas tentativas. Aguarde 1 minuto.";
    }

    if (msg.includes("user not found")) {
        return "❌ Usuário não encontrado.";
    }

    return "❌ Erro ao fazer login: " + (erro.message || "tente novamente.");
}


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

    // Se já estiver logado, redireciona direto
    supabaseAuth.auth.getSession().then(({ data }) => {
        if (data?.session) {
            window.location.href = "index.html";
        }
    });

    loginForm.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        const email = emailInput.value.trim();
        const senha = senhaInput.value;

        if (!email || !senha) {
            mostrarErro("Preencha e-mail e senha.");
            return;
        }

        // Estado de carregamento
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="spinner"></span>Entrando...';

        try {

            const { data, error } = await supabaseAuth.auth.signInWithPassword({
                email: email,
                password: senha
            });

            if (error) throw error;

            // Verifica se o usuário está ativo na tabela perfis
            const { data: perfil, error: erroPerfil } = await supabaseAuth
                .from("perfis")
                .select("ativo, role")
                .eq("id", data.user.id)
                .single();

            if (erroPerfil || !perfil) {
                await supabaseAuth.auth.signOut();
                throw new Error("Perfil não encontrado. Fale com o administrador.");
            }

            if (!perfil.ativo) {
                await supabaseAuth.auth.signOut();
                throw new Error("Sua conta está desativada.");
            }

            // Salva informações do perfil na sessão local
            try {
                localStorage.setItem("usuario", JSON.stringify({
                    email: data.user.email,
                    role: perfil.role
                }));
            } catch (e) {}

            // Redireciona para o painel
            window.location.href = "index.html";

        } catch (erro) {

            console.error("Erro no login:", erro);
            mostrarErro(traduzirErro(erro));

            btnLogin.disabled = false;
            btnLogin.innerHTML = "Entrar no Painel";

        }
    });
}


// ============================================================
// FUNÇÃO GLOBAL — para outros scripts usarem
// ============================================================

window.authPainel = {

    // Pega sessão atual
    async getSessao() {
        const { data } = await supabaseAuth.auth.getSession();
        return data?.session || null;
    },

    // Pega usuário
    async getUsuario() {
        const { data } = await supabaseAuth.auth.getUser();
        return data?.user || null;
    },

    // Logout
    async logout() {
        await supabaseAuth.auth.signOut();
        try {
            localStorage.removeItem("usuario");
        } catch (e) {}
        window.location.href = "login.html";
    }
};

console.log("🔐 Sistema de autenticação carregado.");