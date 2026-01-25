<template>
  <AnDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑说说' : '发布说说'"
    width="90%"
    max-width="95vw"
    max-height="85vh"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="essay-form"
      label-position="top"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="form.status"
              placeholder="请选择状态"
              :teleported="false"
            >
              <el-option label="发布" :value="1" />
              <el-option label="草稿" :value="2" />
              <el-option label="隐藏" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序" prop="sort_order">
            <el-input-number
              v-model="form.sort_order"
              :min="0"
              :max="9999"
              placeholder="数字越大越靠前"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="发布地址" prop="address">
            <el-input
              v-model="form.address"
              placeholder="如：长沙（可选）"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发布者" prop="from">
            <el-input
              v-model="form.from"
              placeholder="如：安知鱼（可选）"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="自定义发布时间" prop="custom_published_at">
            <el-date-picker
              v-model="customPublishedAtDate"
              type="datetime"
              placeholder="留空则使用当前时间"
              value-format="YYYY-MM-DDTHH:mm:ssZ"
              format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              clearable
            />
            <div class="form-tip">支持设置历史时间或未来时间</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="相关链接" prop="link">
        <el-input
          v-model="form.link"
          placeholder="https://example.com（可选）"
          clearable
        />
      </el-form-item>

      <el-form-item label="说说内容" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="6"
          placeholder="请输入说说内容..."
          show-word-limit
          maxlength="5000"
        />
      </el-form-item>

      <el-form-item label="图片列表">
        <div class="image-upload-container">
          <div class="image-list">
            <div
              v-for="(img, index) in form.image"
              :key="index"
              class="image-item"
            >
              <el-image
                :src="img"
                fit="cover"
                :preview-src-list="form.image"
                :initial-index="index"
                class="image-preview"
              />
              <div class="image-actions">
                <el-button
                  size="small"
                  type="danger"
                  circle
                  @click="removeImage(index)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
            <div
              class="image-uploader"
              :class="{ uploading: uploading }"
              @click="handleSelectImage"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleFileChange"
              />
              <div class="upload-trigger">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <div class="upload-text">
                  {{ uploading ? "上传中..." : "上传图片" }}
                </div>
              </div>
            </div>
            <div class="image-uploader" @click="showAddLinkDialog">
              <div class="upload-trigger">
                <el-icon class="upload-icon"><Link /></el-icon>
                <div class="upload-text">添加链接</div>
              </div>
            </div>
          </div>
          <div class="upload-tip">
            支持 JPG、PNG、WEBP 格式，建议尺寸 800x600，也可以直接输入图片链接
          </div>
        </div>
      </el-form-item>

      <el-form-item label="音乐配置">
        <el-card shadow="never" class="music-card">
          <el-alert
            title="只支持网易云音乐"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          >
            请在网易云音乐中找到歌曲，复制歌曲 ID（歌曲链接中的数字）
          </el-alert>
          <el-input
            v-model="musicId"
            placeholder="请输入网易云音乐歌曲 ID，如：1901371647"
            clearable
            @input="updateMusicConfig"
          >
            <template #prepend>歌曲 ID</template>
          </el-input>
          <div v-if="hasValidMusic" class="music-preview">
            <el-tag type="success">
              已配置音乐 ID: {{ form.aplayer.id }}
            </el-tag>
            <el-button size="small" type="danger" text @click="clearMusic">
              清除音乐
            </el-button>
          </div>
        </el-card>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ isEdit ? "更新" : "发布" }}
        </el-button>
      </div>
    </template>

    <!-- 添加图片链接对话框 -->
    <AnDialog
      v-model="addLinkDialogVisible"
      title="添加图片链接"
      width="500px"
      @close="cancelAddLink"
    >
      <el-form :model="linkForm" label-width="80px">
        <el-form-item label="图片链接" required label-width="100px">
          <el-input
            v-model="linkForm.url"
            placeholder="请输入图片链接，如：https://example.com/image.jpg"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelAddLink">取消</el-button>
          <el-button type="primary" @click="confirmAddLink">确定</el-button>
        </div>
      </template>
    </AnDialog>
  </AnDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Close, Link } from "@element-plus/icons-vue";
import { createEssay, updateEssay } from "@/api/essay-management";
import type { EssayData, CreateEssayData } from "@/api/essay-management";
import { uploadArticleImage } from "@/api/post";
import AnDialog from "@/components/AnDialog/index.vue";

// Props
interface Props {
  visible: boolean;
  essayData?: EssayData | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  essayData: null
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

// 响应式数据
const formRef = ref<FormInstance>();
const saving = ref(false);
const musicId = ref<string>("");
const fileInputRef = ref<HTMLInputElement>();
const uploading = ref(false);
const customPublishedAtDate = ref<string>("");
const addLinkDialogVisible = ref(false);
const linkForm = reactive({
  url: ""
});

// 表单数据
const form = reactive<CreateEssayData>({
  content: "",
  address: "",
  from: "",
  link: "",
  image: [],
  aplayer: undefined,
  status: 1,
  sort_order: 0,
  custom_published_at: undefined
});

// 表单验证规则
const rules: FormRules = {
  content: [
    { required: true, message: "请输入说说内容", trigger: "blur" },
    {
      min: 1,
      max: 5000,
      message: "内容长度在 1 到 5000 个字符",
      trigger: "blur"
    }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const isEdit = computed(() => !!props.essayData);

// 判断是否配置了有效的音乐
const hasValidMusic = computed(() => {
  return form.aplayer && form.aplayer.id;
});

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    content: "",
    address: "",
    from: "",
    link: "",
    image: [],
    aplayer: undefined,
    status: 1,
    sort_order: 0,
    custom_published_at: undefined
  });
  musicId.value = "";
  customPublishedAtDate.value = "";
};

// 监听说说数据变化，初始化表单
watch(
  () => props.essayData,
  newData => {
    if (newData) {
      // 编辑模式
      Object.assign(form, {
        content: newData.content,
        address: newData.address || "",
        from: newData.from || "",
        link: newData.link || "",
        image: newData.image || [],
        aplayer: newData.aplayer || undefined,
        status: newData.status,
        sort_order: newData.sort_order,
        custom_published_at: undefined
      });

      // 初始化音乐配置
      if (newData.aplayer) {
        musicId.value = newData.aplayer.id;
      } else {
        musicId.value = "";
      }

      // 初始化自定义发布时间
      if (newData.created_at) {
        customPublishedAtDate.value = newData.created_at;
      } else {
        customPublishedAtDate.value = "";
      }
    } else {
      // 新建模式
      resetForm();
    }
  },
  { immediate: true }
);

// 选择图片
const handleSelectImage = () => {
  if (uploading.value) return;
  fileInputRef.value?.click();
};

// 处理文件选择
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // 验证文件
  const isImage = file.type.startsWith("image/");
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error({
      message: "只能上传图片文件!",
      customClass: "high-z-index-message"
    });
    target.value = "";
    return;
  }
  if (!isLt5M) {
    ElMessage.error({
      message: "图片大小不能超过 5MB!",
      customClass: "high-z-index-message"
    });
    target.value = "";
    return;
  }

  // 上传图片
  uploading.value = true;
  const loadingMessage = ElMessage.info({
    message: "正在上传图片...",
    duration: 0,
    customClass: "high-z-index-message"
  });

  try {
    const res = await uploadArticleImage(file);
    const url = res?.data?.url;

    if (!url) {
      throw new Error("服务器未返回有效URL");
    }

    if (!form.image) {
      form.image = [];
    }
    form.image.push(url);
    ElMessage.success({
      message: "图片上传成功",
      customClass: "high-z-index-message"
    });
  } catch (error: any) {
    console.error("图片上传失败:", error);
    ElMessage.error({
      message: error.message || "图片上传失败，请重试",
      customClass: "high-z-index-message"
    });
  } finally {
    uploading.value = false;
    loadingMessage.close();
    target.value = ""; // 清空input，允许重复上传同一文件
  }
};

// 删除图片
const removeImage = (index: number) => {
  form.image?.splice(index, 1);
};

// 显示添加链接对话框
const showAddLinkDialog = () => {
  linkForm.url = "";
  addLinkDialogVisible.value = true;
};

// 确认添加链接
const confirmAddLink = () => {
  const url = linkForm.url.trim();

  if (!url) {
    ElMessage.warning({
      message: "请输入图片链接",
      customClass: "high-z-index-message"
    });
    return;
  }

  // 简单验证URL格式
  try {
    const urlObj = new URL(url);
    if (!urlObj.protocol.startsWith("http")) {
      ElMessage.error({
        message: "请输入有效的 HTTP/HTTPS 链接",
        customClass: "high-z-index-message"
      });
      return;
    }
  } catch {
    ElMessage.error({
      message: "请输入有效的URL格式",
      customClass: "high-z-index-message"
    });
    return;
  }

  // 添加到图片列表
  if (!form.image) {
    form.image = [];
  }
  form.image.push(url);
  ElMessage.success({
    message: "图片链接添加成功",
    customClass: "high-z-index-message"
  });
  addLinkDialogVisible.value = false;
};

// 取消添加链接
const cancelAddLink = () => {
  linkForm.url = "";
  addLinkDialogVisible.value = false;
};

// 更新音乐配置
const updateMusicConfig = () => {
  if (musicId.value) {
    form.aplayer = {
      id: musicId.value
    };
  } else {
    form.aplayer = undefined;
  }
};

// 清除音乐
const clearMusic = () => {
  form.aplayer = undefined;
  musicId.value = "";
};

// 保存
const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    saving.value = true;

    // 处理空数组和空字符串
    const submitData: CreateEssayData = {
      content: form.content,
      status: form.status,
      sort_order: form.sort_order
    };

    // 只有非空值才添加
    if (form.address) submitData.address = form.address;
    if (form.from) submitData.from = form.from;
    if (form.link) submitData.link = form.link;
    if (form.image && form.image.length > 0) submitData.image = form.image;

    // 处理音乐配置
    if (form.aplayer && form.aplayer.id) {
      // 有音乐配置时添加
      submitData.aplayer = form.aplayer;
    } else if (isEdit.value) {
      // 编辑模式下，如果没有音乐配置，发送空对象以清除原有音乐
      submitData.aplayer = { id: "" };
    }

    // 处理自定义发布时间
    if (customPublishedAtDate.value) {
      submitData.custom_published_at = customPublishedAtDate.value;
    }

    let response;
    if (isEdit.value && props.essayData) {
      // 更新说说
      response = await updateEssay(props.essayData.id, submitData);
    } else {
      // 创建说说
      response = await createEssay(submitData);
    }

    if (response.code === 200) {
      ElMessage.success({
        message: isEdit.value ? "更新成功" : "发布成功",
        customClass: "high-z-index-message"
      });
      emit("success");
      handleClose();
    } else {
      ElMessage.error({
        message: response.message || (isEdit.value ? "更新失败" : "发布失败"),
        customClass: "high-z-index-message"
      });
    }
  } catch (error: any) {
    console.error("保存说说失败:", error);
    if (error !== false) {
      // 避免表单验证失败时重复提示
      ElMessage.error({
        message: "保存失败",
        customClass: "high-z-index-message"
      });
    }
  } finally {
    saving.value = false;
  }
};

// 关闭对话框
const handleClose = () => {
  formRef.value?.resetFields();
  dialogVisible.value = false;
};
</script>

<style scoped lang="scss">
.essay-form {
  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    color: var(--anzhiyu-secondtext);
  }

  .image-upload-container {
    width: 100%;

    .image-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 8px;

      .image-item {
        position: relative;
        width: 120px;
        height: 120px;
        overflow: hidden;
        border: 1px solid var(--el-border-color-light);
        border-radius: 8px;

        .image-preview {
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .image-actions {
          position: absolute;
          top: 4px;
          right: 4px;
          opacity: 0;
          transition: opacity 0.3s;
        }

        &:hover .image-actions {
          opacity: 1;
        }
      }

      .image-uploader {
        width: 120px;
        height: 120px;

        &.uploading {
          pointer-events: none;
          opacity: 0.6;
        }

        .upload-trigger {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 120px;
          cursor: pointer;
          border: 1px dashed var(--el-border-color);
          border-radius: 8px;
          transition: all 0.3s;

          &:hover {
            background-color: var(--anzhiyu-secondbg);
            border-color: var(--anzhiyu-theme);
          }

          .upload-icon {
            font-size: 28px;
            color: var(--anzhiyu-secondtext);
          }

          .upload-text {
            margin-top: 8px;
            font-size: 12px;
            color: var(--anzhiyu-secondtext);
          }
        }
      }
    }

    .upload-tip {
      font-size: 12px;
      line-height: 1.5;
      color: var(--anzhiyu-secondtext);
    }
  }

  .music-card {
    width: 100%;

    .music-preview {
      display: flex;
      gap: 12px;
      align-items: center;
      padding-top: 12px;
      margin-top: 12px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

// AnDialog 样式优化
.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

// 移动端适配
@media (width <= 768px) {
  .essay-form {
    // 表单标签位置调整
    :deep(.el-form-item__label) {
      padding-bottom: 6px;
      font-size: 14px;
      line-height: 1.5;
    }

    // 输入框字体大小
    :deep(.el-input__inner) {
      font-size: 14px;
    }

    :deep(.el-textarea__inner) {
      font-size: 14px;
    }

    :deep(.el-select) {
      width: 100%;
    }

    // 行间距调整
    :deep(.el-row) {
      margin-right: 0 !important;
      margin-left: 0 !important;
    }

    // 移动端列布局改为单列
    :deep(.el-col-12) {
      flex: 0 0 100%;
      max-width: 100%;
      padding-right: 0 !important;
      padding-left: 0 !important;
    }

    // 表单项间距
    :deep(.el-form-item) {
      margin-bottom: 16px;
    }

    // 图片上传区域
    .image-upload-container {
      .image-list {
        gap: 8px;

        .image-item,
        .image-uploader {
          position: relative;
          width: calc((100% - 16px) / 3);
          max-width: 100px;
          height: 0;
          max-height: 100px;
          padding-bottom: calc((100% - 16px) / 3);
        }

        .image-item {
          .image-preview {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          .image-actions {
            opacity: 1;

            .el-button {
              width: 24px;
              height: 24px;
              padding: 4px;

              .el-icon {
                font-size: 12px;
              }
            }
          }
        }

        .image-uploader {
          height: auto;
          padding-bottom: 0;

          &::after {
            display: block;
            padding-bottom: 100%;
            content: "";
          }

          .upload-trigger {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;

            .upload-icon {
              font-size: 24px;
            }

            .upload-text {
              margin-top: 4px;
              font-size: 11px;
            }
          }
        }
      }

      .upload-tip {
        margin-top: 8px;
        font-size: 11px;
      }
    }

    // 音乐卡片
    .music-card {
      :deep(.el-card__body) {
        padding: 12px;
      }

      :deep(.el-alert) {
        padding: 8px;
        margin-bottom: 12px !important;

        .el-alert__title {
          font-size: 12px;
        }

        .el-alert__description {
          margin-top: 4px;
          font-size: 11px;
        }
      }

      :deep(.el-input-group__prepend) {
        padding: 0 8px;
        font-size: 13px;
      }

      .music-preview {
        gap: 8px;
        padding-top: 8px;
        margin-top: 8px;

        .el-tag {
          font-size: 12px;
        }

        .el-button {
          font-size: 12px;
        }
      }
    }
  }

  // 底部按钮区域
  .dialog-footer {
    gap: 8px;

    .el-button {
      flex: 1;
      font-size: 14px;
    }
  }
}
</style>
