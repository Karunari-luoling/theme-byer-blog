<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-11-23 13:46:03
 * @LastEditTime: 2025-12-16 11:54:20
 * @LastEditors: 安知鱼
-->
<template>
  <div class="payment-config-form">
    <!-- 状态卡片 -->
    <div class="status-cards">
      <div
        v-for="provider in providers"
        :key="provider.key"
        class="status-card"
        :class="{ active: status[`${provider.key}_enabled`] }"
      >
        <div class="card-icon" :class="provider.key">
          <component :is="provider.icon" />
        </div>
        <div class="card-info">
          <h4>{{ provider.name }}</h4>
          <div class="card-status">
            <span
              class="status-badge"
              :class="{ enabled: status[`${provider.key}_enabled`] }"
            >
              {{ status[`${provider.key}_enabled`] ? "已启用" : "未启用" }}
            </span>
            <span
              class="config-badge"
              :class="{ configured: status[`${provider.key}_configured`] }"
            >
              {{ status[`${provider.key}_configured`] ? "已配置" : "未配置" }}
            </span>
          </div>
        </div>
        <div
          class="card-switch"
          :class="{ disabled: !status[`${provider.key}_configured`] }"
          :title="status[`${provider.key}_configured`] ? '' : '请先完成配置'"
          @click="
            status[`${provider.key}_configured`] &&
            toggleProvider(provider.type, !status[`${provider.key}_enabled`])
          "
        >
          <div
            class="switch"
            :class="{ checked: status[`${provider.key}_enabled`] }"
          >
            <div class="switch-dot" />
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义 Tabs -->
    <Tabs v-model="activeTab" :tabs="tabs">
      <!-- 支付宝配置 -->
      <TabPane :active="activeTab === 'alipay'">
        <el-form
          ref="alipayFormRef"
          :model="alipayForm"
          :rules="alipayRules"
          label-width="110px"
          size="default"
        >
          <el-form-item label="应用ID" prop="app_id">
            <el-input
              v-model="alipayForm.app_id"
              placeholder="请输入支付宝应用ID"
              clearable
            />
          </el-form-item>

          <el-form-item prop="app_private_key">
            <template #label>
              <span>应用私钥</span>
              <el-tooltip placement="top" width="400">
                <template #content>
                  <div>支持格式：</div>
                  <div>1. 纯密钥内容（推荐）</div>
                  <div>2. 完整PEM格式</div>
                </template>
                <el-icon class="info-icon">
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </template>
            <el-input
              v-model="alipayForm.app_private_key"
              type="textarea"
              :rows="3"
              placeholder="请输入应用私钥"
            />
          </el-form-item>

          <el-form-item prop="alipay_public_key">
            <template #label>
              <span>支付宝公钥</span>
              <el-tooltip placement="top" width="400">
                <template #content>
                  <div>支持格式：</div>
                  <div>1. 纯密钥内容（推荐）</div>
                  <div>2. 完整PEM格式</div>
                </template>
                <el-icon class="info-icon">
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </template>
            <el-input
              v-model="alipayForm.alipay_public_key"
              type="textarea"
              :rows="3"
              placeholder="请输入支付宝公钥"
            />
          </el-form-item>

          <el-form-item>
            <div class="form-actions">
              <button
                class="btn btn-primary"
                :class="{ loading: saving.alipay }"
                @click.prevent="saveConfig('ALIPAY')"
              >
                <span v-if="!saving.alipay">保存配置</span>
                <span v-else>保存中...</span>
              </button>
              <button
                class="btn btn-default"
                :class="{ loading: testing.alipay }"
                @click.prevent="testConfig('ALIPAY')"
              >
                <span v-if="!testing.alipay">测试连接</span>
                <span v-else>测试中...</span>
              </button>
            </div>
          </el-form-item>
        </el-form>
      </TabPane>

      <!-- 微信支付配置 -->
      <TabPane :active="activeTab === 'wechat'">
        <el-form
          ref="wechatFormRef"
          :model="wechatForm"
          :rules="wechatRules"
          label-width="110px"
          size="default"
        >
          <el-form-item label="应用ID" prop="app_id">
            <el-input
              v-model="wechatForm.app_id"
              placeholder="请输入微信应用ID"
              clearable
            />
          </el-form-item>

          <el-form-item label="商户号" prop="mch_id">
            <el-input
              v-model="wechatForm.mch_id"
              placeholder="请输入商户号"
              clearable
            />
          </el-form-item>

          <el-form-item label="商户序列号" prop="mch_serial_no">
            <el-input
              v-model="wechatForm.mch_serial_no"
              placeholder="请输入商户序列号"
              clearable
            />
          </el-form-item>

          <el-form-item label="API v3密钥" prop="api_v3_key">
            <el-input
              v-model="wechatForm.api_v3_key"
              type="password"
              show-password
              placeholder="请输入API v3密钥"
              clearable
            />
          </el-form-item>

          <el-form-item prop="private_key_data">
            <template #label>
              <span>商户私钥</span>
              <el-tooltip placement="top" width="400">
                <template #content>
                  <div>格式要求：</div>
                  <div>-----BEGIN PRIVATE KEY-----</div>
                  <div>MIIEvwIBADANBg...</div>
                  <div>-----END PRIVATE KEY-----</div>
                </template>
                <el-icon class="info-icon">
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </template>
            <el-input
              v-model="wechatForm.private_key_data"
              type="textarea"
              :rows="3"
              placeholder="请输入商户私钥（PEM格式）"
            />
          </el-form-item>

          <el-form-item>
            <div class="form-actions">
              <button
                class="btn btn-primary"
                :class="{ loading: saving.wechat }"
                @click.prevent="saveConfig('WECHAT')"
              >
                <span v-if="!saving.wechat">保存配置</span>
                <span v-else>保存中...</span>
              </button>
              <button
                class="btn btn-default"
                :class="{ loading: testing.wechat }"
                @click.prevent="testConfig('WECHAT')"
              >
                <span v-if="!testing.wechat">测试连接</span>
                <span v-else>测试中...</span>
              </button>
            </div>
          </el-form-item>
        </el-form>
      </TabPane>

      <!-- 易支付配置 -->
      <TabPane :active="activeTab === 'epay'">
        <el-form
          ref="epayFormRef"
          :model="epayForm"
          :rules="epayRules"
          label-width="110px"
          size="default"
        >
          <el-form-item label="商户号" prop="mch_id">
            <el-input
              v-model="epayForm.mch_id"
              placeholder="请输入易支付商户号"
              clearable
            />
          </el-form-item>

          <el-form-item label="商户密钥" prop="key">
            <el-input
              v-model="epayForm.key"
              type="password"
              show-password
              placeholder="请输入商户密钥"
              clearable
            />
          </el-form-item>

          <el-form-item label="支付网关" prop="gateway">
            <el-input
              v-model="epayForm.gateway"
              placeholder="请输入支付网关地址，例如：https://pay.example.com"
              clearable
            />
          </el-form-item>

          <el-form-item label="同步跳转地址" prop="return_url">
            <el-input
              v-model="epayForm.return_url"
              placeholder="支付成功后跳转的页面地址（可选）"
              clearable
            />
          </el-form-item>

          <el-form-item>
            <div class="form-actions">
              <button
                class="btn btn-primary"
                :class="{ loading: saving.epay }"
                @click.prevent="saveConfig('EPAY')"
              >
                <span v-if="!saving.epay">保存配置</span>
                <span v-else>保存中...</span>
              </button>
              <button
                class="btn btn-default"
                :class="{ loading: testing.epay }"
                @click.prevent="testConfig('EPAY')"
              >
                <span v-if="!testing.epay">测试连接</span>
                <span v-else>测试中...</span>
              </button>
            </div>
          </el-form-item>
        </el-form>
      </TabPane>

      <!-- 虎皮椒V3配置 -->
      <TabPane :active="activeTab === 'hupijiao'">
        <el-form
          ref="hupijiaoFormRef"
          :model="hupijiaoForm"
          :rules="hupijiaoRules"
          label-width="110px"
          size="default"
        >
          <el-form-item label="应用ID" prop="app_id">
            <el-input
              v-model="hupijiaoForm.app_id"
              placeholder="请输入虎皮椒应用ID"
              clearable
            />
          </el-form-item>

          <el-form-item label="应用密钥" prop="app_secret">
            <el-input
              v-model="hupijiaoForm.app_secret"
              type="password"
              show-password
              placeholder="请输入应用密钥"
              clearable
            />
          </el-form-item>

          <el-form-item label="支付网关" prop="gateway">
            <el-input
              v-model="hupijiaoForm.gateway"
              placeholder="默认：https://api.xunhupay.com"
              clearable
            />
          </el-form-item>

          <el-form-item label="同步跳转地址" prop="return_url">
            <el-input
              v-model="hupijiaoForm.return_url"
              placeholder="支付成功后跳转的页面地址（可选）"
              clearable
            />
          </el-form-item>

          <el-form-item>
            <div class="form-actions">
              <button
                class="btn btn-primary"
                :class="{ loading: saving.hupijiao }"
                @click.prevent="saveConfig('HUPIJIAO')"
              >
                <span v-if="!saving.hupijiao">保存配置</span>
                <span v-else>保存中...</span>
              </button>
              <button
                class="btn btn-default"
                :class="{ loading: testing.hupijiao }"
                @click.prevent="testConfig('HUPIJIAO')"
              >
                <span v-if="!testing.hupijiao">测试连接</span>
                <span v-else>测试中...</span>
              </button>
            </div>
          </el-form-item>
        </el-form>
      </TabPane>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";
import Tabs from "@/components/Tabs/index.vue";
import TabPane from "@/components/Tabs/TabPane.vue";
import type { TabItem } from "@/components/Tabs/index.vue";
import {
  getPaymentConfigDetails,
  setAlipayConfig,
  setWechatConfig,
  setEpayConfig,
  setHupijiaoConfig,
  toggleProvider as toggleProviderAPI,
  testConfig as testConfigAPI
} from "@/api/payment";

defineOptions({ name: "PaymentConfigForm" });

// 支付方式配置
const providers = [
  {
    key: "alipay",
    type: "ALIPAY",
    name: "支付宝",
    icon: () =>
      h("svg", {
        class: "icon",
        viewBox: "0 0 1024 1024",
        innerHTML:
          '<path d="M230.4 576.512c-12.288 9.728-25.088 24.064-28.672 41.984-5.12 24.576-1.024 55.296 22.528 79.872 28.672 29.184 72.704 37.376 91.648 38.912 51.2 3.584 105.984-22.016 147.456-50.688 16.384-11.264 44.032-34.304 70.144-69.632-59.392-30.72-133.632-64.512-212.48-61.44-40.448 1.536-69.632 9.728-90.624 20.992z m752.64 135.68c26.112-61.44 40.96-129.024 40.96-200.192C1024 229.888 794.112 0 512 0S0 229.888 0 512s229.888 512 512 512c170.496 0 321.536-83.968 414.72-211.968-88.064-43.52-232.96-115.712-322.56-159.232-42.496 48.64-105.472 97.28-176.64 118.272-44.544 13.312-84.992 18.432-126.976 9.728-41.984-8.704-72.704-28.16-90.624-47.616-9.216-10.24-19.456-22.528-27.136-37.888 0.512 1.024 1.024 2.048 1.024 3.072 0 0-4.608-7.68-7.68-19.456-1.536-6.144-3.072-11.776-3.584-17.92-0.512-4.096-0.512-8.704 0-12.8-0.512-7.68 0-15.872 1.536-24.064 4.096-20.48 12.8-44.032 35.328-65.536 49.152-48.128 114.688-50.688 148.992-50.176 50.176 0.512 138.24 22.528 211.968 48.64 20.48-43.52 33.792-90.112 41.984-121.344h-307.2v-33.28h157.696v-66.56H272.384V302.08h190.464V235.52c0-9.216 2.048-16.384 16.384-16.384h74.752V302.08h207.36v33.28h-207.36v66.56h165.888s-16.896 92.672-68.608 184.32c115.2 40.96 278.016 104.448 331.776 125.952z" fill="currentColor"/>'
      })
  },
  {
    key: "wechat",
    type: "WECHAT",
    name: "微信支付",
    icon: () =>
      h("svg", {
        class: "icon",
        viewBox: "0 0 1024 1024",
        innerHTML:
          '<path d="M1010.8 628c0-141.2-141.3-256.2-299.9-256.2-168 0-300.3 115.1-300.3 256.2 0 141.4 132.3 256.2 300.3 256.2 35.2 0 70.7-8.9 106-17.7l96.8 53-26.6-88.2c70.9-53.2 123.7-123.7 123.7-203.3zM618 588.8c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40c0 22-17.9 40-40 40z m194.3-0.3c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z" fill="currentColor"/><path d="M366.3 106.9c-194.1 0-353.1 132.3-353.1 300.3 0 97 52.9 176.6 141.3 238.4l-35.3 106.2 123.4-61.9c44.2 8.7 79.6 17.7 123.7 17.7 11.1 0 22.1-0.5 33-1.4-6.9-23.6-10.9-48.3-10.9-74 0-154.3 132.5-279.5 300.2-279.5 11.5 0 22.8 0.8 34 2.1C692 212.6 539.9 106.9 366.3 106.9zM247.7 349.2c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48z m246.6 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48z" fill="currentColor"/>'
      })
  },
  {
    key: "epay",
    type: "EPAY",
    name: "易支付",
    icon: () =>
      h("svg", {
        class: "icon",
        viewBox: "0 0 1024 1024",
        innerHTML:
          '<path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="currentColor"/><path d="M512 140c-205.4 0-372 166.6-372 372s166.6 372 372 372 372-166.6 372-372-166.6-372-372-372z m171.4 584H340.6c-10.2 0-18.6-8.4-18.6-18.6v-37.2c0-10.2 8.4-18.6 18.6-18.6h342.8c10.2 0 18.6 8.4 18.6 18.6v37.2c0 10.2-8.4 18.6-18.6 18.6z m0-148.8H340.6c-10.2 0-18.6-8.4-18.6-18.6v-37.2c0-10.2 8.4-18.6 18.6-18.6h342.8c10.2 0 18.6 8.4 18.6 18.6v37.2c0 10.2-8.4 18.6-18.6 18.6z m0-148.8H340.6c-10.2 0-18.6-8.4-18.6-18.6v-37.2c0-10.2 8.4-18.6 18.6-18.6h342.8c10.2 0 18.6 8.4 18.6 18.6v37.2c0 10.2-8.4 18.6-18.6 18.6z" fill="currentColor"/>'
      })
  },
  {
    key: "hupijiao",
    type: "HUPIJIAO",
    name: "虎皮椒V3",
    icon: () =>
      h("svg", {
        class: "icon",
        viewBox: "0 0 1024 1024",
        innerHTML:
          '<path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="currentColor"/><path d="M623.5 421.5c-3.1-4.4-8.1-7-13.5-7H473L512.5 96h-74l-74.5 318.5H302c-5.4 0-10.4 2.6-13.5 7a16 16 0 0 0-2.3 15.4l63.5 195a16.1 16.1 0 0 0 15.3 11.1H512v288h74V643h146.5c6.7 0 12.7-4.2 15-10.4l81.5-195c2.6-6.3.7-13.6-4.5-18.1l-145-118.5c-3.8-3.1-8.7-4.7-13.5-4.7h-42.5z" fill="currentColor"/>'
      })
  }
];

// Tabs 配置
const tabs: TabItem[] = [
  { key: "alipay", label: "支付宝配置" },
  { key: "wechat", label: "微信支付配置" },
  { key: "epay", label: "易支付配置" },
  { key: "hupijiao", label: "虎皮椒V3配置" }
];

// 当前激活的标签页
const activeTab = ref("alipay");

// 状态数据
const status = reactive({
  alipay_enabled: false,
  wechat_enabled: false,
  epay_enabled: false,
  hupijiao_enabled: false,
  alipay_configured: false,
  wechat_configured: false,
  epay_configured: false,
  hupijiao_configured: false
});

// 加载状态
const saving = reactive({
  alipay: false,
  wechat: false,
  epay: false,
  hupijiao: false
});
const testing = reactive({
  alipay: false,
  wechat: false,
  epay: false,
  hupijiao: false
});

// 表单引用
const alipayFormRef = ref<FormInstance>();
const wechatFormRef = ref<FormInstance>();
const epayFormRef = ref<FormInstance>();
const hupijiaoFormRef = ref<FormInstance>();

// 表单数据
const alipayForm = reactive({
  app_id: "",
  app_private_key: "",
  alipay_public_key: ""
});

const wechatForm = reactive({
  app_id: "",
  mch_id: "",
  mch_serial_no: "",
  api_v3_key: "",
  private_key_data: ""
});

const epayForm = reactive({
  mch_id: "",
  key: "",
  gateway: "",
  return_url: ""
});

const hupijiaoForm = reactive({
  app_id: "",
  app_secret: "",
  gateway: "https://api.xunhupay.com",
  return_url: ""
});

// 表单验证规则
const alipayRules = reactive<FormRules>({
  app_id: [{ required: true, message: "请输入应用ID", trigger: "blur" }],
  app_private_key: [
    { required: true, message: "请输入应用私钥", trigger: "blur" }
  ],
  alipay_public_key: [
    { required: true, message: "请输入支付宝公钥", trigger: "blur" }
  ]
});

const wechatRules = reactive<FormRules>({
  app_id: [{ required: true, message: "请输入微信应用ID", trigger: "blur" }],
  mch_id: [{ required: true, message: "请输入商户号", trigger: "blur" }],
  mch_serial_no: [
    { required: true, message: "请输入商户序列号", trigger: "blur" }
  ],
  api_v3_key: [
    { required: true, message: "请输入API v3密钥", trigger: "blur" }
  ],
  private_key_data: [
    { required: true, message: "请输入商户私钥", trigger: "blur" }
  ]
});

const epayRules = reactive<FormRules>({
  mch_id: [{ required: true, message: "请输入商户号", trigger: "blur" }],
  key: [{ required: true, message: "请输入商户密钥", trigger: "blur" }],
  gateway: [{ required: true, message: "请输入支付网关地址", trigger: "blur" }]
});

const hupijiaoRules = reactive<FormRules>({
  app_id: [{ required: true, message: "请输入应用ID", trigger: "blur" }],
  app_secret: [{ required: true, message: "请输入应用密钥", trigger: "blur" }]
});

// 加载支付状态
const loadPaymentStatus = async () => {
  try {
    const response = await getPaymentConfigDetails();
    const configData = response.data;

    if (configData && configData.alipay) {
      status.alipay_enabled = configData.alipay.enabled || false;
      status.alipay_configured = configData.alipay.configured || false;
      if (configData.alipay.configured) {
        Object.assign(alipayForm, configData.alipay);
      }
    } else {
      status.alipay_enabled = false;
      status.alipay_configured = false;
    }

    if (configData && configData.wechat) {
      status.wechat_enabled = configData.wechat.enabled || false;
      status.wechat_configured = configData.wechat.configured || false;
      if (configData.wechat.configured) {
        Object.assign(wechatForm, configData.wechat);
      }
    } else {
      status.wechat_enabled = false;
      status.wechat_configured = false;
    }

    if (configData && configData.epay) {
      status.epay_enabled = configData.epay.enabled || false;
      status.epay_configured = configData.epay.configured || false;
      if (configData.epay.configured) {
        Object.assign(epayForm, configData.epay);
      }
    } else {
      status.epay_enabled = false;
      status.epay_configured = false;
    }

    if (configData && configData.hupijiao) {
      status.hupijiao_enabled = configData.hupijiao.enabled || false;
      status.hupijiao_configured = configData.hupijiao.configured || false;
      if (configData.hupijiao.configured) {
        Object.assign(hupijiaoForm, configData.hupijiao);
      }
    } else {
      status.hupijiao_enabled = false;
      status.hupijiao_configured = false;
    }
  } catch (error: any) {
    console.error("[DEBUG] 加载支付状态失败:", error);
    ElMessage.error("获取配置失败");
  }
};

// 通用保存配置
const saveConfig = async (
  provider: "ALIPAY" | "WECHAT" | "EPAY" | "HUPIJIAO"
) => {
  let formRef: FormInstance | undefined;
  let providerName: string;
  let formData: any;
  let savingKey: "alipay" | "wechat" | "epay" | "hupijiao";
  let apiCall: any;

  switch (provider) {
    case "ALIPAY":
      formRef = alipayFormRef.value;
      providerName = "支付宝";
      formData = alipayForm;
      savingKey = "alipay";
      apiCall = setAlipayConfig;
      break;
    case "WECHAT":
      formRef = wechatFormRef.value;
      providerName = "微信支付";
      formData = wechatForm;
      savingKey = "wechat";
      apiCall = setWechatConfig;
      break;
    case "EPAY":
      formRef = epayFormRef.value;
      providerName = "易支付";
      formData = epayForm;
      savingKey = "epay";
      apiCall = setEpayConfig;
      break;
    case "HUPIJIAO":
      formRef = hupijiaoFormRef.value;
      providerName = "虎皮椒";
      formData = hupijiaoForm;
      savingKey = "hupijiao";
      apiCall = setHupijiaoConfig;
      break;
  }

  if (!formRef) return;

  await formRef.validate(async valid => {
    if (!valid) {
      ElMessage.error("请检查表单必填项");
      return;
    }

    saving[savingKey] = true;
    try {
      await apiCall(formData);
      ElMessage.success(`${providerName}配置保存成功`);
      await loadPaymentStatus();
    } catch (error: any) {
      ElMessage.error(error.message || "保存失败");
    } finally {
      saving[savingKey] = false;
    }
  });
};

// 切换支付方式状态
const toggleProvider = async (provider: string, enabled: boolean) => {
  try {
    await toggleProviderAPI(provider, { enabled });
    const providerNames: Record<string, string> = {
      ALIPAY: "支付宝",
      WECHAT: "微信支付",
      EPAY: "易支付",
      HUPIJIAO: "虎皮椒"
    };
    // 更新本地状态
    if (provider === "ALIPAY") status.alipay_enabled = enabled;
    else if (provider === "WECHAT") status.wechat_enabled = enabled;
    else if (provider === "EPAY") status.epay_enabled = enabled;
    else if (provider === "HUPIJIAO") status.hupijiao_enabled = enabled;
    ElMessage.success(
      `${providerNames[provider]}已${enabled ? "启用" : "禁用"}`
    );
  } catch (error: any) {
    ElMessage.error(error.message || "操作失败");
  }
};

// 测试配置
const testConfig = async (
  provider: "ALIPAY" | "WECHAT" | "EPAY" | "HUPIJIAO"
) => {
  let providerName: string;
  let testingKey: "alipay" | "wechat" | "epay" | "hupijiao";

  switch (provider) {
    case "ALIPAY":
      providerName = "支付宝";
      testingKey = "alipay";
      break;
    case "WECHAT":
      providerName = "微信支付";
      testingKey = "wechat";
      break;
    case "EPAY":
      providerName = "易支付";
      testingKey = "epay";
      break;
    case "HUPIJIAO":
      providerName = "虎皮椒";
      testingKey = "hupijiao";
      break;
  }

  testing[testingKey] = true;
  try {
    const data: any = await testConfigAPI(provider);
    if (data.code === 200) {
      ElMessage.success(`${providerName}连接成功: ${data.message}`);
    } else {
      ElMessage.error(`${providerName}连接失败: ${data.message || "未知错误"}`);
    }
  } catch (error: any) {
    ElMessage.error(error.message || `${providerName}测试请求失败`);
  } finally {
    testing[testingKey] = false;
  }
};

onMounted(() => {
  loadPaymentStatus();
});
</script>

<style lang="scss" scoped>
.payment-config-form {
  /* 状态卡片 */
  .status-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .status-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    background: var(--anzhiyu-card-bg);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: default;

    &:hover {
      border-color: var(--anzhiyu-card-border);
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
    }

    &.active {
      border-color: var(--anzhiyu-theme);
      background: var(--anzhiyu-theme-op-light);
    }

    // 暗色模式优化 - 系统偏好检测
    @media (prefers-color-scheme: dark) {
      background: var(--anzhiyu-background);
      border-color: var(--el-border-color-darker);

      &:hover {
        background: var(--anzhiyu-card-bg);
        border-color: var(--anzhiyu-card-border);
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
      }

      &.active {
        border-color: var(--anzhiyu-theme);
        background: color-mix(in srgb, var(--anzhiyu-theme) 10%, transparent);
      }
    }

    // 暗色模式优化 - 手动切换支持
    html.dark {
      background: var(--anzhiyu-background);
      border-color: var(--el-border-color-darker);

      &:hover {
        background: var(--anzhiyu-card-bg);
        border-color: var(--anzhiyu-card-border);
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
      }

      &.active {
        border-color: var(--anzhiyu-theme);
        background: color-mix(in srgb, var(--anzhiyu-theme) 10%, transparent);
      }
    }

    .card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      margin: 0 auto;
      color: white;
      border-radius: 10px;

      svg {
        width: 26px;
        height: 26px;
      }

      &.alipay {
        background: #1677ff;
      }

      &.wechat {
        background: #07c160;
      }

      &.epay {
        background: #ff7a45;
      }

      &.hupijiao {
        background: #ffa940;
      }
    }

    .card-info {
      flex: 1;
      text-align: center;

      h4 {
        margin: 0 0 8px 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--anzhiyu-fontcolor);
      }

      .card-status {
        display: flex;
        gap: 6px;
        justify-content: center;
      }
    }

    .status-badge,
    .config-badge {
      padding: 2px 10px;
      font-size: 12px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .status-badge {
      color: var(--anzhiyu-secondtext);
      background: var(--el-fill-color);

      &.enabled {
        color: var(--anzhiyu-green);
        background: var(--el-color-success-light-9);
      }

      // 暗色模式下的样式 - 系统偏好检测
      @media (prefers-color-scheme: dark) {
        background: var(--el-fill-color-dark);

        &.enabled {
          color: var(--el-color-success-light-3);
          background: color-mix(in srgb, var(--anzhiyu-green) 15%, transparent);
        }
      }

      // 暗色模式下的样式 - 手动切换支持
      html.dark {
        background: var(--el-fill-color-dark);

        &.enabled {
          color: var(--el-color-success-light-3);
          background: color-mix(in srgb, var(--anzhiyu-green) 15%, transparent);
        }
      }
    }

    .config-badge {
      color: var(--anzhiyu-secondtext);
      background: var(--el-fill-color);

      &.configured {
        color: var(--anzhiyu-green);
        background: var(--el-color-success-light-9);
      }

      // 暗色模式下的样式 - 系统偏好检测
      @media (prefers-color-scheme: dark) {
        background: var(--el-fill-color-dark);

        &.configured {
          color: var(--el-color-success-light-3);
          background: color-mix(in srgb, var(--anzhiyu-green) 15%, transparent);
        }
      }

      // 暗色模式下的样式 - 手动切换支持
      html.dark {
        background: var(--el-fill-color-dark);

        &.configured {
          color: var(--el-color-success-light-3);
          background: color-mix(in srgb, var(--anzhiyu-green) 15%, transparent);
        }
      }
    }

    .card-switch {
      display: flex;
      justify-content: center;
      padding-top: 4px;
      cursor: pointer;

      &.disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .switch {
        position: relative;
        width: 44px;
        height: 22px;
        background: var(--el-fill-color-dark);
        border-radius: 11px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &.checked {
          background: var(--anzhiyu-theme);

          .switch-dot {
            transform: translateX(22px);
          }
        }

        .switch-dot {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          background: var(--anzhiyu-card-bg);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        // 暗色模式下的开关样式 - 系统偏好检测
        @media (prefers-color-scheme: dark) {
          background: var(--el-fill-color-darker);
          border: 1px solid var(--el-border-color-darker);

          &.checked {
            background: var(--anzhiyu-theme);
            border-color: transparent;
          }

          .switch-dot {
            background: var(--anzhiyu-card-bg);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          }
        }

        // 暗色模式下的开关样式 - 手动切换支持
        html.dark {
          background: var(--el-fill-color-darker);
          border: 1px solid var(--el-border-color-darker);

          &.checked {
            background: var(--anzhiyu-theme);
            border-color: transparent;
          }

          .switch-dot {
            background: var(--anzhiyu-card-bg);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          }
        }
      }
    }
  }

  /* Tabs 内容样式 */
  :deep(.custom-tabs) {
    .tabs-content {
      :deep(.el-form) {
        max-width: 800px;
      }

      :deep(.el-form-item) {
        margin-bottom: 20px;
      }

      :deep(.el-form-item__label) {
        display: inline-flex;
        align-items: center;
        font-weight: 500;
        color: var(--anzhiyu-fontcolor);
      }

      :deep(.el-textarea__inner) {
        font-family: Monaco, Menlo, "Ubuntu Mono", Consolas, monospace;
        font-size: 13px;
        line-height: 1.6;

        // 暗色模式下的输入框样式 - 系统偏好检测
        @media (prefers-color-scheme: dark) {
          background: var(--el-fill-color-blank);
          border-color: var(--el-border-color-darker);
          color: var(--anzhiyu-fontcolor);

          &:hover {
            border-color: var(--anzhiyu-card-border);
          }

          &:focus {
            background: var(--anzhiyu-card-bg);
            border-color: var(--anzhiyu-theme);
          }
        }
      }

      :deep(.el-input__inner) {
        // 暗色模式下的输入框样式 - 系统偏好检测
        @media (prefers-color-scheme: dark) {
          background: var(--el-fill-color-blank);
          border-color: var(--el-border-color-darker);
          color: var(--anzhiyu-fontcolor);

          &:hover {
            border-color: var(--anzhiyu-card-border);
          }

          &:focus {
            background: var(--anzhiyu-card-bg);
            border-color: var(--anzhiyu-theme);
          }
        }
      }

      // 暗色模式下的输入框样式 - 手动切换支持
      html.dark {
        :deep(.el-textarea__inner) {
          background: var(--el-fill-color-blank);
          border-color: var(--el-border-color-darker);
          color: var(--anzhiyu-fontcolor);

          &:hover {
            border-color: var(--anzhiyu-card-border);
          }

          &:focus {
            background: var(--anzhiyu-card-bg);
            border-color: var(--anzhiyu-theme);
          }
        }

        :deep(.el-input__inner) {
          background: var(--el-fill-color-blank);
          border-color: var(--el-border-color-darker);
          color: var(--anzhiyu-fontcolor);

          &:hover {
            border-color: var(--anzhiyu-card-border);
          }

          &:focus {
            background: var(--anzhiyu-card-bg);
            border-color: var(--anzhiyu-theme);
          }
        }
      }

      .info-icon {
        margin-left: 6px;
        font-size: 14px;
        color: var(--anzhiyu-secondtext);
        cursor: help;
        transition: color 0.2s;

        &:hover {
          color: var(--anzhiyu-theme);
        }

        // 暗色模式下的信息图标 - 系统偏好检测
        @media (prefers-color-scheme: dark) {
          color: var(--anzhiyu-secondtext);

          &:hover {
            color: var(--anzhiyu-theme);
          }
        }

        // 暗色模式下的信息图标 - 手动切换支持
        html.dark {
          color: var(--anzhiyu-secondtext);

          &:hover {
            color: var(--anzhiyu-theme);
          }
        }
      }
    }
  }

  /* 自定义按钮 */
  .form-actions {
    display: flex;
    gap: 12px;
  }

  .btn {
    position: relative;
    min-width: 100px;
    padding: 9px 20px;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    color: var(--anzhiyu-fontcolor);
    text-align: center;
    background: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    border-radius: 6px;
    outline: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;

    &:hover {
      border-color: var(--anzhiyu-theme-op);
      background: var(--anzhiyu-theme-op-light);
    }

    &:active {
      transform: scale(0.98);
    }

    &.btn-primary {
      color: white;
      background: var(--anzhiyu-theme);
      border-color: var(--anzhiyu-theme);

      &:hover {
        background: var(--anzhiyu-theme);
        border-color: var(--anzhiyu-theme);
      }
    }

    // 暗色模式下的按钮样式 - 系统偏好检测
    @media (prefers-color-scheme: dark) {
      background: var(--el-fill-color);
      border-color: var(--anzhiyu-card-border);

      &:hover {
        background: var(--el-fill-color-dark);
        border-color: var(--anzhiyu-theme);
      }

      &.btn-primary {
        background: var(--anzhiyu-theme);
        border-color: var(--anzhiyu-theme);

        &:hover {
          background: var(--anzhiyu-theme);
          border-color: var(--anzhiyu-theme);
        }
      }
    }

    // 暗色模式下的按钮样式 - 手动切换支持
    html.dark {
      background: var(--el-fill-color);
      border-color: var(--anzhiyu-card-border);

      &:hover {
        background: var(--el-fill-color-dark);
        border-color: var(--anzhiyu-theme);
      }

      &.btn-primary {
        background: var(--anzhiyu-theme);
        border-color: var(--anzhiyu-theme);

        &:hover {
          background: var(--anzhiyu-theme);
          border-color: var(--anzhiyu-theme);
        }
      }
    }

    &.loading {
      pointer-events: none;
      opacity: 0.6;

      &::after {
        content: "";
        position: absolute;
        top: 50%;
        right: 12px;
        width: 14px;
        height: 14px;
        margin-top: -7px;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: rotate 0.6s linear infinite;
      }
    }
  }

  @keyframes rotate {
    to {
      transform: rotate(360deg);
    }
  }

  /* 响应式 */
  @media (max-width: 1200px) {
    .status-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .status-cards {
      grid-template-columns: 1fr;
    }
  }
}
</style>
