<template>
  <el-form-item label="动漫列表">
    <div class="comic-list-container">
      <div
        v-for="(comic, index) in comicListModel"
        :key="index"
        class="comic-item"
      >
        <el-card shadow="hover">
          <div class="comic-item-header">
            <span class="comic-index">#{{ index + 1 }}</span>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="removeComic(index)"
            >
              删除
            </el-button>
          </div>

          <el-form-item label="封面图片">
            <el-input
              v-model="comic.cover"
              placeholder="请输入动漫封面图片链接"
            />
          </el-form-item>

          <el-form-item label="链接地址">
            <el-input v-model="comic.href" placeholder="请输入动漫链接地址" />
          </el-form-item>

          <el-form-item label="动漫名称">
            <el-input v-model="comic.name" placeholder="请输入动漫名称" />
          </el-form-item>
        </el-card>
      </div>

      <el-button
        type="primary"
        :icon="Plus"
        class="add-comic-btn"
        @click="addComic"
      >
        添加动漫
      </el-button>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Delete, Plus } from "@element-plus/icons-vue";

interface ComicItem {
  cover: string;
  href: string;
  name: string;
}

// 定义 props 和 emits 以支持 v-model:comic-list
// 使用 camelCase 名称以兼容 TypeScript 类型检查
const props = withDefaults(
  defineProps<{
    comicList: ComicItem[];
  }>(),
  {
    comicList: () => []
  }
);

const emit = defineEmits<{
  "update:comic-list": [value: ComicItem[]];
}>();

const comicListModel = computed({
  get: () => props.comicList,
  set: (val: ComicItem[]) => emit("update:comic-list", val)
});

const addComic = () => {
  const newComic: ComicItem = {
    cover: "",
    href: "",
    name: ""
  };
  // 使用 computed 的 setter 来触发更新
  comicListModel.value = [...comicListModel.value, newComic];
};

const removeComic = (index: number) => {
  const updatedList = [...comicListModel.value];
  updatedList.splice(index, 1);
  // 使用 computed 的 setter 来触发更新
  comicListModel.value = updatedList;
};
</script>

<style scoped lang="scss">
.comic-list-container {
  .comic-item {
    margin-bottom: 16px;

    .comic-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .comic-index {
        font-weight: bold;
        color: var(--anzhiyu-theme);
      }
    }
  }

  .add-comic-btn {
    width: 100%;
    margin-top: 16px;
  }
}

.el-form-item {
  margin-bottom: 16px;
}
</style>
