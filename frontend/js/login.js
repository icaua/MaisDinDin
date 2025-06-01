// js/login.js
 const loginForm = document.getElementById('loginForm');
 const messageDiv = document.getElementById('message');
 const btnLogin = document.getElementById('btnLogin');
 const emailInput = document.getElementById('email');
 const senhaInput = document.getElementById('senha');

 // Redireciona para home se já estiver logado
 if (isLoggedIn()) {
     window.location.href = 'home.html';
 }

 if (loginForm) {
     loginForm.addEventListener('submit', async function(event) {
         event.preventDefault();
         const email = emailInput.value;
         const senha = senhaInput.value;
         
         messageDiv.innerHTML = '';
         messageDiv.className = ''; 
         btnLogin.disabled = true;
         btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';

         try {
             const response = await fetch('http://localhost:3000/login', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ email, senha })
             });
             const data = await response.json();

             if (response.ok && data.success && data.token) {
                 messageDiv.innerHTML = `<div class="alert alert-success">${data.message} Redirecionando...</div>`;
                 saveToken(data.token);
                 if (data.user) {
                     saveUser(data.user);
                 }
                 setTimeout(() => { window.location.href = 'home.html'; }, 1000);
             } else {
                 messageDiv.innerHTML = `<div class="alert alert-danger">${data.message || 'Falha no login.'}</div>`;
                 senhaInput.value = '';
                 senhaInput.focus();
             }
         } catch (error) {
             console.error('Erro ao tentar fazer login:', error);
             messageDiv.innerHTML = `<div class="alert alert-danger">Erro ao conectar com o servidor. Tente novamente.</div>`;
         } finally {
             btnLogin.disabled = false;
             btnLogin.innerHTML = 'Entrar';
         }
     });
 }