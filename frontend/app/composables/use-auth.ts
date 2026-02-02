import { parseApiError } from "@/lib/error-utils";
import type { User } from "@/features/user/types";

/**
 * Simple and temporary auth system for local demo only.
 * TODO: Replace with Supabase auth, already present in Next.js version.
 */
export function useAuth() {
  const user = useState<User | null>("user", () => null);
  const { get, post, del } = useApi();

  async function fetchUser() {
    try {
      user.value = await get<User>("/me");
    } catch {
      user.value = null;
    }
  }

  async function login(email: string, password: string) {
    try {
      const loggedInUser = await post<User>("/login", { email, password });

      try {
        user.value = await get<User>("/me");
      } catch {
        user.value = loggedInUser;
      }
    } catch (err) {
      throw new Error(parseApiError(err));
    }
  }

  async function register(
    email: string,
    password: string,
    passwordConfirmation: string,
    name: string,
  ) {
    try {
      const registeredUser = await post<User>("/register", {
        user: {
          email,
          password,
          passwordConfirmation,
          name,
        },
      });

      try {
        user.value = await get<User>("/me");
      } catch {
        user.value = registeredUser;
      }
    } catch (err) {
      throw new Error(parseApiError(err));
    }
  }

  async function logout() {
    await del("/logout");
    user.value = null;
    navigateTo("/login");
  }

  return { user, fetchUser, login, register, logout };
}
