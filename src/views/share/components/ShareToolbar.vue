<template>
  <div class="h-full overflow-hidden bg-white share-toolbar rounded-2xl">
    <div class="toolbar-actions">
      <el-tooltip content="切换视图" placement="bottom" :show-arrow="false">
        <el-button
          circle
          :icon="viewMode === 'grid' ? Tickets : Grid"
          class="!text-[var(--anzhiyu-white)] !border-none !bg-[var(--anzhiyu-theme)] !ml-0"
          @click="handleToggleView"
        />
      </el-tooltip>

      <el-tooltip content="排序" placement="bottom" :show-arrow="false">
        <div>
          <el-dropdown
            trigger="click"
            placement="bottom-end"
            class="sort-dropdown"
            @command="(key: SortKey) => emit('set-sort-key', key)"
          >
            <el-button
              circle
              :icon="Sort"
              class="!text-[var(--anzhiyu-white)] !border-none !bg-[#6EB65E]"
            />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  command="name_asc"
                  :class="{ active: sortKey === 'name_asc' }"
                  >A-Z</el-dropdown-item
                >
                <el-dropdown-item
                  command="name_desc"
                  :class="{ active: sortKey === 'name_desc' }"
                  >Z-A</el-dropdown-item
                >
                <el-dropdown-item
                  divided
                  command="size_asc"
                  :class="{ active: sortKey === 'size_asc' }"
                  >最小</el-dropdown-item
                >
                <el-dropdown-item
                  command="size_desc"
                  :class="{ active: sortKey === 'size_desc' }"
                  >最大</el-dropdown-item
                >
                <el-dropdown-item
                  divided
                  command="updated_at_desc"
                  :class="{ active: sortKey === 'updated_at_desc' }"
                  >最新修改</el-dropdown-item
                >
                <el-dropdown-item
                  command="updated_at_asc"
                  :class="{ active: sortKey === 'updated_at_asc' }"
                  >最早修改</el-dropdown-item
                >
                <el-dropdown-item
                  divided
                  command="created_at_desc"
                  :class="{ active: sortKey === 'created_at_desc' }"
                  >最新上传</el-dropdown-item
                >
                <el-dropdown-item
                  command="created_at_asc"
                  :class="{ active: sortKey === 'created_at_asc' }"
                  >最早上传</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Grid, Tickets, Sort } from "@element-plus/icons-vue";
import type { SortKey } from "@/store/modules/fileStore";

const props = defineProps<{
  viewMode: "list" | "grid";
  sortKey: SortKey;
}>();

const emit = defineEmits<{
  (e: "set-view-mode", mode: "list" | "grid"): void;
  (e: "set-sort-key", key: SortKey): void;
}>();

const handleToggleView = () => {
  emit("set-view-mode", props.viewMode === "grid" ? "list" : "grid");
};
</script>

<style scoped lang="scss">
.share-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  background-color: var(--anzhiyu-card-bg);
  border: var(--style-border);
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.el-dropdown-menu__item.active) {
  color: var(--el-color-primary, #409eff);
  background-color: var(--el-color-primary-light-9, #ecf5ff);
}
</style>
