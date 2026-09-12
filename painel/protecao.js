// ============================================================
// PROTEÇÃO DO PAINEL — senha de acesso
// ============================================================

(function protegerPainel() {

    // ⚠️ TROQUE A SENHA AQUI POR UMA FORTE
    const SENHA_CORRETA = "Mandala1";

    const CHAVE = "painel_autorizado";
    const VALIDADE_HORAS = 24;

    // Verifica se já está autenticado
    try {
        const salvo = localStorage.getItem(CHAVE);
        if (salvo) {
            const dados = JSON.parse(salvo);
            if (dados.expira > Date.now()) {
                return; // liberado
            }
        }
    } catch (e) {}

    // Pede a senha
    const tentativa = prompt("🔒 Acesso restrito\n\nDigite a senha do painel:");

    if (tentativa === SENHA_CORRETA) {

        const expira = Date.now() + (VALIDADE_HORAS * 60 * 60 * 1000);

        try {
            localStorage.setItem(CHAVE, JSON.stringify({ expira }));
        } catch (e) {}

        console.log("✅ Painel liberado por " + VALIDADE_HORAS + "h.");

    } else {

        document.documentElement.innerHTML = `
            <head>
                <title>Acesso negado</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        min-height: 100vh;
                        display: grid;
                        place-items: center;
                        background: #050a12;
                        color: #f4f8ff;
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                    }
                    h1 { font-size: 32px; margin-bottom: 12px; }
                    p { color: #8ba0bf; margin-bottom: 24px; font-size: 15px; }
                    button {
                        background: #198cff;
                        color: #fff;
                        border: 0;
                        padding: 14px 26px;
                        border-radius: 10px;
                        font-weight: 700;
                        font-size: 15px;
                        cursor: pointer;
                        transition: .2s;
                    }
                    button:hover { background: #0a6fe0; }
                </style>
            </head>
            <body>
                <div>
                    <h1>🔒 Acesso negado</h1>
                    <p>Este painel é de uso interno.</p>
                    <button onclick="location.reload()">Tentar novamente</button>
                </div>
            </body>
        `;
    }
})();