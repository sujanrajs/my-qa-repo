const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const storage = {
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  setUser: (user: any): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser: (): any | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  removeUser: (): void => {
    localStorage.removeItem(USER_KEY);
  },

  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

