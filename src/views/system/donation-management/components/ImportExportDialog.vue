<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Upload,
  Download,
  UploadFilled,
  EditPen
} from "@element-plus/icons-vue";
import type { UploadProps, UploadFile } from "element-plus";
import {
  exportDonationsApi,
  importDonationsApi,
  type ImportDonationOptions,
  type ImportDonationResult
} from "@/api/donation";
import AnDialog from "@/components/AnDialog/index.vue";

defineOptions({
  name: "DonationImportExportDialog"
});

interface Props {
  modelValue: boolean;
  selectedIds: number[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  selectedIds: () => []
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 是否有选中记录
const hasSelectedIds = computed(() => props.selectedIds.length > 0);

// 弹窗标题
const dialogTitle = computed(() => "打赏记录导入导出");

const activeTab = ref<"export" | "import">("export");

// 导出全部选项
const exportAll = ref(false);

// 导入方式：file = 文件上传，paste = 粘贴 JSON
const importMode = ref<"file" | "paste">("file");

// 粘贴的 JSON 文本
const pasteJsonText = ref("");

// 监听弹窗打开
watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      activeTab.value = "export";
      exportAll.value = !hasSelectedIds.value;
      importMode.value = "file";
      pasteJsonText.value = "";
    }
  }
);

const exporting = ref(false);
const importing = ref(false);
const uploadFileList = ref<UploadFile[]>([]);

// 导入选项
const importOptions = reactive<ImportDonationOptions>({
  skip_existing: true,
  default_status: 0
});

// 计算是否可以导入
const canImport = computed(() => {
  if (importMode.value === "file") {
    return uploadFileList.value.length > 0;
  } else {
    return pasteJsonText.value.trim().length > 0;
  }
});

// 导出打赏记录
const handleExport = async () => {
  const idsToExport = exportAll.value ? [] : props.selectedIds;

  if (!exportAll.value && props.selectedIds.length === 0) {
    ElMessage.warning({
      message: "请至少选择一条记录进行导出，或选择导出全部",
      customClass: "high-z-index-message"
    });
    return;
  }

  try {
    exporting.value = true;
    const blob = await exportDonationsApi(idsToExport);

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    link.download = `donations_export_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success({
      message: exportAll.value
        ? "成功导出全部打赏记录"
        : `成功导出 ${props.selectedIds.length} 条记录`,
      customClass: "high-z-index-message"
    });
    dialogVisible.value = false;
  } catch (error: any) {
    console.error("导出失败:", error);
    ElMessage.error({
      message: error.message || "导出打赏记录失败",
      customClass: "high-z-index-message"
    });
  } finally {
    exporting.value = false;
  }
};

// 文件上传前的验证
const beforeUpload: UploadProps["beforeUpload"] = file => {
  const isJSON =
    file.type === "application/json" || file.name.endsWith(".json");

  if (!isJSON) {
    ElMessage.error({
      message: "只支持 .json 格式的文件",
      customClass: "high-z-index-message"
    });
    return false;
  }

  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage.error({
      message: "文件大小不能超过 10MB",
      customClass: "high-z-index-message"
    });
    return false;
  }

  return true;
};

// 手动上传
const handleFileChange: UploadProps["onChange"] = file => {
  uploadFileList.value = [file];
};

// 移除文件
const handleRemove: UploadProps["onRemove"] = () => {
  uploadFileList.value = [];
};

// 验证 JSON 格式
const validateJsonData = (jsonText: string): boolean => {
  try {
    const data = JSON.parse(jsonText);
    // 检查是否有 donations 数组
    if (!data.donations || !Array.isArray(data.donations)) {
      ElMessage.error({
        message: "JSON 格式错误：缺少 donations 数组",
        customClass: "high-z-index-message"
      });
      return false;
    }
    // 检查每条记录是否有必要字段
    for (let i = 0; i < data.donations.length; i++) {
      const item = data.donations[i];
      if (!item.name || typeof item.name !== "string") {
        ElMessage.error({
          message: `JSON 格式错误：第 ${i + 1} 条记录缺少 name 字段`,
          customClass: "high-z-index-message"
        });
        return false;
      }
      if (item.amount === undefined || typeof item.amount !== "number") {
        ElMessage.error({
          message: `JSON 格式错误：第 ${i + 1} 条记录缺少 amount 字段`,
          customClass: "high-z-index-message"
        });
        return false;
      }
    }
    return true;
  } catch {
    ElMessage.error({
      message: "JSON 格式错误：无法解析",
      customClass: "high-z-index-message"
    });
    return false;
  }
};

// 导入打赏记录
const handleImport = async () => {
  let file: File;

  if (importMode.value === "file") {
    // 文件上传模式
    if (uploadFileList.value.length === 0) {
      ElMessage.warning({
        message: "请选择要导入的文件",
        customClass: "high-z-index-message"
      });
      return;
    }

    const rawFile = uploadFileList.value[0].raw;
    if (!rawFile) {
      ElMessage.error({
        message: "无效的文件",
        customClass: "high-z-index-message"
      });
      return;
    }
    file = rawFile;
  } else {
    // 粘贴 JSON 模式
    const jsonText = pasteJsonText.value.trim();
    if (!jsonText) {
      ElMessage.warning({
        message: "请粘贴 JSON 数据",
        customClass: "high-z-index-message"
      });
      return;
    }

    // 验证 JSON 格式
    if (!validateJsonData(jsonText)) {
      return;
    }

    // 将文本转换为 File 对象
    const blob = new Blob([jsonText], { type: "application/json" });
    file = new File([blob], "paste-import.json", { type: "application/json" });
  }

  try {
    importing.value = true;
    const { data } = await importDonationsApi(file, importOptions);

    // 显示导入结果
    const result = data as ImportDonationResult;
    const messages = [
      `总计: ${result.total_count} 条`,
      `成功: ${result.success_count} 条`,
      `跳过: ${result.skipped_count} 条`,
      `失败: ${result.failed_count} 条`
    ];

    if (result.errors && result.errors.length > 0) {
      messages.push("\n错误信息:");
      messages.push(...result.errors.slice(0, 5));
      if (result.errors.length > 5) {
        messages.push(`...还有 ${result.errors.length - 5} 条错误`);
      }
    }

    ElMessageBox.alert(messages.join("\n"), "导入完成", {
      confirmButtonText: "确定",
      type: result.failed_count > 0 ? "warning" : "success",
      customClass: "high-z-index-message-box",
      callback: () => {
        emit("success");
        dialogVisible.value = false;
        uploadFileList.value = [];
        pasteJsonText.value = "";
      }
    });
  } catch (error: any) {
    console.error("导入失败:", error);
    ElMessage.error(error.message || "导入打赏记录失败");
  } finally {
    importing.value = false;
  }
};

const handleClose = () => {
  uploadFileList.value = [];
  pasteJsonText.value = "";
  importMode.value = "file";
  // 重置导入选项为默认值
  importOptions.skip_existing = true;
  importOptions.default_status = 0;
  dialogVisible.value = false;
};
</script>

<template>
  <AnDialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="480px"
    max-width="95vw"
    max-height="90vh"
    :close-on-click-modal="false"
    hide-footer
    @close="handleClose"
  >
    <el-tabs v-model="activeTab" class="import-export-tabs">
      <!-- 导出标签页 -->
      <el-tab-pane label="导出打赏" name="export">
        <div class="export-container">
          <!-- 导出选项卡片 -->
          <div class="option-cards">
            <div
              class="option-card"
              :class="{ active: exportAll }"
              @click="exportAll = true"
            >
              <i class="anzhiyufont anzhiyu-icon-list-ul option-icon" />
              <div class="option-info">
                <div class="option-title">导出全部</div>
                <div class="option-desc">导出所有打赏记录</div>
              </div>
              <i
                v-if="exportAll"
                class="anzhiyufont anzhiyu-icon-circle-check option-check"
              />
            </div>

            <div
              class="option-card"
              :class="{
                active: !exportAll,
                disabled: selectedIds.length === 0
              }"
              @click="selectedIds.length > 0 && (exportAll = false)"
            >
              <i class="anzhiyufont anzhiyu-icon-thumbtack option-icon" />
              <div class="option-info">
                <div class="option-title">导出已选</div>
                <div class="option-desc">
                  {{
                    selectedIds.length > 0
                      ? `已选 ${selectedIds.length} 条`
                      : "请先在列表选择"
                  }}
                </div>
              </div>
              <i
                v-if="!exportAll && selectedIds.length > 0"
                class="anzhiyufont anzhiyu-icon-circle-check option-check"
              />
            </div>
          </div>

          <div class="action-section">
            <el-button
              :disabled="!exportAll && selectedIds.length === 0"
              :loading="exporting"
              type="primary"
              :icon="Download"
              class="action-btn"
              @click="handleExport"
            >
              {{ exporting ? "导出中..." : "开始导出" }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 导入标签页 -->
      <el-tab-pane label="导入打赏" name="import">
        <div class="import-container">
          <!-- 导入方式切换 -->
          <div class="mode-tabs">
            <div
              class="mode-tab"
              :class="{ active: importMode === 'file' }"
              @click="importMode = 'file'"
            >
              <i class="anzhiyufont anzhiyu-icon-folder-open" />
              <span>文件上传</span>
            </div>
            <div
              class="mode-tab"
              :class="{ active: importMode === 'paste' }"
              @click="importMode = 'paste'"
            >
              <i class="anzhiyufont anzhiyu-icon-paste" />
              <span>粘贴 JSON</span>
            </div>
          </div>

          <!-- 文件上传 -->
          <div v-if="importMode === 'file'" class="upload-section">
            <el-upload
              v-model:file-list="uploadFileList"
              class="upload-area"
              drag
              :auto-upload="false"
              :limit="1"
              :before-upload="beforeUpload"
              :on-change="handleFileChange"
              :on-remove="handleRemove"
              accept=".json"
            >
              <div class="upload-content">
                <i class="anzhiyufont anzhiyu-icon-inbox upload-icon" />
                <div class="upload-text">
                  拖拽或 <em>点击上传</em> JSON 文件
                </div>
              </div>
            </el-upload>
          </div>

          <!-- 粘贴 JSON -->
          <div v-else class="paste-section">
            <el-input
              v-model="pasteJsonText"
              type="textarea"
              :rows="6"
              placeholder='{ "donations": [{ "name": "张三", "amount": 10 }] }'
              class="paste-textarea"
            />
          </div>

          <!-- 导入选项 -->
          <div class="import-options">
            <div class="option-item">
              <el-checkbox v-model="importOptions.skip_existing">
                跳过重复记录
              </el-checkbox>
            </div>
            <div class="option-item">
              <span class="option-label">状态：</span>
              <el-radio-group
                v-model="importOptions.default_status"
                size="small"
              >
                <el-radio-button :value="0">原状态</el-radio-button>
                <el-radio-button :value="1">显示</el-radio-button>
                <el-radio-button :value="2">隐藏</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <div class="action-section">
            <el-button
              :disabled="!canImport"
              :loading="importing"
              type="primary"
              :icon="Upload"
              class="action-btn"
              @click="handleImport"
            >
              {{ importing ? "导入中..." : "开始导入" }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </AnDialog>
</template>

<style lang="scss" scoped>
.import-export-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__content) {
    padding-top: 12px;
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 0;
  }

  :deep(.el-tabs__item) {
    font-weight: 500;
  }
}

// 导出选项卡片
.option-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--anzhiyu-secondbg);
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(.disabled) {
    background: var(--anzhiyu-card-bg);
    border-color: var(--anzhiyu-theme-op);
  }

  &.active {
    background: var(--anzhiyu-theme-op);
    border-color: var(--anzhiyu-main);

    .option-icon {
      color: var(--anzhiyu-main);
    }
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option-icon {
    font-size: 20px;
    color: var(--anzhiyu-secondtext);
    transition: color 0.2s ease;
  }

  .option-info {
    flex: 1;

    .option-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
      line-height: 1.3;
    }

    .option-desc {
      font-size: 12px;
      color: var(--anzhiyu-secondtext);
      margin-top: 2px;
    }
  }

  .option-check {
    font-size: 16px;
    color: var(--anzhiyu-main);
  }
}

// 导入方式切换
.mode-tabs {
  display: flex;
  gap: 6px;
  padding: 3px;
  background: var(--anzhiyu-secondbg);
  border-radius: 8px;
  margin-bottom: 12px;
}

.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--anzhiyu-secondtext);
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  i {
    font-size: 14px;
  }

  &:hover:not(.active) {
    color: var(--anzhiyu-fontcolor);
  }

  &.active {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);
  }
}

// 文件上传区域
.upload-section {
  .upload-area {
    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      padding: 24px 16px;
      border-radius: 10px;
      border: 1px dashed var(--anzhiyu-card-border);
      background: var(--anzhiyu-secondbg);
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--anzhiyu-main);
        background: var(--anzhiyu-theme-op);
      }
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .upload-icon {
      font-size: 32px;
      color: var(--anzhiyu-main);
      margin-bottom: 8px;
    }

    .upload-text {
      font-size: 13px;
      color: var(--anzhiyu-secondtext);

      em {
        color: var(--anzhiyu-main);
        font-style: normal;
        font-weight: 500;
      }
    }
  }
}

// 粘贴 JSON 区域
.paste-section {
  .paste-textarea {
    :deep(.el-textarea__inner) {
      font-family: "SF Mono", "Monaco", "Menlo", monospace;
      font-size: 12px;
      line-height: 1.5;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid var(--anzhiyu-card-border);
      background: var(--anzhiyu-secondbg);
      transition: all 0.2s ease;
      resize: vertical;

      &:focus {
        border-color: var(--anzhiyu-main);
        background: var(--anzhiyu-card-bg);
      }

      &::placeholder {
        color: var(--anzhiyu-secondtext);
        opacity: 0.5;
      }
    }
  }
}

// 导入选项
.import-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;

  :deep(.el-checkbox) {
    --el-checkbox-font-size: 13px;
  }

  .option-label {
    font-size: 13px;
    color: var(--anzhiyu-secondtext);
  }

  :deep(.el-radio-group) {
    .el-radio-button__inner {
      padding: 6px 12px;
      font-size: 12px;
    }
  }
}

// 操作按钮区域
.action-section {
  display: flex;
  justify-content: center;
  margin-top: 16px;

  .action-btn {
    min-width: 140px;
    height: 38px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
  }
}

// 移动端适配
@media (width <= 768px) {
  .option-card {
    padding: 10px 12px;
  }

  .import-options {
    flex-direction: column;
    gap: 10px;
  }

  .option-row {
    justify-content: space-between;
    width: 100%;
  }
}
</style>

<style lang="scss">
// 全局样式：提高 MessageBox 的 z-index，使其显示在 AnDialog 之上
.el-overlay:has(.high-z-index-message-box) {
  z-index: 2200 !important;
}

.high-z-index-message-box {
  z-index: 2201 !important;
}
</style>
