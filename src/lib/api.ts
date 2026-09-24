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
        const text = await response.text().catch(() => '');
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const jsonErr = JSON.parse(text);
          if (jsonErr.error) errorMsg = jsonErr.error;
        } catch {
          // If response body is HTML or plain text
        }
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        return JSON.parse(text);
      } else {
        throw new Error(`Unexpected non-JSON response from ${url}`);
      }
    } catch (err: any) {
      lastError = err;
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to fetch');
}
