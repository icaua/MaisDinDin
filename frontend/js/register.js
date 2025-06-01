// js/register.js
 const registerForm = document.getElementById('registerForm');
 const messageDiv = document.getElementById('message');
 const btnRegister = document.getElementById('btnRegister');
 const nameInput = document.getElementById('name');
 const emailInput = document.getElementById('email');
 const cpfInput = document.getElementById('cpf');
 const passwordInput = document.getElementById('password');

 function validarCPFFrontend(cpf) {
     if (!cpf) return false;
     cpf = cpf.replace(/[^\d]+/g, ''); 
     if (cpf.length !== 11) return false;
     if (/^(\d)\1+$/.test(cpf)) return false;
     let soma = 0, resto;
     for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
     resto = (soma * 10) % 11;
     if (resto === 10 || resto === 11) resto = 0;
     if (resto !== parseInt(cpf.substring(9, 10))) return false;
     soma = 0;
     for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
     resto = (soma * 10) % 11;
     if (resto === 10 || resto === 11) resto = 0;
     if (resto !== parseInt(cpf.substring(10, 11))) return false;
     return true;
 }

 if (cpfInput) {
     cpfInput.addEventListener('input', function (e) {
         let value = e.target.value.replace(/\D/g, '');
         value = value.replace(/(\d{3})(\d)/, '$1.$2');
         value = value.replace(/(\d{3})(\d)/, '$1.$2');
         value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
         e.target.value = value.substring(0, 14);
     });
 }

 if (registerForm) {
     registerForm.addEventListener('submit', async function(event) {
         event.preventDefault();
         const name = nameInput.value;
         const email = emailInput.value;
         const cpf = cpfInput.value;
         const password = passwordInput.value;

         messageDiv.innerHTML = '';
         messageDiv.className = '';

         if (!validarCPFFrontend(cpf)) {
             messageDiv.innerHTML = `<div class="alert alert-warning">CPF inválido. Por favor, verifique.</div>`;
             cpfInput.focus();
             return;
         }
         if (password.length < 6) {
             messageDiv.innerHTML = `<div class="alert alert-warning">A senha deve ter no mínimo 6 caracteres.</div>`;
             passwordInput.focus();
             return;
         }

         btnRegister.disabled = true;
         btnRegister.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';

         try {
             const response = await fetch('http://localhost:3000/register', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ name, email, cpf, password }) 
             });
             const data = await response.json();

             if (response.ok && data.success) {
                 messageDiv.innerHTML = `<div class="alert alert-success">${data.message} Você será redirecionado para o login.</div>`;
                 registerForm.reset();
                 setTimeout(() => { window.location.href = 'login.html'; }, 2500);
             } else {
                 messageDiv.innerHTML = `<div class="alert alert-danger">${data.message || 'Ocorreu um erro.'}</div>`;
                 if (data.message && data.message.toLowerCase().includes('cpf')) cpfInput.focus();
                 else if (data.message && data.message.toLowerCase().includes('email')) emailInput.focus();
                 else passwordInput.focus();
             }
         } catch (error) {
             console.error('Erro ao registrar:', error);
             messageDiv.innerHTML = `<div class="alert alert-danger">Erro ao conectar com o servidor. Tente novamente.</div>`;
         } finally {
             btnRegister.disabled = false;
             btnRegister.innerHTML = 'Criar Minha Conta';
         }
     });
 }