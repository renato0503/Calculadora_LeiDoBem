// Aguarda o carregamento completo da página para adicionar os eventos
document.addEventListener("DOMContentLoaded", function() {
    const path = window.location.pathname.split("/").pop();

    if (path === 'index.html' || path === '' || path === 'Calculadora_LeiDoBem' || !path) {
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
    } else if (path === 'dashboard.html') {
        const createUserForm = document.getElementById('create-user-form');
        if (createUserForm) createUserForm.addEventListener('submit', handleCreateUser);
        populateUserList();
    } else if (path === 'calculadora.html') {
        const calculadoraForm = document.getElementById('calculadora-form');
        if (calculadoraForm) calculadoraForm.addEventListener('submit', handleCalculadora);
    }
});


// --- DADOS ---
function getInitialUsers() {
    let users = localStorage.getItem('users');
    if (!users) {
        users = [{ username: 'admin', password: 'admin' }];
        localStorage.setItem('users', JSON.stringify(users));
    }
    return JSON.parse(users);
}

// --- FUNÇÕES DE LOGIN E AUTENTICAÇÃO ---
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const users = getInitialUsers();
    const foundUser = users.find(user => user.username === username && user.password === password);
    if (foundUser) {
        localStorage.setItem('loggedInUser', username);
        if (username === 'admin') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'calculadora.html';
        }
    } else {
        alert('Usuário ou senha incorretos!');
    }
}

function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
}

function verificarLogin() {
    if (!localStorage.getItem('loggedInUser')) {
        window.location.href = 'index.html';
    }
}

function verificarLoginAdmin() {
    if (localStorage.getItem('loggedInUser') !== 'admin') {
        alert('Acesso negado!');
        window.location.href = 'index.html';
    }
}

// --- FUNÇÕES DO DASHBOARD (ADMIN) ---
function handleCreateUser(event) {
    event.preventDefault();
    const newUsername = document.getElementById('new-username').value;
    const newPassword = document.getElementById('new-password').value;
    let users = getInitialUsers();
    if (users.some(user => user.username === newUsername)) {
        alert('Este nome de usuário já existe!');
        return;
    }
    users.push({ username: newUsername, password: newPassword });
    localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('create-user-form').reset();
    populateUserList();
    alert('Usuário criado com sucesso!');
}

function populateUserList() {
    const userListElement = document.getElementById('lista-usuarios');
    if (!userListElement) return;
    const users = getInitialUsers();
    userListElement.innerHTML = '';
    users.forEach(user => {
        if (user.username !== 'admin') {
            const li = document.createElement('li');
            li.textContent = user.username;
            userListElement.appendChild(li);
        }
    });
}

// --- FUNÇÕES DA CALCULADORA E RELATÓRIO COM GROQ API ---
async function handleCalculadora(event) {
    event.preventDefault();

    const GROQ_API_KEY = prompt("Por segurança, por favor insira sua chave de API da Groq para gerar o diagnóstico:");
    if (!GROQ_API_KEY) {
        alert("A chave de API é um requisito para a análise.");
        return;
    }

    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('btn-gerar-relatorio').disabled = true;

    // Função auxiliar para pegar valor de radio button
    const getRadioValue = (name) => {
        const radio = document.querySelector(`input[name="${name}"]:checked`);
        return radio ? radio.value : 'nao';
    };

    const dados = {
        // Empresa
        nomeEmpresa: document.getElementById('nome_empresa').value,
        cnpj: document.getElementById('cnpj').value,
        setor: document.getElementById('setor_atuacao').value,
        // Requisitos
        lucroReal: getRadioValue('lucro-real'),
        regularidadeFiscal: getRadioValue('regularidade-fiscal'),
        lucroTributavel: getRadioValue('lucro-tributavel'),
        // Projeto
        tituloProjeto: document.getElementById('titulo_projeto').value,
        objetivo: document.getElementById('objetivo_principal').value,
        desafio: document.getElementById('desafio_tecnologico').value,
        resultados: document.getElementById('resultados_esperados').value,
        // Financeiro
        // AQUI ESTÁ A CORREÇÃO: 'dispêndios-pd' virou 'dispendios-pd'
        dispendiosPD: parseFloat(document.getElementById('dispendios-pd').value) || 0
    };

    let incentivo = 0;
    const isElegivel = dados.lucroReal === 'sim' && dados.regularidadeFiscal === 'sim' && dados.lucroTributavel === 'sim';
    
    if (isElegivel && dados.dispendiosPD > 0) {
        const baseIncentivo = dados.dispendiosPD * 0.60; 
        incentivo = baseIncentivo * 0.34;
    }
    
    const promptText = `
        Você é um consultor sênior, especialista na Lei do Bem (Lei nº 11.196/2005) do Brasil. Sua tarefa é gerar um relatório de diagnóstico técnico, claro, profissional e bem estruturado para a empresa cliente, com base nos dados fornecidos.

        **DADOS DA EMPRESA E PROJETO:**
        - **Empresa:** ${dados.nomeEmpresa} (CNPJ: ${dados.cnpj})
        - **Setor:** ${dados.setor}
        - **Está no Lucro Real?** ${dados.lucroReal.toUpperCase()}
        - **Possui Regularidade Fiscal?** ${dados.regularidadeFiscal.toUpperCase()}
        - **Apurou Lucro Tributável?** ${dados.lucroTributavel.toUpperCase()}
        - **Título do Projeto:** ${dados.tituloProjeto}
        - **Objetivo do Projeto:** ${dados.objetivo}
        - **Desafio e Incerteza Tecnológica:** ${dados.desafio}
        - **Resultados Esperados:** ${dados.resultados}
        - **Valor dos Dispêndios com P&D:** ${dados.dispendiosPD.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}

        **ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:**
        Gere uma resposta formatada exatamente como abaixo. Use **negrito** para todos os títulos de seção. Use parágrafos curtos e linguagem clara.

        ---
        
        **Diagnóstico de Aderência à Lei do Bem**

        **Para:** ${dados.nomeEmpresa}
        **Data do Diagnóstico:** ${new Date().toLocaleDateString('pt-BR')}

        **1. Análise de Elegibilidade**
        (Regra: Para ser elegível, a empresa precisa atender aos 3 requisitos: Lucro Real, Regularidade Fiscal e Lucro Tributável. Avalie os dados. Se **isElegivel** for verdadeiro, que é o caso se os 3 requisitos forem 'SIM', afirme que a empresa CUMPRIU os requisitos formais de enquadramento. Se algum for 'NÃO', afirme que a empresa NÃO É ELEGÍVEL e explique de forma clara qual requisito não foi atendido e por que isso impede o usufruto do benefício.)

        **2. Análise do Projeto (${dados.tituloProjeto})**
        (Com base na descrição do desafio e da incerteza tecnológica, avalie se o projeto tem características de inovação tecnológica para a Lei do Bem. Destaque os pontos positivos da descrição que evidenciam o caráter inovador.)

        **3. Estimativa do Benefício Fiscal**
        (Regra: O cálculo só se aplica se a empresa for elegível. Se for, apresente o valor do benefício fiscal, que é de aproximadamente **${incentivo.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}**. Explique que este valor representa uma economia no IRPJ e na CSLL. Se a empresa não for elegível, informe que o cálculo não se aplica e reforce o motivo.)

        **4. Checklist de Próximos Passos e Recomendações**
        (Crie uma lista numerada de ações práticas que a empresa deve seguir para garantir a segurança e o compliance do benefício.)
        1. **Controle Contábil:** ...
        2. **Documentação Técnica:** ...
        3. **Registro de Horas:** ...
        4. **Propriedade Intelectual:** ...
        5. **Obrigações Acessórias (FORMP&D e DIRBI):** ...

        **5. Conclusão Consultiva**
        (Finalize com um parágrafo encorajador, reforçando que a Lei do Bem é um instrumento estratégico e que, seguindo as recomendações, a empresa estará bem posicionada para aproveitar os benefícios.)
    `;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}`},
            body: JSON.stringify({ model: "llama3-8b-8192", messages: [{ "role": "user", "content": promptText }]})
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: { message: "Erro desconhecido." } }));
            throw new Error(errorBody.error.message);
        }

        const data = await response.json();
        const relatorioGerado = data.choices[0].message.content;
        localStorage.setItem('valorIncentivo', incentivo.toFixed(2));
        localStorage.setItem('relatorioGerado', relatorioGerado);
        window.location.href = 'relatorio.html';

    } catch (error) {
        console.error("Erro ao chamar a API da Groq:", error);
        alert(`Ocorreu um erro ao gerar o relatório: ${error.message}`);
    } finally {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('btn-gerar-relatorio').disabled = false;
    }
}

function exibirRelatorio() {
    verificarLogin();
    const valorIncentivo = localStorage.getItem('valorIncentivo');
    const relatorioGerado = localStorage.getItem('relatorioGerado');

    if (valorIncentivo && relatorioGerado) {
        document.getElementById('valor-incentivo').textContent = `R$ ${parseFloat(valorIncentivo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const relatorioComHTML = relatorioGerado.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        document.getElementById('conteudo-relatorio').innerHTML = relatorioComHTML;
    }
}
