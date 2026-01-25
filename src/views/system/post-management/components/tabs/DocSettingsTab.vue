<!--
 * @Description: 文档模式设置Tab组件
 * @Author: 安知鱼
 * @Date: 2025-12-30
-->
<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { computed, ref, onMounted } from "vue";
import type { ArticleForm, DocSeries } from "@/api/post/type";
import { getDocSeriesList } from "@/api/post";
import { InfoFilled, Document } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const props = defineProps<{
  form: ArticleForm;
}>();

// 文档系列选项
const docSeriesOptions = ref<DocSeries[]>([]);
const isLoadingSeries = ref(false);

// 加载文档系列列表
const loadDocSeriesList = async () => {
  isLoadingSeries.value = true;
  try {
    const res = await getDocSeriesList({ page: 1, pageSize: 100 });
    docSeriesOptions.value = res.data.list || [];
  } catch (error) {
    console.error("加载文档系列失败:", error);
    ElMessage.error("加载文档系列列表失败");
  } finally {
    isLoadingSeries.value = false;
  }
};

// 文档模式开关切换
const handleDocModeChange = (value: boolean) => {
  if (!value) {
    // 关闭文档模式时清空系列ID
    props.form.doc_series_id = undefined;
    props.form.doc_sort = 0;
  }
};

// 当前选中的系列信息
const selectedSeries = computed(() => {
  if (!props.form.doc_series_id) return null;
  return docSeriesOptions.value.find(s => s.id === props.form.doc_series_id);
});

onMounted(() => {
  loadDocSeriesList();
});
</script>

<template>
  <el-form :model="form" label-position="top">
    <el-row :gutter="24">
      <!-- 文档模式开关 -->
      <el-col :span="24">
        <el-form-item>
          <template #label>
            <el-icon style="margin-right: 6px; vertical-align: -2px">
              <Document />
            </el-icon>
            <span>文档模式</span>
            <el-tooltip placement="top" :show-arrow="false">
              <template #content>
                开启文档模式后，该文章将作为文档展示。<br />
                文档页面将使用特殊的三栏布局，<br />
                左侧显示同系列的其他文档，右侧显示目录。
              </template>
              <el-icon class="label-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-switch
            v-model="form.is_doc"
            active-text="开启"
            inactive-text="关闭"
            inline-prompt
            style="--el-switch-on-color: #425aef"
            @change="handleDocModeChange"
          />
        </el-form-item>
      </el-col>

      <!-- 文档系列选择 -->
      <el-col v-if="form.is_doc" :span="12">
        <el-form-item label="文档系列" prop="doc_series_id">
          <template #label>
            <span>文档系列</span>
            <el-tooltip placement="top" :show-arrow="false">
              <template #content>
                选择该文档所属的系列。<br />
                同一系列的文档将在左侧导航栏中显示。
              </template>
              <el-icon class="label-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-select
            v-model="form.doc_series_id"
            placeholder="请选择文档系列"
            style="width: 100%"
            :loading="isLoadingSeries"
            :teleported="false"
            clearable
          >
            <el-option
              v-for="item in docSeriesOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
              <div class="series-option-item">
                <span>{{ item.name }}</span>
                <el-tag size="small" type="info" effect="plain">
                  {{ item.doc_count }} 篇
                </el-tag>
              </div>
            </el-option>
          </el-select>
          <div
            v-if="docSeriesOptions.length === 0 && !isLoadingSeries"
            class="form-item-help"
          >
            暂无文档系列，请先在"文档系列管理"中创建
          </div>
        </el-form-item>
      </el-col>

      <!-- 文档排序 -->
      <el-col v-if="form.is_doc" :span="12">
        <el-form-item label="文档排序" prop="doc_sort">
          <template #label>
            <span>文档排序</span>
            <el-tooltip placement="top" :show-arrow="false">
              <template #content>
                设置该文档在系列中的排序位置。<br />
                数值越小越靠前，相同数值按创建时间排序。
              </template>
              <el-icon class="label-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-input-number
            v-model="form.doc_sort"
            :min="0"
            :max="9999"
            :step="1"
            style="width: 100%"
            placeholder="排序值（越小越靠前）"
          />
        </el-form-item>
      </el-col>

      <!-- 选中系列的预览信息 -->
      <el-col v-if="form.is_doc && selectedSeries" :span="24">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            <span>
              已选择系列：<strong>{{ selectedSeries.name }}</strong>
              <span
                v-if="selectedSeries.description"
                style="margin-left: 12px; color: var(--el-text-color-secondary)"
              >
                {{ selectedSeries.description }}
              </span>
            </span>
          </template>
        </el-alert>
      </el-col>
    </el-row>
  </el-form>
</template>

<style scoped lang="scss">
.label-icon {
  margin-left: 4px;
  cursor: help;
  color: var(--el-text-color-secondary);
}

.form-item-help {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.series-option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
