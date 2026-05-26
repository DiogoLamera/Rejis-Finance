/**
 * Autenticação simples baseada em usuário/senha fixos em env vars.
 * Token assinado com HMAC-SHA256 usando WebCrypto (compatível com Edge runtime).
 */

const VALIDADE_HORAS = 24 * 7; // 1 semana

interface PayloadToken {
  user: string;
  exp: number; // unix timestamp em segundos
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET não configurada ou muito curta (mínimo 16 caracteres)",
    );
  }
  return secret;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(data: string): string {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(message),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function gerarToken(user: string): Promise<string> {
  const payload: PayloadToken = {
    user,
    exp: Math.floor(Date.now() / 1000) + VALIDADE_HORAS * 3600,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const assinatura = await hmacSha256(getSecret(), encoded);
  return `${encoded}.${assinatura}`;
}

export async function verificarToken(
  token: string,
): Promise<PayloadToken | null> {
  if (!token) return null;
  const [encoded, assinatura] = token.split(".");
  if (!encoded || !assinatura) return null;

  try {
    const esperada = await hmacSha256(getSecret(), encoded);

    // Comparação constant-time
    if (assinatura.length !== esperada.length) return null;
    let diff = 0;
    for (let i = 0; i < assinatura.length; i++) {
      diff |= assinatura.charCodeAt(i) ^ esperada.charCodeAt(i);
    }
    if (diff !== 0) return null;

    const payload = JSON.parse(base64UrlDecode(encoded)) as PayloadToken;
    if (
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function credenciaisValidas(user: string, senha: string): boolean {
  const userEsperado = process.env.AUTH_USERNAME ?? "";
  const senhaEsperada = process.env.AUTH_PASSWORD ?? "";
  if (!userEsperado || !senhaEsperada) return false;
  return (
    constanteString(user, userEsperado) &&
    constanteString(senha, senhaEsperada)
  );
}

function constanteString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const COOKIE_AUTH = "rejis_auth";
