// ============================================================
// VERIFICAÇÃO DE SESSÃO — protege o painel
// ============================================================

(async function verificarAcesso() {

    // Chaves do Supabase
    const SUPABASE_URL = "https://ggdzzmekaxrovmuyvxyn.supabase.co";
    const SUPABASE_KEY = "sb_publishable_EyZOeqOCjgq_9RjBCUfa8w_121a85zK";

    const supabaseTemp = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    try {

        // Verifica se há sessão ativa
        const { data, error } = await supabaseTemp.auth.getSession();

        if (error || !data?.session) {
            // Sem sessão → manda para login
            window.location.href = "login.html";
            return;
        }

        // Verifica se o usuário está ativo
        const { data: perfil, error: erroPerfil } = await supabaseTemp
            .from("perfis")
            .select("ativo, role, nome")
            .eq("id", data.session.user.id)
            .single();

        if (erroPerfil || !perfil || !perfil.ativo) {
            await supabaseTemp.auth.signOut();
            window.location.href = "login.html";
            return;
        }

        // Guarda info do usuário para uso no painel
        window.usuarioLogado = {
            id: data.session.user.id,
            email: data.session.user.email,
            nome: perfil.nome,
            role: perfil.role
        };

        console.log("✅ Usuário autenticado:", window.usuarioLogado.email);

    } catch (erro) {
        console.error("Erro na verificação:", erro);
        window.location.href = "login.html";
    }

})();

// ============================================================
// FUNÇÃO DE LOGOUT (global)
// ============================================================

window.fazerLogout = async function () {

    const confirmar = confirm("Deseja sair do painel?");
    if (!confirmar) return;

    try {
        const SUPABASE_URL = "https://ggdzzmekaxrovmuyvxyn.supabase.co";
        const SUPABASE_KEY = "sb_publishable_EyZOeqOCjgq_9RjBCUfa8w_121a85zK";

        const supabaseTemp = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        await supabaseTemp.auth.signOut();

        try {
            localStorage.removeItem("usuario");
        } catch (e) {}

    } catch (e) {
        console.error("Erro no logout:", e);
    }

    window.location.href = "login.html";
};