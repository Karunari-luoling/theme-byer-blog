/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-11-23 17:13:50
 * @LastEditors: 安知鱼
 */
// 响应式storage
import type { App } from "vue";
import Storage from "responsive-storage";
import { routerArrays } from "@/layout/types";
import { responsiveStorageNameSpace } from "@/config/base";

// 配置版本号 - 当需要强制更新某些配置时，增加此版本号
const CONFIG_VERSION = 3;
const CONFIG_VERSION_KEY = "anheyu_config_version";

/**
 * 迁移旧配置到新版本
 * @param existingConfigure 现有的配置
 * @param config 平台配置
 * @returns 迁移后的配置
 */
const migrateConfig = (
  existingConfigure: Record<string, unknown> | null,
  config: PlatformConfigs
): Record<string, unknown> => {
  const storedVersion = Number(localStorage.getItem(CONFIG_VERSION_KEY)) || 1;

  // 如果没有现有配置，返回默认配置
  if (!existingConfigure) {
    return {
      grey: config.Grey ?? false,
      weak: config.Weak ?? false,
      hideTabs: config.HideTabs ?? false,
      hideFooter: config.HideFooter ?? true,
      showLogo: config.ShowLogo ?? true,
      showModel: config.ShowModel ?? "chrome",
      multiTagsCache: config.MultiTagsCache ?? true,
      stretch: config.Stretch ?? false
    };
  }

  // 配置迁移逻辑
  const migratedConfig = { ...existingConfigure };

  // v1 -> v2: 将 showModel 默认值从 "smart" 改为 "chrome"
  if (storedVersion < 2) {
    // 如果用户之前使用的是默认的 "smart"，自动升级为 "chrome"
    if (migratedConfig.showModel === "smart") {
      migratedConfig.showModel = "chrome";
      console.log("📦 配置迁移: showModel 从 smart 更新为 chrome");
    }
  }

  // v2 -> v3: 启用标签页缓存功能，刷新页面保持标签页状态
  if (storedVersion < 3) {
    // 自动为旧用户启用标签页缓存
    if (migratedConfig.multiTagsCache === false) {
      migratedConfig.multiTagsCache = true;
      console.log(
        "📦 配置迁移: multiTagsCache 已启用，刷新页面将保持标签页状态"
      );
    }
  }

  // 更新配置版本号
  if (storedVersion < CONFIG_VERSION) {
    localStorage.setItem(CONFIG_VERSION_KEY, String(CONFIG_VERSION));
    console.log(`📦 配置版本已更新: v${storedVersion} -> v${CONFIG_VERSION}`);
  }

  return migratedConfig;
};

export const injectResponsiveStorage = (app: App, config: PlatformConfigs) => {
  const nameSpace = responsiveStorageNameSpace();

  // 辅助函数：根据时间判断是否应该是暗色模式（早8点至晚8点为亮色）
  const shouldBeDarkByTime = (): boolean => {
    const hour = new Date().getHours();
    return hour < 8 || hour >= 20;
  };

  // 确定默认主题模式：优先使用后端配置的 DEFAULT_THEME_MODE
  let defaultOverallStyle: "light" | "dark" | "system" | "auto" =
    config.OverallStyle ?? "light";
  let defaultDarkMode = config.DarkMode ?? false;

  // 如果后端配置了 DEFAULT_THEME_MODE，使用它作为默认值
  if (config.DEFAULT_THEME_MODE) {
    if (config.DEFAULT_THEME_MODE === "auto") {
      defaultOverallStyle = "auto";
      defaultDarkMode = shouldBeDarkByTime();
    } else {
      defaultOverallStyle =
        config.DEFAULT_THEME_MODE === "dark" ? "dark" : "light";
      defaultDarkMode = config.DEFAULT_THEME_MODE === "dark";
    }
  }

  // 获取现有配置并进行迁移
  const existingConfigure = Storage.getData("configure", nameSpace);
  const migratedConfigure = migrateConfig(existingConfigure, config);

  // 判断是否启用标签页缓存：优先使用迁移后的配置，其次使用后端配置，默认启用
  const isMultiTagsCacheEnabled =
    migratedConfigure.multiTagsCache ?? config.MultiTagsCache ?? true;

  const configObj = Object.assign(
    {
      // layout模式以及主题
      layout: Storage.getData("layout", nameSpace) ?? {
        layout: config.Layout ?? "vertical",
        theme: config.Theme ?? "light",
        darkMode: defaultDarkMode,
        sidebarStatus: config.SidebarStatus ?? true,
        epThemeColor: config.EpThemeColor ?? "#409EFF",
        themeColor: config.Theme ?? "light", // 主题色（对应系统配置中的主题色，与theme不同的是它不会受到浅色、深色整体风格切换的影响，只会在手动点击主题色时改变）
        overallStyle: defaultOverallStyle // 整体风格（浅色：light、深色：dark、跟随系统：system、早晚自动：auto）
      },
      // 系统配置-界面显示（使用迁移后的配置）
      configure: migratedConfigure
    },
    isMultiTagsCacheEnabled
      ? {
          // 默认显示顶级菜单tag，启用缓存后刷新页面保持标签页状态
          tags: Storage.getData("tags", nameSpace) ?? routerArrays
        }
      : {}
  );

  app.use(Storage, { nameSpace, memory: configObj });
};
