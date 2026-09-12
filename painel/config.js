// ============================================================
// MÓDULO CONFIGURAÇÕES DA EMPRESA
// ============================================================

const configForm = document.getElementById("configForm");
const cfgCancelar = document.getElementById("cfgCancelar");
const cfgPreview = document.getElementById("cfgPreview");

// Campos
const cfgNome = document.getElementById("cfgNome");
const cfgCnpj = document.getElementById("cfgCnpj");
const cfgIE = document.getElementById("cfgIE");
const cfgTelefone = document.getElementById("cfgTelefone");
const cfgWhatsapp = document.getElementById("cfgWhatsapp");
const cfgEmail = document.getElementById("cfgEmail");
const cfgSite = document.getElementById("cfgSite");
const cfgEndereco = document.getElementById("cfgEndereco");
const cfgBairro = document.getElementById("cfgBairro");
const cfgCep = document.getElementById("cfgCep");
const cfgCidade = document.getElementById("cfgCidade");
const cfgEstado = document.getElementById("cfgEstado");
const cfgSlogan = document.getElementById("cfgSlogan");
const cfgGarantia = document.getElementById("cfgGarantia");
const cfgTermos = document.getElementById("cfgTermos");

let configCarregada = false;


// ============================================================
// CARREGAR CONFIGURAÇÕES DO SUPABASE
// ============================================================

async function carregarConfiguracoes() {

    try {

        const { data, error } = await supabaseClient
            .from("configuracoes")
            .select("*");

        if (error) throw error;

        const mapa = {};
        (data || []).forEach(function (item) {
            mapa[item.chave] = item.valor || "";
        });

        // Preenche campos
        if (cfgNome) cfgNome.value = mapa.empresa_nome || "";
        if (cfgCnpj) cfgCnpj.value = mapa.empresa_cnpj || "";
        if (cfgIE) cfgIE.value = mapa.empresa_ie || "";
        if (cfgTelefone) cfgTelefone.value = mapa.empresa_telefone || "";
        if (cfgWhatsapp) cfgWhatsapp.value = mapa.empresa_whatsapp || "";
        if (cfgEmail) cfgEmail.value = mapa.empresa_email || "";
        if (cfgSite) cfgSite.value = mapa.empresa_site || "";
        if (cfgEndereco) cfgEndereco.value = mapa.empresa_endereco || "";
        if (cfgBairro) cfgBairro.value = mapa.empresa_bairro || "";
        if (cfgCep) cfgCep.value = mapa.empresa_cep || "";
        if (cfgCidade) cfgCidade.value = mapa.empresa_cidade || "";
        if (cfgEstado) cfgEstado.value = mapa.empresa_estado || "";
        if (cfgSlogan) cfgSlogan.value = mapa.empresa_slogan || "";
        if (cfgGarantia) cfgGarantia.value = mapa.empresa_garantia || "";
        if (cfgTermos) cfgTermos.value = mapa.empresa_termos || "";

        configCarregada = true;

        atualizarPreview();

        // Atualiza o bot do chat com o nome da empresa
        if (typeof botConfig !== "undefined" && mapa.empresa_nome) {
            botConfig.nome = mapa.empresa_nome;
        }

    } catch (erro) {
        console.error("Erro ao carregar configurações:", erro);
    }
}


// ============================================================
// SALVAR CONFIGURAÇÕES
// ============================================================

if (configForm) {

    configForm.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        const botaoSalvar = configForm.querySelector('button[type="submit"]');

        const nome = cfgNome.value.trim();

        if (!nome) {
            alert("Informe o nome da assistência.");
            return;
        }

        // Monta lista de {chave, valor}
        const itens = [
            { chave: "empresa_nome", valor: nome },
            { chave: "empresa_cnpj", valor: cfgCnpj.value.trim() },
            { chave: "empresa_ie", valor: cfgIE.value.trim() },
            { chave: "empresa_telefone", valor: cfgTelefone.value.trim() },
            { chave: "empresa_whatsapp", valor: cfgWhatsapp.value.trim() },
            { chave: "empresa_email", valor: cfgEmail.value.trim() },
            { chave: "empresa_site", valor: cfgSite.value.trim() },
            { chave: "empresa_endereco", valor: cfgEndereco.value.trim() },
            { chave: "empresa_bairro", valor: cfgBairro.value.trim() },
            { chave: "empresa_cep", valor: cfgCep.value.trim() },
            { chave: "empresa_cidade", valor: cfgCidade.value.trim() },
            { chave: "empresa_estado", valor: cfgEstado.value.trim() },
            { chave: "empresa_slogan", valor: cfgSlogan.value.trim() },
            { chave: "empresa_garantia", valor: cfgGarantia.value.trim() },
            { chave: "empresa_termos", valor: cfgTermos.value.trim() }
        ];

        try {

            if (botaoSalvar) {
                botaoSalvar.disabled = true;
                botaoSalvar.textContent = "Salvando...";
            }

            // Upsert (insere ou atualiza)
            for (const item of itens) {
                const { error } = await supabaseClient
                    .from("configuracoes")
                    .upsert(
                        {
                            chave: item.chave,
                            valor: item.valor,
                            atualizado_em: new Date().toISOString()
                        },
                        { onConflict: "chave" }
                    );

                if (error) {
                    console.error("Erro ao salvar", item.chave, error);
                }
            }

            alert("Configurações salvas com sucesso! ✅");

            atualizarPreview();

            // Atualiza o bot também
            if (typeof botConfig !== "undefined") {
                botConfig.nome = nome;
                botConfig.horario = botConfig.horario || "";
                if (typeof botTitulo !== "undefined" && botTitulo) {
                    botTitulo.textContent = nome;
                }
            }

        } catch (erro) {

            console.error("Erro ao salvar configurações:", erro);
            alert("Erro ao salvar.\n\n" + (erro.message || ""));

        } finally {

            if (botaoSalvar) {
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = "💾 Salvar configurações";
            }
        }
    });
}


// ============================================================
// RESTAURAR PADRÃO
// ============================================================

if (cfgCancelar) {
    cfgCancelar.addEventListener("click", function () {

        if (!confirm("Restaurar os campos para o padrão? Os dados não salvos serão perdidos.")) {
            return;
        }

        if (cfgNome) cfgNome.value = "Reparo de Celular";
        if (cfgCnpj) cfgCnpj.value = "";
        if (cfgIE) cfgIE.value = "";
        if (cfgTelefone) cfgTelefone.value = "";
        if (cfgWhatsapp) cfgWhatsapp.value = "";
        if (cfgEmail) cfgEmail.value = "";
        if (cfgSite) cfgSite.value = "";
        if (cfgEndereco) cfgEndereco.value = "";
        if (cfgBairro) cfgBairro.value = "";
        if (cfgCep) cfgCep.value = "";
        if (cfgCidade) cfgCidade.value = "";
        if (cfgEstado) cfgEstado.value = "";
        if (cfgSlogan) cfgSlogan.value = "";
        if (cfgGarantia) cfgGarantia.value = "Garantia de 90 dias sobre os serviços executados.";
        if (cfgTermos) cfgTermos.value = "O cliente declara estar ciente de que o aparelho foi entregue para análise técnica. A assistência não se responsabiliza por dados não salvos.";

        atualizarPreview();
    });
}


// ============================================================
// PRÉ-VISUALIZAÇÃO
// ============================================================

function atualizarPreview() {

    if (!cfgPreview) return;

    const nome = cfgNome?.value.trim() || "Nome da Assistência";
    const cnpj = cfgCnpj?.value.trim();
    const telefone = cfgTelefone?.value.trim();
    const whatsapp = cfgWhatsapp?.value.trim();
    const email = cfgEmail?.value.trim();
    const site = cfgSite?.value.trim();

    // Endereço completo
    const partesEnd = [
        cfgEndereco?.value.trim(),
        cfgBairro?.value.trim(),
        (cfgCidade?.value.trim() || "") + (cfgEstado?.value.trim() ? " - " + cfgEstado.value.trim() : ""),
        cfgCep?.value.trim()
    ].filter(Boolean);

    const enderecoCompleto = partesEnd.join(", ");

    const slogan = cfgSlogan?.value.trim() || "";
    const garantia = cfgGarantia?.value.trim() || "";
    const termos = cfgTermos?.value.trim() || "";

    cfgPreview.innerHTML = `
        <div class="preview-header">
            <h2>${escaparHTML(nome)}</h2>
            ${cnpj ? `<p>CNPJ: ${escaparHTML(cnpj)}</p>` : ""}
            ${slogan ? `<div class="preview-slogan">"${escaparHTML(slogan)}"</div>` : ""}
        </div>

        <div class="preview-info">
            ${enderecoCompleto ? `<div>📍 ${escaparHTML(enderecoCompleto)}</div>` : ""}
            ${telefone ? `<div>📞 ${escaparHTML(telefone)}</div>` : ""}
            ${whatsapp ? `<div>💬 ${escaparHTML(whatsapp)}</div>` : ""}
            ${email ? `<div>✉️ ${escaparHTML(email)}</div>` : ""}
            ${site ? `<div>🌐 ${escaparHTML(site)}</div>` : ""}
        </div>

        ${garantia ? `<div class="preview-termos"><strong>Garantia:</strong> ${escaparHTML(garantia)}</div>` : ""}
        ${termos ? `<div class="preview-termos">${escaparHTML(termos)}</div>` : ""}
    `;
}

// Atualiza o preview conforme digita
[cfgNome, cfgCnpj, cfgIE, cfgTelefone, cfgWhatsapp, cfgEmail, cfgSite,
 cfgEndereco, cfgBairro, cfgCep, cfgCidade, cfgEstado, cfgSlogan,
 cfgGarantia, cfgTermos].forEach(function (campo) {
    if (campo) {
        campo.addEventListener("input", atualizarPreview);
    }
});


// ============================================================
// FIM DO MÓDULO CONFIGURAÇÕES
// ============================================================