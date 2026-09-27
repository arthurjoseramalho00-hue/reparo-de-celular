// ============================================================
// BOT HÍBRIDO — Palavras-chave + Consulta ao Supabase
// ============================================================

let botIniciado = false;
let botConfig = {
    nome: "Reparo Tech",
    boasVindas: "Olá! 👋 Bem-vindo à Reparo Tech. Trabalhamos com celulares, computadores e impressoras. Como posso ajudar?",
    fallback: "Desculpe, não entendi. 🤔 Você pode perguntar sobre: horário, endereço, orçamento, prazo ou garantia.",
    horario: "Segunda a Sexta, das 9h às 18h",
    endereco: "Custódia - PE",
    whatsapp: "(19) 98282-6005"
};

const CHAVE_STORAGE = "bot_config_v1";


// ============================================================
// ELEMENTOS
// ============================================================

const chatMensagens = document.getElementById("chatMensagens");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const botTitulo = document.getElementById("botTitulo");

const botNome = document.getElementById("botNome");
const botBoasVindas = document.getElementById("botBoasVindas");
const botFallback = document.getElementById("botFallback");
const botHorario = document.getElementById("botHorario");
const botEndereco = document.getElementById("botEndereco");
const botWhatsapp = document.getElementById("botWhatsapp");
const botSalvarConfig = document.getElementById("botSalvarConfig");


// ============================================================
// CONFIGURAÇÕES
// ============================================================

function carregarConfigBot() {

    try {
        const salvo = localStorage.getItem(CHAVE_STORAGE);
        if (salvo) {
            botConfig = { ...botConfig, ...JSON.parse(salvo) };
        }
    } catch (e) {
        console.warn("Não foi possível carregar config do bot:", e);
    }

    if (botNome) botNome.value = botConfig.nome;
    if (botBoasVindas) botBoasVindas.value = botConfig.boasVindas;
    if (botFallback) botFallback.value = botConfig.fallback;
    if (botHorario) botHorario.value = botConfig.horario;
    if (botEndereco) botEndereco.value = botConfig.endereco;
    if (botWhatsapp) botWhatsapp.value = botConfig.whatsapp;

    if (botTitulo) botTitulo.textContent = botConfig.nome || "Assistente Virtual";
}

function salvarConfigBot() {

    botConfig = {
        nome: (botNome?.value || "").trim() || "Reparo Tech",
        boasVindas: (botBoasVindas?.value || "").trim() || botConfig.boasVindas,
        fallback: (botFallback?.value || "").trim() || botConfig.fallback,
        horario: (botHorario?.value || "").trim(),
        endereco: (botEndereco?.value || "").trim(),
        whatsapp: (botWhatsapp?.value || "").trim()
    };

    try {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(botConfig));
    } catch (e) {
        console.warn("Não foi possível salvar config:", e);
    }

    if (botTitulo) botTitulo.textContent = botConfig.nome;

    alert("Configurações salvas com sucesso! ✅");
}

if (botSalvarConfig) botSalvarConfig.addEventListener("click", salvarConfigBot);


// ============================================================
// MENSAGENS
// ============================================================

function adicionarMensagem(texto, tipo) {

    if (!chatMensagens) return;

    const msg = document.createElement("div");
    msg.className = `msg msg-${tipo}`;
    msg.innerHTML = formatarMensagem(texto);

    chatMensagens.appendChild(msg);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
}

function formatarMensagem(texto) {

    let html = String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    html = html.replace(/\n/g, "<br>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    return html;
}

function mostrarDigitando() {

    if (!chatMensagens) return null;

    const div = document.createElement("div");
    div.className = "chat-digitando";
    div.id = "digitandoTemp";
    div.innerHTML = "<span></span><span></span><span></span>";

    chatMensagens.appendChild(div);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;

    return div;
}

function removerDigitando() {
    const el = document.getElementById("digitandoTemp");
    if (el) el.remove();
}


// ============================================================
// UTILITÁRIOS
// ============================================================

function normalizar(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function contemAlguma(texto, palavras) {
    return palavras.some(p => texto.includes(p));
}


// ============================================================
// RESPOSTAS
// ============================================================

function responderSaudacao() {
    const respostas = [
        `Olá! 👋 Sou o assistente da ${botConfig.nome}. Como posso ajudar?`,
        `Oi! 😊 Em que posso ajudar?`,
        `Olá! Bem-vindo(a) à ${botConfig.nome}. O que você precisa?`
    ];
    return respostas[Math.floor(Math.random() * respostas.length)];
}

function responderHorario() {
    return `🕐 Nosso horário de funcionamento é:\n**${botConfig.horario}**\n\nQuer que eu verifique algo mais?`;
}

function responderEndereco() {
    return `📍 Estamos localizados em:\n**${botConfig.endereco}**\n\nPrecisa de mais alguma informação?`;
}

function responderWhatsapp() {
    return `💬 Nosso WhatsApp é: **${botConfig.whatsapp}**\n\nFique à vontade para nos chamar!`;
}

function responderGarantia() {
    return `🛡️ **Sim, oferecemos garantia!**\n\nA garantia cobre:\n• Defeitos do serviço realizado\n• Peças trocadas\n\nO prazo varia conforme o tipo de serviço. Para detalhes específicos, entre em contato pelo WhatsApp: **${botConfig.whatsapp}**`;
}

function responderPrazo() {
    return `⏱️ O prazo varia conforme o serviço:\n\n• **Até 2 horas** — Serviços simples\n• **No mesmo dia** — Reparos comuns\n• **1 a 3 dias** — Serviços mais complexos\n\nPara saber o prazo exato do seu caso, me diga o **modelo do equipamento** e o **serviço desejado**. 🔧`;
}

function responderPreco() {
    return `💰 Para eu te passar o preço exato, me diga:\n\n• **Marca e modelo** do equipamento\n• **Qual serviço** você precisa\n\nExemplos:\n_"Quanto custa trocar a tela de um Galaxy A03?"_\n_"Quanto custa formatar um notebook Dell?"_\n_"Quanto custa recarga de cartucho Epson?"_`;
}

function responderOrcamento() {
    return `📋 Para fazer um orçamento, é só me passar:\n\n• **Marca e modelo** do equipamento\n• **O que está acontecendo** (tela quebrada, não liga, não puxa papel, etc.)\n\nOu se preferir, fale direto com nossa equipe:\n💬 **${botConfig.whatsapp}**`;
}

function responderObrigado() {
    const respostas = [
        "Por nada! 😊 Estou aqui se precisar.",
        "Fico feliz em ajudar! 🙌",
        "Disponha! Qualquer coisa é só chamar. 👋"
    ];
    return respostas[Math.floor(Math.random() * respostas.length)];
}

function responderDespedida() {
    return `Até logo! 👋 Se precisar, é só voltar. Você também pode nos chamar no WhatsApp: **${botConfig.whatsapp}**`;
}


// ============================================================
// CONSULTA AO BANCO
// ============================================================

async function buscarServicoNoBanco(mensagemOriginal) {

    const mensagem = normalizar(mensagemOriginal);

    try {

        const { data: servicos, error } = await supabaseClient.from("servicos").select("*");
        if (error) throw error;
        if (!servicos || servicos.length === 0) return null;

        const palavrasServico = {
            // Celular
            "tela": ["tela", "display", "ecra", "vidro"],
            "bateria": ["bateria", "carrega", "carregamento"],
            "placa": ["placa", "curto", "queimou"],
            "conector": ["conector", "carga", "carregador", "usb"],
            "camera": ["camera", "câmera", "foto"],
            "alto-falante": ["alto", "falante", "som", "audio", "áudio"],
            "microfone": ["microfone", "mic", "falar"],
            "botao": ["botao", "botão", "power", "volume"],
            // Computador
            "formatacao": ["formata", "formatacao", "reset", "sistema", "windows", "lento", "travando", "virus", "vírus"],
            "upgrade ssd": ["ssd", "hd", "disco", "armazenamento", "upgrade"],
            "memoria ram": ["ram", "memoria", "memória"],
            "teclado": ["teclado", "tecla"],
            "limpeza": ["limpeza", "limpar", "poeira", "superaquec", "esquentando"],
            "montagem": ["montagem", "montar", "pc gamer", "setup"],
            // Impressora
            "recarga cartucho": ["cartucho", "recarga", "tinta", "jato"],
            "recarga toner": ["toner", "laser"],
            "cabeca impressao": ["cabeca", "cabeça", "entupid", "nao imprime", "não imprime"],
            "tracao papel": ["papel", "atolando", "puxando", "tracao", "tração"],
            "manutencao impressora": ["manutencao", "manutenção", "impressora"]
        };

        let tipoServicoDetectado = null;
        for (const [tipo, chaves] of Object.entries(palavrasServico)) {
            if (contemAlguma(mensagem, chaves)) {
                tipoServicoDetectado = tipo;
                break;
            }
        }

        const marcas = [
            "samsung", "apple", "iphone", "motorola", "xiaomi", "redmi", "realme", "lg", "nokia", "asus",
            "dell", "hp", "lenovo", "acer", "positivo", "macbook",
            "epson", "brother", "canon"
        ];

        let marcaDetectada = null;
        for (const m of marcas) {
            if (mensagem.includes(m)) { marcaDetectada = m; break; }
        }

        const modelosServicos = servicos.map(s => normalizar(s.modelo || ""));
        let modeloDetectado = null;
        for (const modelo of modelosServicos) {
            const partes = modelo.split(/\s+/);
            for (const parte of partes) {
                if (parte.length >= 2 && mensagem.includes(parte)) {
                    modeloDetectado = modelo;
                    break;
                }
            }
            if (modeloDetectado) break;
        }

        let encontrados = servicos.filter(function (s) {
            const marcaOk = !marcaDetectada || normalizar(s.marca || "").includes(marcaDetectada);
            const modeloOk = !modeloDetectado || normalizar(s.modelo || "").includes(modeloDetectado);
            const tipoOk = !tipoServicoDetectado || normalizar(s.tipo_servico || "").includes(tipoServicoDetectado);
            return marcaOk && modeloOk && tipoOk;
        });

        if (encontrados.length === 0 && tipoServicoDetectado) {
            encontrados = servicos.filter(s => normalizar(s.tipo_servico || "").includes(tipoServicoDetectado));
        }

        if (encontrados.length === 0 && marcaDetectada) {
            encontrados = servicos.filter(s => normalizar(s.marca || "").includes(marcaDetectada));
        }

        if (encontrados.length === 0) return null;

        encontrados = encontrados.slice(0, 5);

        const idsEncontrados = encontrados.map(s => s.id);

        const { data: precos } = await supabaseClient.from("precos").select("*").in("servico_id", idsEncontrados);

        const mapaPrecos = {};
        (precos || []).forEach(p => { mapaPrecos[p.servico_id] = p; });

        let resposta = encontrados.length === 1 ? "🔍 Encontrei este serviço:\n\n" : "🔍 Encontrei estes serviços:\n\n";

        encontrados.forEach(function (s) {

            const preco = mapaPrecos[s.id];
            const valor = preco
                ? Number(preco.preco_final || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : (s.preco && Number(s.preco) > 0
                    ? Number(s.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                    : "Sob consulta");

            const icone = s.categoria === "computador" ? "💻" : s.categoria === "impressora" ? "🖨️" : "📱";

            resposta += `${icone} **${s.marca} ${s.modelo}**\n`;
            resposta += `🔧 ${s.tipo_servico}\n`;
            resposta += `💰 ${valor}\n`;
            resposta += `⏱️ ${s.prazo || "A definir"}\n`;

            if (s.status && normalizar(s.status) !== "ativo") resposta += `⚠️ _Indisponível no momento_\n`;
            resposta += "\n";
        });

        resposta += `Quer agendar? Chame no WhatsApp: **${botConfig.whatsapp}** 💬`;

        return resposta;

    } catch (erro) {
        console.error("Erro na busca do banco:", erro);
        return null;
    }
}


// ============================================================
// PROCESSAR MENSAGEM
// ============================================================

async function processarMensagem(textoOriginal) {

    const texto = normalizar(textoOriginal);
    if (!texto) return botConfig.fallback;

    if (contemAlguma(texto, ["oi", "ola", "eae", "e ai", "bom dia", "boa tarde", "boa noite", "hey", "opa"])) return responderSaudacao();
    if (contemAlguma(texto, ["obrigado", "obrigada", "valeu", "vlw", "thanks", "agradeco"])) return responderObrigado();
    if (contemAlguma(texto, ["tchau", "ate logo", "ate mais", "flw", "falou", "bye"])) return responderDespedida();
    if (contemAlguma(texto, ["horario", "aberto", "fecha", "abre", "funcionamento", "que horas"])) return responderHorario();
    if (contemAlguma(texto, ["endereco", "onde fica", "onde voces", "localizacao", "como chegar", "loja"])) return responderEndereco();
    if (contemAlguma(texto, ["whatsapp", "whats", "telefone", "contato", "numero", "zap"])) return responderWhatsapp();
    if (contemAlguma(texto, ["garantia", "garante", "defeito"])) return responderGarantia();
    if (contemAlguma(texto, ["prazo", "demora", "quanto tempo", "rapido"])) return responderPrazo();

    const palavrasDeBusca = [
        "tela", "bateria", "placa", "conector", "camera",
        "falante", "microfone", "botao",
        "samsung", "apple", "iphone", "motorola", "xiaomi",
        "redmi", "realme", "dell", "hp", "lenovo", "acer",
        "epson", "brother", "canon", "positivo", "asus",
        "notebook", "computador", "pc", "desktop", "ssd", "hd",
        "ram", "memoria", "teclado", "formatar", "formatacao",
        "windows", "virus", "limpeza",
        "impressora", "cartucho", "toner", "recarga", "tinta",
        "papel", "atolando", "cabeça",
        "quanto custa", "quanto fica", "preco", "orçamento",
        "orcamento", "valor", "quanto"
    ];

    if (contemAlguma(texto, palavrasDeBusca)) {
        const resultadoBanco = await buscarServicoNoBanco(textoOriginal);
        if (resultadoBanco) return resultadoBanco;
    }

    if (contemAlguma(texto, ["preco", "valor", "quanto custa", "quanto fica"])) return responderPreco();
    if (contemAlguma(texto, ["orcamento", "orcamento", "cotacao", "cotacao"])) return responderOrcamento();

    return botConfig.fallback;
}


// ============================================================
// ENVIAR MENSAGEM
// ============================================================

async function enviarMensagemUsuario(texto) {

    if (!texto || !texto.trim()) return;

    adicionarMensagem(texto, "user");
    if (chatInput) chatInput.value = "";

    mostrarDigitando();
    await new Promise(resolve => setTimeout(resolve, 500));

    let resposta;

    try {
        resposta = await processarMensagem(texto);
    } catch (e) {
        console.error("Erro no bot:", e);
        resposta = "Ops! Tive um problema técnico. Tente novamente em instantes. 😅";
    }

    removerDigitando();
    adicionarMensagem(resposta, "bot");
}


// ============================================================
// EVENTOS DO CHAT
// ============================================================

if (chatForm) {
    chatForm.addEventListener("submit", function (e) {
        e.preventDefault();
        enviarMensagemUsuario(chatInput.value);
    });
}

document.querySelectorAll("[data-sugestao]").forEach(function (botao) {
    botao.addEventListener("click", function () {
        enviarMensagemUsuario(botao.dataset.sugestao);
    });
});


// ============================================================
// INICIALIZAR
// ============================================================

function iniciarBot() {

    carregarConfigBot();

    if (botIniciado) return;
    botIniciado = true;

    if (chatMensagens) chatMensagens.innerHTML = "";

    setTimeout(function () {
        adicionarMensagem(botConfig.boasVindas, "bot");
    }, 300);
}

console.log("🤖 Módulo Bot carregado.");