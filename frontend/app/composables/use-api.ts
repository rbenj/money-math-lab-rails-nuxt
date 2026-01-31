export function useApi() {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase;

  function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Forward cookies from the incoming request server side
    if (import.meta.server) {
      const event = useRequestEvent();
      const cookie = event?.node.req.headers.cookie;
      if (cookie) {
        headers.cookie = cookie;
      }
    }

    return headers;
  }

  async function get<T>(path: string): Promise<T> {
    return await $fetch<T>(`${baseUrl}${path}`, {
      credentials: "include",
      headers: getHeaders(),
    });
  }

  async function post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    return await $fetch<T>(`${baseUrl}${path}`, {
      method: "POST",
      body,
      credentials: "include",
      headers: getHeaders(),
    });
  }

  async function put<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return await $fetch<T>(`${baseUrl}${path}`, {
      method: "PUT",
      body,
      credentials: "include",
      headers: getHeaders(),
    });
  }

  async function del(path: string): Promise<void> {
    await $fetch(`${baseUrl}${path}`, {
      method: "DELETE",
      credentials: "include",
      headers: getHeaders(),
    });
  }

  return { get, post, put, del };
}
