<!--
 * @Description: 全文隐藏设置Tab组件
 * @Author: 安知鱼
 * @Date: 2025-12-27
-->
<script setup lang="ts">
import type { FullTextHiddenForm } from "@/api/post/type";

const props = defineProps<{
  form: FullTextHiddenForm;
}>();

const emit = defineEmits<{
  (e: "update:form", value: FullTextHiddenForm): void;
}>();

// 使用内部表单
const internalForm = props.form;
</script>

<template>
  <el-form :model="internalForm" label-position="top">
    <el-row :gutter="24">
      <el-col :span="24">
        <el-alert title="全文隐藏功能" type="info" :closable="false" show-icon>
          <template #default>
            <p>
              全文隐藏功能允许您对整篇文章设置密码保护，用户需要输入正确的密码才能查看完整内容。
            </p>
            <p>
              启用后，文章将只显示预览内容，点击"查看全文"按钮后需要验证密码。
            </p>
            <p>优先级：全文隐藏 > 密码保护内容 > 付费内容</p>
          </template>
        </el-alert>
      </el-col>

      <el-col :span="24">
        <el-form-item label="启用全文隐藏">
          <div>
            <el-switch v-model="internalForm.enabled" />
            <div class="form-item-help">
              启用后，用户需要输入密码才能查看完整文章内容
            </div>
          </div>
        </el-form-item>
      </el-col>

      <template v-if="internalForm.enabled">
        <el-col :span="24">
          <el-form-item label="访问密码" prop="password" required>
            <el-input
              v-model="internalForm.password"
              type="password"
              show-password
              placeholder="请输入访问密码"
            />
            <div class="form-item-help">
              用户需要输入此密码才能查看完整内容，请妥善保管
            </div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="按钮文案" prop="button_text">
            <el-input
              v-model="internalForm.button_text"
              placeholder="查看全文"
            />
            <div class="form-item-help">显示在文章末尾的按钮文字</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="输入框提示" prop="input_placeholder">
            <el-input
              v-model="internalForm.input_placeholder"
              placeholder="请输入密码查看全文"
            />
            <div class="form-item-help">密码输入框的提示文字</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="初始显示高度(px)" prop="initial_visible_height">
            <el-input-number
              v-model="internalForm.initial_visible_height"
              :min="100"
              :max="1000"
              :step="50"
              controls-position="right"
              style="width: 100%"
            />
            <div class="form-item-help">
              文章初始显示的高度，超出部分将被隐藏
            </div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="预览字符数" prop="preview_char_count">
            <el-input-number
              v-model="internalForm.preview_char_count"
              :min="100"
              :max="5000"
              :step="100"
              controls-position="right"
              style="width: 100%"
            />
            <div class="form-item-help">未验证密码时显示的文章字符数量</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="最大尝试次数" prop="max_attempts">
            <el-input-number
              v-model="internalForm.max_attempts"
              :min="0"
              :max="100"
              controls-position="right"
              style="width: 100%"
            />
            <div class="form-item-help">0表示不限制，建议设置为3-10次</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="二维码链接(可选)" prop="qr_code_url">
            <el-input
              v-model="internalForm.qr_code_url"
              placeholder="https://example.com/qrcode"
            />
            <div class="form-item-help">可用于引导用户付费或关注以获取密码</div>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item
            label="弹窗顶部描述(支持HTML)"
            prop="modal_top_description"
          >
            <el-input
              v-model="internalForm.modal_top_description"
              type="textarea"
              :rows="3"
              placeholder="<p>请输入密码查看完整内容</p>"
            />
            <div class="form-item-help">
              在密码输入框上方显示的描述文字，支持HTML标签
            </div>
          </el-form-item>
        </el-col>
      </template>
    </el-row>
  </el-form>
</template>

<style scoped lang="scss">
.form-item-help {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
