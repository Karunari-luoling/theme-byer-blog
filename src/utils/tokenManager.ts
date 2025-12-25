/**
 * 付费内容访问令牌管理工具
 * 支持多篇文章的token存储（每篇文章一个付费区域）
 */

interface AccessTokenData {
  token: string;
  articleId: string;
  orderNo: string;
  purchaseTime: string;
  expireTime?: string; // 如果有过期时间的话
}

interface TokenStorage {
  [articleId: string]: AccessTokenData;
}

const STORAGE_KEY = "anheyu_paid_content_tokens";
const TOKEN_EXPIRY_DAYS = 365; // token有效期默认1年

// 私有辅助函数
const getStorage = (): TokenStorage => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("[TokenManager] 读取存储数据失败:", error);
    return {};
  }
};

const setStorage = (storage: TokenStorage): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("[TokenManager] 保存存储数据失败:", error);
  }
};

const isTokenExpired = (token: AccessTokenData): boolean => {
  if (!token.expireTime) {
    return false; // 没有过期时间的token认为永久有效
  }

  try {
    const expireTime = new Date(token.expireTime);
    const now = new Date();
    return now > expireTime;
  } catch (error) {
    console.error("[TokenManager] 检查令牌过期时间失败:", error);
    return false; // 解析失败时认为未过期
  }
};

const getDefaultExpireTime = (): string => {
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + TOKEN_EXPIRY_DAYS);
  return expireDate.toISOString();
};

// 导出的公共函数
export const saveToken = (data: {
  token: string;
  articleId: string;
  orderNo: string;
  expireTime?: string;
}): void => {
  try {
    const storage = getStorage();
    const { token, articleId, orderNo, expireTime } = data;

    const tokenData: AccessTokenData = {
      token,
      articleId,
      orderNo,
      purchaseTime: new Date().toISOString(),
      expireTime: expireTime || getDefaultExpireTime()
    };

    // 直接保存token（每篇文章只有一个付费区域）
    storage[articleId] = tokenData;

    setStorage(storage);
    console.log(
      `[TokenManager] 已保存访问令牌: 文章=${articleId}, 订单=${orderNo}`
    );
  } catch (error) {
    console.error("[TokenManager] 保存访问令牌失败:", error);
  }
};

export const getToken = (articleId: string): AccessTokenData | null => {
  try {
    const storage = getStorage();
    const token = storage[articleId];

    if (!token) {
      return null;
    }

    // 检查token是否过期
    if (isTokenExpired(token)) {
      // 删除过期token
      Reflect.deleteProperty(storage, articleId);
      setStorage(storage);
      return null;
    }

    return token;
  } catch (error) {
    console.error("[TokenManager] 获取访问令牌失败:", error);
    return null;
  }
};

export const getValidTokenString = (articleId: string): string | null => {
  const token = getToken(articleId);
  return token ? token.token : null;
};

export const hasValidToken = (articleId: string): boolean => {
  return getToken(articleId) !== null;
};

export const removeToken = (articleId: string): void => {
  try {
    const storage = getStorage();
    Reflect.deleteProperty(storage, articleId);
    setStorage(storage);
    console.log(`[TokenManager] 已删除文章令牌: ${articleId}`);
  } catch (error) {
    console.error("[TokenManager] 删除访问令牌失败:", error);
  }
};

export const clearAllTokens = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[TokenManager] 已清除所有访问令牌");
  } catch (error) {
    console.error("[TokenManager] 清除所有访问令牌失败:", error);
  }
};

export const getPurchasedArticleIds = (): string[] => {
  try {
    const storage = getStorage();
    return Object.keys(storage).filter(articleId => hasValidToken(articleId));
  } catch (error) {
    console.error("[TokenManager] 获取已购买文章列表失败:", error);
    return [];
  }
};

export const cleanupExpiredTokens = (): void => {
  try {
    const storage = getStorage();
    let hasChanges = false;

    Object.keys(storage).forEach(articleId => {
      const token = storage[articleId];
      if (isTokenExpired(token)) {
        Reflect.deleteProperty(storage, articleId);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setStorage(storage);
      console.log("[TokenManager] 已清理过期令牌");
    }
  } catch (error) {
    console.error("[TokenManager] 清理过期令牌失败:", error);
  }
};

const TokenManager = {
  saveToken,
  getToken,
  getValidTokenString,
  hasValidToken,
  removeToken,
  clearAllTokens,
  getPurchasedArticleIds,
  cleanupExpiredTokens
};

export default TokenManager;
export type { AccessTokenData, TokenStorage };
