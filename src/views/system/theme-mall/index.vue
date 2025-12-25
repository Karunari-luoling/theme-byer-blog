<!--
 * @Description: 主题商城
 * @Author: 安知鱼
 * @Date: 2025-09-18 14:31:11
 * @LastEditTime: 2025-12-20 14:30:00
 * @LastEditors: 安知鱼
-->
<template>
  <div class="theme-mall">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">主题商城</h1>
        <p class="page-subtitle">发现精美主题，打造个性化站点</p>
      </div>
      <div class="header-actions">
        <button class="action-btn refresh-btn" @click="refreshThemes">
          <i class="anzhiyufont anzhiyu-icon-arrow-rotate-right" />
        </button>
        <button class="action-btn primary-btn" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          <span>上传主题</span>
        </button>
      </div>
    </div>

    <!-- 自定义 Tab 切换 -->
    <div class="tabs-wrapper">
      <div class="tabs-nav">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'market' }"
          @click="handleTabChange('market')"
        >
          <el-icon><Shop /></el-icon>
          <span>主题商城</span>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'installed' }"
          @click="handleTabChange('installed')"
        >
          <el-icon><FolderOpened /></el-icon>
          <span>已安装</span>
        </div>
        <div class="tab-indicator" :style="indicatorStyle" />
      </div>
    </div>

    <!-- 主题列表 -->
    <div class="theme-list">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner" />
        <span>加载中...</span>
      </div>

      <div
        v-else-if="!currentThemeList || currentThemeList.length === 0"
        class="empty-state"
      >
        <el-icon class="empty-icon"><Box /></el-icon>
        <p>
          {{
            activeTab === "installed"
              ? "暂无已安装主题"
              : searchParams.search
                ? "没有找到匹配的主题"
                : "暂无主题数据"
          }}
        </p>
        <button class="retry-btn" @click="refreshThemes">重新加载</button>
      </div>

      <div v-else class="theme-grid">
        <div
          v-for="theme in currentThemeList"
          :key="theme.id || theme.name"
          class="theme-card"
          :class="{ 'is-current': theme.is_current }"
        >
          <!-- 主题预览图 -->
          <div class="card-preview">
            <img
              v-if="theme.previewUrl"
              :src="theme.previewUrl"
              :alt="theme.name"
              class="preview-img"
              @error="handleImageError"
            />
            <div v-else class="preview-placeholder">
              <el-icon><Picture /></el-icon>
            </div>

            <!-- 标识徽章 -->
            <div class="card-badges">
              <span v-if="theme.isOfficial" class="badge official">
                <el-icon><CircleCheckFilled /></el-icon>
                官方
              </span>
              <span v-if="theme.themeType === 'pro'" class="badge pro">
                PRO
              </span>
              <span v-if="theme.is_current" class="badge current">
                使用中
              </span>
            </div>
          </div>

          <!-- 主题信息 -->
          <div class="card-body">
            <div class="card-header">
              <h3 class="theme-name">{{ theme.name }}</h3>
              <span class="theme-version">v{{ theme.version }}</span>
            </div>
            <p class="theme-author">by {{ theme.author }}</p>
            <p class="theme-desc">{{ theme.description || "暂无描述" }}</p>

            <!-- 标签 -->
            <div v-if="theme.tags?.length" class="theme-tags">
              <span
                v-for="tag in theme.tags.slice(0, 3)"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
              <span v-if="theme.tags.length > 3" class="tag more">
                +{{ theme.tags.length - 3 }}
              </span>
            </div>

            <!-- 价格（仅PRO版） -->
            <div
              v-if="theme.themeType === 'pro' && theme.price"
              class="theme-price"
            >
              <span class="price">¥{{ formatPrice(theme.price) }}</span>
            </div>

            <!-- 操作按钮 -->
            <div class="card-actions">
              <!-- 已安装主题操作 -->
              <template v-if="activeTab === 'installed'">
                <template v-if="theme.is_current">
                  <button class="btn current-btn" disabled>
                    <el-icon><Check /></el-icon>
                    当前主题
                  </button>
                </template>
                <template v-else>
                  <button
                    class="btn primary-btn"
                    :class="{ loading: switchingTheme === theme.name }"
                    :disabled="switchingTheme !== null"
                    @click="switchToTheme(theme)"
                  >
                    <i
                      v-if="switchingTheme !== theme.name"
                      class="anzhiyufont anzhiyu-icon-bolt"
                    />
                    {{ switchingTheme === theme.name ? "启用中..." : "启用" }}
                  </button>
                  <button
                    class="btn icon-btn danger"
                    @click="confirmUninstallTheme(theme)"
                  >
                    <el-icon><Delete /></el-icon>
                  </button>
                </template>
              </template>

              <!-- 商城主题操作 -->
              <template v-else>
                <template v-if="theme.themeType === 'community'">
                  <button
                    v-if="theme.downloadUrl"
                    class="btn primary-btn"
                    @click="installTheme(theme)"
                  >
                    <el-icon><Download /></el-icon>
                    安装
                  </button>
                  <button
                    v-else-if="theme.repoUrl"
                    class="btn primary-btn"
                    @click="openRepo(theme.repoUrl)"
                  >
                    <i class="anzhiyufont anzhiyu-icon-github" />
                    源码
                  </button>
                </template>
                <template v-else-if="theme.themeType === 'pro'">
                  <button class="btn pro-btn" @click="buyTheme(theme)">
                    <el-icon><ShoppingCart /></el-icon>
                    购买
                  </button>
                </template>
              </template>

              <!-- 演示按钮 -->
              <button
                v-if="theme.demoUrl"
                class="btn icon-btn"
                @click="openDemo(theme.demoUrl)"
              >
                <el-icon><View /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div
      v-if="themeData?.total && themeData.total > searchParams.limit!"
      class="pagination-wrapper"
    >
      <el-pagination
        v-model:current-page="searchParams.page"
        v-model:page-size="searchParams.limit"
        :total="themeData.total"
        :page-sizes="[12, 24, 36]"
        layout="total, prev, pager, next"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 上传主题弹窗 -->
    <AnDialog
      v-model="showUploadDialog"
      title="上传主题"
      width="480px"
      :show-footer="false"
    >
      <div class="upload-content">
        <div class="upload-tips">
          <div class="tip-item">
            <el-icon><Document /></el-icon>
            <span>文件格式：ZIP 压缩包</span>
          </div>
          <div class="tip-item">
            <el-icon><Coin /></el-icon>
            <span>文件大小：不超过 50MB</span>
          </div>
          <div class="tip-item">
            <el-icon><Folder /></el-icon>
            <span>必须包含：theme.json、index.html</span>
          </div>
        </div>

        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            accept=".zip"
            drag
          >
            <div class="upload-dragger">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <p class="upload-text">拖拽文件到此处或点击上传</p>
              <p class="upload-hint">支持 ZIP 格式</p>
            </div>
          </el-upload>
        </div>

        <div v-if="selectedFile" class="selected-file">
          <div class="file-info">
            <el-icon class="file-icon"><Document /></el-icon>
            <div class="file-detail">
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{
                formatFileSize(selectedFile.size)
              }}</span>
            </div>
          </div>
          <button class="remove-btn" @click="removeSelectedFile">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="upload-actions">
          <button class="btn cancel-btn" @click="closeUploadDialog">
            取消
          </button>
          <button
            v-if="selectedFile"
            class="btn primary-btn"
            :class="{ loading: uploading }"
            :disabled="uploading"
            @click="uploadTheme"
          >
            {{ uploading ? "上传中..." : "上传主题" }}
          </button>
        </div>
      </div>
    </AnDialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Upload,
  Shop,
  FolderOpened,
  Box,
  Picture,
  CircleCheckFilled,
  Check,
  Delete,
  Download,
  ShoppingCart,
  View,
  Document,
  Coin,
  Folder,
  UploadFilled,
  Close
} from "@element-plus/icons-vue";
import AnDialog from "@/components/AnDialog/index.vue";
import { themeMallApi } from "@/api/theme-mall";
import type {
  ThemeListParams,
  ThemeListData,
  Theme
} from "@/api/theme-mall/type";
import { getToken } from "@/utils/auth";

defineOptions({
  name: "ThemeMall"
});

// 响应式数据
const loading = ref(false);
const themeData = ref<ThemeListData | null>(null);
const installedThemes = ref<Theme[]>([]);
const activeTab = ref("market");

// 上传相关状态
const showUploadDialog = ref(false);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const uploadRef = ref();

// 主题切换状态
const switchingTheme = ref<string | null>(null);

// 搜索参数
const searchParams = ref<ThemeListParams & { themeType: string }>({
  page: 1,
  limit: 12,
  search: "",
  tags: "",
  themeType: ""
});

// 计算Tab指示器位置
const indicatorStyle = computed(() => {
  const index = activeTab.value === "market" ? 0 : 1;
  return {
    transform: `translateX(${index * 100}%)`,
    width: "50%"
  };
});

// 当前显示的主题列表
const currentThemeList = computed(() => {
  if (activeTab.value === "installed") {
    return installedThemes.value;
  }
  return themeData.value?.list || [];
});

// 获取主题列表
const loadThemes = async () => {
  loading.value = true;
  try {
    const params = { ...searchParams.value };
    Object.keys(params).forEach(key => {
      const value = params[key as keyof ThemeListParams];
      if (value === "") {
        delete params[key as keyof ThemeListParams];
      }
    });

    const response = await themeMallApi.getThemes(params);

    if (response.code === 200 && response.data) {
      const list = response.data.list || [];
      const sortedList = list.sort((a, b) => {
        if (a.isOfficial && !b.isOfficial) return -1;
        if (!a.isOfficial && b.isOfficial) return 1;
        return 0;
      });

      themeData.value = {
        ...response.data,
        list: sortedList
      };
    } else {
      throw new Error(response.message || "获取主题列表失败");
    }
  } catch (error: any) {
    console.error("加载主题失败:", error);
    ElMessage.error(error.message || "加载主题失败，请稍后重试");
    themeData.value = null;
  } finally {
    loading.value = false;
  }
};

// 获取已安装主题列表
const loadInstalledThemes = async () => {
  loading.value = true;
  try {
    const response = await themeMallApi.getInstalledThemes();
    if (response.code === 200 && response.data) {
      installedThemes.value = response.data;
    } else {
      throw new Error(response.message || "获取已安装主题失败");
    }
  } catch (error: any) {
    console.error("加载已安装主题失败:", error);
    ElMessage.error(error.message || "加载已安装主题失败");
    installedThemes.value = [];
  } finally {
    loading.value = false;
  }
};

// 刷新主题
const refreshThemes = () => {
  if (activeTab.value === "installed") {
    loadInstalledThemes();
  } else {
    loadThemes();
  }
};

// Tab切换处理
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName;
  if (tabName === "installed") {
    loadInstalledThemes();
  } else {
    loadThemes();
  }
};

// 分页处理
const handleSizeChange = (size: number) => {
  searchParams.value.limit = size;
  searchParams.value.page = 1;
  loadThemes();
};

const handleCurrentChange = (page: number) => {
  searchParams.value.page = page;
  loadThemes();
};

// 打开演示
const openDemo = (url: string) => {
  window.open(url, "_blank");
};

// 打开仓库
const openRepo = (url: string) => {
  window.open(url, "_blank");
};

// 安装主题
const installTheme = async (theme: Theme) => {
  if (!theme.downloadUrl) {
    ElMessage.error("该主题没有提供下载链接");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要安装主题 "${theme.name}" 吗？`,
      "安装确认",
      {
        confirmButtonText: "确认安装",
        cancelButtonText: "取消",
        type: "info"
      }
    );

    const response = await themeMallApi.installTheme({
      theme_name: theme.name,
      download_url: theme.downloadUrl,
      theme_market_id: theme.id
    });

    if (response.code === 200) {
      ElMessage.success("主题安装成功！");
      loadInstalledThemes();
    } else {
      throw new Error(response.message || "安装失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("安装主题失败:", error);
      ElMessage.error(error.message || "安装主题失败");
    }
  }
};

// 启用主题
const switchToTheme = async (theme: Theme) => {
  try {
    await ElMessageBox.confirm(
      `确定要启用主题 "${theme.name}" 吗？启用后页面将自动刷新。`,
      "启用确认",
      {
        confirmButtonText: "确认启用",
        cancelButtonText: "取消",
        type: "info"
      }
    );

    switchingTheme.value = theme.name;

    const response = await themeMallApi.switchTheme({
      theme_name: theme.name
    });

    if (response.code === 200) {
      ElMessage.success("主题启用成功！");
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set("t", Date.now().toString());
        window.location.href = url.toString();
      }, 1500);
    } else {
      throw new Error(response.message || "启用失败");
    }
  } catch (error: any) {
    switchingTheme.value = null;
    if (error !== "cancel") {
      console.error("启用主题失败:", error);
      ElMessage.error(error.message || "启用主题失败");
    }
  }
};

// 确认卸载主题
const confirmUninstallTheme = async (theme: Theme) => {
  try {
    await ElMessageBox.confirm(
      `确定要卸载主题 "${theme.name}" 吗？此操作不可撤销。`,
      "卸载确认",
      {
        confirmButtonText: "确认卸载",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const response = await themeMallApi.uninstallTheme({
      theme_name: theme.name
    });

    if (response.code === 200) {
      ElMessage.success("主题卸载成功！");
      loadInstalledThemes();
    } else {
      throw new Error(response.message || "卸载失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("卸载主题失败:", error);
      ElMessage.error(error.message || "卸载主题失败");
    }
  }
};

// 购买主题
const buyTheme = (theme: Theme) => {
  ElMessageBox.confirm(
    `确定要购买主题 "${theme.name}" 吗？价格：¥${formatPrice(theme.price || 0)}`,
    "购买确认",
    {
      confirmButtonText: "确认购买",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      ElMessage.success("购买功能开发中...");
    })
    .catch(() => {});
};

// 图片错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
  const placeholder = img.parentElement?.querySelector(".preview-placeholder");
  if (placeholder) {
    (placeholder as HTMLElement).style.display = "flex";
  }
};

// 格式化价格
const formatPrice = (priceInCents: number | undefined | null) => {
  if (priceInCents == null || isNaN(Number(priceInCents))) {
    return "0.00";
  }
  return (Number(priceInCents) / 100).toFixed(2);
};

// 上传相关方法
const handleFileChange = (file: any) => {
  selectedFile.value = file.raw;
};

const beforeUpload = (file: File) => {
  const isZip =
    file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip");
  if (!isZip) {
    ElMessage.error("只能上传ZIP格式的文件");
    return false;
  }

  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    ElMessage.error("文件大小不能超过50MB");
    return false;
  }

  return false;
};

const removeSelectedFile = () => {
  selectedFile.value = null;
  uploadRef.value?.clearFiles();
};

const uploadTheme = async () => {
  if (!selectedFile.value) {
    ElMessage.error("请先选择文件");
    return;
  }

  uploading.value = true;
  try {
    ElMessage.info("正在验证主题...");
    const validateResponse = await themeMallApi.validateTheme(
      selectedFile.value
    );

    if (validateResponse.code !== 200) {
      throw new Error(validateResponse.message || "验证失败");
    }

    if (!validateResponse.data.is_valid) {
      const errorMsg =
        validateResponse.data.errors?.join(", ") || "主题验证失败";
      throw new Error(errorMsg);
    }

    if (validateResponse.data.existing_theme) {
      const existingTheme = validateResponse.data.existing_theme;
      const newVersion = validateResponse.data.metadata?.version;
      const existingVersion =
        existingTheme.installed_version || existingTheme.version;

      const compareVersions = (v1: string, v2: string): number => {
        const parts1 = v1.split(".").map(Number);
        const parts2 = v2.split(".").map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
          const part1 = parts1[i] || 0;
          const part2 = parts2[i] || 0;

          if (part1 > part2) return 1;
          if (part1 < part2) return -1;
        }
        return 0;
      };

      const versionComparison = compareVersions(
        newVersion || "0.0.0",
        existingVersion || "0.0.0"
      );

      if (versionComparison > 0) {
        try {
          await ElMessageBox.confirm(
            `检测到已安装主题 "${existingTheme.name}" 的新版本。\n\n` +
              `当前版本：${existingVersion}\n` +
              `新版本：${newVersion}\n\n` +
              `是否要更新到新版本？`,
            "主题版本更新",
            {
              confirmButtonText: "确认更新",
              cancelButtonText: "取消",
              type: "info"
            }
          );
          await performThemeUpload(true);
        } catch (error) {
          if (error === "cancel") {
            ElMessage.info("取消更新");
            return;
          }
          throw error;
        }
      } else if (versionComparison === 0) {
        try {
          await ElMessageBox.confirm(
            `主题 "${existingTheme.name}" (版本 ${existingVersion}) 已安装。\n\n是否重新安装？`,
            "重新安装主题",
            {
              confirmButtonText: "重新安装",
              cancelButtonText: "取消",
              type: "warning"
            }
          );
          await performThemeUpload(true);
        } catch (error) {
          if (error === "cancel") {
            ElMessage.info("取消安装");
            return;
          }
          throw error;
        }
      } else {
        ElMessage.warning(
          `当前上传版本 (${newVersion}) 低于已安装版本 (${existingVersion})`
        );
        return;
      }
    } else {
      await performThemeUpload(false);
    }
  } catch (error: any) {
    console.error("上传主题失败:", error);
    ElMessage.error(error.message || "上传主题失败");
  } finally {
    uploading.value = false;
  }
};

const performThemeUpload = async (forceUpdate: boolean = false) => {
  const uploadResponse = await themeMallApi.uploadTheme(
    selectedFile.value!,
    forceUpdate
  );

  if (uploadResponse.code === 200) {
    ElMessage.success(forceUpdate ? "主题更新成功" : "主题上传成功");
    closeUploadDialog();
    activeTab.value = "installed";
    loadInstalledThemes();
  } else {
    throw new Error(uploadResponse.message || "上传失败");
  }
};

const closeUploadDialog = () => {
  showUploadDialog.value = false;
  selectedFile.value = null;
  uploadRef.value?.clearFiles();
};

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return size + " B";
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + " KB";
  }
  return (size / 1024 / 1024).toFixed(2) + " MB";
};

const checkLoginStatus = () => {
  const tokenData = getToken();
  if (!tokenData || !tokenData.accessToken) {
    return false;
  }
  if (tokenData.expires && Date.now() > tokenData.expires * 1000) {
    return false;
  }
  return true;
};

onMounted(() => {
  checkLoginStatus();
  loadThemes();
});
</script>

<style scoped lang="scss">
.theme-mall {
  max-width: 1400px;
  padding: 0 16px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 12px;

  .header-left {
    .page-title {
      margin: 0 0 2px;
      font-size: 20px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .page-subtitle {
      margin: 0;
      font-size: 13px;
      color: var(--anzhiyu-secondtext);
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

/* 通用按钮样式 */
.action-btn {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 8px;
  transition: all 0.2s ease;

  .el-icon {
    font-size: 14px;
  }

  i {
    font-size: 14px;
  }

  &:hover {
    background: var(--anzhiyu-secondbg);
  }

  &.primary-btn {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);
    border-color: var(--anzhiyu-main);

    &:hover {
      filter: brightness(1.05);
    }
  }

  &.refresh-btn {
    width: 34px;
    padding: 7px;

    &:hover i {
      transform: rotate(180deg);
    }

    i {
      transition: transform 0.3s ease;
    }
  }
}

/* Tab 切换 */
.tabs-wrapper {
  margin-bottom: 16px;

  .tabs-nav {
    position: relative;
    display: inline-flex;
    padding: 3px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;

    .tab-item {
      position: relative;
      z-index: 1;
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      color: var(--anzhiyu-secondtext);
      cursor: pointer;
      transition: color 0.3s ease;

      .el-icon {
        font-size: 14px;
      }

      &:hover {
        color: var(--anzhiyu-fontcolor);
      }

      &.active {
        color: var(--anzhiyu-main);
      }
    }

    .tab-indicator {
      position: absolute;
      top: 3px;
      bottom: 3px;
      left: 3px;
      background: var(--anzhiyu-card-bg);
      border-radius: 6px;
      box-shadow: var(--anzhiyu-shadow-border);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
}

/* 主题列表 */
.theme-list {
  min-height: 300px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--anzhiyu-secondtext);

  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 2px solid var(--anzhiyu-secondbg);
    border-top-color: var(--anzhiyu-main);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--anzhiyu-secondtext);

  .empty-icon {
    font-size: 48px;
    opacity: 0.3;
  }

  p {
    margin: 0;
    font-size: 14px;
  }

  .retry-btn {
    padding: 6px 16px;
    font-size: 13px;
    color: var(--anzhiyu-main);
    cursor: pointer;
    background: transparent;
    border: 1px solid var(--anzhiyu-main);
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);
    }
  }
}

/* 主题网格 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.theme-card {
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--anzhiyu-main);
  }

  &.is-current {
    border-color: var(--anzhiyu-green);
    box-shadow: 0 0 0 2px var(--anzhiyu-green-op);
  }
}

.card-preview {
  position: relative;
  height: 140px;
  overflow: hidden;
  background: var(--anzhiyu-secondbg);

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .preview-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--anzhiyu-secondtext);

    .el-icon {
      font-size: 36px;
      opacity: 0.3;
    }
  }
}

.card-badges {
  position: absolute;
  top: 8px;
  right: 8px;
  left: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .badge {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;

    .el-icon {
      font-size: 11px;
    }

    &.official {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);
    }

    &.pro {
      color: var(--anzhiyu-white);
      background: linear-gradient(135deg, #f59e0b, #f97316);
    }

    &.current {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-green);
    }
  }
}

.card-body {
  padding: 14px;

  .card-header {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 2px;

    .theme-name {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .theme-version {
      padding: 1px 6px;
      font-size: 11px;
      font-weight: 500;
      color: var(--anzhiyu-secondtext);
      background: var(--anzhiyu-secondbg);
      border-radius: 3px;
    }
  }

  .theme-author {
    margin: 0 0 8px;
    font-size: 12px;
    color: var(--anzhiyu-secondtext);
  }

  .theme-desc {
    display: -webkit-box;
    min-height: 34px;
    margin: 0 0 8px;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.4;
    color: var(--anzhiyu-fontcolor);
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}

.theme-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;

  .tag {
    padding: 2px 8px;
    font-size: 11px;
    color: var(--anzhiyu-secondtext);
    background: var(--anzhiyu-secondbg);
    border-radius: 3px;

    &.more {
      color: var(--anzhiyu-main);
    }
  }
}

.theme-price {
  margin-bottom: 10px;

  .price {
    font-size: 16px;
    font-weight: 700;
    color: #f59e0b;
  }
}

.card-actions {
  display: flex;
  gap: 6px;
  padding-top: 12px;
  border-top: var(--style-border);
}

/* 按钮 */
.btn {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  transition: all 0.2s ease;

  .el-icon {
    font-size: 12px;
  }

  i {
    font-size: 12px;
  }

  &.primary-btn {
    flex: 1;
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);

    &:hover:not(:disabled) {
      filter: brightness(1.05);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    &.loading {
      pointer-events: none;
    }
  }

  &.pro-btn {
    flex: 1;
    color: var(--anzhiyu-white);
    background: linear-gradient(135deg, #f59e0b, #f97316);

    &:hover {
      filter: brightness(1.05);
    }
  }

  &.current-btn {
    flex: 1;
    color: var(--anzhiyu-white);
    cursor: default;
    background: var(--anzhiyu-green);
  }

  &.icon-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    color: var(--anzhiyu-fontcolor);
    background: var(--anzhiyu-secondbg);

    &:hover {
      background: var(--anzhiyu-main);
      color: var(--anzhiyu-white);
    }

    &.danger:hover {
      background: var(--anzhiyu-red);
    }
  }

  &.cancel-btn {
    color: var(--anzhiyu-fontcolor);
    background: var(--anzhiyu-secondbg);

    &:hover {
      background: var(--el-fill-color);
    }
  }
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 上传弹窗内容 */
.upload-content {
  .upload-tips {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    margin-bottom: 16px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;

    .tip-item {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 12px;
      color: var(--anzhiyu-secondtext);

      .el-icon {
        font-size: 14px;
        color: var(--anzhiyu-main);
      }
    }
  }

  .upload-area {
    margin-bottom: 16px;

    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      padding: 28px 16px;
      background: var(--anzhiyu-secondbg);
      border: 2px dashed var(--el-border-color);
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--anzhiyu-main);
      }
    }

    .upload-dragger {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;

      .upload-icon {
        font-size: 36px;
        color: var(--anzhiyu-main);
      }

      .upload-text {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--anzhiyu-fontcolor);
      }

      .upload-hint {
        margin: 0;
        font-size: 12px;
        color: var(--anzhiyu-secondtext);
      }
    }
  }

  .selected-file {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    margin-bottom: 16px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;

    .file-info {
      display: flex;
      gap: 10px;
      align-items: center;

      .file-icon {
        font-size: 20px;
        color: var(--anzhiyu-main);
      }

      .file-detail {
        display: flex;
        flex-direction: column;
        gap: 1px;

        .file-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--anzhiyu-fontcolor);
        }

        .file-size {
          font-size: 11px;
          color: var(--anzhiyu-secondtext);
        }
      }
    }

    .remove-btn {
      width: 24px;
      height: 24px;
      padding: 0;
      color: var(--anzhiyu-secondtext);
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        color: var(--anzhiyu-red);
        background: var(--anzhiyu-red-op);
      }
    }
  }

  .upload-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
}

/* 响应式 */
@media (width <= 768px) {
  .theme-mall {
    padding: 0 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 0;

    .header-actions {
      width: 100%;

      .action-btn.primary-btn {
        flex: 1;
      }
    }
  }

  .tabs-wrapper .tabs-nav {
    width: 100%;

    .tab-item {
      flex: 1;
      justify-content: center;
      padding: 8px 12px;
    }
  }

  .theme-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card-preview {
    height: 120px;
  }
}
</style>
