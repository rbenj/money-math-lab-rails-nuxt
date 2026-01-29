export function useApi() {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase;

  async function get<T>(path: string): Promise<T> {
    return await $fetch<T>(`${baseUrl}${path}`, {
      credentials: 'include',
    });
  };

  async function post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    return await $fetch<T>(`${baseUrl}${path}`, {
      method: 'POST',
      body,
      credentials: 'include',
    });
  };

  async function put<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return await $fetch<T>(`${baseUrl}${path}`, {
      method: 'PUT',
      body,
      credentials: 'include',
    });
  };

  async function del(path: string): Promise<void> {
    await $fetch(`${baseUrl}${path}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  };

  return { get, post, put, del };
};
