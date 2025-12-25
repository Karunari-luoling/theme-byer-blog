<template>
  <el-form-item label="生涯列表">
    <div class="career-list-container">
      <div
        v-for="(career, index) in careerListModel"
        :key="index"
        class="career-item"
      >
        <el-card shadow="hover">
          <div class="career-item-header">
            <span class="career-index">#{{ index + 1 }}</span>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="removeCareer(index)"
            >
              删除
            </el-button>
          </div>

          <el-form-item label="颜色">
            <el-color-picker
              v-model="career.color"
              show-alpha
              placeholder="请选择颜色"
            />
          </el-form-item>

          <el-form-item label="描述">
            <el-input v-model="career.desc" placeholder="请输入生涯描述" />
          </el-form-item>
        </el-card>
      </div>

      <el-button
        type="primary"
        :icon="Plus"
        class="add-career-btn"
        @click="addCareer"
      >
        添加生涯
      </el-button>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Delete, Plus } from "@element-plus/icons-vue";

interface CareerItem {
  color: string;
  desc: string;
}

// 定义 props 和 emits 以支持 v-model:career-list
// 使用 camelCase 名称以兼容 TypeScript 类型检查
const props = withDefaults(
  defineProps<{
    careerList: CareerItem[];
  }>(),
  {
    careerList: () => []
  }
);

const emit = defineEmits<{
  "update:career-list": [value: CareerItem[]];
}>();

const careerListModel = computed({
  get: () => props.careerList,
  set: (val: CareerItem[]) => emit("update:career-list", val)
});

const addCareer = () => {
  const newCareer: CareerItem = {
    color: "var(--anzhiyu-theme)",
    desc: ""
  };
  // 使用 computed 的 setter 来触发更新
  careerListModel.value = [...careerListModel.value, newCareer];
};

const removeCareer = (index: number) => {
  const updatedList = [...careerListModel.value];
  updatedList.splice(index, 1);
  // 使用 computed 的 setter 来触发更新
  careerListModel.value = updatedList;
};
</script>

<style scoped lang="scss">
.career-list-container {
  .career-item {
    margin-bottom: 16px;

    .career-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .career-index {
        font-weight: bold;
        color: var(--anzhiyu-theme);
      }
    }
  }

  .add-career-btn {
    width: 100%;
    margin-top: 16px;
  }
}

.el-form-item {
  margin-bottom: 16px;
}
</style>
