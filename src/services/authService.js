import Parse from 'parse/dist/parse.min.js';

/**
 * Serviço de autenticação que contém métodos para login, logout, etc.
 */
const authService = {
  /**
   * Realiza o login do usuário usando o Parse
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise} - Promise resolvida com o usuário logado ou rejeitada com erro
   */
  login: async (username, password) => {
    try {
      const user = await Parse.User.logIn(username, password);
      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Realiza o logout do usuário atual
   * @returns {Promise} - Promise resolvida após o logout
   */
  logout: async () => {
    try {
      await Parse.User.logOut();
      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verifica se existe um usuário logado atualmente
   * @returns {Parse.User|null} - O usuário atual ou null
   */
  getCurrentUser: () => {
    try {
      return Parse.User.current();
    } catch (error) {
      console.error('Erro ao verificar usuário atual:', error);
      return null;
    }
  },
  
  /**
   * Registra um novo usuário no sistema
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha do usuário
   * @param {string} email - Email do usuário
   * @returns {Promise} - Promise resolvida com o usuário criado
   */
  register: async (username, password, email) => {
    const user = new Parse.User();
    user.set("username", username);
    user.set("password", password);
    user.set("email", email);
    
    try {
      const newUser = await user.signUp();
      return newUser;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;