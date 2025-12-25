<template>
  <el-form label-position="top" class="essay-settings-form">
    <el-divider content-position="left">
      <h3>即刻（说说）配置</h3>
    </el-divider>

    <!-- 基本配置区域 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><Edit /></el-icon>
        基本配置
      </h4>
      <div class="config-grid">
        <el-form-item label="页面标题">
          <el-input
            v-model="localValue.title"
            placeholder="请输入即刻页面标题"
            clearable
            @update:model-value="handleUpdate"
          />
          <div class="form-item-help">即刻页面显示的主标题，如：即刻短文。</div>
        </el-form-item>

        <el-form-item label="页面副标题">
          <el-input
            v-model="localValue.subTitle"
            placeholder="请输入即刻页面副标题"
            clearable
            @update:model-value="handleUpdate"
          />
          <div class="form-item-help">
            即刻页面显示的副标题，如：咸鱼的日常生活。
          </div>
        </el-form-item>

        <el-form-item label="提示文字">
          <el-input
            v-model="localValue.tips"
            placeholder="请输入提示文字"
            clearable
            @update:model-value="handleUpdate"
          />
          <div class="form-item-help">
            即刻页面的引导提示文字，如：随时随地，分享生活。
          </div>
        </el-form-item>

        <el-form-item label="顶部背景图">
          <el-input
            v-model="localValue.topBackground"
            placeholder="请输入顶部背景图片链接"
            clearable
            @update:model-value="handleUpdate"
          >
            <template #prepend>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <div class="form-item-help">即刻页面顶部横幅的背景图片。</div>
        </el-form-item>
      </div>
    </div>

    <!-- 按钮配置区域 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><Link /></el-icon>
        按钮配置
      </h4>
      <div class="config-grid">
        <el-form-item label="按钮文字">
          <el-input
            v-model="localValue.buttonText"
            placeholder="请输入按钮文字"
            clearable
            @update:model-value="handleUpdate"
          />
          <div class="form-item-help">即刻页面按钮显示的文字，如：关于我。</div>
        </el-form-item>

        <el-form-item label="按钮链接">
          <el-input
            v-model="localValue.buttonLink"
            placeholder="请输入按钮跳转链接"
            clearable
            @update:model-value="handleUpdate"
          >
            <template #prepend>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <div class="form-item-help">
            点击按钮后跳转的链接地址，如：/about。
          </div>
        </el-form-item>
      </div>
    </div>

    <!-- 显示配置区域 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><Setting /></el-icon>
        显示配置
      </h4>
      <div class="config-grid">
        <el-form-item label="首页显示">
          <el-switch
            v-model="localValue.homeEnable"
            active-text="开启"
            inactive-text="关闭"
            @update:model-value="handleUpdate"
          />
          <div class="form-item-help">是否在首页显示即刻模块。</div>
        </el-form-item>

        <el-form-item label="每页显示数量">
          <el-input-number
            v-model="localValue.limit"
            :min="1"
            :max="100"
            :step="5"
            controls-position="right"
            @update:model-value="handleUpdate"
          />
          <div class="form-item-help">
            即刻列表每页显示的条目数量，建议：30。
          </div>
        </el-form-item>
      </div>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { Edit, Link, Setting } from "@element-plus/icons-vue";

interface EssaySettings {
  title: string;
  subTitle: string;
  tips: string;
  buttonText: string;
  buttonLink: string;
  limit: number;
  homeEnable: boolean;
  topBackground: string;
}

const props = defineProps<{
  modelValue: EssaySettings;
}>();

const emit = defineEmits(["update:modelValue"]);

const localValue = reactive<EssaySettings>({
  title: props.modelValue.title || "即刻短文",
  subTitle: props.modelValue.subTitle || "咸鱼的日常生活。",
  tips: props.modelValue.tips || "随时随地，分享生活",
  buttonText: props.modelValue.buttonText || "关于我",
  buttonLink: props.modelValue.buttonLink || "/about",
  limit: props.modelValue.limit || 30,
  homeEnable: props.modelValue.homeEnable ?? true,
  topBackground:
    props.modelValue.topBackground ||
    "https://img02.anheyu.com/adminuploads/1/2022/08/21/630249e2df20f.jpg"
});

watch(
  () => props.modelValue,
  newValue => {
    Object.assign(localValue, newValue);
  },
  { deep: true }
);

const handleUpdate = () => {
  emit("update:modelValue", { ...localValue });
};
</script>

<style scoped lang="scss">
.essay-settings-form {
  max-width: 800px;
}

.el-divider {
  margin: 0 0 28px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }
}

.config-section {
  margin-bottom: 40px;

  .section-title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 20px;
    font-size: 16px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);

    .el-icon {
      color: var(--anzhiyu-theme);
    }
  }

  .config-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;

    .el-form-item {
      margin-bottom: 0;

      .form-item-help {
        width: 100%;
        margin-top: 4px;
        font-size: 12px;
        line-height: 1.4;
        color: var(--anzhiyu-secondtext);
      }
    }
  }
}

@media (width >= 768px) {
  .config-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

// 移动端适配
@media (width <= 768px) {
  .essay-settings-form {
    padding: 0;
  }

  .el-divider {
    margin: 0 0 20px;

    h3 {
      font-size: 16px;
    }
  }

  .config-section {
    margin-bottom: 28px;

    .section-title {
      gap: 6px;
      margin-bottom: 16px;
      font-size: 15px;

      .el-icon {
        font-size: 18px;
      }
    }

    .config-grid {
      gap: 16px;

      .el-form-item {
        :deep(.el-form-item__label) {
          padding-bottom: 6px;
          font-size: 14px;
          line-height: 1.5;
        }

        :deep(.el-input__inner) {
          font-size: 14px;
        }

        :deep(.el-input-number) {
          width: 100%;

          .el-input__inner {
            text-align: left;
          }
        }

        :deep(.el-switch) {
          height: 22px;
        }

        :deep(.el-switch__label) {
          font-size: 13px;
        }

        .form-item-help {
          margin-top: 6px;
          font-size: 11px;
          line-height: 1.4;
        }
      }
    }
  }

  // 输入框前置元素
  :deep(.el-input-group__prepend) {
    padding: 0 10px;

    .el-icon {
      font-size: 14px;
    }
  }
}
</style>
