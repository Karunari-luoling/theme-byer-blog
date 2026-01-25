<!--
 * @Description: 知识库管理页面
 * @Author: 安知鱼
 * @Date: 2025-01-23
-->
<template>
  <div class="knowledge-management">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div
            class="stat-icon"
            style="background: linear-gradient(135deg, #49b1f5, #36d1dc)"
          >
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_documents || 0 }}</div>
            <div class="stat-label">总文档数</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div
            class="stat-icon"
            style="background: linear-gradient(135deg, #43a047, #66bb6a)"
          >
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.indexed_documents || 0 }}</div>
            <div class="stat-label">已索引</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div
            class="stat-icon"
            style="background: linear-gradient(135deg, #ff9800, #ffb74d)"
          >
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pending_documents || 0 }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div
            class="stat-icon"
            style="background: linear-gradient(135deg, #7c4dff, #b388ff)"
          >
            <el-icon><Collection /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_chunks || 0 }}</div>
            <div class="stat-label">总分块数</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 配置信息 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>知识库配置</span>
          <el-tag v-if="config.enabled" type="success" size="small"
            >已启用</el-tag
          >
          <el-tag v-else type="info" size="small">未启用</el-tag>
        </div>
      </template>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="Embedding 提供者">
          {{ config.embedding_provider || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="Embedding 模型">
          {{ config.embedding_model || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="向量存储">
          {{ config.vector_store || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="向量维度">
          {{ config.vector_dimension || "-" }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 文档列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>文档列表</span>
          <div class="header-actions">
            <el-select
              v-model="filterStatus"
              placeholder="状态筛选"
              clearable
              style="width: 120px"
              @change="loadDocuments"
            >
              <el-option label="全部" value="" />
              <el-option label="已索引" value="indexed" />
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="失败" value="failed" />
            </el-select>
            <el-dropdown @command="handleSyncCommand" trigger="click">
              <el-button type="warning" :loading="syncing">
                <el-icon><Connection /></el-icon>
                同步文章
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="sync">
                    同步所有文章
                  </el-dropdown-item>
                  <el-dropdown-item command="force">
                    强制重新索引
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-upload
              :show-file-list="false"
              :before-upload="handleUpload"
              :accept="supportedTypes.join(',')"
            >
              <el-button type="success" :icon="Upload" :loading="uploading">
                上传文档
              </el-button>
            </el-upload>
            <el-button type="primary" :icon="Plus" @click="showAddDialog">
              添加文档
            </el-button>
            <el-button :icon="Refresh" @click="loadData"> 刷新 </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="documents" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="doc-title">
              <el-tag size="small" :type="getSourceTypeTag(row.source_type)">
                {{ getSourceTypeText(row.source_type) }}
              </el-tag>
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="chunk_count"
          label="分块数"
          width="90"
          align="center"
        />
        <el-table-column
          prop="content_length"
          label="内容长度"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            {{ formatLength(row.content_length) }}
          </template>
        </el-table-column>
        <el-table-column prop="indexed_at" label="索引时间" width="170">
          <template #default="{ row }">
            {{ row.indexed_at ? formatTime(row.indexed_at) : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              link
              type="primary"
              @click="viewDocument(row)"
            >
              查看
            </el-button>
            <el-button
              size="small"
              link
              type="primary"
              @click="reindexDocument(row)"
            >
              重建索引
            </el-button>
            <el-popconfirm
              title="确定删除该文档吗？"
              @confirm="deleteDocument(row)"
            >
              <template #reference>
                <el-button size="small" link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadDocuments"
          @current-change="loadDocuments"
        />
      </div>
    </el-card>

    <!-- 添加文档对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加文档"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="文档标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文档标题" />
        </el-form-item>
        <el-form-item label="文档内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="10"
            placeholder="请输入文档内容（支持 Markdown 格式）"
            show-word-limit
            maxlength="50000"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleAddDocument"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看文档对话框 -->
    <el-drawer v-model="viewDrawerVisible" title="文档详情" size="50%">
      <div v-if="currentDocument" class="doc-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{
            currentDocument.id
          }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{
            currentDocument.title
          }}</el-descriptions-item>
          <el-descriptions-item label="来源类型">
            {{ getSourceTypeText(currentDocument.source_type) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(currentDocument.status)" size="small">
              {{ getStatusText(currentDocument.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分块数">{{
            currentDocument.chunk_count
          }}</el-descriptions-item>
          <el-descriptions-item label="内容长度">
            {{ formatLength(currentDocument.content_length) }}
          </el-descriptions-item>
          <el-descriptions-item label="索引时间">
            {{
              currentDocument.indexed_at
                ? formatTime(currentDocument.indexed_at)
                : "-"
            }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatTime(currentDocument.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentDocument.error_message"
            label="错误信息"
            :span="2"
          >
            <el-text type="danger">{{ currentDocument.error_message }}</el-text>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  Document,
  CircleCheck,
  Clock,
  Collection,
  Plus,
  Refresh,
  Upload,
  Connection,
  ArrowDown
} from "@element-plus/icons-vue";
import {
  getKnowledgeStats,
  getKnowledgeConfig,
  getKnowledgeDocuments,
  indexKnowledgeDocument,
  deleteKnowledgeDocument as deleteDocApi,
  reindexKnowledgeDocument,
  uploadKnowledgeDocument,
  getSupportedFileTypes,
  syncKnowledgeArticles,
  type KnowledgeStats,
  type KnowledgeConfig,
  type KnowledgeDocument
} from "@/api/knowledge";
import type { UploadRawFile } from "element-plus";

// 统计数据
const stats = ref<KnowledgeStats>({
  total_documents: 0,
  indexed_documents: 0,
  pending_documents: 0,
  failed_documents: 0,
  total_chunks: 0,
  total_tokens: 0
});

// 配置
const config = ref<KnowledgeConfig>({
  enabled: false,
  embedding_provider: "",
  embedding_model: "",
  vector_store: "",
  vector_dimension: 0
});

// 文档列表
const documents = ref<KnowledgeDocument[]>([]);
const loading = ref(false);
const filterStatus = ref("");
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

// 添加文档
const addDialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  title: "",
  content: ""
});
const formRules: FormRules = {
  title: [{ required: true, message: "请输入文档标题", trigger: "blur" }],
  content: [{ required: true, message: "请输入文档内容", trigger: "blur" }]
};

// 查看文档
const viewDrawerVisible = ref(false);
const currentDocument = ref<KnowledgeDocument | null>(null);

// 文件上传
const uploading = ref(false);
const supportedTypes = ref([".md", ".markdown", ".txt", ".pdf", ".docx"]);

// 同步文章
const syncing = ref(false);

// 加载数据
const loadData = async () => {
  await Promise.all([
    loadStats(),
    loadConfig(),
    loadDocuments(),
    loadSupportedTypes()
  ]);
};

// 加载支持的文件类型
const loadSupportedTypes = async () => {
  try {
    const res = await getSupportedFileTypes();
    if (res.code === 200 && res.data.types) {
      supportedTypes.value = res.data.types;
    }
  } catch {
    // 使用默认值
  }
};

// 处理文件上传
const handleUpload = async (file: UploadRawFile) => {
  // 检查文件大小（10MB）
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error("文件大小不能超过 10MB");
    return false;
  }

  uploading.value = true;
  try {
    const res = await uploadKnowledgeDocument(file);
    if (res.code === 200) {
      ElMessage.success("文档上传成功，正在索引...");
      loadData();
    } else {
      ElMessage.error(res.message || "上传失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "上传失败");
  } finally {
    uploading.value = false;
  }
  return false; // 阻止默认上传行为
};

// 加载统计
const loadStats = async () => {
  try {
    const res = await getKnowledgeStats();
    if (res.code === 200) {
      stats.value = res.data;
    }
  } catch {
    // 忽略错误
  }
};

// 加载配置
const loadConfig = async () => {
  try {
    const res = await getKnowledgeConfig();
    if (res.code === 200) {
      config.value = res.data;
    }
  } catch {
    // 忽略错误
  }
};

// 加载文档列表
const loadDocuments = async () => {
  loading.value = true;
  try {
    const res = await getKnowledgeDocuments({
      status: filterStatus.value,
      page: pagination.page,
      page_size: pagination.pageSize
    });
    if (res.code === 200) {
      documents.value = res.data.documents || [];
      pagination.total = res.data.total;
    }
  } catch {
    ElMessage.error("加载文档列表失败");
  } finally {
    loading.value = false;
  }
};

// 显示添加对话框
const showAddDialog = () => {
  form.title = "";
  form.content = "";
  addDialogVisible.value = true;
};

// 添加文档
const handleAddDocument = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const res = await indexKnowledgeDocument({
      title: form.title,
      content: form.content
    });
    if (res.code === 200) {
      ElMessage.success("文档添加成功，正在索引...");
      addDialogVisible.value = false;
      loadData();
    } else {
      ElMessage.error(res.message || "添加失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "添加失败");
  } finally {
    submitting.value = false;
  }
};

// 查看文档
const viewDocument = (doc: KnowledgeDocument) => {
  currentDocument.value = doc;
  viewDrawerVisible.value = true;
};

// 重建索引
const reindexDocument = async (doc: KnowledgeDocument) => {
  try {
    const res = await reindexKnowledgeDocument(doc.id);
    if (res.code === 200) {
      ElMessage.success("正在重新索引...");
      loadDocuments();
    } else {
      ElMessage.error(res.message || "操作失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "操作失败");
  }
};

// 删除文档
const deleteDocument = async (doc: KnowledgeDocument) => {
  try {
    const res = await deleteDocApi(doc.id);
    if (res.code === 200) {
      ElMessage.success("删除成功");
      loadData();
    } else {
      ElMessage.error(res.message || "删除失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "删除失败");
  }
};

// 同步文章命令处理
const handleSyncCommand = async (command: string) => {
  const force = command === "force";
  syncing.value = true;

  try {
    const res = await syncKnowledgeArticles(force);
    if (res.code === 200) {
      const data = res.data;
      ElMessage.success(
        `同步完成：共 ${data.total_articles} 篇文章，新增 ${data.new_documents} 篇，更新 ${data.updated_documents} 篇，跳过 ${data.skipped_documents} 篇`
      );
      loadData();
    } else {
      ElMessage.error(res.message || "同步失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "同步失败");
  } finally {
    syncing.value = false;
  }
};

// 工具函数
const getSourceTypeText = (type: string) => {
  const map: Record<string, string> = {
    article: "文章",
    upload: "上传",
    custom: "自定义",
    webpage: "网页"
  };
  return map[type] || type;
};

type TagType = "success" | "warning" | "info" | "danger" | "primary";

const getSourceTypeTag = (type: string): TagType => {
  const map: Record<string, TagType> = {
    article: "primary",
    upload: "success",
    custom: "info",
    webpage: "warning"
  };
  return map[type] || "primary";
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: "待处理",
    processing: "处理中",
    indexed: "已索引",
    failed: "失败",
    disabled: "已禁用"
  };
  return map[status] || status;
};

const getStatusTag = (status: string): TagType => {
  const map: Record<string, TagType> = {
    pending: "warning",
    processing: "info",
    indexed: "success",
    failed: "danger",
    disabled: "info"
  };
  return map[status] || "info";
};

const formatLength = (length: number) => {
  if (length >= 1000) {
    return `${(length / 1000).toFixed(1)}K`;
  }
  return String(length);
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.knowledge-management {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .stat-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;

    .el-icon {
      font-size: 28px;
      color: #fff;
    }
  }

  .stat-info {
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin-top: 6px;
    }
  }
}

.config-card,
.table-card {
  margin-bottom: 20px;
  border-radius: 12px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }
}

.doc-title {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-tag {
    flex-shrink: 0;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.doc-detail {
  padding: 16px;
}

// 移动端适配
@media screen and (max-width: 768px) {
  .knowledge-management {
    padding: 12px;
  }

  .stat-card {
    padding: 16px;
    gap: 12px;

    .stat-icon {
      width: 48px;
      height: 48px;

      .el-icon {
        font-size: 24px;
      }
    }

    .stat-info .stat-value {
      font-size: 22px;
    }
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start !important;

    .header-actions {
      width: 100%;
      flex-wrap: wrap;
    }
  }
}
</style>
