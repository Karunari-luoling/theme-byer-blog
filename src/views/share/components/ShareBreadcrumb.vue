<template>
  <div class="share-breadcrumb-wrapper" @click="switchToEditMode">
    <div v-if="!isEditing" class="share-breadcrumb">
      <el-tooltip content="返回根目录" placement="bottom" :show-arrow="false">
        <el-icon class="home-icon" @click.stop="onNavigate('')">
          <HomeFilled />
        </el-icon>
      </el-tooltip>
      <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item
          v-for="(segment, index) in pathSegments"
          :key="segment.id || 'root'"
        >
          <!-- 最后一个 segment 且需要显示下拉菜单时 -->
          <el-dropdown
            v-if="isLastSegment(index) && showDropdown"
            trigger="click"
            placement="bottom-start"
            @command="handleCommand"
            @visible-change="isDropdownVisible = $event"
          >
            <span class="el-dropdown-link" @click.stop>
              {{ segment.name }}
              <IconifyIconOnline
                icon="raphael:arrowdown"
                class="el-icon--right"
              />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="{ action: 'enter' }">
                  <IconifyIconOffline :icon="Back" class="dropdown-icon" />进入
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'download' }">
                  <IconifyIconOffline
                    :icon="Download"
                    class="dropdown-icon"
                  />下载
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 其他情况，作为普通链接 -->
          <span v-else class="is-link" @click.stop="onNavigate(segment.id)">
            {{ segment.name }}
          </span>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div v-else class="input-mode">
      <el-tooltip content="返回根目录" placement="bottom" :show-arrow="false">
        <el-icon class="home-icon" @click.stop="onNavigate('')">
          <HomeFilled />
        </el-icon>
      </el-tooltip>
      <el-input
        ref="pathInputRef"
        v-model="pathInput"
        placeholder="请输入文件夹名称后按 Enter"
        @blur="handleSubmit"
        @keydown.enter.prevent="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from "vue";
import { ElMessage } from "element-plus";

import { HomeFilled, ArrowRight } from "@element-plus/icons-vue";
import Back from "@iconify-icons/ep/back";
import Download from "@iconify-icons/ep/download";
import InfoFilled from "@iconify-icons/ep/info-filled";

interface PathSegment {
  id: string;
  name: string;
}

const props = defineProps<{
  segments: PathSegment[];
  currentFolderInfo?: { id: string; name: string } | null;
  showDropdown?: boolean;
}>();

const emit = defineEmits<{
  (e: "navigate", folderId: string): void;
  (e: "download-folder", id: string): void;
}>();

const isEditing = ref(false);
const pathInput = ref("");
const pathInputRef = ref<HTMLInputElement | null>(null);
const isDropdownVisible = ref(false);

const pathSegments = computed(() => {
  return [{ id: "", name: "共享文件" }, ...props.segments];
});

const isLastSegment = (index: number) => {
  return (
    index === pathSegments.value.length - 1 && pathSegments.value.length > 1
  );
};

const onNavigate = (folderId: string) => {
  emit("navigate", folderId);
};

const switchToEditMode = () => {
  if (isDropdownVisible.value) return;
  isEditing.value = true;
  // 设置当前路径为输入框的初始值
  pathInput.value = pathSegments.value
    .slice(1)
    .map(s => s.name)
    .join("/");
  nextTick(() => {
    pathInputRef.value?.focus();
  });
};

const handleSubmit = () => {
  const inputValue = pathInput.value.trim();

  isEditing.value = false;

  if (!inputValue) {
    // 如果输入为空，返回根目录
    onNavigate("");
    return;
  }

  // 在分享页面中，我们只能通过当前面包屑来导航
  // 用户输入的路径名需要在当前面包屑中查找匹配
  const parts = inputValue.split("/").filter(Boolean);

  // 尝试匹配最后一个部分
  if (parts.length > 0) {
    const targetName = parts[parts.length - 1];
    const matchedSegment = pathSegments.value.find(
      s => s.name.toLowerCase() === targetName.toLowerCase()
    );

    if (matchedSegment) {
      onNavigate(matchedSegment.id);
    } else {
      ElMessage.warning(`未找到名为 "${targetName}" 的文件夹`);
    }
  }
};

interface CommandPayload {
  action: string;
}

const handleCommand = (command: CommandPayload) => {
  const { action } = command;
  if (!props.currentFolderInfo?.id) {
    ElMessage.warning("无法获取当前目录信息");
    return;
  }

  switch (action) {
    case "enter":
      onNavigate(props.currentFolderInfo.id);
      break;
    case "download":
      emit("download-folder", props.currentFolderInfo.id);
      break;
    default:
      ElMessage.info(`功能 [${action}] 正在开发中...`);
      break;
  }
};

watch(
  () => props.segments,
  () => {
    // 当面包屑变化时，更新输入框的值
    pathInput.value = props.segments.map(s => s.name).join("/");
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
// 移动端下拉菜单优化
@media screen and (width <= 768px) {
  :deep(.el-dropdown-menu) {
    min-width: 200px;
    padding: 8px 0;

    .el-dropdown-menu__item {
      display: flex;
      align-items: center;
      min-height: 44px;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.5;

      .dropdown-icon {
        width: 20px;
        height: 20px;
        margin-right: 10px;
        font-size: 18px;
      }

      &.el-dropdown-menu__item--divided {
        margin-top: 8px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }
  }

  // 确保下拉菜单在移动端可点击
  :deep(.el-popper) {
    .el-dropdown-menu__item {
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
  }
}

@media screen and (width <= 576px) {
  :deep(.el-dropdown-menu) {
    max-width: 90vw;

    .el-dropdown-menu__item {
      min-height: 48px;
      padding: 14px 16px;
      font-size: 15px;
    }
  }
}

.dropdown-icon {
  margin-right: 8px;
}

:root {
  --style-border: 1px solid #e0e0e0;
}

.share-breadcrumb-wrapper {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 24px;
  overflow: hidden;
  cursor: text;
  background-color: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;

  @media screen and (width <= 768px) {
    min-height: 48px;
    padding: 0 16px;
    border-radius: 10px;
  }
}

.share-breadcrumb {
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;

  @media screen and (width <= 768px) {
    :deep(.el-breadcrumb) {
      flex: 1;
      overflow: hidden;

      .el-breadcrumb__item {
        max-width: none;

        .el-breadcrumb__inner {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  @media screen and (width <= 576px) {
    :deep(.el-breadcrumb) {
      .el-breadcrumb__item {
        .el-breadcrumb__inner {
          max-width: 80px;
        }
      }
    }
  }
}

.home-icon {
  flex-shrink: 0;
  margin-right: 12px;
  font-size: 16px;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;

  @media screen and (width <= 768px) {
    margin-right: 10px;
    font-size: 18px;
  }
}

.home-icon:hover {
  color: var(--el-color-primary);
}

.is-link {
  display: inline-block;
  padding: 8px;
  font-weight: normal;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;

  @media screen and (width <= 768px) {
    padding: 10px 12px;
    font-size: 14px;
  }
}

.is-link:hover {
  color: var(--anzhiyu-white) !important;
  background-color: var(--anzhiyu-main);
}

.el-breadcrumb__item:not(:last-child) .is-link {
  font-weight: normal;
  color: var(--anzhiyu-fontcolor);
}

.el-breadcrumb__item:first-child .is-link {
  color: var(--anzhiyu-fontcolor);
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  padding: 8px;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;

  @media screen and (width <= 768px) {
    padding: 10px 12px;
    font-size: 15px;
  }
}

.el-dropdown-link .el-icon--right {
  display: inline-flex;
  align-items: center;
  margin-left: 5px;
  font-size: 12px;

  @media screen and (width <= 768px) {
    font-size: 14px;
  }
}

.el-dropdown-link:hover {
  color: var(--anzhiyu-white);
  background-color: var(--anzhiyu-main) !important;
}

.input-mode {
  display: flex;
  align-items: center;
  width: 100%;

  @media screen and (width <= 768px) {
    :deep(.el-input__inner) {
      height: 40px;
      font-size: 15px;
      line-height: 40px;
    }
  }

  :deep(.el-input__wrapper) {
    padding: 4px !important;
    box-shadow: none !important;

    &:hover {
      box-shadow: none !important;
    }
  }
}
</style>
