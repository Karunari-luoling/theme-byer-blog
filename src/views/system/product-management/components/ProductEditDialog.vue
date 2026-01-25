<template>
  <AnDialog
    :model-value="modelValue"
    :title="mode === 'create' ? '添加商品' : '编辑商品'"
    width="600px"
    :close-on-click-modal="false"
    :confirm-loading="submitting"
    :confirm-text="mode === 'create' ? '创建商品' : '保存更改'"
    show-footer
    @update:model-value="$emit('update:modelValue', $event)"
    @closed="handleClosed"
    @confirm="handleSubmit"
  >
    <div v-loading="loading" class="product-form">
      <!-- 基本信息区 -->
      <div class="form-section">
        <div class="section-content">
          <!-- 商品标题 -->
          <div class="form-item">
            <label class="form-label required">商品名称</label>
            <el-input
              v-model="form.title"
              placeholder="输入商品名称"
              size="large"
              maxlength="100"
              show-word-limit
              class="title-input"
            />
          </div>

          <!-- 封面和状态行 -->
          <div class="flex-row">
            <div class="flex-1 form-item">
              <label class="form-label">封面图片</label>
              <div class="cover-input-wrapper">
                <el-input
                  v-model="form.cover_url"
                  placeholder="输入图片 URL"
                  clearable
                >
                  <template #prefix>
                    <el-icon><Link /></el-icon>
                  </template>
                </el-input>
                <div
                  v-if="form.cover_url"
                  class="cover-preview"
                  @click="previewCover"
                >
                  <el-image :src="form.cover_url" fit="cover">
                    <template #error>
                      <div class="cover-error">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </div>
              </div>
            </div>
          </div>

          <!-- 商品描述 -->
          <div class="form-item">
            <label class="form-label">商品描述</label>
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="简要介绍商品特点（支持 Markdown）"
              resize="none"
            />
          </div>

          <!-- 状态和会员设置 -->
          <div class="flex-row settings-row">
            <div class="setting-item">
              <span class="setting-label">商品状态</span>
              <el-radio-group v-model="form.status" class="status-radio-group">
                <el-radio-button :value="ProductStatus.Draft">
                  草稿
                </el-radio-button>
                <el-radio-button :value="ProductStatus.Published">
                  上架
                </el-radio-button>
                <el-radio-button :value="ProductStatus.Offline">
                  下架
                </el-radio-button>
              </el-radio-group>
            </div>
            <div class="setting-item">
              <span class="setting-label">会员权益</span>
              <el-switch
                v-model="membershipFree"
                active-text="免费"
                inactive-text="付费"
                inline-prompt
              />
            </div>
            <div class="setting-item">
              <el-tooltip
                content="控制商品是否在首页文章列表中展示"
                placement="top"
              >
                <span class="setting-label">首页显示</span>
              </el-tooltip>
              <el-switch
                v-model="form.show_on_homepage"
                active-text="是"
                inactive-text="否"
                inline-prompt
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 规格设置区 -->
      <div class="form-section variants-section">
        <div class="section-header">
          <div class="section-title">
            <el-icon><Box /></el-icon>
            <span>规格设置</span>
          </div>
          <el-button
            type="primary"
            size="small"
            round
            @click="handleAddVariant"
          >
            <el-icon><Plus /></el-icon>
            添加规格
          </el-button>
        </div>

        <div class="section-content">
          <!-- 空状态 -->
          <div v-if="form.variants.length === 0" class="empty-variants">
            <el-icon class="empty-icon"><Box /></el-icon>
            <p>暂无规格，点击上方按钮添加</p>
          </div>

          <!-- 规格列表 -->
          <TransitionGroup name="variant-list" tag="div" class="variants-list">
            <div
              v-for="(variant, index) in form.variants"
              :key="variant._key || index"
              class="variant-card"
            >
              <!-- 规格头部 -->
              <div class="variant-header">
                <div class="variant-index">{{ index + 1 }}</div>
                <el-input
                  v-model="variant.name"
                  placeholder="规格名称（如：标准版）"
                  class="variant-name-input"
                />
                <el-button
                  type="danger"
                  size="small"
                  circle
                  plain
                  @click="handleRemoveVariant(index)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>

              <!-- 规格内容 -->
              <div class="variant-body">
                <!-- 价格输入 -->
                <div class="price-row">
                  <div class="price-input-group">
                    <span class="currency">¥</span>
                    <el-input-number
                      v-model="variant.priceYuan"
                      :min="0"
                      :precision="2"
                      :step="1"
                      :controls="false"
                      placeholder="0.00"
                      class="price-input"
                      @change="updateVariantPrice(variant)"
                    />
                  </div>
                  <span class="price-hint">元</span>
                </div>

                <!-- 发货方式 -->
                <div class="delivery-row">
                  <el-radio-group
                    v-model="variant.delivery_method"
                    class="delivery-options"
                  >
                    <el-radio-button :value="DeliveryMethod.Fixed">
                      <el-icon><Document /></el-icon>
                      固定内容
                    </el-radio-button>
                    <el-radio-button :value="DeliveryMethod.Stock">
                      <el-icon><Key /></el-icon>
                      卡密库存
                    </el-radio-button>
                  </el-radio-group>
                </div>

                <!-- 发货内容区域（固定高度） -->
                <div class="delivery-content-wrapper">
                  <!-- 固定内容输入 -->
                  <div
                    v-if="variant.delivery_method === DeliveryMethod.Fixed"
                    class="delivery-content"
                  >
                    <el-input
                      v-model="variant.fixed_reply_content"
                      type="textarea"
                      :rows="2"
                      placeholder="用户购买成功后将收到此内容"
                      resize="none"
                    />
                  </div>

                  <!-- 卡密提示 -->
                  <div
                    v-else-if="variant.delivery_method === DeliveryMethod.Stock"
                    class="stock-hint"
                  >
                    <el-icon><InfoFilled /></el-icon>
                    <span>保存后可在「库存管理」中导入卡密</span>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </AnDialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  Plus,
  Close,
  Document,
  Key,
  Box,
  Picture,
  Link,
  InfoFilled
} from "@element-plus/icons-vue";
import AnDialog from "@/components/AnDialog";
import {
  createProductApi,
  updateProductApi,
  getProductAdminApi,
  type ProductListItem,
  type CreateVariantRequest,
  ProductStatus,
  DeliveryMethod
} from "@/api/product";

interface Props {
  modelValue: boolean;
  product: ProductListItem | null;
  mode: "create" | "edit";
}

interface VariantForm extends CreateVariantRequest {
  _key?: string;
  priceYuan?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  refresh: [];
}>();

const loading = ref(false);
const submitting = ref(false);

// 表单数据
const form = reactive({
  title: "",
  description: "",
  cover_url: "",
  status: ProductStatus.Draft,
  exclude_from_membership: false,
  show_on_homepage: true,
  sort_order: 0,
  variants: [] as VariantForm[]
});

// 会员免费 computed
const membershipFree = computed({
  get: () => !form.exclude_from_membership,
  set: val => (form.exclude_from_membership = !val)
});

// 生成唯一 key
let variantKeyCounter = 0;
const generateKey = () => `variant_${Date.now()}_${++variantKeyCounter}`;

// 监听弹窗打开，加载数据
watch(
  () => props.modelValue,
  async val => {
    if (val) {
      if (props.mode === "edit" && props.product) {
        await loadProduct();
      } else {
        resetForm();
        // 新建时默认添加一个规格
        handleAddVariant();
      }
    }
  }
);

// 加载商品数据
const loadProduct = async () => {
  if (!props.product) return;

  try {
    loading.value = true;
    const res = await getProductAdminApi(props.product.id);
    if (res.code === 200 && res.data) {
      const data = res.data;
      form.title = data.title;
      form.description = data.description || "";
      form.cover_url = data.cover_url || "";
      form.status = data.status;
      form.exclude_from_membership = data.exclude_from_membership;
      form.show_on_homepage = data.show_on_homepage;
      form.sort_order = data.sort_order;
      form.variants = data.variants.map(v => ({
        _key: generateKey(),
        id: v.id,
        name: v.name,
        price: v.price,
        priceYuan: v.price / 100,
        delivery_method: v.delivery_method,
        fixed_reply_content: v.fixed_reply_content,
        sort_order: v.sort_order
      }));
    }
  } catch (error) {
    console.error("加载商品信息失败:", error);
    ElMessage.error({
      message: "加载商品信息失败",
      customClass: "high-z-index-message"
    });
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  form.title = "";
  form.description = "";
  form.cover_url = "";
  form.status = ProductStatus.Draft;
  form.exclude_from_membership = false;
  form.show_on_homepage = true;
  form.sort_order = 0;
  form.variants = [];
};

// 更新规格价格（元转分）
const updateVariantPrice = (variant: VariantForm) => {
  variant.price = Math.round((variant.priceYuan || 0) * 100);
};

// 添加规格
const handleAddVariant = () => {
  const isFirst = form.variants.length === 0;
  form.variants.push({
    _key: generateKey(),
    name: isFirst ? "默认规格" : "",
    price: 0,
    priceYuan: 0,
    delivery_method: DeliveryMethod.Fixed,
    fixed_reply_content: "",
    sort_order: form.variants.length
  });

  // 滚动到新添加的规格
  nextTick(() => {
    const container = document.querySelector(".variants-list");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
};

// 删除规格
const handleRemoveVariant = (index: number) => {
  form.variants.splice(index, 1);
};

// 预览封面
const previewCover = () => {
  if (form.cover_url) {
    window.open(form.cover_url, "_blank");
  }
};

// 提交表单
const handleSubmit = async () => {
  // 验证
  if (!form.title.trim()) {
    ElMessage.warning({
      message: "请输入商品名称",
      customClass: "high-z-index-message"
    });
    return;
  }

  if (form.variants.length === 0) {
    ElMessage.warning({
      message: "请至少添加一个规格",
      customClass: "high-z-index-message"
    });
    return;
  }

  // 验证规格
  for (let i = 0; i < form.variants.length; i++) {
    const v = form.variants[i];
    if (!v.name.trim()) {
      ElMessage.warning({
        message: `请填写规格 ${i + 1} 的名称`,
        customClass: "high-z-index-message"
      });
      return;
    }
    if (
      v.delivery_method === DeliveryMethod.Fixed &&
      !v.fixed_reply_content?.trim()
    ) {
      ElMessage.warning({
        message: `请填写规格 ${i + 1} 的发货内容`,
        customClass: "high-z-index-message"
      });
      return;
    }
  }

  try {
    submitting.value = true;

    // 转换规格数据
    const variants = form.variants.map((v, index) => ({
      id: v.id,
      name: v.name,
      price: Math.round((v.priceYuan || 0) * 100),
      delivery_method: v.delivery_method,
      fixed_reply_content: v.fixed_reply_content,
      sort_order: index
    }));

    const data = {
      title: form.title,
      description: form.description,
      cover_url: form.cover_url,
      status: form.status,
      exclude_from_membership: form.exclude_from_membership,
      show_on_homepage: form.show_on_homepage,
      sort_order: form.sort_order,
      variants
    };

    if (props.mode === "create") {
      await createProductApi(data);
      ElMessage.success({
        message: "创建成功",
        customClass: "high-z-index-message"
      });
    } else if (props.product) {
      await updateProductApi(props.product.id, data);
      ElMessage.success({
        message: "保存成功",
        customClass: "high-z-index-message"
      });
    }

    emit("update:modelValue", false);
    emit("refresh");
  } catch (error) {
    console.error("保存失败:", error);
    ElMessage.error({
      message: "保存失败",
      customClass: "high-z-index-message"
    });
  } finally {
    submitting.value = false;
  }
};

// 对话框关闭
const handleClosed = () => {
  resetForm();
};
</script>

<style lang="scss" scoped>
.product-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--anzhiyu-secondbg);
    border-radius: 2px;

    &:hover {
      background: var(--anzhiyu-theme);
    }
  }
}

// 分区样式
.form-section {
  background: var(--anzhiyu-secondbg);
  border-radius: 12px;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--anzhiyu-card-border);
    border-radius: 12px 12px 0 0;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);

      .el-icon {
        font-size: 16px;
        color: var(--anzhiyu-theme);
      }
    }
  }

  .section-content {
    padding: 16px;
    padding-bottom: 20px;
  }
}

// 表单项
.form-item {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  .form-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--anzhiyu-fontcolor);
    margin-bottom: 8px;

    &.required::after {
      content: "*";
      color: #f56c6c;
      margin-left: 4px;
    }
  }
}

// 标题输入框
.title-input {
  :deep(.el-input__wrapper) {
    font-size: 15px;
    font-weight: 500;
  }
}

// 封面输入
.cover-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-start;

  .el-input {
    flex: 1;
  }

  .cover-preview {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.05);
    }

    .el-image {
      width: 100%;
      height: 100%;
    }

    .cover-error {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--anzhiyu-card-bg);

      .el-icon {
        font-size: 20px;
        color: var(--anzhiyu-secondtext);
      }
    }
  }
}

// 弹性布局
.flex-row {
  display: flex;
  gap: 16px;
}

.flex-1 {
  flex: 1;
}

// 设置行
.settings-row {
  padding: 12px 0 4px;
  border-top: 1px dashed var(--anzhiyu-card-border);
  margin-top: 16px;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  .setting-item {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;

    .setting-label {
      font-size: 13px;
      color: var(--anzhiyu-secondtext);
      white-space: nowrap;
    }
  }

  .status-radio-group {
    :deep(.el-radio-button__inner) {
      padding: 5px 10px;
      font-size: 12px;
      border-radius: 0;
    }

    :deep(.el-radio-button:first-child .el-radio-button__inner) {
      border-radius: 6px 0 0 6px;
    }

    :deep(.el-radio-button:last-child .el-radio-button__inner) {
      border-radius: 0 6px 6px 0;
    }
  }
}

// 规格区域
.variants-section {
  .section-content {
    padding: 12px;
  }
}

// 空状态
.empty-variants {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--anzhiyu-secondtext);

  .empty-icon {
    font-size: 36px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 13px;
  }
}

// 规格列表
.variants-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 规格卡片
.variant-card {
  background: var(--anzhiyu-card-bg);
  border-radius: 10px;
  border: 1px solid var(--anzhiyu-card-border);
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    border-color: var(--anzhiyu-theme);
  }

  .variant-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--anzhiyu-secondbg);

    .variant-index {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: var(--anzhiyu-theme);
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .variant-name-input {
      flex: 1;

      :deep(.el-input__wrapper) {
        background: var(--anzhiyu-card-bg);
        box-shadow: none;
        border: 1px solid transparent;

        &:hover,
        &.is-focus {
          border-color: var(--anzhiyu-theme);
        }
      }
    }
  }

  .variant-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

// 价格输入
.price-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .price-input-group {
    display: flex;
    align-items: center;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;
    padding: 0 12px;
    height: 40px;

    .currency {
      font-size: 16px;
      font-weight: 600;
      color: #f56c6c;
      margin-right: 4px;
    }

    .price-input {
      width: 100px;

      :deep(.el-input__wrapper) {
        background: transparent;
        box-shadow: none;
        padding: 0;

        .el-input__inner {
          font-size: 18px;
          font-weight: 600;
          color: #f56c6c;
          text-align: left;
        }
      }
    }
  }

  .price-hint {
    font-size: 13px;
    color: var(--anzhiyu-secondtext);
  }
}

// 发货方式
.delivery-row {
  .delivery-options {
    width: 100%;

    :deep(.el-radio-button) {
      flex: 1;

      .el-radio-button__inner {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px 16px;
        border-radius: 8px;
        border: 1px solid var(--anzhiyu-card-border);
        box-shadow: none;

        .el-icon {
          font-size: 14px;
        }
      }

      &:first-child .el-radio-button__inner {
        border-radius: 8px 0 0 8px;
      }

      &:last-child .el-radio-button__inner {
        border-radius: 0 8px 8px 0;
      }

      &.is-active .el-radio-button__inner {
        background: var(--anzhiyu-theme);
        border-color: var(--anzhiyu-theme);
      }
    }
  }
}

// 发货内容容器（固定高度）
.delivery-content-wrapper {
  min-height: 60px;
  display: flex;
  flex-direction: column;
}

// 发货内容
.delivery-content {
  flex: 1;

  :deep(.el-textarea__inner) {
    background: var(--anzhiyu-secondbg);
    border: none;
    border-radius: 8px;
    min-height: 54px !important;
  }
}

// 卡密提示
.stock-hint {
  flex: 1;
  display: flex;
  min-height: 54px;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: var(--anzhiyu-theme-op);
  border-radius: 8px;
  font-size: 13px;
  color: var(--anzhiyu-theme);

  .el-icon {
    font-size: 14px;
  }
}

// 规格列表动画
.variant-list-enter-active,
.variant-list-leave-active {
  transition: all 0.3s ease;
}

.variant-list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.variant-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.variant-list-move {
  transition: transform 0.3s ease;
}

// 响应式适配
@media screen and (width <= 768px) {
  .flex-row {
    flex-direction: column;
    gap: 12px;
  }

  .settings-row {
    flex-direction: row;
    flex-wrap: wrap;

    .setting-item {
      min-width: 120px;
    }
  }
}
</style>
