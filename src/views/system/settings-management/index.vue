<template>
  <div v-loading="siteConfigStore.loading" class="settings-page">
    <SettingsLayout
      :has-changes="hasChanges"
      :loading="saving"
      @save="handleSave"
      @reset-current="handleResetCurrent"
      @reset-all="handleResetAll"
    >
      <template #default="{ activeComponent }">
        <el-form :model="form" label-position="top" class="setting-form">
          <!-- 站点信息 - 基本信息 -->
          <template v-if="activeComponent === 'BaseInfoForm'">
            <div class="section-header">
              <h2>基本信息</h2>
              <p class="section-desc">
                配置站点的基本信息，包括名称、描述、URL 等
              </p>
            </div>
            <BaseInfoForm v-model="form.site" />
          </template>

          <!-- 站点信息 - Logo与图标 -->
          <template v-else-if="activeComponent === 'IconSettingsForm'">
            <div class="section-header">
              <h2>Logo 与图标</h2>
              <p class="section-desc">配置站点的 Logo、Favicon 和 PWA 图标</p>
            </div>
            <IconSettingsForm v-model="form.site" />
          </template>

          <!-- 外观配置 - 首页设置 -->
          <template v-else-if="activeComponent === 'HomePageForm'">
            <div class="section-header">
              <h2>首页设置</h2>
              <p class="section-desc">
                配置首页顶部、Banner、分类卡片、页眉页脚等
              </p>
            </div>
            <HomePageForm v-model="form.frontDesk.home" />
          </template>

          <!-- 外观配置 - 侧边栏 -->
          <template v-else-if="activeComponent === 'SidebarPageForm'">
            <div class="section-header">
              <h2>侧边栏</h2>
              <p class="section-desc">
                配置侧边栏的作者信息、标签云、天气等模块
              </p>
            </div>
            <SidebarPageForm v-model="form.frontDesk.sidebar" />
          </template>

          <!-- 外观配置 - 页面样式 -->
          <template v-else-if="activeComponent === 'PageSittingForm'">
            <div class="section-header">
              <h2>页面样式</h2>
              <p class="section-desc">
                配置外链警告、图片参数、自定义 CSS/JS 等
              </p>
            </div>
            <PageSittingForm v-model="form.page" />
          </template>

          <!-- 内容管理 - 文章配置 -->
          <template v-else-if="activeComponent === 'PostSettings'">
            <div class="section-header">
              <h2>文章配置</h2>
              <p class="section-desc">
                配置文章的默认封面、分页、代码块、打赏等
              </p>
            </div>
            <PostSettings v-model="form.post" />
          </template>

          <!-- 内容管理 - 文件处理 -->
          <template v-else-if="activeComponent === 'FileSettings'">
            <div class="section-header">
              <h2>文件处理</h2>
              <p class="section-desc">
                配置文件上传限制、缩略图生成、EXIF 提取等
              </p>
            </div>
            <FileSettings v-model="form.file" />
          </template>

          <!-- 用户与通知 - 评论系统 -->
          <template v-else-if="activeComponent === 'CommentSettingsForm'">
            <div class="section-header">
              <h2>评论系统</h2>
              <p class="section-desc">配置评论功能、敏感词过滤、通知设置等</p>
            </div>
            <CommentSettingsForm v-model="form.frontDesk.comment" />
          </template>

          <!-- 用户与通知 - 邮件服务 -->
          <template v-else-if="activeComponent === 'EmailSettingsForm'">
            <div class="section-header">
              <h2>邮件服务</h2>
              <p class="section-desc">配置 SMTP 服务器和邮件模板</p>
            </div>
            <EmailSettingsForm v-model="form.frontDesk.email" />
          </template>

          <!-- 第三方服务 - 第三方登录 -->
          <template v-else-if="activeComponent === 'OAuthPageForm'">
            <div class="section-header">
              <h2>第三方登录</h2>
              <p class="section-desc">
                配置 QQ、微信、Logto、OIDC 等第三方登录
              </p>
            </div>
            <OAuthPageForm v-model="form.frontDesk.oauth" />
          </template>

          <!-- 第三方服务 - SEO 推送 -->
          <template v-else-if="activeComponent === 'SeoSettingsForm'">
            <div class="section-header">
              <h2>SEO 推送</h2>
              <p class="section-desc">配置百度、Bing、Google 等搜索引擎推送</p>
            </div>
            <SeoSettingsForm v-model="form.frontDesk.seo" />
          </template>

          <!-- 高级功能 - 友链管理 -->
          <template v-else-if="activeComponent === 'FLinkPageSettingsForm'">
            <div class="section-header">
              <h2>友链管理</h2>
              <p class="section-desc">配置友链申请条件、通知和审核设置</p>
            </div>
            <FLinkPageSettingsForm
              ref="fLinkFormRef"
              v-model="form.frontDesk.fLink"
            />
          </template>

          <!-- 高级功能 - 关于页 -->
          <template v-else-if="activeComponent === 'AboutPageForm'">
            <div class="section-header">
              <h2>关于页</h2>
              <p class="section-desc">配置关于页的个人信息、技能、生涯等</p>
            </div>
            <AboutPageForm ref="aboutFormRef" v-model="form.frontDesk.about" />
          </template>

          <!-- 高级功能 - 装备页 -->
          <template v-else-if="activeComponent === 'EquipmentPageForm'">
            <div class="section-header">
              <h2>装备页</h2>
              <p class="section-desc">配置装备/好物展示页面</p>
            </div>
            <EquipmentPageForm v-model="form.frontDesk.equipment" />
          </template>

          <!-- 高级功能 - 评论页 -->
          <template v-else-if="activeComponent === 'RecentCommentsPageForm'">
            <div class="section-header">
              <h2>最近评论页</h2>
              <p class="section-desc">配置最近评论页面的 Banner 等</p>
            </div>
            <RecentCommentsPageForm v-model="form.frontDesk.recentComments" />
          </template>

          <!-- 高级功能 - 即刻页 -->
          <template v-else-if="activeComponent === 'EssayPageForm'">
            <div class="section-header">
              <h2>即刻页</h2>
              <p class="section-desc">配置即刻/说说页面</p>
            </div>
            <EssayPageForm v-model="form.frontDesk.essay" />
          </template>

          <!-- 高级功能 - 朋友圈 -->
          <template v-else-if="activeComponent === 'MomentsPageForm'">
            <div class="section-header">
              <h2>朋友圈</h2>
              <p class="section-desc">配置朋友圈 RSS 抓取和显示</p>
            </div>
            <MomentsPageForm v-model="form.frontDesk.moments" />
          </template>

          <!-- 高级功能 - AI 功能 -->
          <template v-else-if="activeComponent === 'AISettingsForm'">
            <div class="section-header">
              <h2>AI 功能</h2>
              <p class="section-desc">配置 AI 摘要、AI 写作、AI 播客等</p>
            </div>
            <AISettingsForm v-model="form.ai" />
          </template>

          <!-- 高级功能 - 支付配置 -->
          <template v-else-if="activeComponent === 'PaymentConfigForm'">
            <div class="section-header">
              <h2>支付配置</h2>
              <p class="section-desc">配置微信、支付宝等支付方式</p>
            </div>
            <PaymentConfigForm />
          </template>

          <!-- 高级功能 - 页面管理 -->
          <template v-else-if="activeComponent === 'PageManagement'">
            <div class="section-header">
              <h2>页面管理</h2>
              <p class="section-desc">管理自定义页面</p>
            </div>
            <PageManagement />
          </template>

          <!-- 高级功能 - 相册页 -->
          <template v-else-if="activeComponent === 'AlbumPageForm'">
            <div class="section-header">
              <h2>相册页</h2>
              <p class="section-desc">
                配置相册页面的 Banner、布局模式、瀑布流等
              </p>
            </div>
            <AlbumPageForm v-model="form.frontDesk.album" />
          </template>

          <!-- 高级功能 - 音乐页 -->
          <template v-else-if="activeComponent === 'MusicPageForm'">
            <div class="section-header">
              <h2>音乐页面</h2>
              <p class="section-desc">
                配置音乐胶囊和音乐馆页面的播放列表、唱片外观等
              </p>
            </div>
            <MusicPageForm v-model="form.frontDesk.music" />
          </template>

          <!-- 高级功能 - 人机验证 -->
          <template v-else-if="activeComponent === 'CaptchaSettingsForm'">
            <div class="section-header">
              <h2>人机验证</h2>
              <p class="section-desc">
                配置人机验证，支持 Turnstile / 极验 /
                系统验证码，保护登录和注册接口
              </p>
            </div>
            <CaptchaSettingsForm v-model="form.frontDesk.captcha" />
          </template>

          <!-- 高级功能 - 备份&导入 -->
          <template v-else-if="activeComponent === 'BackupImportForm'">
            <div class="section-header">
              <h2>备份 & 导入</h2>
              <p class="section-desc">
                管理系统配置备份，支持导出、导入和恢复配置
              </p>
            </div>
            <BackupImportForm />
          </template>
        </el-form>
      </template>
    </SettingsLayout>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, watch, provide, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { getSettingsApi, updateSettingsApi } from "@/api/sys-settings";
import { get, set, isEqual, cloneDeep } from "lodash-es";

// 引入描述符和工具函数
import { allSettingDescriptors } from "./settings.descriptor";
import {
  createInitialFormState,
  createDescriptorMap,
  parseBackendValue,
  formatValueForSave,
  validateJsonConfig
} from "./utils";

// 引入布局组件
import SettingsLayout from "./components/SettingsLayout.vue";

// 引入所有表单子组件
import BaseInfoForm from "./components/BaseInfoForm.vue";
import IconSettingsForm from "./components/IconSettingsForm.vue";
import PageSittingForm from "./components/PageSittingForm.vue";
import FileSettings from "./components/fileSetting/FileSettingsForm.vue";
import PostSettings from "./components/postSettings/index.vue";
import PaymentConfigForm from "./components/PaymentConfigForm.vue";
import PageManagement from "../page-management/index.vue";
import AISettingsForm from "./components/AISettingsForm/index.vue";

// 引入前台相关组件
import HomePageForm from "./components/frontDesk/HomePageForm/index.vue";
import SidebarPageForm from "./components/frontDesk/SidebarPageForm/index.vue";
import CommentSettingsForm from "./components/frontDesk/CommentSettingsForm/index.vue";
import EmailSettingsForm from "./components/frontDesk/EmailSettingsForm/index.vue";
import FLinkPageSettingsForm from "./components/frontDesk/FLinkPageSettingsForm/index.vue";
import EquipmentPageForm from "./components/frontDesk/EquipmentPageForm/index.vue";
import AboutPageForm from "./components/frontDesk/AboutPageForm/index.vue";
import RecentCommentsPageForm from "./components/frontDesk/RecentCommentsPageForm/index.vue";
import EssayPageForm from "./components/frontDesk/EssayPageForm/index.vue";
import MomentsPageForm from "./components/frontDesk/MomentsPageForm/index.vue";
import OAuthPageForm from "./components/frontDesk/OAuthPageForm/index.vue";
import SeoSettingsForm from "./components/frontDesk/SeoSettingsForm/index.vue";
import AlbumPageForm from "./components/frontDesk/AlbumPageForm/index.vue";
import MusicPageForm from "./components/frontDesk/MusicPageForm/index.vue";
import CaptchaSettingsForm from "./components/frontDesk/CaptchaSettingsForm/index.vue";
import BackupImportForm from "./components/BackupImportForm.vue";

const siteConfigStore = useSiteConfigStore();
const fLinkFormRef = ref<InstanceType<typeof FLinkPageSettingsForm>>();
const aboutFormRef = ref<InstanceType<typeof AboutPageForm>>();
const saving = ref(false);

// 根据描述符创建 Map，方便查找
const descriptorMap = createDescriptorMap(allSettingDescriptors);
// 根据描述符获取所有需要从后端请求的键
const allBackendKeys = allSettingDescriptors.map(d => d.backendKey);
// 根据描述符自动生成包含所有默认值的、具有正确嵌套结构的 form 对象
const form = reactive(createInitialFormState(allSettingDescriptors));
// 保存原始数据用于比较变更
const originalFormData = ref<any>(null);

// 将表单对象提供给子组件，以便获取站点URL等配置
provide("settingsForm", form);

// 检测是否有未保存的更改
const hasChanges = computed(() => {
  if (!originalFormData.value) return false;

  for (const [frontendPath, desc] of descriptorMap) {
    const currentValue = get(form, frontendPath);
    const originalValue = get(originalFormData.value, frontendPath);

    if (!isEqual(currentValue, originalValue)) {
      return true;
    }
  }
  return false;
});

// 设置管理专用的数据加载状态
const settingsLoading = ref(false);

// 从服务器加载配置（不污染 siteConfig store，避免敏感配置泄露）
const loadSettingsFromServer = async () => {
  settingsLoading.value = true;
  try {
    const res = await getSettingsApi(allBackendKeys);
    if (res.code === 200 && res.data) {
      // 遍历描述符，填充表单（直接使用 API 返回的数据，不存储到 store）
      descriptorMap.forEach((desc, frontendPath) => {
        const backendValue = get(res.data, desc.backendKey);
        if (backendValue !== undefined) {
          const parsedValue = parseBackendValue(
            backendValue,
            desc.type,
            desc.backendKey
          );
          set(form, frontendPath, cloneDeep(parsedValue));
        }
      });
      // 保存原始数据用于比较
      originalFormData.value = cloneDeep(form);
    } else {
      ElMessage.error(res.message || "加载配置失败");
    }
  } catch (error: any) {
    console.error("加载配置失败:", error);
    ElMessage.error(`加载配置失败: ${error.message || String(error)}`);
  } finally {
    settingsLoading.value = false;
  }
};

onMounted(() => {
  // 直接从 API 加载配置，不使用 siteConfig store
  // 这样可以避免敏感配置（如 API Key）被缓存到 localStorage
  loadSettingsFromServer();
});

const handleSave = async () => {
  // 在保存前，先同步编辑器的内容
  if (fLinkFormRef.value?.syncEditorContent) {
    await fLinkFormRef.value.syncEditorContent();
  }
  if (aboutFormRef.value?.syncEditorContent) {
    await aboutFormRef.value.syncEditorContent();
  }

  const settingsToUpdate: Record<string, any> = {};
  const validationErrors: string[] = [];

  // 使用本地保存的原始数据进行比较（不使用可能被污染的 siteConfig store）
  const originalSettings = originalFormData.value || {};

  // 通用逻辑：遍历描述符，自动比较差异和验证
  descriptorMap.forEach((desc, frontendPath) => {
    const currentValue = get(form, frontendPath);
    const originalValue = get(originalSettings, frontendPath);

    if (!isEqual(currentValue, originalValue)) {
      const formattedValue = formatValueForSave(currentValue, desc.type);

      // 对JSON类型进行额外验证
      if (desc.type === "json") {
        const validation = validateJsonConfig(formattedValue, desc.backendKey);
        if (!validation.isValid) {
          validationErrors.push(`${desc.backendKey}: ${validation.error}`);
          return;
        }
      }

      settingsToUpdate[desc.backendKey] = formattedValue;
    }
  });

  // 如果有验证错误，显示错误信息并停止保存
  if (validationErrors.length > 0) {
    ElMessage.error(`配置验证失败：\n${validationErrors.join("\n")}`);
    return;
  }

  if (Object.keys(settingsToUpdate).length === 0) {
    ElMessage.info("没有检测到任何更改。");
    return;
  }

  saving.value = true;

  try {
    // 直接调用 API 保存，不通过 siteConfig store（避免敏感配置被缓存）
    const res = await updateSettingsApi(settingsToUpdate);
    if (res.code !== 200) {
      throw new Error(res.message || "保存失败");
    }

    // 更新本地原始数据
    originalFormData.value = cloneDeep(form);

    // 刷新公共配置缓存（只会获取公开配置，不包含敏感信息）
    await siteConfigStore.forceRefreshFromServer();

    ElMessage.success("设置已保存成功");
  } catch (error: any) {
    console.error("保存设置时发生错误:", error);
    ElMessage.error(`保存失败: ${error.message || String(error)}`);
  } finally {
    saving.value = false;
  }
};

// 组件名到 frontendPath 前缀的映射
const componentToPathPrefix: Record<string, string[]> = {
  BaseInfoForm: ["site."],
  IconSettingsForm: ["site."],
  HomePageForm: ["frontDesk.home."],
  SidebarPageForm: ["frontDesk.sidebar."],
  PageSittingForm: ["page."],
  PostSettings: ["post."],
  FileSettings: ["file."],
  CommentSettingsForm: ["frontDesk.comment."],
  EmailSettingsForm: ["frontDesk.email."],
  OAuthPageForm: ["frontDesk.oauth."],
  SeoSettingsForm: ["frontDesk.seo."],
  FLinkPageSettingsForm: ["frontDesk.fLink."],
  AboutPageForm: ["frontDesk.about."],
  EquipmentPageForm: ["frontDesk.equipment."],
  RecentCommentsPageForm: ["frontDesk.recentComments."],
  EssayPageForm: ["frontDesk.essay."],
  MomentsPageForm: ["frontDesk.moments."],
  AlbumPageForm: ["frontDesk.album."],
  MusicPageForm: ["frontDesk.music."],
  CaptchaSettingsForm: ["frontDesk.captcha."],
  AISettingsForm: ["ai."]
};

// 重置选区 - 重置当前 tab 的配置
const handleResetCurrent = (activeComponent: string) => {
  const prefixes = componentToPathPrefix[activeComponent];
  if (!prefixes || prefixes.length === 0) {
    ElMessage.warning("当前页面不支持重置操作");
    return;
  }

  if (!originalFormData.value) {
    ElMessage.warning("没有可重置的数据");
    return;
  }

  // 先检查当前页面是否有变更
  let changedCount = 0;
  descriptorMap.forEach((desc, frontendPath) => {
    const belongsToComponent = prefixes.some(prefix =>
      frontendPath.startsWith(prefix)
    );
    if (belongsToComponent) {
      const currentValue = get(form, frontendPath);
      const originalValue = get(originalFormData.value, frontendPath);
      if (!isEqual(currentValue, originalValue)) {
        changedCount++;
      }
    }
  });

  if (changedCount === 0) {
    ElMessage.info("当前页面没有需要重置的更改");
    return;
  }

  ElMessageBox.confirm(
    `确定要重置当前页面的 ${changedCount} 项配置更改吗？`,
    "重置选区确认",
    {
      confirmButtonText: "确定重置",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      let resetCount = 0;
      descriptorMap.forEach((desc, frontendPath) => {
        const belongsToComponent = prefixes.some(prefix =>
          frontendPath.startsWith(prefix)
        );
        if (belongsToComponent) {
          const currentValue = get(form, frontendPath);
          const originalValue = get(originalFormData.value, frontendPath);
          // 只重置有变更的配置
          if (
            !isEqual(currentValue, originalValue) &&
            originalValue !== undefined
          ) {
            set(form, frontendPath, cloneDeep(originalValue));
            resetCount++;
          }
        }
      });

      ElMessage.success(`已重置 ${resetCount} 项配置`);
    })
    .catch(() => {
      // 用户取消
    });
};

// 重置全部 - 重置所有配置
const handleResetAll = () => {
  if (!originalFormData.value) {
    ElMessage.warning("没有可重置的数据");
    return;
  }

  // 先统计变更数量
  let changedCount = 0;
  descriptorMap.forEach((desc, frontendPath) => {
    const currentValue = get(form, frontendPath);
    const originalValue = get(originalFormData.value, frontendPath);
    if (!isEqual(currentValue, originalValue)) {
      changedCount++;
    }
  });

  if (changedCount === 0) {
    ElMessage.info("没有需要重置的更改");
    return;
  }

  ElMessageBox.confirm(
    `确定要重置所有 ${changedCount} 项配置更改吗？`,
    "重置全部确认",
    {
      confirmButtonText: "确定重置",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      let resetCount = 0;
      descriptorMap.forEach((desc, frontendPath) => {
        const currentValue = get(form, frontendPath);
        const originalValue = get(originalFormData.value, frontendPath);
        // 只重置有变更的配置
        if (
          !isEqual(currentValue, originalValue) &&
          originalValue !== undefined
        ) {
          set(form, frontendPath, cloneDeep(originalValue));
          resetCount++;
        }
      });

      ElMessage.success(`已重置 ${resetCount} 项配置`);
    })
    .catch(() => {
      // 用户取消
    });
};
</script>

<style scoped lang="scss">
.settings-page {
  height: 100%;
  overflow: hidden;
  margin: 0 !important;
}

.setting-form {
  width: 100%;
}

.section-header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .section-desc {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}
</style>
