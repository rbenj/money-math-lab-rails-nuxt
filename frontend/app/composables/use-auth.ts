import type { User } from '@/features/user/types';

export function useAuth() {
  const user = useState<User | null>('user', () => null);
  const { get, post, del } = useApi();

  async function fetchUser() {
    try {
      user.value = await get<User>('/me');
    } catch {
      user.value = null;
    }
  };

  async function login(email: string, password: string) {
    user.value = await post<User>('/login', { email, password });
  };

  async function register(
    email: string,
    password: string,
    passwordConfirmation: string,
    name: string,
  ) {
    user.value = await post<User>('/register', {
      user: {
        email,
        password,
        passwordConfirmation,
        name,
      },
    });
  };

  async function logout() {
    await del('/logout');
    user.value = null;
    navigateTo('/login');
  };

  return { user, fetchUser, login, register, logout };
};
