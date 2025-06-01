// js/home.js
 document.addEventListener('DOMContentLoaded', async () => {
     if (!isLoggedIn()) {
         console.log('Usuário não logado, redirecionando para login.');
         window.location.href = 'login.html';
         return; 
     }

     const welcomeMessageElement = document.getElementById('welcomeMessage');
     const saldoElement = document.getElementById('saldoValor');
     const nomeUsuarioElement = document.getElementById('nomeUsuario'); // Se você tiver um span específico para o nome
     const logoutButton = document.getElementById('btnLogout');
     const listaMovimentacoesElement = document.getElementById('listaMovimentacoes');
     const loadingMovimentacoesElement = document.getElementById('loadingMovimentacoes');

     // Exibe nome do localStorage para feedback rápido, se disponível
     const storedUser = getUser();
     if (storedUser && storedUser.name) {
         if (welcomeMessageElement) welcomeMessageElement.textContent = `Bem-vindo(a) de volta, ${storedUser.name}!`;
         if (nomeUsuarioElement) nomeUsuarioElement.textContent = storedUser.name;
     }
     
     if (logoutButton) {
         logoutButton.style.display = 'inline-block';
         logoutButton.addEventListener('click', () => {
             logout();
         });
     }

     try {
         const response = await authFetch('http://localhost:3000/api/profile'); 
         
         if (!response.ok) { // authFetch já trata 401/403 e desloga. Isso é para outros erros.
              const errorData = await response.json().catch(() => ({ message: "Erro ao buscar dados do perfil." }));
              throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
         }
         const data = await response.json();

         if (data.success) {
             const user = data.user;
             saveUser(user); // Atualiza o usuário no localStorage

             if (welcomeMessageElement && user.name) {
                 welcomeMessageElement.textContent = `Bem-vindo(a) de volta, ${user.name}!`;
             }
             if (saldoElement && data.saldo !== undefined) {
                 saldoElement.textContent = `R$ ${parseFloat(data.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
             }
             if (nomeUsuarioElement && user.name) {
                 nomeUsuarioElement.textContent = user.name;
             }
             
             // Placeholder para carregar movimentações
             if(loadingMovimentacoesElement) loadingMovimentacoesElement.textContent = 'Nenhuma movimentação recente.'; 
             // loadTransactions(); // Implementar esta função
         } else {
             console.error('Falha ao carregar dados do perfil:', data.message);
             logout(); // Desloga se o backend reportar falha nos dados do perfil
         }
     } catch (error) {
         console.error('Erro ao carregar informações da home:', error.message);
         // Se o erro não for 'Authentication failed' (já tratado pelo authFetch), pode ser um erro de rede.
         // O usuário já foi deslogado pelo authFetch se o erro foi 401/403.
         if (error.message !== 'Authentication failed') {
             if(welcomeMessageElement) welcomeMessageElement.textContent = 'Erro ao carregar dados. Tente novamente mais tarde.';
             if(saldoElement) saldoElement.textContent = 'R$ --,--';
         }
     }
 });

 /*
 async function loadTransactions() {
     // const listaMovimentacoesElement = document.getElementById('listaMovimentacoes');
     // const loadingMovimentacoesElement = document.getElementById('loadingMovimentacoes');
     // try {
     //     const response = await authFetch('http://localhost:3000/api/transactions'); // Exemplo de endpoint
     //     if (!response.ok) throw new Error('Falha ao buscar transações');
     //     const data = await response.json();
     //     if (data.success && data.transactions) {
     //         if (loadingMovimentacoesElement) loadingMovimentacoesElement.style.display = 'none';
     //         listaMovimentacoesElement.innerHTML = ''; // Limpa
     //         if (data.transactions.length === 0) {
     //            listaMovimentacoesElement.innerHTML = '<p class="text-center text-white-50">Nenhuma movimentação recente.</p>';
     //            return;
     //         }
     //         data.transactions.forEach(trans => {
     //             const item = document.createElement('div');
     //             item.className = 'list-group-item list-group-item-custom d-flex justify-content-between align-items-center';
     //             // Popular o item com os dados da transação (trans.descricao, trans.valor, etc.)
     //             // Adicionar classes text-despesa ou text-receita
     //             listaMovimentacoesElement.appendChild(item);
     //         });
     //     } else {
     //         if (loadingMovimentacoesElement) loadingMovimentacoesElement.textContent = 'Erro ao carregar movimentações.';
     //     }
     // } catch (error) {
     //     console.error("Erro ao carregar transações:", error);
     //     if (loadingMovimentacoesElement) loadingMovimentacoesElement.textContent = 'Falha ao carregar movimentações.';
     // }
 }
 */