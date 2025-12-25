/*
 * @Description: 密码保护内容加密工具 - PRO版本特有功能
 * @Author: 安知鱼
 * @Date: 2025-09-16 18:00:00
 * @LastEditTime: 2025-09-16 20:56:05
 * @LastEditors: 安知鱼
 */

// 密钥配置 - 前后端需要保持一致
const ENCRYPTION_CONFIG = {
  // 固定密钥
  SECRET_KEY: "anheyu-pro-password-protection-key-2025",
  // 加密算法
  ALGORITHM: "AES-GCM",
  // 密钥长度
  KEY_LENGTH: 256,
  // IV长度
  IV_LENGTH: 12
} as const;

/**
 * 将字符串转换为ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer as ArrayBuffer;
}

/**
 * 将ArrayBuffer转换为字符串
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * 将ArrayBuffer转换为Base64字符串
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 将Base64字符串转换为ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

/**
 * 从密钥字符串生成CryptoKey
 */
async function deriveKey(keyString: string): Promise<CryptoKey> {
  // 使用PBKDF2从字符串生成密钥
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    stringToArrayBuffer(keyString),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // 固定的盐值（生产环境建议使用随机盐值）
  const salt = stringToArrayBuffer("anheyu-pro-salt-2025");

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 10000,
      hash: "SHA-256"
    },
    keyMaterial,
    {
      name: ENCRYPTION_CONFIG.ALGORITHM,
      length: ENCRYPTION_CONFIG.KEY_LENGTH
    },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * 加密密码
 * @param password 原始密码
 * @returns 加密后的Base64字符串
 */
export async function encryptPassword(password: string): Promise<string> {
  try {
    // 生成密钥
    const key = await deriveKey(ENCRYPTION_CONFIG.SECRET_KEY);

    // 生成随机IV
    const iv = crypto.getRandomValues(
      new Uint8Array(ENCRYPTION_CONFIG.IV_LENGTH)
    );

    // 加密
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv
      },
      key,
      stringToArrayBuffer(password)
    );

    // 将IV和加密数据合并
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // 转换为Base64
    return arrayBufferToBase64(combined.buffer);
  } catch (error) {
    console.error("密码加密失败:", error);
    // fallback: 如果加密失败，使用简单的Base64编码
    return btoa(unescape(encodeURIComponent(password)));
  }
}

/**
 * 解密密码（主要用于测试，生产环境由后端处理）
 * @param encryptedPassword 加密后的Base64字符串
 * @returns 原始密码
 */
export async function decryptPassword(
  encryptedPassword: string
): Promise<string> {
  try {
    // 生成密钥
    const key = await deriveKey(ENCRYPTION_CONFIG.SECRET_KEY);

    // 从Base64解码
    const combined = base64ToArrayBuffer(encryptedPassword);

    // 分离IV和加密数据
    const iv = combined.slice(0, ENCRYPTION_CONFIG.IV_LENGTH);
    const encrypted = combined.slice(ENCRYPTION_CONFIG.IV_LENGTH);

    // 解密
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv
      },
      key,
      encrypted
    );

    return arrayBufferToString(decrypted);
  } catch (error) {
    console.error("密码解密失败:", error);
    // fallback: 尝试Base64解码
    try {
      return decodeURIComponent(escape(atob(encryptedPassword)));
    } catch {
      return encryptedPassword; // 如果都失败了，返回原始字符串
    }
  }
}

/**
 * 验证加密功能是否可用
 */
export function isCryptoSupported(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined" &&
    typeof crypto.getRandomValues !== "undefined"
  );
}

/**
 * 简单的后备加密方法（当Web Crypto API不可用时）
 */
function simpleEncrypt(text: string): string {
  // 简单的XOR加密 + Base64
  const key = ENCRYPTION_CONFIG.SECRET_KEY;
  let encrypted = "";

  for (let i = 0; i < text.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const textChar = text.charCodeAt(i);
    encrypted += String.fromCharCode(textChar ^ keyChar);
  }

  return btoa(unescape(encodeURIComponent(encrypted)));
}

/**
 * 兼容性加密函数
 */
export async function encryptPasswordCompat(password: string): Promise<string> {
  if (isCryptoSupported()) {
    return encryptPassword(password);
  } else {
    // 使用简单加密作为后备方案
    return simpleEncrypt(password);
  }
}
