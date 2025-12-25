<template>
  <el-dialog
    v-model="localVisible"
    :title="modalTitle"
    width="60%"
    top="10vh"
    :close-on-click-modal="false"
    class="move-modal"
    @closed="handleModalClosed"
  >
    <div
      v-if="localVisible"
      v-loading="isInitializing"
      element-loading-text="正在初始化..."
      class="move-modal-content"
    >
      <el-aside width="280px" class="tree-aside">
        <div class="tree-scroll-container">
          <el-tree
            v-if="!isInitializing"
            ref="folderTreeRef"
            :data="treeData"
            :props="{
              label: 'name',
              children: 'children',
              isLeaf: 'isLeaf',
              disabled: 'disabled'
            }"
            node-key="path"
            highlight-current
            :expand-on-click-node="false"
            :default-expanded-keys="defaultExpandedKeys"
            :current-node-key="currentPath"
            @node-click="handleTreeNodeClick"
            @node-expand="handleNodeExpand"
          >
            <template #default="{ node, data }">
              <div v-if="data.isOptimisticNode" class="optimistic-loading-node">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span class="ml-2">{{ node.label }}</span>
              </div>
              <div
                v-else-if="data.isLoadMoreNode"
                class="load-more-node"
                @click.stop="handleLoadMoreInTree(node)"
              >
                <span>{{ node.label }}</span>
              </div>
              <span
                v-else-if="!data.isDummy"
                class="custom-tree-node"
                :class="{ 'is-current-path': node.data.path === currentPath }"
              >
                <el-icon class="folder-icon"><Folder /></el-icon>
                <span class="ml-2">{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </div>
      </el-aside>

      <el-main class="file-browser-main">
        <div class="flex w-full">
          <FileBreadcrumb
            :key="currentPath"
            class="flex-1 mb-2"
            :path="currentPath"
            @navigate="navigateToPath"
          />
          <FileToolbar
            class="mb-2 ml-2"
            :view-mode="viewMode"
            :sort-key="sortKey"
            :page-size="pageSize"
            :columns="activeColumns"
            :has-selection="false"
            :is-simplified="true"
            @refresh="handleModalRefresh"
            @set-view-mode="handleSetViewMode"
            @set-sort-key="handleSetSortKey"
            @set-page-size="handleSetPageSize"
          />
        </div>

        <div
          ref="fileContentAreaRef"
          v-loading="listLoading"
          class="file-content-area"
        >
          <template v-if="!listLoading">
            <FileListView
              v-if="viewMode === 'list'"
              :key="currentPath"
              :files="filesInModal"
              :columns="activeColumns"
              :sort-key="sortKey"
              :loading="false"
              :selected-file-ids="new Set()"
              :disabled-file-ids="disabledIdsForRightPanel"
              :is-more-loading="isMoreLoading"
              :has-more="hasMore"
              @navigate-to="navigateToPath"
              @scroll-to-load="loadMoreFiles"
            />
            <FileGridView
              v-if="viewMode === 'grid'"
              :key="currentPath"
              :files="filesInModal"
              :loading="false"
              :selected-file-ids="new Set()"
              :disabled-file-ids="disabledIdsForRightPanel"
              :is-more-loading="isMoreLoading"
              @navigate-to="navigateToPath"
            />
          </template>
        </div>
      </el-main>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="target-info" :title="targetPathBreadcrumb">
          <template v-if="currentTargetFolderInfo">
            {{ props.mode === "move" ? "移动到:" : "复制到:" }}
            <el-icon class="ml-2 mr-1"><Folder /></el-icon>
            <span class="font-bold target-path-text">{{
              targetPathBreadcrumb
            }}</span>
          </template>
          <template v-else>
            <span class="text-gray-400">请选择一个目标文件夹</span>
          </template>
        </div>
        <div>
          <el-button @click="localVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="isSubmitting"
            :disabled="!currentTargetFolderInfo || isSubmitting"
            @click="confirmAction"
          >
            {{ confirmButtonText }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { PropType, WatchStopHandle } from "vue";
import { ElMessage, ElTree } from "element-plus";
import { Folder, Loading } from "@element-plus/icons-vue";

import { useFileStore } from "@/store/modules/fileStore";

import FileToolbar from "./FileToolbar.vue";
import FileBreadcrumb from "./FileBreadcrumb.vue";
// 使用动态导入避免与其他地方的动态导入冲突
import { defineAsyncComponent } from "vue";
import {
  fetchFilesByPathApi,
  moveFilesApi,
  copyFilesApi
} from "@/api/sys-file/sys-file";
import {
  type FileItem,
  FileType,
  type ParentInfo,
  type FileListResponse,
  type ColumnConfig
} from "@/api/sys-file/type";
import { extractLogicalPathFromUri, getParentPath } from "@/utils/fileUtils";

const FileListView = defineAsyncComponent(() => import("./FileListView.vue"));
const FileGridView = defineAsyncComponent(() => import("./FileGridView.vue"));

// 类型定义
type ElTreeNode = NonNullable<
  ReturnType<InstanceType<typeof ElTree>["getNode"]>
>;
type SortKey =
  | "name_asc"
  | "name_desc"
  | "size_asc"
  | "size_desc"
  | "updated_at_asc"
  | "updated_at_desc"
  | "created_at_asc"
  | "created_at_desc";
type CachedApiData = FileListResponse["data"] & { hasMore: boolean };
interface TreeNodeData {
  id: string;
  name: string;
  path: string;
  children?: TreeNodeData[];
  isLeaf: boolean;
  disabled: boolean;
  isLoadMoreNode?: boolean;
  isLoading?: boolean;
  isLoaded?: boolean;
  isOptimisticNode?: boolean;
  isDummy?: boolean; // 用于识别占位符子节点
}
type LoadMoreNodeData = Required<
  Pick<TreeNodeData, "id" | "name" | "path" | "isLoadMoreNode">
>;
type UnifiedNodeData = TreeNodeData | LoadMoreNodeData;

// Props & Emits
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  itemsForAction: { type: Array as PropType<FileItem[]>, default: () => [] },
  mode: { type: String as PropType<"move" | "copy">, required: true }
});
const emit = defineEmits(["update:modelValue", "success"]);

// Store 实例
const fileStore = useFileStore();

// 基础状态和计算属性
const modalTitle = computed(() =>
  props.mode === "move" ? "移动到" : "复制到"
);
const confirmButtonText = computed(() =>
  props.mode === "move" ? "确定移动" : "确定复制"
);
const localVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});
const idsForActionSet = computed(
  () => new Set(props.itemsForAction.map(item => item.id))
);
const targetPathBreadcrumb = computed(() => {
  if (!currentTargetFolderInfo.value?.path) return "我的文件";
  const path = extractLogicalPathFromUri(currentTargetFolderInfo.value.path);
  if (path === "/") return "我的文件";
  const segments = path.split("/").filter(Boolean);
  return `我的文件 / ${segments.join(" / ")}`;
});

const defaultColumns: ColumnConfig[] = [
  { type: 0, width: 380 },
  { type: 1, width: 120 },
  { type: 2, width: 180 }
];
const activeColumns = computed<ColumnConfig[]>(() => {
  const data = sharedDataSource.get(currentPath.value);
  const apiColumns = data?.view?.columns;
  return Array.isArray(apiColumns) && apiColumns.length > 0
    ? apiColumns
    : defaultColumns;
});
const isActionOnFolders = computed(() =>
  props.itemsForAction.some(item => item.type === FileType.Dir)
);
const sourceActionFolderPaths = computed(() => {
  if (!isActionOnFolders.value) return new Set();
  return new Set(
    props.itemsForAction
      .filter(item => item.type === FileType.Dir)
      .map(item => extractLogicalPathFromUri(item.path))
  );
});
const disabledIdsForRightPanel = computed(() => {
  const fileIdsInView = filesInModal.value
    .filter(item => item.type !== FileType.Dir)
    .map(item => item.id);
  return new Set([...idsForActionSet.value, ...fileIdsInView]);
});

// 组件引用
const folderTreeRef = ref<InstanceType<typeof ElTree>>();

// 状态管理
const isInitializing = ref(false);
const listLoading = ref(false);
const isMoreLoading = ref(false);
const isSubmitting = ref(false);

// 数据模型
const sharedDataSource = new Map<string, CachedApiData>();
const currentPath = ref("/");
const filesInModal = ref<FileItem[]>([]);
const hasMore = ref(true);
const currentTargetFolderInfo = ref<ParentInfo | null>(null);
const defaultExpandedKeys = ref<string[]>([]);
const treeData = ref<TreeNodeData[]>([]);

// 视图状态 (从 Store 读取)
const viewMode = computed(() => fileStore.viewMode);
const sortKey = computed(() => fileStore.sortKey);
const pageSize = computed(() => fileStore.pageSize);

// 辅助函数
const DUMMY_CHILD_NODE: TreeNodeData = {
  id: "dummy",
  path: "dummy",
  name: "dummy",
  isLeaf: true,
  disabled: true,
  isDummy: true
};

const isTreeNodeDisabled = (path: string, id: string): boolean => {
  if (idsForActionSet.value.has(id)) return true;
  if (isActionOnFolders.value) {
    for (const sourcePath of sourceActionFolderPaths.value) {
      if (path === sourcePath || path.startsWith(sourcePath + "/")) return true;
    }
  }
  return false;
};

const createLoadMoreNode = (
  parentNodeData: TreeNodeData
): LoadMoreNodeData => ({
  id: `load-more-${parentNodeData.path}`,
  name: "加载更多...",
  path: `load-more-${parentNodeData.path}`,
  isLoadMoreNode: true
});

const createOptimisticLoadingNode = (
  parentNodeData: TreeNodeData
): TreeNodeData => ({
  id: `optimistic-loader-${parentNodeData.path}`,
  path: `optimistic-loader-${parentNodeData.path}`,
  name: "正在加载...",
  children: [],
  isLeaf: true,
  disabled: true,
  isLoaded: true,
  isOptimisticNode: true
});

const fileItemToTreeNode = (folder: FileItem): TreeNodeData => {
  const folderPath = extractLogicalPathFromUri(folder.path);
  return {
    id: folder.id,
    name: folder.name,
    path: folderPath,
    children: [DUMMY_CHILD_NODE],
    isLeaf: false,
    disabled: isTreeNodeDisabled(folderPath, folder.id),
    isLoaded: false
  };
};

// 初始化与监听逻辑
let stopStoreWatcher: WatchStopHandle | null = null;

watch(localVisible, isVisible => {
  if (isVisible) {
    initializeComponent();
    console.log("[Store Watch] 弹窗已打开，开始监听全局设置变更...");
    stopStoreWatcher = watch(
      () => [fileStore.sortKey, fileStore.pageSize],
      () => {
        if (isInitializing.value) return;
        console.log(
          "[Store Watch] 检测到全局视图设置变更，正在刷新弹窗内数据..."
        );
        handleModalRefresh();
      }
    );
  } else {
    if (stopStoreWatcher) {
      console.log("[Store Watch] 弹窗已关闭，停止监听全局设置变更。");
      stopStoreWatcher();
      stopStoreWatcher = null;
    }
  }
});

const initializeComponent = async () => {
  console.log("[Init] 🚀 开始初始化移动/复制组件 (稀疏树模式)...");
  isInitializing.value = true;
  await resetState();
  const initialPath = extractLogicalPathFromUri(
    props.itemsForAction[0] ? getParentPath(props.itemsForAction[0].path) : "/"
  );
  console.log(`[Init] 初始目标路径为: ${initialPath}`);

  let data: CachedApiData | null = null;
  if (fileStore.path === initialPath) {
    console.log(
      `[Init] 优化：初始路径与 store 路径一致，直接复用 store 数据，跳过网络请求。`
    );
    data = {
      files: fileStore.files,
      parent: fileStore.parentInfo,
      pagination: {
        page: 1,
        page_size: fileStore.pageSize,
        next_token: fileStore.nextToken,
        is_cursor: true
      },
      view: {
        view: fileStore.viewMode,
        order: fileStore.sortKey.split("_")[0],
        order_direction: fileStore.sortKey.split("_")[1] as "asc" | "desc",
        page_size: fileStore.pageSize,
        columns: fileStore.columns
      },
      hasMore: fileStore.hasMore,
      props: fileStore.currentProps,
      storage_policy: fileStore.storagePolicy,
      context_hint: `来自 store: ${initialPath}`
    };
    sharedDataSource.set(initialPath, data);
  } else {
    console.log(
      `[Init] 初始路径与 store 路径不符 (${fileStore.path})，从 API 获取数据。`
    );
    data = await getDirectoryContents(initialPath, true);
  }

  if (!data) {
    isInitializing.value = false;
    ElMessage.error("初始化文件夹数据失败！");
    return;
  }
  processApiResponse(data, initialPath);

  const pathSegments = initialPath.split("/").filter(Boolean);
  const rootNode: TreeNodeData = {
    id: "/",
    path: "/",
    name: "我的文件",
    children: initialPath === "/" ? [] : [DUMMY_CHILD_NODE],
    isLeaf: false,
    isLoaded: initialPath === "/",
    disabled: isTreeNodeDisabled("/", "/")
  };

  let currentNode = rootNode;
  const expandedKeys = ["/"];

  pathSegments.forEach(segment => {
    const parentPath = currentNode.path;
    const newPath =
      parentPath === "/" ? `/${segment}` : `${parentPath}/${segment}`;
    expandedKeys.push(newPath);
    const newNode: TreeNodeData = {
      id: newPath,
      path: newPath,
      name: segment,
      children: [DUMMY_CHILD_NODE],
      isLeaf: false,
      isLoaded: false,
      disabled: isTreeNodeDisabled(newPath, newPath)
    };
    // 关键: 将新节点作为 *唯一* 子节点，从而构建稀疏路径
    currentNode.children = [newNode];
    currentNode = newNode;
  });

  updateTreeNodeChildren(currentNode, data);
  currentNode.isLoaded = true;

  treeData.value = [rootNode];
  defaultExpandedKeys.value = expandedKeys;
  isInitializing.value = false;
  console.log("[Init] 初始化完成！");
};

// 数据获取与处理
const getDirectoryContents = async (
  path: string,
  forceRefresh = false
): Promise<CachedApiData | null> => {
  const logicalPath = extractLogicalPathFromUri(path);
  if (!forceRefresh && sharedDataSource.has(logicalPath))
    return sharedDataSource.get(logicalPath)!;
  try {
    const res = await fetchFilesByPathApi(logicalPath);
    if (res.code !== 200 || !res.data) {
      ElMessage.error(res.message || "获取文件列表失败");
      return null;
    }
    const dataToCache: CachedApiData = {
      ...res.data,
      hasMore: !!res.data.pagination?.next_token
    };
    sharedDataSource.set(logicalPath, dataToCache);
    return dataToCache;
  } catch (error) {
    ElMessage.error("网络错误，获取文件列表失败");
    return null;
  }
};

const processApiResponse = (data: CachedApiData, path: string) => {
  filesInModal.value = data.files;
  hasMore.value = data.hasMore;
  currentPath.value = path;
  const parentInfo = data.parent;
  if (parentInfo) {
    parentInfo.name =
      extractLogicalPathFromUri(parentInfo.path) === "/"
        ? "我的文件"
        : parentInfo.name;
    currentTargetFolderInfo.value = parentInfo;
  }
};

// Tree 交互逻辑
const updateTreeNodeChildren = (node: TreeNodeData, data: CachedApiData) => {
  const subFolders = data.files
    .filter(item => item.type === FileType.Dir)
    .map((folder): TreeNodeData => {
      const folderPath = extractLogicalPathFromUri(folder.path);
      const existingNode = folderTreeRef.value?.getNode(folderPath);
      if (existingNode) {
        const existingNodeData = existingNode.data as TreeNodeData;
        existingNodeData.name = folder.name;
        existingNodeData.disabled = isTreeNodeDisabled(folderPath, folder.id);
        return existingNodeData;
      } else {
        return fileItemToTreeNode(folder);
      }
    });

  let finalChildren: UnifiedNodeData[] = subFolders;
  const allItemsInResponseAreFolders =
    data.files.length > 0 && data.files.every(f => f.type === FileType.Dir);
  if (data.hasMore && allItemsInResponseAreFolders) {
    finalChildren.push(createLoadMoreNode(node));
  }
  node.children = finalChildren as TreeNodeData[];
  const allFoldersAreLoaded = !data.hasMore || !allItemsInResponseAreFolders;
  if (allFoldersAreLoaded && subFolders.length === 0) {
    node.isLeaf = true;
  }
};

const handleNodeExpand = async (data: TreeNodeData) => {
  if (data.isLoaded || data.isLoading) return;
  if (data.children?.length === 1 && data.children[0].isDummy) {
    data.children = [];
  }
  data.isLoading = true;
  data.children = [createOptimisticLoadingNode(data)];
  const apiData = await getDirectoryContents(data.path);
  if (apiData) {
    updateTreeNodeChildren(data, apiData);
    data.isLoaded = true;
  } else {
    data.children = [];
    data.isLeaf = true;
  }
  data.isLoading = false;
};

const handleTreeNodeClick = (data: TreeNodeData) => {
  if (
    data.disabled ||
    data.isLoadMoreNode ||
    data.isOptimisticNode ||
    data.isDummy
  )
    return;
  navigateToPath(data.path);
};

const handleLoadMoreInTree = async (node: ElTreeNode) => {
  const parentNode = node.parent;
  const parentData = parentNode.data as TreeNodeData;
  const existingData = sharedDataSource.get(parentData.path);
  if (!existingData || !existingData.hasMore) return;
  const res = await fetchFilesByPathApi(
    parentData.path,
    existingData.pagination!.next_token
  );
  if (res.code === 200 && res.data) {
    const existingIds = new Set(existingData.files.map(f => f.id));
    const uniqueNewFiles = res.data.files.filter(f => !existingIds.has(f.id));
    existingData.files.push(...uniqueNewFiles);
    existingData.pagination = res.data.pagination;
    existingData.hasMore = !!res.data.pagination?.next_token;
    sharedDataSource.set(parentData.path, existingData);

    updateTreeNodeChildren(parentData, existingData);
    parentData.children = [...(parentData.children || [])];
  }
};

// 主视图交互逻辑
const navigateToPath = async (path: string) => {
  if (listLoading.value || currentPath.value === path) return;
  listLoading.value = true;
  const data = await getDirectoryContents(path, false);
  if (data) {
    processApiResponse(data, path);
    const nodeData = folderTreeRef.value?.getNode(path)?.data as TreeNodeData;
    if (nodeData && !nodeData.isLoaded) {
      updateTreeNodeChildren(nodeData, data);
      nodeData.isLoaded = true;
    }
  }
  listLoading.value = false;
};

const loadMoreFiles = async () => {
  if (isMoreLoading.value || !hasMore.value) return;
  isMoreLoading.value = true;
  const existingData = sharedDataSource.get(currentPath.value);
  if (!existingData || !existingData.pagination?.next_token) {
    isMoreLoading.value = false;
    return;
  }
  const res = await fetchFilesByPathApi(
    currentPath.value,
    existingData.pagination.next_token
  );
  if (res.code === 200 && res.data) {
    const existingIds = new Set(existingData.files.map(f => f.id));
    const uniqueNewFiles = res.data.files.filter(f => !existingIds.has(f.id));
    existingData.files.push(...uniqueNewFiles);
    existingData.pagination = res.data.pagination;
    existingData.hasMore = !!res.data.pagination?.next_token;
    sharedDataSource.set(currentPath.value, existingData);
    processApiResponse(existingData, currentPath.value);

    const treeNodeData = folderTreeRef.value?.getNode(currentPath.value)
      ?.data as TreeNodeData;
    if (treeNodeData) {
      updateTreeNodeChildren(treeNodeData, existingData);
    }
  }
  isMoreLoading.value = false;
};

// 其他函数与事件处理
const handleModalRefresh = async () => {
  listLoading.value = true;
  const data = await getDirectoryContents(currentPath.value, true);
  if (data) {
    processApiResponse(data, currentPath.value);
    const treeNode = folderTreeRef.value?.getNode(currentPath.value);
    if (treeNode) {
      treeNode.data.isLoaded = false;
      // 清空子节点并重新加载
      handleNodeExpand(treeNode.data as TreeNodeData);
    }
  }
  listLoading.value = false;
};

const resetState = async () => {
  sharedDataSource.clear();
  filesInModal.value = [];
  currentPath.value = "/";
  hasMore.value = true;
  defaultExpandedKeys.value = [];
  currentTargetFolderInfo.value = null;
  treeData.value = [];
};

const handleModalClosed = () => resetState();
const handleSetViewMode = (mode: "list" | "grid") =>
  fileStore.setViewMode(mode);
const handleSetPageSize = (size: number) => fileStore.setPageSize(size);
const handleSetSortKey = (key: SortKey) => fileStore.setSort(key);

const confirmAction = async () => {
  if (!currentTargetFolderInfo.value) {
    ElMessage.warning("无法确定目标文件夹，请重试。");
    return;
  }
  const destination = currentTargetFolderInfo.value;
  const itemsToMove = props.itemsForAction;
  if (itemsToMove.some(item => item.id === destination.id)) {
    ElMessage.error(`操作无效：不能将项目移动或复制到其自身。`);
    return;
  }
  const movingFolders = itemsToMove.filter(item => item.type === FileType.Dir);
  const destinationPath = extractLogicalPathFromUri(destination.path);
  for (const folder of movingFolders) {
    const sourcePath = extractLogicalPathFromUri(folder.path);
    if (
      destinationPath === sourcePath ||
      destinationPath.startsWith(sourcePath + "/")
    ) {
      ElMessage.error(
        `操作无效：不能将文件夹 "${folder.name}" 移动或复制到其子目录中。`
      );
      return;
    }
  }
  isSubmitting.value = true;
  try {
    const sourceIDs = itemsToMove.map(item => item.id);
    const apiToCall = props.mode === "move" ? moveFilesApi : copyFilesApi;
    const res = await apiToCall(sourceIDs, destination.id);
    if (res.code === 200) {
      emit("success", { mode: props.mode });
      localVisible.value = false;
    } else {
      ElMessage.error(res.message || `${modalTitle.value}失败`);
    }
  } catch (error) {
    console.error(`${modalTitle.value} request failed:`, error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style lang="scss">
.move-modal {
  .el-dialog__body {
    padding: 10px 20px;
    margin: 0;
  }

  .move-modal-content {
    display: flex;
    height: 60vh;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
  }

  .tree-aside {
    position: relative;
    width: 280px;
    padding-top: 10px;
    border-right: 1px solid var(--el-border-color-light);

    .tree-scroll-container {
      height: 100%;
      padding-right: 5px;
      padding-left: 5px;
      overflow-y: auto;
    }

    .el-tree {
      background: transparent;
    }

    .custom-tree-node {
      display: flex;
      flex: 1;
      align-items: center;
      font-size: 14px;

      &.is-current-path {
        font-weight: bold;
        color: var(--anzhiyu-theme);
      }
    }

    .load-more-node {
      width: fit-content;
      padding: 4px 8px;
      margin: 4px auto 8px;
      font-size: 13px;
      color: var(--anzhiyu-theme);
      text-align: center;
      cursor: pointer;
      background-color: var(--anzhiyu-theme-op-light);
      border-radius: 12px;
      transition: background-color 0.2s ease;

      &:hover {
        font-weight: 500;
        background-color: var(--el-color-primary-light-8);
      }
    }

    .el-tree-node[aria-disabled="true"] > .el-tree-node__content {
      color: var(--anzhiyu-secondtext);
      cursor: not-allowed;
      background: transparent !important;
      opacity: 0.7;
    }

    .optimistic-loading-node {
      display: flex;
      flex: 1;
      align-items: center;
      padding: 0 8px;
      font-size: 14px;
      color: var(--anzhiyu-secondtext);
      cursor: progress;
    }

    .is-loading {
      animation: rotating 1.5s linear infinite;
    }
  }

  .file-browser-main {
    display: flex;
    flex-direction: column;
    padding: 10px 15px;
    overflow: hidden;

    .file-content-area {
      position: relative;
      flex: 1;
      margin-top: 10px;
      overflow-y: auto;
      background-color: var(--el-bg-color);

      .el-loading-mask {
        background-color: var(--el-mask-color);
      }
    }
  }

  .dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .target-info {
      display: flex;
      align-items: center;
      max-width: 70%;
      font-size: 14px;
      color: var(--anzhiyu-fontcolor);

      .target-path-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
