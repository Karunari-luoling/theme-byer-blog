import { recordVisit } from "@/api/statistics";
import type { RouteLocationNormalized } from "vue-router";

/**
 * 路由级别的访问统计记录
 * 用于记录页面路由变化时的访问行为
 */

let currentPath: string = "";
let currentPageTitle: string = "";
let pageStartTime: number = 0;
let isFirstLoad: boolean = true;

/**
 * 检查路径是否为后台管理路径
 * @param path - 路由路径
 */
const isAdminPath = (path: string): boolean => {
  if (!path) return false;
  return path.startsWith("/admin/") || path === "/admin";
};

/**
 * 获取安全的 referer（排除后台路径）
 * @param fromPath - 来源路径
 * @returns 安全的 referer 字符串
 */
const getSafeReferer = (fromPath?: string): string => {
  // 如果来源路径是后台路径，使用 document.referrer 或空字符串
  if (fromPath && isAdminPath(fromPath)) {
    return document.referrer || "";
  }
  return fromPath || document.referrer;
};

// 记录路由变化
export function recordRouteChange(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) {
  try {
    const fromIsAdmin = isAdminPath(from?.path);
    const toIsAdmin = isAdminPath(to.path);

    // 如果从后台页面跳转到后台页面，则完全不处理
    if (fromIsAdmin && toIsAdmin) {
      console.log("🚫 后台页面内部跳转，跳过所有统计");
      return;
    }

    console.log(
      `路由变化触发: from=${from?.fullPath || "/"}, to=${to.fullPath}, isFirstLoad=${isFirstLoad}`
    );

    // 如果是首次加载（页面刷新或直接访问）
    if (isFirstLoad) {
      isFirstLoad = false; // 无论如何，先消耗掉首次加载标记

      // 如果首次加载的页面是后台页面，则不记录并直接返回
      if (toIsAdmin) {
        console.log(`🚫 首次访问是后台页面，跳过统计: ${to.fullPath}`);
        return;
      }

      currentPath = to.fullPath;
      currentPageTitle = document.title;
      pageStartTime = Date.now();

      // 记录新页面的访问（初始访问）
      recordVisit({
        url_path: to.fullPath,
        page_title: document.title,
        referer: getSafeReferer(from?.fullPath),
        duration: 0
      });

      console.log(`✅ 首次访问记录完成: ${to.fullPath}`);
      return;
    }

    // 如果路径发生变化，记录上一个页面的停留时间
    if (
      currentPath &&
      currentPath !== to.fullPath &&
      pageStartTime > 0 &&
      !isAdminPath(currentPath)
    ) {
      const duration = Math.floor((Date.now() - pageStartTime) / 1000);

      recordVisit({
        url_path: currentPath,
        page_title: currentPageTitle,
        referer: getSafeReferer(from?.fullPath),
        duration: duration
      });
      console.log(`📊 记录页面停留时间: ${currentPath}, 停留${duration}秒`);
    }

    if (toIsAdmin) {
      console.log(`🚫 进入后台页面，暂停统计: ${to.fullPath}`);
      // 清空当前记录，这样从后台跳出时不会错误地记录后台页面的停留时间
      currentPath = "";
      currentPageTitle = "";
      pageStartTime = 0;
      return;
    }

    // 更新当前路径、标题和开始时间，为下一次记录停留时间做准备
    currentPath = to.fullPath;
    currentPageTitle = document.title;
    pageStartTime = Date.now();

    // 记录新页面的访问（初始访问）
    recordVisit({
      url_path: to.fullPath,
      page_title: document.title,
      referer: getSafeReferer(from?.fullPath),
      duration: 0
    });

    console.log(
      `🔄 路由变化记录完成: ${from?.fullPath || "/"} -> ${to.fullPath}`
    );
  } catch (error) {
    console.error("记录路由变化失败:", error);
  }
}

// 记录页面停留时间（用于SPA应用） - 这个函数不受影响，但最好也加上判断
export function recordPageDuration(path: string, duration: number) {
  if (isAdminPath(path)) {
    return;
  }
  try {
    recordVisit({
      url_path: path,
      page_title: document.title,
      referer: document.referrer,
      duration: duration
    });
  } catch (error) {
    console.error("记录页面停留时间失败:", error);
  }
}

// 获取当前页面开始时间
export function getCurrentPageStartTime() {
  return pageStartTime;
}

// 获取当前路径
export function getCurrentPath() {
  return currentPath;
}

// 重置首次加载标记（用于特殊场景）
export function resetFirstLoadFlag() {
  isFirstLoad = true;
  console.log("重置首次加载标记");
}
