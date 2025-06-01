// js/auth.js
const TOKEN_KEY = 'meuAppToken';
const USER_KEY = 'meuAppUser';

function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY); // Também remove dados do usuário
}

function saveUser(userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

function getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
    const token = getToken();
    // Poderia adicionar verificação de expiração do token aqui se o payload do token contiver 'exp'
    return !!token; 
}

function logout() {
    removeToken();
    window.location.href = 'login.html';
}

async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
         const response = await fetch(url, { ...options, headers });
         if (response.status === 401 || response.status === 403) {
             console.warn("Token inválido ou sessão expirada. Deslogando...");
             logout(); 
             throw new Error('Authentication failed'); 
         }
         return response;
    } catch (error) {
         console.error("Erro na requisição autenticada:", error.message);
         if (error.message !== 'Authentication failed' && (error instanceof TypeError && error.message.includes("Failed to fetch"))) {
             // Tratar erro de rede genérico, talvez mostrar uma mensagem ao usuário
             console.error("Falha de rede ao tentar buscar dados autenticados.");
         }
         throw error; 
    }
}