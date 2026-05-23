const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  setupLogout();
  setupTransactionForm({
    formId: 'formAdicionarReceita',
    amountId: 'valorReceita',
    dateId: 'dataReceita',
    descriptionId: 'descricaoReceita',
    categoryId: 'tipoReceita',
    messageId: 'messageReceita',
    type: 'IN',
    successMessage: 'Receita adicionada com sucesso!',
  });
  setupTransactionForm({
    formId: 'formAdicionarDespesa',
    amountId: 'valorDespesa',
    dateId: 'dataDespesa',
    descriptionId: 'descricaoDespesa',
    categoryId: 'tipoDespesa',
    messageId: 'messageDespesa',
    type: 'OUT',
    successMessage: 'Despesa adicionada com sucesso!',
  });

  if (document.getElementById('saldoValor')) {
    await loadHome();
  }

  if (document.getElementById('categoryLegend')) {
    await loadCategorySummary();
  }
});

function setupLogout() {
  const logoutButton = document.getElementById('btnLogout');

  if (logoutButton) {
    logoutButton.style.display = 'inline-block';
    logoutButton.addEventListener('click', logout);
  }
}

async function loadHome() {
  const welcomeMessageElement = document.getElementById('welcomeMessage');
  const saldoElement = document.getElementById('saldoValor');
  const nomeUsuarioElement = document.getElementById('nomeUsuario');

  const storedUser = getUser();
  if (storedUser?.name) {
    setUserName(storedUser.name, welcomeMessageElement, nomeUsuarioElement);
  }

  try {
    const [profileResponse, dashboardResponse] = await Promise.all([
      authFetch(`${API_URL}/api/profile`),
      authFetch(`${API_URL}/api/dashboard`),
    ]);

    const profileData = await profileResponse.json();
    const dashboardData = await dashboardResponse.json();

    if (!profileResponse.ok || !profileData.success) {
      throw new Error(profileData.message || 'Erro ao buscar perfil.');
    }

    if (!dashboardResponse.ok || !dashboardData.success) {
      throw new Error(dashboardData.message || 'Erro ao buscar dashboard.');
    }

    saveUser(profileData.user);
    setUserName(profileData.user.name, welcomeMessageElement, nomeUsuarioElement);

    if (saldoElement) {
      saldoElement.textContent = formatCurrency(dashboardData.balance);
    }

    renderLatestTransactions(dashboardData.latestTransactions || []);
  } catch (error) {
    console.error('Erro ao carregar home:', error.message);
    if (welcomeMessageElement) welcomeMessageElement.textContent = 'Erro ao carregar dados.';
    if (saldoElement) saldoElement.textContent = 'R$ --,--';
    renderLatestTransactions([]);
  }
}

function setupTransactionForm(config) {
  const form = document.getElementById(config.formId);
  if (!form) return;

  const dateInput = document.getElementById(config.dateId);
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const messageElement = document.getElementById(config.messageId);
    const payload = {
      description: document.getElementById(config.descriptionId).value.trim(),
      amount: Number(document.getElementById(config.amountId).value),
      category: document.getElementById(config.categoryId).value,
      type: config.type,
      date: document.getElementById(config.dateId).value,
    };

    setMessage(messageElement, '');

    try {
      const response = await authFetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Nao foi possivel salvar a movimentacao.');
      }

      setMessage(messageElement, config.successMessage, 'success');
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 700);
    } catch (error) {
      console.error('Erro ao salvar movimentacao:', error);
      setMessage(messageElement, error.message, 'danger');
    }
  });
}

function renderLatestTransactions(transactions) {
  const listElement = document.getElementById('listaMovimentacoes');
  const loadingElement = document.getElementById('loadingMovimentacoes');

  if (!listElement) return;

  listElement.innerHTML = '';

  if (!transactions.length) {
    const emptyElement = document.createElement('p');
    emptyElement.className = 'text-center text-white-50';
    emptyElement.id = loadingElement?.id || 'loadingMovimentacoes';
    emptyElement.textContent = 'Nenhuma movimentacao recente.';
    listElement.appendChild(emptyElement);
    return;
  }

  transactions.forEach((transaction) => {
    const item = document.createElement('div');
    item.className = 'list-group-item list-group-item-custom d-flex justify-content-between align-items-center';

    const info = document.createElement('div');
    const description = document.createElement('strong');
    const category = document.createElement('small');

    description.textContent = transaction.description;
    category.className = 'd-block text-white-50';
    category.textContent = `${transaction.category} - ${formatDate(transaction.date)}`;

    const amount = document.createElement('span');
    amount.className = transaction.type === 'IN' ? 'text-receita' : 'text-despesa';
    amount.textContent = `${transaction.type === 'IN' ? '+' : '-'} ${formatCurrency(transaction.amount)}`;

    info.appendChild(description);
    info.appendChild(category);
    item.appendChild(info);
    item.appendChild(amount);
    listElement.appendChild(item);
  });
}

async function loadCategorySummary() {
  const legendElement = document.getElementById('categoryLegend');
  const analysisElement = document.getElementById('comparativeAnalysisText');

  try {
    const response = await authFetch(`${API_URL}/api/dashboard`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Erro ao carregar categorias.');
    }

    const expenseCategories = (data.summaryByCategory || [])
      .filter((item) => item.expenses > 0)
      .sort((a, b) => b.expenses - a.expenses);

    legendElement.innerHTML = '';

    if (!expenseCategories.length) {
      legendElement.innerHTML = '<p class="text-white-50">Nenhuma despesa cadastrada.</p>';
    } else {
      expenseCategories.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'd-flex justify-content-between mb-2';
        li.innerHTML = `<span>${item.category}</span><strong>${formatCurrency(item.expenses)}</strong>`;
        legendElement.appendChild(li);
      });
    }

    if (analysisElement) {
      analysisElement.textContent = `Receitas: ${formatCurrency(data.totalIncome)} | Despesas: ${formatCurrency(data.totalExpenses)} | Saldo: ${formatCurrency(data.balance)}`;
    }
  } catch (error) {
    console.error('Erro ao carregar resumo por categoria:', error);
    if (legendElement) legendElement.innerHTML = '<p class="text-white-50">Erro ao carregar dados.</p>';
    if (analysisElement) analysisElement.textContent = 'Nao foi possivel carregar a analise.';
  }
}

function setUserName(name, welcomeElement, nameElement) {
  const displayName = name || 'usuario';

  if (welcomeElement) {
    welcomeElement.textContent = `Bem-vindo(a) de volta, ${displayName}!`;
  }

  if (nameElement) {
    nameElement.textContent = displayName;
  }
}

function setMessage(element, message, type = 'danger') {
  if (!element) return;

  element.innerHTML = message ? `<div class="alert alert-${type}">${message}</div>` : '';
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
