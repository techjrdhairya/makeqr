import { auth } from '../lib/firebase';

/**
 * Attaches the signed-in user's Firebase ID token to every same-origin /api/ request,
 * so the server can verify who is uploading / editing links and files.
 */
if (typeof window !== 'undefined' && !(window as any).__mqAuthFetchPatched) {
  (window as any).__mqAuthFetchPatched = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const isApi = url.startsWith('/api/') || url.startsWith(`${window.location.origin}/api/`);
      const user = auth.currentUser;
      if (isApi && user) {
        const token = await user.getIdToken();
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
        init = { ...init, headers };
      }
    } catch {
      /* fall through unauthenticated */
    }
    return original(input, init);
  };
}
