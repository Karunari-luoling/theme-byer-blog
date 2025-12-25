<template>
  <div class="ai-settings-form">
    <el-divider content-position="left">
      <span class="divider-title">AI 摘要配置</span>
    </el-divider>

    <el-alert type="info" :closable="false" style="margin-bottom: 20px">
      <template #title> 配置提示 </template>
      <div>
        <p>配置AI服务后，可在文章编辑时自动生成文章摘要和AI写作。</p>
        <ul>
          <li>
            <strong>智谱 GLM：</strong>在
            <a href="https://open.bigmodel.cn/" target="_blank"
              >智谱AI开放平台</a
            >
            申请 API Key
          </li>
          <li>
            <strong>OpenAI：</strong>在
            <a href="https://platform.openai.com/" target="_blank"
              >OpenAI 平台</a
            >
            获取 API Key
          </li>
          <li>
            <strong>通义千问：</strong>在
            <a href="https://dashscope.console.aliyun.com/" target="_blank"
              >阿里云 DashScope</a
            >
            获取 API Key
          </li>
          <li>
            <strong>Claude：</strong>在
            <a href="https://console.anthropic.com/" target="_blank"
              >Anthropic Console</a
            >
            获取 API Key
          </li>
          <li>
            <strong>DeepSeek：</strong>在
            <a href="https://platform.deepseek.com/" target="_blank"
              >DeepSeek 平台</a
            >
            获取 API Key
          </li>
          <li>
            <strong>豆包：</strong>在
            <a href="https://console.volcengine.com/ark" target="_blank"
              >火山引擎方舟平台</a
            >
            获取 API Key
          </li>
        </ul>
      </div>
    </el-alert>

    <!-- 基础配置 -->
    <el-form-item label="AI 服务提供商">
      <el-select
        v-model="localValue.summary.provider"
        placeholder="请选择 AI 服务提供商"
        style="width: 100%"
      >
        <el-option
          v-for="provider in providerOptions"
          :key="provider.value"
          :label="provider.label"
          :value="provider.value"
        >
          <span style="float: left">{{ provider.label }}</span>
          <span
            style="
              float: right;
              color: var(--el-text-color-secondary);
              font-size: 12px;
            "
          >
            {{ provider.description }}
          </span>
        </el-option>
      </el-select>
      <div class="form-item-tip">
        选择对应平台后，API URL 和模型名称会自动填充默认值
      </div>
    </el-form-item>

    <el-form-item label="API Key" required>
      <el-input
        v-model="localValue.summary.apiKey"
        placeholder="请输入 API Key"
        clearable
      />
      <div class="form-item-tip">从对应 AI 服务商处获取的 API 密钥（必填）</div>
    </el-form-item>

    <el-form-item label="API URL">
      <el-input
        v-model="localValue.summary.apiURL"
        :placeholder="getDefaultAPIURL()"
        clearable
      />
      <div class="form-item-tip">
        留空使用默认地址：{{ getDefaultAPIURL() || "根据提供商自动设置" }}
      </div>
    </el-form-item>

    <el-form-item label="模型名称">
      <el-select
        v-model="localValue.summary.model"
        filterable
        allow-create
        clearable
        :placeholder="getDefaultModel() || '选择或输入模型名称'"
        style="width: 100%"
      >
        <el-option
          v-for="model in getSummaryModels"
          :key="model.value"
          :label="model.label"
          :value="model.value"
        >
          <span style="float: left">{{ model.label }}</span>
          <span
            style="
              float: right;
              color: var(--el-text-color-secondary);
              font-size: 12px;
            "
          >
            {{ model.description }}
          </span>
        </el-option>
      </el-select>
      <div class="form-item-tip">
        留空使用默认模型：{{
          getDefaultModel() || "根据提供商自动设置"
        }}。支持选择预设或手动输入
      </div>
    </el-form-item>

    <!-- 高级配置 -->
    <el-divider content-position="left">
      <span class="sub-divider-title">高级配置</span>
    </el-divider>

    <el-form-item label="系统提示词">
      <el-input
        v-model="localValue.summary.systemPrompt"
        type="textarea"
        :rows="6"
        placeholder="自定义系统提示词，留空使用默认提示词"
        clearable
      />
      <div class="form-item-tip">
        自定义 AI 的行为和输出格式。留空将使用默认提示词。
      </div>
    </el-form-item>

    <!-- 测试连接 -->
    <el-form-item>
      <div>
        <el-button
          type="primary"
          :loading="testingConnection"
          :disabled="!localValue.summary.apiKey"
          @click="testConnection"
        >
          {{ testingConnection ? "测试中..." : "测试连接" }}
        </el-button>
        <div class="form-item-tip">点击测试按钮验证 API 配置是否正确</div>
      </div>
    </el-form-item>

    <!-- AI 写作配置 -->
    <el-divider content-position="left">
      <span class="divider-title">AI 写作配置</span>
    </el-divider>

    <el-alert type="success" :closable="false" style="margin-bottom: 20px">
      <template #title> AI 写作功能 </template>
      <div>
        <p>
          AI
          写作功能可以根据主题或大纲自动生成高质量的博客文章，并智能使用博客的标签插件来丰富内容。
        </p>
        <p>如果不单独配置，将使用上方 AI 摘要的配置。</p>
      </div>
    </el-alert>

    <el-form-item label="单独配置 AI 写作">
      <div>
        <el-switch v-model="useCustomWritingConfig" />
        <div class="form-item-tip">
          开启后可以为 AI 写作功能单独配置服务商和模型
        </div>
      </div>
    </el-form-item>

    <template v-if="useCustomWritingConfig">
      <el-form-item label="AI 服务提供商">
        <el-select
          v-model="localValue.writing.provider"
          placeholder="请选择 AI 服务提供商"
          style="width: 100%"
        >
          <el-option
            v-for="provider in providerOptions"
            :key="provider.value"
            :label="provider.label"
            :value="provider.value"
          >
            <span style="float: left">{{ provider.label }}</span>
            <span
              style="
                float: right;
                color: var(--el-text-color-secondary);
                font-size: 12px;
              "
            >
              {{ provider.description }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="API Key">
        <el-input
          v-model="localValue.writing.apiKey"
          placeholder="请输入 API Key（留空则使用摘要配置）"
          clearable
        />
      </el-form-item>

      <el-form-item label="API URL">
        <el-input
          v-model="localValue.writing.apiURL"
          :placeholder="getWritingDefaultAPIURL()"
          clearable
        />
        <div class="form-item-tip">
          留空使用默认地址：{{
            getWritingDefaultAPIURL() || "根据提供商自动设置"
          }}
        </div>
      </el-form-item>

      <el-form-item label="模型名称">
        <el-select
          v-model="localValue.writing.model"
          filterable
          allow-create
          clearable
          :placeholder="getWritingDefaultModel() || '选择或输入模型名称'"
          style="width: 100%"
        >
          <el-option
            v-for="model in getWritingModels"
            :key="model.value"
            :label="model.label"
            :value="model.value"
          >
            <span style="float: left">{{ model.label }}</span>
            <span
              style="
                float: right;
                color: var(--el-text-color-secondary);
                font-size: 12px;
              "
            >
              {{ model.description }}
            </span>
          </el-option>
        </el-select>
        <div class="form-item-tip">
          留空使用默认模型：{{
            getWritingDefaultModel() || "根据提供商自动设置"
          }}。支持选择预设或手动输入
        </div>
      </el-form-item>
    </template>

    <!-- AI 写作高级配置 -->
    <el-divider content-position="left">
      <span class="sub-divider-title">AI 写作高级配置</span>
    </el-divider>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="最大生成 Token 数">
          <el-input-number
            v-model="localValue.writing.maxTokens"
            :min="1024"
            :max="32768"
            :step="512"
            controls-position="right"
            style="width: 100%"
          />
          <div class="form-item-tip">控制 AI 生成内容的最大长度</div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="创意度 (Temperature)">
          <el-slider
            v-model="localValue.writing.temperature"
            :min="0"
            :max="1"
            :step="0.1"
            show-stops
            :marks="temperatureMarks"
          />
          <div class="form-item-tip">
            值越高，生成内容越有创意；值越低，内容越规范
          </div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="AI 写作系统提示词">
      <el-input
        v-model="localValue.writing.systemPrompt"
        type="textarea"
        :rows="10"
        placeholder="自定义 AI 写作的系统提示词，留空使用默认提示词"
        clearable
      />
      <div class="form-item-tip">
        自定义 AI 写作的行为和输出格式。默认提示词已包含博客标签插件的使用说明。
      </div>
    </el-form-item>

    <!-- AI 播客配置 -->
    <el-divider content-position="left">
      <span class="divider-title">AI 播客配置</span>
    </el-divider>

    <el-alert type="warning" :closable="false" style="margin-bottom: 20px">
      <template #title> AI 播客功能 </template>
      <div>
        <p>
          AI
          播客功能可以将文章内容转换为双人对话式的播客音频，支持实时字幕显示。
        </p>
        <p>
          目前支持 <strong>火山引擎豆包语音</strong> 服务，需要在
          <a href="https://console.volcengine.com/speech/app" target="_blank"
            >火山引擎语音控制台</a
          >
          开通播客 TTS 服务。 选择【豆包语音播客大模型】获取 App ID 和 Access
          Token。
        </p>
      </div>
    </el-alert>

    <el-form-item label="启用 AI 播客">
      <div>
        <el-switch v-model="localValue.podcast.enable" />
        <div class="form-item-tip">
          开启后，文章详情页左下角会显示 AI 播客按钮
        </div>
      </div>
    </el-form-item>

    <template v-if="localValue.podcast.enable">
      <el-form-item label="应用 ID (App ID)" required>
        <div>
          <el-input
            v-model="localValue.podcast.appId"
            placeholder="请输入火山引擎应用 ID"
            clearable
          />
          <div class="form-item-tip">从火山引擎语音控制台获取的应用 ID</div>
        </div>
      </el-form-item>

      <el-form-item label="Access Token" required>
        <el-input
          v-model="localValue.podcast.accessKey"
          placeholder="请输入 Access Token"
          clearable
        />
        <div class="form-item-tip">从火山引擎语音控制台获取的 Access Token</div>
      </el-form-item>

      <el-form-item label="资源 ID">
        <el-input
          v-model="localValue.podcast.resourceId"
          placeholder="volc.service_type.10050"
          clearable
        />
        <div class="form-item-tip">
          播客 TTS 服务资源 ID，默认为 volc.service_type.10050
        </div>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="主播 1 音色">
            <el-select
              v-model="localValue.podcast.speaker1"
              placeholder="请选择主播 1 音色"
              style="width: 100%"
            >
              <el-option
                v-for="speaker in podcastSpeakers"
                :key="speaker.value"
                :label="speaker.label"
                :value="speaker.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="主播 2 音色">
            <el-select
              v-model="localValue.podcast.speaker2"
              placeholder="请选择主播 2 音色"
              style="width: 100%"
            >
              <el-option
                v-for="speaker in podcastSpeakers"
                :key="speaker.value"
                :label="speaker.label"
                :value="speaker.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="片头音乐">
            <div>
              <el-switch v-model="localValue.podcast.useHeadMusic" />
              <div class="form-item-tip">是否在播客开头添加片头音乐</div>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="片尾音乐">
            <div>
              <el-switch v-model="localValue.podcast.useTailMusic" />
              <div class="form-item-tip">是否在播客结尾添加片尾音乐</div>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        <span class="sub-divider-title">音频参数</span>
      </el-divider>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="音频格式">
            <el-select
              v-model="localValue.podcast.audioFormat"
              placeholder="选择音频格式"
              style="width: 100%"
            >
              <el-option label="MP3" value="mp3" />
              <el-option label="OGG Opus" value="ogg_opus" />
              <el-option label="PCM" value="pcm" />
              <el-option label="AAC" value="aac" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="采样率">
            <el-select
              v-model="localValue.podcast.sampleRate"
              placeholder="选择采样率"
              style="width: 100%"
            >
              <el-option label="16000 Hz" :value="16000" />
              <el-option label="24000 Hz (推荐)" :value="24000" />
              <el-option label="48000 Hz" :value="48000" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="语速调整">
            <el-input-number
              v-model="localValue.podcast.speechRate"
              :min="-50"
              :max="100"
              :step="10"
              controls-position="right"
              style="width: 100%"
            />
            <div class="form-item-tip">-50 到 100，0 为正常语速</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        <span class="sub-divider-title">界面配置</span>
      </el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="按钮文字">
            <el-input
              v-model="localValue.podcast.buttonText"
              placeholder="AI 播客"
              clearable
            />
            <div class="form-item-tip">播客按钮显示的文字</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="按钮图标">
            <div>
              <IconSelector v-model="localValue.podcast.buttonIcon" />
              <div class="form-item-tip">
                支持 Remix Icon、anzhiyu 图标和图片 URL
              </div>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { http } from "@/utils/http";
import IconSelector from "../frontDesk/components/IconSelector.vue";

interface AISummarySettings {
  provider: string;
  apiKey: string;
  apiURL: string;
  model: string;
  systemPrompt: string;
}

interface AIWritingSettings {
  provider: string;
  apiKey: string;
  apiURL: string;
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
}

interface AIPodcastSettings {
  enable: boolean;
  appId: string;
  accessKey: string;
  resourceId: string;
  speaker1: string;
  speaker2: string;
  useHeadMusic: boolean;
  useTailMusic: boolean;
  audioFormat: string;
  sampleRate: number;
  speechRate: number;
  buttonText: string;
  buttonIcon: string;
}

interface AISettings {
  summary: AISummarySettings;
  writing: AIWritingSettings;
  podcast: AIPodcastSettings;
}

const props = defineProps<{
  modelValue: AISettings;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: AISettings): void;
}>();

const testingConnection = ref(false);
const useCustomWritingConfig = ref(false);

// 播客主播音色选项
const podcastSpeakers = [
  { value: "zh_male_dayixiansheng_v2_saturn_bigtts", label: "大义先生 (男声)" },
  {
    value: "zh_female_mizaitongxue_v2_saturn_bigtts",
    label: "米仔同学 (女声)"
  },
  { value: "zh_male_liufei_v2_saturn_bigtts", label: "刘飞 (男声)" },
  { value: "zh_male_xiaolei_v2_saturn_bigtts", label: "小雷 (男声)" }
];

// AI 服务提供商选项
const providerOptions = [
  { value: "glm", label: "智谱 GLM", description: "国产大模型" },
  { value: "openai", label: "OpenAI", description: "GPT 系列" },
  { value: "qwen", label: "通义千问", description: "阿里云" },
  { value: "claude", label: "Claude", description: "Anthropic" },
  { value: "deepseek", label: "DeepSeek", description: "深度求索" },
  { value: "doubao", label: "豆包", description: "字节跳动" }
];

// 默认 API URL 配置
const defaultAPIURLs: Record<string, string> = {
  glm: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  claude: "https://api.anthropic.com/v1/messages",
  deepseek: "https://api.deepseek.com/chat/completions",
  doubao: "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
};

// 默认模型配置
const defaultModels: Record<string, string> = {
  glm: "glm-4-flash",
  openai: "gpt-4o-mini",
  qwen: "qwen-turbo",
  claude: "claude-3-5-haiku-latest",
  deepseek: "deepseek-chat",
  // 使用最新旗舰模型作为默认值，通常更容易开通
  doubao: "doubao-seed-1-6-251015"
};

// AI 写作推荐模型（更强大的模型）
const writingDefaultModels: Record<string, string> = {
  glm: "glm-4-plus",
  openai: "gpt-4o",
  qwen: "qwen-max",
  claude: "claude-3-5-sonnet-latest",
  deepseek: "deepseek-chat",
  doubao: "doubao-seed-1-6-251015"
};

// 各服务商支持的模型列表
const providerModels: Record<
  string,
  Array<{ value: string; label: string; description: string }>
> = {
  glm: [
    {
      value: "glm-4-flash",
      label: "GLM-4-Flash",
      description: "免费，快速响应"
    },
    { value: "glm-4-air", label: "GLM-4-Air", description: "高性价比" },
    { value: "glm-4-airx", label: "GLM-4-AirX", description: "极速推理" },
    { value: "glm-4-long", label: "GLM-4-Long", description: "超长上下文" },
    { value: "glm-4-plus", label: "GLM-4-Plus", description: "高级模型" },
    { value: "glm-4", label: "GLM-4", description: "标准模型" },
    { value: "glm-4-0520", label: "GLM-4-0520", description: "高智能旗舰" },
    { value: "glm-4v", label: "GLM-4V", description: "多模态视觉" },
    { value: "glm-4v-plus", label: "GLM-4V-Plus", description: "视觉增强" }
  ],
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "轻量快速" },
    { value: "gpt-4o", label: "GPT-4o", description: "多模态旗舰" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "高性能" },
    { value: "gpt-4", label: "GPT-4", description: "标准模型" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "经济实惠" },
    { value: "o1-preview", label: "O1 Preview", description: "推理增强" },
    { value: "o1-mini", label: "O1 Mini", description: "轻量推理" }
  ],
  qwen: [
    { value: "qwen-turbo", label: "Qwen Turbo", description: "快速响应" },
    { value: "qwen-plus", label: "Qwen Plus", description: "效果增强" },
    { value: "qwen-max", label: "Qwen Max", description: "旗舰模型" },
    {
      value: "qwen-max-longcontext",
      label: "Qwen Max Long",
      description: "长文本"
    },
    { value: "qwen-long", label: "Qwen Long", description: "超长上下文" },
    {
      value: "qwen2.5-72b-instruct",
      label: "Qwen2.5 72B",
      description: "开源大模型"
    },
    {
      value: "qwen2.5-32b-instruct",
      label: "Qwen2.5 32B",
      description: "中型模型"
    },
    {
      value: "qwen2.5-14b-instruct",
      label: "Qwen2.5 14B",
      description: "轻量模型"
    },
    {
      value: "qwen2.5-7b-instruct",
      label: "Qwen2.5 7B",
      description: "入门模型"
    }
  ],
  claude: [
    {
      value: "claude-3-5-haiku-latest",
      label: "Claude 3.5 Haiku",
      description: "快速轻量"
    },
    {
      value: "claude-3-5-sonnet-latest",
      label: "Claude 3.5 Sonnet",
      description: "推荐使用"
    },
    {
      value: "claude-3-opus-latest",
      label: "Claude 3 Opus",
      description: "最强模型"
    },
    {
      value: "claude-3-sonnet-20240229",
      label: "Claude 3 Sonnet",
      description: "平衡"
    },
    {
      value: "claude-3-haiku-20240307",
      label: "Claude 3 Haiku",
      description: "经济"
    }
  ],
  deepseek: [
    { value: "deepseek-chat", label: "DeepSeek Chat", description: "通用对话" },
    {
      value: "deepseek-coder",
      label: "DeepSeek Coder",
      description: "代码生成"
    },
    {
      value: "deepseek-reasoner",
      label: "DeepSeek Reasoner",
      description: "深度推理"
    }
  ],
  doubao: [
    {
      value: "doubao-seed-1-6-251015",
      label: "Doubao-Seed-1.6 (251015)",
      description: "最新旗舰模型（推荐）"
    },
    {
      value: "doubao-seed-1-6-250615",
      label: "Doubao-Seed-1.6 (250615)",
      description: "标准旗舰模型"
    },
    {
      value: "doubao-seed-1-6-lite-251015",
      label: "Doubao-Seed-1.6-lite",
      description: "轻量版本（高性价比）"
    },
    {
      value: "doubao-seed-1-6-flash-250828",
      label: "Doubao-Seed-1.6-flash",
      description: "快速响应"
    },
    {
      value: "doubao-seed-1-6-vision-250815",
      label: "Doubao-Seed-1.6-vision",
      description: "多模态视觉"
    },
    {
      value: "doubao-seed-1-6-thinking-250715",
      label: "Doubao-Seed-1.6-thinking",
      description: "深度推理"
    },
    {
      value: "doubao-seedance-1-0-pro-250528",
      label: "Doubao-Seedance-1.0-pro",
      description: "视频生成模型"
    },
    {
      value: "doubao-seedance-1-0-pro-fast-251015",
      label: "Doubao-Seedance-1.0-pro-fast",
      description: "快速视频生成"
    },
    {
      value: "doubao-1-5-pro-32k-250115",
      label: "Doubao-1.5-pro-32k",
      description: "经典旗舰（32k上下文）"
    },
    {
      value: "doubao-1-5-lite-32k-250115",
      label: "Doubao-1.5-lite-32k",
      description: "经典轻量（32k上下文）"
    }
  ]
};

// 获取当前服务商的模型列表
const getSummaryModels = computed(() => {
  return providerModels[localValue.value.summary.provider] || [];
});

const getWritingModels = computed(() => {
  return providerModels[localValue.value.writing.provider] || [];
});

// 创意度滑块标记
const temperatureMarks = {
  0: "精确",
  0.5: "平衡",
  1: "创意"
};

const localValue = ref<AISettings>({
  summary: {
    provider: props.modelValue?.summary?.provider ?? "glm",
    apiKey: props.modelValue?.summary?.apiKey ?? "",
    apiURL: props.modelValue?.summary?.apiURL ?? "",
    model: props.modelValue?.summary?.model ?? "",
    systemPrompt: props.modelValue?.summary?.systemPrompt ?? ""
  },
  writing: {
    provider: props.modelValue?.writing?.provider ?? "glm",
    apiKey: props.modelValue?.writing?.apiKey ?? "",
    apiURL: props.modelValue?.writing?.apiURL ?? "",
    model: props.modelValue?.writing?.model ?? "",
    systemPrompt: props.modelValue?.writing?.systemPrompt ?? "",
    maxTokens: props.modelValue?.writing?.maxTokens ?? 4096,
    temperature: props.modelValue?.writing?.temperature ?? 0.7
  },
  podcast: {
    enable: props.modelValue?.podcast?.enable ?? false,
    appId: props.modelValue?.podcast?.appId ?? "",
    accessKey: props.modelValue?.podcast?.accessKey ?? "",
    resourceId:
      props.modelValue?.podcast?.resourceId ?? "volc.service_type.10050",
    speaker1:
      props.modelValue?.podcast?.speaker1 ??
      "zh_male_dayixiansheng_v2_saturn_bigtts",
    speaker2:
      props.modelValue?.podcast?.speaker2 ??
      "zh_female_mizaitongxue_v2_saturn_bigtts",
    useHeadMusic: props.modelValue?.podcast?.useHeadMusic ?? false,
    useTailMusic: props.modelValue?.podcast?.useTailMusic ?? false,
    audioFormat: props.modelValue?.podcast?.audioFormat ?? "mp3",
    sampleRate: props.modelValue?.podcast?.sampleRate ?? 24000,
    speechRate: props.modelValue?.podcast?.speechRate ?? 0,
    buttonText: props.modelValue?.podcast?.buttonText ?? "AI 播客",
    buttonIcon: props.modelValue?.podcast?.buttonIcon ?? "anzhiyu-icon-podcast"
  }
});

// 获取默认 API URL
const getDefaultAPIURL = () => {
  return defaultAPIURLs[localValue.value.summary.provider] || "";
};

// 获取默认模型
const getDefaultModel = () => {
  return defaultModels[localValue.value.summary.provider] || "";
};

// 获取 AI 写作默认 API URL
const getWritingDefaultAPIURL = () => {
  return defaultAPIURLs[localValue.value.writing.provider] || "";
};

// 获取 AI 写作默认模型
const getWritingDefaultModel = () => {
  return writingDefaultModels[localValue.value.writing.provider] || "";
};

// 是否正在同步（防止循环更新）
const isSyncing = ref(false);

// 监听 props 变化
watch(
  () => props.modelValue,
  newValue => {
    if (isSyncing.value) return;

    isSyncing.value = true;
    localValue.value = {
      summary: {
        provider: newValue?.summary?.provider ?? "glm",
        apiKey: newValue?.summary?.apiKey ?? "",
        apiURL: newValue?.summary?.apiURL ?? "",
        model: newValue?.summary?.model ?? "",
        systemPrompt: newValue?.summary?.systemPrompt ?? ""
      },
      writing: {
        provider: newValue?.writing?.provider ?? "glm",
        apiKey: newValue?.writing?.apiKey ?? "",
        apiURL: newValue?.writing?.apiURL ?? "",
        model: newValue?.writing?.model ?? "",
        systemPrompt: newValue?.writing?.systemPrompt ?? "",
        maxTokens: newValue?.writing?.maxTokens ?? 4096,
        temperature: newValue?.writing?.temperature ?? 0.7
      },
      podcast: {
        enable: newValue?.podcast?.enable ?? false,
        appId: newValue?.podcast?.appId ?? "",
        accessKey: newValue?.podcast?.accessKey ?? "",
        resourceId: newValue?.podcast?.resourceId ?? "volc.service_type.10050",
        speaker1:
          newValue?.podcast?.speaker1 ??
          "zh_male_dayixiansheng_v2_saturn_bigtts",
        speaker2:
          newValue?.podcast?.speaker2 ??
          "zh_female_mizaitongxue_v2_saturn_bigtts",
        useHeadMusic: newValue?.podcast?.useHeadMusic ?? false,
        useTailMusic: newValue?.podcast?.useTailMusic ?? false,
        audioFormat: newValue?.podcast?.audioFormat ?? "mp3",
        sampleRate: newValue?.podcast?.sampleRate ?? 24000,
        speechRate: newValue?.podcast?.speechRate ?? 0,
        buttonText: newValue?.podcast?.buttonText ?? "AI 播客",
        buttonIcon: newValue?.podcast?.buttonIcon ?? "anzhiyu-icon-podcast"
      }
    };

    // 检查是否有单独配置 AI 写作
    useCustomWritingConfig.value = !!(
      newValue?.writing?.apiKey || newValue?.writing?.provider !== "glm"
    );

    setTimeout(() => {
      isSyncing.value = false;
    }, 0);
  },
  { deep: true }
);

// 监听本地值变化，向上传递
watch(
  localValue,
  newValue => {
    if (isSyncing.value) return;
    emit("update:modelValue", newValue);
  },
  { deep: true }
);

// 测试连接
const testConnection = async () => {
  testingConnection.value = true;
  try {
    const provider = localValue.value.summary.provider;
    const model =
      localValue.value.summary.model || defaultModels[provider] || "";
    let apiURL =
      localValue.value.summary.apiURL || defaultAPIURLs[provider] || "";

    // 豆包统一使用 v3 API（根据官方文档，所有模型都使用 v3）
    if (provider === "doubao") {
      if (apiURL.includes("/api/v4/")) {
        // 如果误填了 v4，自动纠正为 v3
        apiURL = apiURL.replace("/api/v4/", "/api/v3/");
      } else if (!apiURL.includes("/api/v3/")) {
        // 如果URL中没有版本号，添加 v3
        apiURL = apiURL.replace(
          "https://ark.cn-beijing.volces.com/api/",
          "https://ark.cn-beijing.volces.com/api/v3/"
        );
      }
    }

    const response = await http.request<{ code: number; message: string }>(
      "post",
      "/api/pro/admin/ai/test-connection",
      {
        data: {
          provider,
          api_key: localValue.value.summary.apiKey,
          api_url: apiURL,
          model
        }
      }
    );

    if (response.code === 200) {
      ElMessage.success("AI 服务连接测试成功！");
    } else {
      ElMessage.error(`连接测试失败：${response.message || "未知错误"}`);
    }
  } catch (error: any) {
    ElMessage.error(`连接测试失败：${error.message || "网络错误"}`);
  } finally {
    testingConnection.value = false;
  }
};
</script>

<style scoped lang="scss">
.ai-settings-form {
  .divider-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .sub-divider-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--anzhiyu-fontcolor);
  }

  .form-item-tip {
    font-size: 12px;
    color: var(--anzhiyu-secondtext);
    margin-top: 4px;
    line-height: 1.5;
  }

  // 修复滑块 marks 与提示文字重叠的问题
  :deep(.el-slider) {
    margin-bottom: 24px;

    .el-slider__marks-text {
      font-size: 12px;
      color: var(--anzhiyu-secondtext);
    }
  }

  :deep(.el-alert) {
    p {
      margin: 8px 0;
    }

    ul {
      margin: 8px 0;
      padding-left: 20px;

      li {
        margin: 4px 0;
      }
    }

    a {
      color: var(--anzhiyu-theme);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
