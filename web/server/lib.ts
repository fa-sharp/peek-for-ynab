/**
 * Whether the given request URL represents an API request.
 */
export function isApiRequest(url: string) {
  return url.startsWith("/api/");
}
