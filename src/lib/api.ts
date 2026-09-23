export const api = {
  post: async <T>(path: string, body: unknown): Promise<T> => {
    console.debug("API placeholder", path, body);
    throw new Error("API real ainda não configurada.");
  }
};