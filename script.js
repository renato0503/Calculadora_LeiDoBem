// Aguarda o carregamento completo da página para adicionar os eventos
document.addEventListener("DOMContentLoaded", function() {
    const path = window.location.pathname.split("/").pop();

    if (path === 'index.html' || path === '' || path === 'Calculadora_LeiDoBem') {
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

// Função para inicializar os usuários (simulando um banco de dados)
function getInitialUsers() {
    let users = localStorage.getItem('users');
    if (!users) {
        // Cria o usuário admin se não existir
        users = [{ username: 'admin', password: 'admin' }];
        localStorage.setItem('users', JSON.stringify(users));
        return users;
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
        localStorage.setItem('loggedInUser', username); // Guarda o usuário logado
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
    populateUserList(); // Atualiza a lista na tela
    alert('Usuário criado com sucesso!');
}

function populateUserList() {
    const userListElement = document.getElementById('lista-usuarios');
    if (!userListElement) return;
    
    const users = getInitialUsers();
    userListElement.innerHTML = ''; // Limpa a lista antes de preencher

    users.forEach(user => {
        if (user.username !== 'admin') { // Não mostra o admin na lista
            const li = document.createElement('li');
            li.textContent = user.username;
            userListElement.appendChild(li);
        }
    });
}

// --- FUNÇÕES DA CALCULADORA E RELATÓRIO ---

async function handleCalculadora(event) {
    event.preventDefault();

    const GEMINI_API_KEY = prompt("Por favor, insira sua chave de API do Google Gemini para gerar o relatório:");
    if (!GEMINI_API_KEY) {
        alert("A chave de API é necessária para continuar.");
        return;
    }

    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('btn-gerar-relatorio').disabled = true;

    const respostas = {
        lucroReal: document.getElementById('lucro-real').checked,
        regularidadeFiscal: document.getElementById('regularidade-fiscal').checked,
        lucroTributavel: document.getElementById('lucro-tributavel').checked,
        dispendiosPD: parseFloat(document.getElementById('dispêndios-pd').value) || 0,
        descricaoProjeto: document.getElementById('descricao-projeto').value
    };

    let incentivo = 0;
    if (respostas.lucroReal && respostas.regularidadeFiscal && respostas.lucroTributavel && respostas.dispendiosPD > 0) {
        const baseIncentivo = respostas.dispendiosPD * 0.60; 
        incentivo = baseIncentivo * 0.34;
    }
    
    const promptText = `
        Você é um consultor especialista na "Lei do Bem" (Lei nº 11.196/2005) do Brasil.
        Uma empresa preencheu um formulário de avaliação. Analise os dados abaixo e gere um relatório técnico detalhado.

        **Dados da Empresa:**
        - Regime de Tributação: ${respostas.lucroReal ? "Lucro Real" : "Outro (Não elegível)"}
        - Regularidade Fiscal: ${respostas.regularidadeFiscal ? "Sim (Elegível)" : "Não (Não elegível)"}
        - Apurou Lucro Tributável: ${respostas.lucroTributavel ? "Sim (Elegível)" : "Não (Impede o aproveitamento no ano)"}
        - Valor dos Dispêndios com P&D: R$ ${respostas.dispendiosPD.toFixed(2)}
        - Breve Descrição do Projeto: "${respostas.descricaoProjeto}"

        **Seu relatório deve conter:**
        1.  **Análise de Elegibilidade:** Com base nos requisitos de enquadramento, informe de maneira clara se a empresa é elegível ou não. Se não for, explique exatamente qual requisito não foi atendido e o que isso significa.
        2.  **Estimativa do Benefício:** Mencione que o benefício fiscal estimado é de aproximadamente R$ ${incentivo.toFixed(2)}, explicando que este valor é uma redução do IRPJ e da CSLL devidos.
        3.  **Próximos Passos e Recomendações:** Crie uma lista de ações (checklist) que a empresa deve seguir. Detalhe a importância de:
            - Controle e segregação contábil dos gastos com P&D.
            - Elaboração de relatórios técnicos detalhados para cada projeto, conforme o Manual de Frascati.
            - Registro de horas dos profissionais envolvidos.
            - Documentação de propriedade intelectual (patentes).
            - Envio do formulário FORMP&D ao MCTI.
            - A nova obrigação da DIRBI.
        4.  **Conclusão:** Finalize com um parágrafo encorajador sobre os benefícios estratégicos de usar a Lei do Bem.

        Formate sua resposta usando títulos e listas para fácil leitura.
    `;

    try {
        // ***** AQUI ESTÁ A CORREÇÃO *****
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`A resposta da API não foi bem-sucedida: ${errorBody.error.message}`);
        }

        const data = await response.json();
        const relatorioGerado = data.candidates[0].content.parts[0].text;

        localStorage.setItem('valorIncentivo', incentivo.toFixed(2));
        localStorage.setItem('relatorioGerado', relatorioGerado);

        window.location.href = 'relatorio.html';

    } catch (error) {
        console.error("Erro ao chamar a API do Gemini:", error);
        alert("Ocorreu um erro ao gerar o relatório. Verifique se a sua chave de API está correta e tente novamente.");
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
        document.getElementById('conteudo-relatorio').textContent = relatorioGerado;
    }
}