<!--
 * @Description: 本地存储配置表单
 * @Author: 安知鱼
 * @Date: 2025-07-15 15:36:48
 * @LastEditTime: 2025-11-13 13:57:33
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { type StoragePolicy } from "@/api/sys-policy";
const formData = defineModel<Partial<StoragePolicy>>({ required: true });
</script>
<template>
  <el-form-item label="Blob 挂载目录" prop="virtual_path">
    <el-input v-model="formData.virtual_path" placeholder="例如: /uploads" />
    <div class="form-item-help">
      存储到本系统内对应的挂载路径，需要确保唯一。
    </div>
  </el-form-item>
  <el-form-item label="Blob 存储目录" prop="base_path">
    <el-input
      v-model="formData.base_path"
      placeholder="例如: /www/storage/uploads"
    />
    <div class="form-item-help">文件 Blob 的实际存放物理目录。</div>
  </el-form-item>

  <el-form-item label="是否开启米游社同步" prop="enable_miyoushe_sync">
    <div>
      <el-switch v-model="formData.enable_miyoushe_sync" />
      <div class="form-item-help">会同步上传到米游社。</div>
    </div>
  </el-form-item>

  <el-form-item label="米游社cookie" prop="miyoushe_cookie">
    <el-input
      v-model="formData.miyoushe_cookie"
      type="textarea"
      :disabled="!formData.enable_miyoushe_sync"
      :placeholder="
        formData.enable_miyoushe_sync
          ? '请输入米游社cookie'
          : '请先开启米游社同步'
      "
    />
    <div class="form-item-help">
      {{
        formData.enable_miyoushe_sync
          ? "米游社cookie，用于同步上传到米游社。"
          : "需要先开启米游社同步才能设置cookie。"
      }}
    </div>
  </el-form-item>

  <el-form-item label="OSS处理样式" prop="oss_process_style">
    <el-input
      v-model="formData.oss_process_style"
      placeholder="例如: ?x-oss-process=image/format,avif"
    />
    <div class="form-item-help">
      米游社链接的OSS处理参数，用于图片格式转换等处理。
    </div>
  </el-form-item>
</template>
<style scoped>
.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--anzhiyu-secondfontcolor);
}
</style>
