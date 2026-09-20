import { auth } from './firebase';

export async function apiFetch(url: string, options: RequestInit = {}, retries = 3, delayMs = 300) {
  let lastError: any;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const user = auth.currentUser;
      const headers = new Headers(options.headers || {});

      if (user) {
        try {
          const token = await user.getIdToken();
          headers.set('Authorization', `Bearer ${token}`);
        } catch (e) {
          // proceed without token if fails
        }
      }

      // Ensure JSON content type for body requests
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      lastError = err;
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to fetch');
}
