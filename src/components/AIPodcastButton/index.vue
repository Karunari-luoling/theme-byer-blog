<!--
 * @Description: AI播客按钮组件 - 流式播放版本（音乐胶囊风格）
 * @Author: 安知鱼
 * @Date: 2025-12-17
-->
<template>
  <Teleport to="body">
    <div
      v-if="isEnabled"
      class="ai-podcast-capsule"
      :class="{
        expanded: isExpanded,
        playing: isPlaying,
        loading: isLoading,
        hovering: isHovering,
        'in-footer-area': isInFooterArea
      }"
      :style="{
        '--dominant-color': dominantColor,
        backgroundColor: isExpanded ? dominantColor : ''
      }"
      @click="handleCapsuleClick"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
    >
      <!-- 收起状态 -->
      <template v-if="!isExpanded">
        <!-- 图标 -->
        <div class="capsule-icon">
          <img
            v-if="isImageUrl(buttonIcon)"
            :src="buttonIcon"
            alt="podcast"
            class="icon-image"
          />
          <IconifyIconOnline
            v-else-if="isIconifyIcon(buttonIcon)"
            :icon="buttonIcon"
            width="18"
            height="18"
          />
          <i v-else class="anzhiyufont" :class="buttonIcon" />
        </div>

        <!-- 文字信息 -->
        <div class="capsule-info">
          <span class="capsule-title">{{ buttonText }}</span>
        </div>

        <!-- Hover 遮罩层 -->
        <div class="capsule-hover-overlay">
          <!-- 播放/暂停按钮 -->
          <div class="capsule-play-icon" @click="handleIconClick">
            <!-- 加载状态 -->
            <div v-if="isLoading" class="loading-spinner">
              <div class="spinner-ring" />
            </div>
            <!-- 播放按钮 -->
            <svg
              v-else-if="!isPlaying"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <!-- 暂停动画（2条音乐条，与音乐胶囊一致） -->
            <div v-else class="pause-bars" :class="{ playing: isPlaying }">
              <div class="bar" />
              <div class="bar" />
            </div>
          </div>
        </div>

        <!-- 进度条覆盖层 -->
        <div
          class="progress-overlay"
          :style="{ width: progressPercent + '%' }"
        />
      </template>

      <!-- 展开状态 - 播放器 -->
      <div v-else class="expanded-view">
        <!-- 头部控制栏 -->
        <div class="player-header">
          <div class="player-title">
            <img
              v-if="isImageUrl(buttonIcon)"
              :src="buttonIcon"
              alt="podcast"
              class="icon-image"
            />
            <IconifyIconOnline
              v-else-if="isIconifyIcon(buttonIcon)"
              :icon="buttonIcon"
              width="16"
              height="16"
            />
            <i v-else class="anzhiyufont" :class="buttonIcon" />
            <span>AI 播客</span>
          </div>
          <div class="player-controls">
            <button
              class="control-btn"
              :disabled="isLoading"
              @click.stop="togglePlay"
            >
              <i
                v-if="isLoading"
                class="anzhiyufont anzhiyu-icon-spinner spinning"
              />
              <i
                v-else
                :class="
                  isPlaying
                    ? 'anzhiyufont anzhiyu-icon-pause'
                    : 'anzhiyufont anzhiyu-icon-play'
                "
              />
            </button>
            <button class="control-btn close-btn" @click.stop="collapse">
              <i class="anzhiyufont anzhiyu-icon-xmark" />
            </button>
          </div>
        </div>

        <!-- 进度条 - 只在有有效时长时显示 -->
        <div v-if="hasValidDuration" class="progress-bar" @click.stop="seekTo">
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: progressPercent + '%' }"
            />
          </div>
          <div class="time-display">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- 单块字幕显示区域 -->
        <div class="subtitle-container">
          <!-- 加载状态 -->
          <div
            v-if="isLoading && subtitleList.length === 0"
            class="subtitle-loading"
          >
            <div class="loading-content">
              <div class="loading-wave">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <span class="loading-text">{{ statusMessage }}</span>
            </div>
          </div>

          <!-- 当前字幕块 -->
          <div v-else-if="currentSubtitleItem" class="subtitle-block">
            <!-- 说话人信息 -->
            <div class="speaker-row">
              <div
                class="speaker-avatar"
                :class="
                  currentSubtitleItem.speakerIndex === 0
                    ? 'avatar-a'
                    : 'avatar-b'
                "
              >
                {{ currentSubtitleItem.speakerIndex === 0 ? "🎙️" : "🎧" }}
              </div>
              <div class="speaker-name">{{ currentSubtitleItem.speaker }}</div>
              <div class="round-indicator">
                {{ currentSubtitleIndex + 1 }} / {{ subtitleList.length }}
              </div>
            </div>

            <!-- 字幕文本（打字机效果） -->
            <div class="subtitle-text-wrapper">
              <p class="subtitle-text">
                <span class="displayed-text">{{ displayedText }}</span>
                <span v-if="isTyping" class="typing-cursor" />
              </p>
            </div>
          </div>

          <!-- 等待生成 -->
          <div v-else-if="isStreaming" class="subtitle-waiting">
            <div class="waiting-icon">🎙️</div>
            <span>AI 正在生成播客内容...</span>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="errorMessage" class="subtitle-error">
            <i class="anzhiyufont anzhiyu-icon-exclamation-circle" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- 初始状态 -->
          <div v-else class="subtitle-ready">
            <div class="ready-icon">🎧</div>
            <span>点击播放开始收听 AI 播客</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 音频元素（流式播放） -->
  <audio
    ref="audioRef"
    @timeupdate="onTimeUpdate"
    @loadedmetadata="onLoadedMetadata"
    @ended="onEnded"
    @error="onError"
    @canplay="onCanPlay"
    @waiting="onWaiting"
    @playing="onActualPlaying"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { IconifyIconOnline } from "@/components/ReIcon";
import { checkAIPodcastEnabled } from "@/api/ai-podcast";

interface Props {
  articleId: string;
  articleTitle?: string;
  contentHtml?: string;
  primaryColor?: string;
}

const props = defineProps<Props>();

// 状态
const isEnabled = ref(false);
const isExpanded = ref(false);
const isLoading = ref(false);
const isPlaying = ref(false);
const isStreaming = ref(false);
const isBuffering = ref(false);
const isHovering = ref(false);
const isInFooterArea = ref(false);
const audioRef = ref<HTMLAudioElement | null>(null);
const currentTime = ref(0);
const duration = ref(0);
const statusMessage = ref("");
const errorMessage = ref("");
const receivedBytes = ref(0);
const bufferPercent = ref(0);
const currentSpeaker = ref("");
const currentSubtitle = ref("");

// 字幕列表（用于对话式显示）
interface SubtitleItem {
  round: number;
  speaker: string;
  speakerIndex: number; // 0 或 1，用于区分两个说话人
  text: string;
  estimatedStartTime: number; // 后端估算的开始时间（秒）
  estimatedDuration: number; // 后端估算的时长（秒）
  estimatedEndTime: number; // 后端估算的结束时间（秒）
  actualStartTime: number; // 实际开始播放的时间（秒）- 动态校准
  actualDuration: number; // 实际时长（秒）- 动态校准（在下一轮开始时计算）
  dataReceived: boolean; // 该轮次的数据是否已全部接收（收到 round_end）
  dataReceivedAtTime: number; // 收到 round_end 时的播放时间
}
const subtitleList = ref<SubtitleItem[]>([]);
const currentSubtitleIndex = ref(-1); // 当前正在播放的字幕索引
let speakerMap = new Map<string, number>(); // 记录说话人对应的索引
let accumulatedEstimatedDuration = 0; // 累计的估算时长（用于 round_start 时的初始估计）
let lastSubtitleChangeTime = 0; // 上一次字幕切换的实际时间
let lastBufferedEndTime = 0; // 上一轮结束时的缓冲结束时间

// 待处理的 round_end 事件队列
interface PendingRoundEnd {
  round: number;
  roundIndex: number;
}
let pendingRoundEnds: PendingRoundEnd[] = [];
let lastProcessedBufferEnd = 0; // 上次处理时的缓冲区位置

// 获取当前已缓冲的音频结束时间
const getBufferedEndTime = (): number => {
  if (
    !sourceBuffer ||
    !sourceBuffer.buffered ||
    sourceBuffer.buffered.length === 0
  ) {
    return 0;
  }
  return sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1);
};

// 处理待处理的 round_end 事件
// 严格顺序处理：每次只处理一个轮次，等待缓冲区实际更新后再处理下一个
// 不使用字节数，完全依赖浏览器的缓冲区时间
const processPendingRoundEnds = () => {
  if (pendingRoundEnds.length === 0) return;

  const currentBufferedEnd = getBufferedEndTime();

  // 如果缓冲区没有更新，等待下次调用
  if (currentBufferedEnd <= lastProcessedBufferEnd) return;

  // 只处理第一个待处理的轮次（按顺序）
  const pending = pendingRoundEnds[0];
  const targetItem = subtitleList.value[pending.roundIndex];

  if (targetItem && !targetItem.dataReceived) {
    // 该轮次的开始时间是上一轮的结束时间
    const startTime = lastBufferedEndTime;
    // 该轮次的结束时间是当前缓冲区位置
    const endTime = currentBufferedEnd;
    const duration = endTime - startTime;

    targetItem.actualStartTime = startTime;
    targetItem.estimatedDuration = duration;
    targetItem.estimatedEndTime = endTime;
    targetItem.dataReceived = true;
    targetItem.dataReceivedAtTime = currentTime.value;

    console.log(
      `[AI播客] 轮次 ${pending.round} 顺序处理: 开始=${startTime.toFixed(2)}s, 结束=${endTime.toFixed(2)}s, 时长=${duration.toFixed(2)}s`
    );

    // 更新记录的位置
    lastBufferedEndTime = currentBufferedEnd;
    lastProcessedBufferEnd = currentBufferedEnd;

    // 移除已处理的轮次
    pendingRoundEnds.shift();

    // 如果还有待处理的轮次，等待下一次缓冲区更新
    // 不要立即递归调用，让缓冲区有机会更新
  }
};

// 当前字幕项
const currentSubtitleItem = computed(() => {
  if (
    currentSubtitleIndex.value < 0 ||
    currentSubtitleIndex.value >= subtitleList.value.length
  ) {
    return null;
  }
  return subtitleList.value[currentSubtitleIndex.value];
});

// 当前显示的文本（打字机效果）- 使用 requestAnimationFrame 优化性能
// 文字可以比音频快，在 70% 的时间内显示完所有文字
const TYPING_SPEED_FACTOR = 0.7; // 打字机速度因子，越小文字显示越快
const DEFAULT_CHARS_PER_SECOND = 8; // 默认每秒显示的字符数（当时长未知时使用）
const MIN_CHAR_INTERVAL = 50; // 最小字符间隔（毫秒），避免过于频繁更新

// 打字机状态（非响应式，用于内部计算）
let typingAnimationId: number | null = null;
let lastTypingUpdate = 0;
let lastDisplayedLength = 0;

// 响应式的显示文本（仅在字符数变化时更新）
const displayedText = ref("");

// 计算目标显示字符数的纯函数（不触发响应式）
const calculateCharsToShow = (
  item: SubtitleItem,
  elapsedTime: number
): number => {
  if (elapsedTime <= 0) {
    return 1;
  }

  const itemDuration = item.estimatedDuration;

  // 如果时长还未知（round_end 还没收到），使用默认速度
  if (itemDuration <= 0) {
    return Math.max(1, Math.floor(elapsedTime * DEFAULT_CHARS_PER_SECOND));
  }

  // 文字在 TYPING_SPEED_FACTOR 比例的时间内显示完
  const typingDuration = itemDuration * TYPING_SPEED_FACTOR;
  const progress = Math.min(Math.max(elapsedTime / typingDuration, 0), 1);
  return Math.max(1, Math.ceil(item.text.length * progress));
};

// 打字机动画循环（使用 requestAnimationFrame）
// 重要：直接读取 audio.currentTime 而不是依赖 timeupdate 事件
// 这样即使 timeupdate 事件因系统负载被节流，动画仍能正确更新
const updateTypingAnimation = () => {
  const item = currentSubtitleItem.value;
  if (!item) {
    displayedText.value = "";
    lastDisplayedLength = 0;
    typingAnimationId = null;
    return;
  }

  const now = performance.now();
  // 直接从音频元素获取当前时间，避免依赖可能被节流的 timeupdate 事件
  const realCurrentTime = audioRef.value?.currentTime ?? currentTime.value;
  const elapsedTime = realCurrentTime - item.actualStartTime;
  const targetLength = Math.min(
    calculateCharsToShow(item, elapsedTime),
    item.text.length
  );

  // 只在需要更新时才修改响应式值（减少 Vue 响应式开销）
  // 并且确保间隔足够（避免过于频繁的 DOM 更新）
  if (
    targetLength !== lastDisplayedLength &&
    (now - lastTypingUpdate >= MIN_CHAR_INTERVAL ||
      targetLength === item.text.length)
  ) {
    displayedText.value = item.text.substring(0, targetLength);
    lastDisplayedLength = targetLength;
    lastTypingUpdate = now;
  }

  // 如果还没显示完且正在播放，继续动画循环
  if (isPlaying.value && targetLength < item.text.length) {
    typingAnimationId = requestAnimationFrame(updateTypingAnimation);
  } else {
    typingAnimationId = null;
  }
};

// 启动打字机动画
const startTypingAnimation = () => {
  if (typingAnimationId !== null) {
    cancelAnimationFrame(typingAnimationId);
  }
  lastTypingUpdate = 0;
  lastDisplayedLength = 0;
  typingAnimationId = requestAnimationFrame(updateTypingAnimation);
};

// 停止打字机动画
const stopTypingAnimation = () => {
  if (typingAnimationId !== null) {
    cancelAnimationFrame(typingAnimationId);
    typingAnimationId = null;
  }
};

// 监听字幕切换，重启打字机动画
watch(currentSubtitleIndex, () => {
  lastDisplayedLength = 0;
  if (isPlaying.value) {
    startTypingAnimation();
  }
});

// 监听播放状态
watch(isPlaying, playing => {
  if (playing) {
    startTypingAnimation();
  } else {
    stopTypingAnimation();
  }
});

// 是否正在打字（光标闪烁）
const isTyping = computed(() => {
  const item = currentSubtitleItem.value;
  if (!item || !isPlaying.value) return false;

  // 如果还没显示完全部文字，显示光标
  return displayedText.value.length < item.text.length;
});

// 流式播放相关
let abortController: AbortController | null = null;
let mediaSource: MediaSource | null = null;
let sourceBuffer: SourceBuffer | null = null;
let audioQueue: Uint8Array[] = [];
let isAppending = ref(false);
let streamComplete = ref(false);
let streamReader: ReadableStreamDefaultReader<Uint8Array> | null = null; // 保存 reader 引用
let isStreamPaused = ref(false); // 流式读取是否被暂停

// 配置
const siteConfigStore = useSiteConfigStore();
const buttonText = computed(() => {
  return siteConfigStore.getSiteConfig?.ai_podcast?.button_text || "AI 播客";
});

const buttonIcon = computed(() => {
  return (
    siteConfigStore.getSiteConfig?.ai_podcast?.button_icon || "ri:mic-fill"
  );
});

// 获取文章主色调
// 优先使用 prop 传入的 primaryColor，其次使用 CSS 变量
const dominantColor = computed(() => {
  // 优先使用 prop 传入的文章主色
  if (props.primaryColor) {
    return props.primaryColor;
  }
  // 备用：从 CSS 变量获取
  if (typeof document !== "undefined") {
    const style = getComputedStyle(document.documentElement);
    const mainColor = style.getPropertyValue("--anzhiyu-main").trim();
    if (mainColor) return mainColor;
  }
  return "#49b1f5"; // 默认颜色
});

// 进度
const progressPercent = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

// 是否有有效的时长（用于决定是否显示进度条）
const hasValidDuration = computed(() => {
  return duration.value > 0 && isFinite(duration.value) && !isStreaming.value;
});

// 图标类型判断
const isImageUrl = (icon: string) => {
  return icon?.startsWith("http") || icon?.startsWith("/");
};

const isIconifyIcon = (icon: string) => {
  return icon?.includes(":");
};

// 处理胶囊点击
const handleCapsuleClick = (event: MouseEvent) => {
  event.stopPropagation();

  // 检查是否点击了播放按钮区域
  const target = event.target as HTMLElement;
  const isPlayIcon = target.closest(".capsule-play-icon");

  if (isPlayIcon) {
    // 点击播放按钮区域，已在 handleIconClick 中处理
    return;
  }

  // 如果在播放状态，点击非图标区域展开
  if (isPlaying.value && !isExpanded.value) {
    isExpanded.value = true;
    return;
  }

  // 如果已展开，不处理（通过关闭按钮关闭）
  if (isExpanded.value) {
    return;
  }

  // 收起状态且未播放
  // 检查是否有已存在的音频源可以继续播放，而不是重新开始
  if (audioRef.value?.src && audioRef.value.src !== "") {
    // 有现有音频源，恢复播放
    togglePlay();
  } else {
    // 没有音频源，开始新的播放
    startGeneration();
  }
};

// 处理播放图标点击
const handleIconClick = (event: MouseEvent) => {
  event.stopPropagation();
  togglePlay();
};

// 切换播放状态
const togglePlay = () => {
  if (isLoading.value) return;

  if (!audioRef.value?.src || audioRef.value.src === "") {
    // 没有音频源，开始生成
    startGeneration();
  } else if (isPlaying.value) {
    // 暂停
    audioRef.value?.pause();
    isPlaying.value = false;
    // 暂停流式读取，减小请求压力
    isStreamPaused.value = true;
    console.log("[AI播客] 已暂停流式读取");
  } else {
    // 恢复播放 - 通知音乐播放器暂停（互斥）
    window.dispatchEvent(new CustomEvent("ai-podcast-play"));
    audioRef.value?.play();
    isPlaying.value = true;
    // 恢复流式读取
    isStreamPaused.value = false;
    console.log("[AI播客] 已恢复流式读取");
  }
};

// 收起播放器
const collapse = () => {
  isExpanded.value = false;
};

// 初始化 MediaSource 用于流式播放
const initMediaSource = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 清理之前的资源
    cleanupMediaSource();

    mediaSource = new MediaSource();
    audioQueue = [];
    isAppending.value = false;
    streamComplete.value = false;

    const url = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener(
      "sourceopen",
      () => {
        try {
          // MP3 格式
          sourceBuffer = mediaSource!.addSourceBuffer("audio/mpeg");
          sourceBuffer.mode = "sequence";

          sourceBuffer.addEventListener("updateend", () => {
            isAppending.value = false;
            appendNextChunk();
            // 缓冲区更新后，尝试处理待处理的 round_end 事件
            processPendingRoundEnds();
          });

          sourceBuffer.addEventListener("error", e => {
            console.error("[AI播客] SourceBuffer 错误:", e);
          });

          resolve();
        } catch (e) {
          console.error("[AI播客] 创建 SourceBuffer 失败:", e);
          reject(e);
        }
      },
      { once: true }
    );

    mediaSource.addEventListener("sourceended", () => {
      console.log("[AI播客] MediaSource ended");
    });

    mediaSource.addEventListener("sourceclose", () => {
      console.log("[AI播客] MediaSource closed");
    });

    if (audioRef.value) {
      audioRef.value.src = url;
    }
  });
};

// 清理 MediaSource 资源
const cleanupMediaSource = () => {
  if (sourceBuffer && mediaSource && mediaSource.readyState === "open") {
    try {
      mediaSource.removeSourceBuffer(sourceBuffer);
    } catch (e) {
      // 忽略错误
    }
  }
  sourceBuffer = null;
  mediaSource = null;
  audioQueue = [];
};

// 追加下一个音频块
const appendNextChunk = () => {
  if (
    !sourceBuffer ||
    isAppending.value ||
    audioQueue.length === 0 ||
    !mediaSource ||
    mediaSource.readyState !== "open"
  ) {
    // 如果流已完成且队列为空，关闭 MediaSource
    if (
      streamComplete.value &&
      audioQueue.length === 0 &&
      mediaSource &&
      mediaSource.readyState === "open"
    ) {
      try {
        mediaSource.endOfStream();
        console.log("[AI播客] MediaSource 已结束");
      } catch (e) {
        console.log("[AI播客] endOfStream 失败:", e);
      }
    }
    return;
  }

  isAppending.value = true;
  const chunk = audioQueue.shift();

  try {
    // 创建新的 ArrayBuffer 副本以确保类型兼容
    const buffer = new ArrayBuffer(chunk!.length);
    new Uint8Array(buffer).set(chunk!);
    sourceBuffer.appendBuffer(buffer);
  } catch (e) {
    console.error("[AI播客] 追加音频块失败:", e);
    isAppending.value = false;
  }
};

// 添加音频数据到队列
const queueAudioData = (data: Uint8Array) => {
  audioQueue.push(data);
  appendNextChunk();
};

// 开始流式生成
const startGeneration = async () => {
  if (!props.contentHtml) {
    errorMessage.value = "文章内容不可用";
    return;
  }

  isLoading.value = true;
  isStreaming.value = true;
  isStreamPaused.value = false; // 重置暂停状态
  errorMessage.value = "";
  statusMessage.value = "正在连接 AI 服务...";
  receivedBytes.value = 0;
  currentSpeaker.value = "";
  currentSubtitle.value = "";

  // 重置字幕相关状态
  subtitleList.value = [];
  currentSubtitleIndex.value = -1;
  speakerMap.clear();
  accumulatedEstimatedDuration = 0;
  lastSubtitleChangeTime = 0;
  lastBufferedEndTime = 0;
  pendingRoundEnds = [];
  lastProcessedBufferEnd = 0;

  try {
    // 取消之前的请求
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    // 初始化 MediaSource
    try {
      await initMediaSource();
      console.log("[AI播客] MediaSource 初始化成功");
    } catch (e) {
      console.error("[AI播客] MediaSource 初始化失败，将使用备用模式:", e);
    }

    // 使用混合流式 API
    const response = await fetch("/api/pro/ai-podcast/stream-mixed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        article_id: props.articleId,
        content_html: props.contentHtml
      }),
      signal: abortController.signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    statusMessage.value = "AI 正在生成播客...";

    // 读取混合流
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }
    streamReader = reader; // 保存 reader 引用

    let buffer = new Uint8Array(0);
    let firstAudioReceived = false;
    let fallbackChunks: ArrayBuffer[] = []; // 备用模式收集数据

    const processStream = async () => {
      while (true) {
        // 如果流式读取被暂停，等待恢复
        while (isStreamPaused.value && !streamComplete.value) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 如果流已完成，退出循环
        if (streamComplete.value) {
          break;
        }

        const { done, value } = await reader.read();

        if (done) {
          console.log("[AI播客] 流式传输完成");
          isStreaming.value = false;
          streamComplete.value = true;

          // 通知 MediaSource 流已完成
          appendNextChunk();

          // 如果使用备用模式（MediaSource 失败），创建 Blob 播放
          if (!sourceBuffer && fallbackChunks.length > 0) {
            const blob = new Blob(fallbackChunks, { type: "audio/mpeg" });
            const url = URL.createObjectURL(blob);
            if (audioRef.value) {
              audioRef.value.src = url;
              try {
                await audioRef.value.play();
                isPlaying.value = true;
              } catch (e) {
                console.log("[AI播客] 自动播放被阻止");
              }
            }
          }
          break;
        }

        if (value) {
          // 合并缓冲区
          const newBuffer = new Uint8Array(buffer.length + value.length);
          newBuffer.set(buffer);
          newBuffer.set(value, buffer.length);
          buffer = newBuffer;

          // 解析帧
          while (buffer.length >= 5) {
            const frameType = buffer[0];
            const frameLength = new DataView(
              buffer.buffer,
              buffer.byteOffset + 1,
              4
            ).getUint32(0, false);

            if (buffer.length < 5 + frameLength) {
              // 数据不完整，等待更多数据
              break;
            }

            const frameData = buffer.slice(5, 5 + frameLength);
            buffer = buffer.slice(5 + frameLength);

            if (frameType === 0) {
              // 音频帧
              receivedBytes.value += frameData.length;

              if (sourceBuffer) {
                // 使用 MediaSource 流式播放
                queueAudioData(frameData);
              } else {
                // 备用模式：收集数据（转换为 ArrayBuffer）
                const ab = new ArrayBuffer(frameData.length);
                new Uint8Array(ab).set(frameData);
                fallbackChunks.push(ab);
              }

              // 首次收到音频数据时，尝试开始播放
              if (!firstAudioReceived) {
                firstAudioReceived = true;
                statusMessage.value = "";

                // 如果使用 MediaSource，尝试自动播放
                // 注意：不要在这里设置 isLoading = false，等 onActualPlaying 事件触发时再设置
                if (sourceBuffer && audioRef.value) {
                  try {
                    // 通知音乐播放器暂停（互斥）
                    window.dispatchEvent(new CustomEvent("ai-podcast-play"));
                    await audioRef.value.play();
                    // isPlaying 和 isLoading 会在 onActualPlaying 事件中设置
                    console.log("[AI播客] 开始流式播放");
                  } catch (e) {
                    console.log("[AI播客] 自动播放被阻止，需要用户交互");
                    // 自动播放被阻止时才设置 isLoading = false，让用户手动点击播放
                    isLoading.value = false;
                  }
                }
              }
            } else if (frameType === 1) {
              // JSON 事件帧
              try {
                const eventText = new TextDecoder().decode(frameData);
                const event = JSON.parse(eventText);
                handleStreamEvent(event);
              } catch (e) {
                console.error("[AI播客] 解析事件失败:", e);
              }
            }
          }
        }
      }
    };

    processStream().catch(error => {
      if (error.name !== "AbortError") {
        console.error("[AI播客] 流处理错误:", error);
        errorMessage.value = "播放失败: " + error.message;
        isLoading.value = false;
        isStreaming.value = false;
      }
    });
  } catch (error: any) {
    console.error("[AI播客] 启动失败:", error);
    isLoading.value = false;
    isStreaming.value = false;

    if (error.name === "AbortError") {
      statusMessage.value = "已停止";
    } else {
      errorMessage.value = error.message || "启动失败";
    }
  }
};

// 处理流事件
const handleStreamEvent = (event: any) => {
  console.log("[AI播客] 事件:", event.event, event);

  switch (event.event) {
    case "connecting":
      statusMessage.value = event.message || "正在连接...";
      break;
    case "connected":
      statusMessage.value = event.message || "已连接";
      break;
    case "generating":
      statusMessage.value = event.message || "生成中...";
      // 不要在这里设置 isLoading = false，等音频真正播放时再设置
      break;
    case "round_start":
      // 收集字幕到对话列表
      if (event.text) {
        const speaker = event.speaker || "";
        // 分配说话人索引（0 或 1）
        if (!speakerMap.has(speaker)) {
          speakerMap.set(speaker, speakerMap.size % 2);
        }
        const speakerIndex = speakerMap.get(speaker) || 0;

        // 添加新字幕
        // 使用 ?? 而不是 ||，因为 round 可能为 0（第一轮）
        subtitleList.value.push({
          round: event.round ?? subtitleList.value.length,
          speaker,
          speakerIndex,
          text: event.text,
          estimatedStartTime: accumulatedEstimatedDuration,
          estimatedDuration: 0, // 将在 round_end 时更新
          estimatedEndTime: 0, // 将在 round_end 时更新
          actualStartTime: 0, // 将在播放时动态校准
          actualDuration: 0, // 将在下一轮开始时计算
          dataReceived: false, // 数据未接收完成
          dataReceivedAtTime: 0 // 收到 round_end 时的播放时间
        });

        // 只在第一个字幕时设为当前字幕
        if (subtitleList.value.length === 1) {
          currentSubtitleIndex.value = 0;
          currentSpeaker.value = speaker;
          currentSubtitle.value = event.text;
          // 第一个字幕的实际开始时间为 0
          subtitleList.value[0].actualStartTime = 0;
        }
      }
      break;
    case "round_end":
      // 更新当前轮次的时长信息，并标记该轮次数据已完成
      // 将事件添加到待处理队列，等待音频缓冲后顺序处理
      // 不使用字节数，完全依赖浏览器的缓冲区时间
      if (subtitleList.value.length > 0 && event.round !== undefined) {
        const roundIndex = subtitleList.value.findIndex(
          item => item.round === event.round
        );
        if (roundIndex >= 0) {
          pendingRoundEnds.push({
            round: event.round,
            roundIndex: roundIndex
          });
          // 尝试处理（如果缓冲区已经更新）
          processPendingRoundEnds();
        } else {
          console.warn(`[AI播客] 无法找到轮次 ${event.round} 对应的字幕项`);
        }
      }
      break;
    case "progress":
      // 进度更新 - 根据播放进度更新字幕
      updateCurrentSubtitle();
      break;
    case "completed":
      isStreaming.value = false;
      isLoading.value = false;
      break;
    case "error":
      errorMessage.value = event.message || "发生错误";
      isLoading.value = false;
      isStreaming.value = false;
      break;
  }
};

// 停止流式播放
const stopStreaming = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }

  // 清理 reader
  if (streamReader) {
    streamReader.cancel().catch(() => {
      // 忽略取消错误
    });
    streamReader = null;
  }

  // 清理 MediaSource
  cleanupMediaSource();

  if (audioRef.value) {
    audioRef.value.pause();
    audioRef.value.src = "";
  }

  isPlaying.value = false;
  isStreaming.value = false;
  isLoading.value = false;
  streamComplete.value = false;
  isStreamPaused.value = false;

  // 重置字幕相关状态
  subtitleList.value = [];
  currentSubtitleIndex.value = -1;
  currentSubtitle.value = "";
  currentSpeaker.value = "";
  speakerMap.clear();
  accumulatedEstimatedDuration = 0;
  lastSubtitleChangeTime = 0;
  lastBufferedEndTime = 0;
  pendingRoundEnds = [];
  lastProcessedBufferEnd = 0;
};

const seekTo = (event: MouseEvent) => {
  if (!audioRef.value || duration.value === 0 || isStreaming.value) return;

  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  audioRef.value.currentTime = percent * duration.value;
};

const onTimeUpdate = () => {
  if (!audioRef.value) return;
  currentTime.value = audioRef.value.currentTime;
  // 根据播放进度更新字幕
  updateCurrentSubtitle();
};

// 根据播放进度更新当前显示的字幕（动态校准）
const updateCurrentSubtitle = () => {
  if (subtitleList.value.length === 0) return;

  const playTime = currentTime.value;
  const currentIdx = currentSubtitleIndex.value;
  const currentItem = subtitleList.value[currentIdx];

  if (!currentItem) return;

  // 先处理 seek 回退的情况
  // 使用前一个字幕的 estimatedEndTime 作为当前字幕的开始时间
  const currentStartTime =
    currentIdx > 0 ? subtitleList.value[currentIdx - 1].estimatedEndTime : 0;

  if (playTime < currentStartTime && currentIdx > 0) {
    // 需要回退到之前的字幕
    for (let i = currentIdx - 1; i >= 0; i--) {
      const itemStartTime =
        i > 0 ? subtitleList.value[i - 1].estimatedEndTime : 0;
      if (playTime >= itemStartTime) {
        currentSubtitleIndex.value = i;
        currentSpeaker.value = subtitleList.value[i].speaker;
        currentSubtitle.value = subtitleList.value[i].text;
        break;
      }
    }
    return;
  }

  // 切换到下一个字幕的条件：
  // 1. 当前轮次的数据必须已接收完成（收到 round_end，此时 estimatedDuration 已设置）
  // 2. 音频必须播放完当前轮次（播放时间超过该轮次的结束时间）
  // 3. 有下一个字幕可以切换
  // 注意：文字可以提前显示完，但必须等音频读完才切换
  // 注意：不再需要检查下一轮的 dataReceived，因为 round_end 现在使用 event.round 精确匹配
  const isDataReceived = currentItem.dataReceived;
  const hasNextSubtitle = currentIdx < subtitleList.value.length - 1;

  if (!hasNextSubtitle || !isDataReceived) {
    // 没有下一个字幕或当前数据未接收完，不切换
    return;
  }

  const nextItem = subtitleList.value[currentIdx + 1];

  // 直接使用浏览器报告的实际结束时间（在 round_end 时记录的 currentBufferedEnd）
  // 不使用任何估算，直接比较播放时间和实际缓冲结束时间
  const realEndTime = currentItem.estimatedEndTime;
  // 音频是否已经播放完当前轮次
  const isAudioFinished = playTime >= realEndTime && realEndTime > 0;

  if (isAudioFinished) {
    const nextIndex = currentIdx + 1;

    // 记录上一个字幕的实际时长
    currentItem.actualDuration = playTime - currentItem.actualStartTime;

    // 如果下一个字幕的 actualStartTime 还没有被 round_end 设置（dataReceived 为 false），
    // 则使用当前播放时间作为备选
    if (!nextItem.dataReceived && nextItem.actualStartTime === 0) {
      nextItem.actualStartTime = playTime;
    }

    // 更新当前字幕索引
    currentSubtitleIndex.value = nextIndex;
    currentSpeaker.value = nextItem.speaker;
    currentSubtitle.value = nextItem.text;

    console.log(
      `[AI播客] 字幕切换: ${currentIdx} -> ${nextIndex}, 实际时长: ${currentItem.actualDuration.toFixed(2)}s, 播放时间: ${playTime.toFixed(2)}s, 下一个开始时间: ${nextItem.actualStartTime.toFixed(2)}s`
    );
  }
};

const onLoadedMetadata = () => {
  if (!audioRef.value) return;
  duration.value = audioRef.value.duration;
};

const onEnded = () => {
  isPlaying.value = false;
  isStreaming.value = false;
};

const onError = (e: Event) => {
  console.error("[AI播客] 音频错误:", e);
  isPlaying.value = false;
  isLoading.value = false;
  errorMessage.value = "音频加载失败";
};

const onCanPlay = () => {
  isBuffering.value = false;
};

const onWaiting = () => {
  isBuffering.value = true;
};

const onActualPlaying = () => {
  isPlaying.value = true;
  isLoading.value = false;
  isBuffering.value = false;
};

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

// 检查是否启用
const checkEnabled = async () => {
  try {
    const res = await checkAIPodcastEnabled();
    isEnabled.value = res.data?.enabled ?? false;
  } catch (error) {
    console.error("[AI播客] 检查启用状态失败:", error);
    isEnabled.value = false;
  }
};

// 页脚区域观察器
let footerObserver: IntersectionObserver | null = null;

// 初始化页脚区域观察器
const initFooterObserver = () => {
  const footerElement = document.getElementById("footer-container");

  if (!footerElement) {
    return;
  }

  footerObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        // 当页脚区域进入视口时，隐藏 AI 播客按钮
        isInFooterArea.value = entry.isIntersecting;
      });
    },
    {
      // 当页脚区域有任何部分进入视口时就触发
      threshold: 0.1,
      // 设置根边距，提前一点触发
      rootMargin: "50px 0px 0px 0px"
    }
  );

  footerObserver.observe(footerElement);
};

// 清理页脚观察器
const cleanupFooterObserver = () => {
  if (footerObserver) {
    footerObserver.disconnect();
    footerObserver = null;
  }
};

// 生命周期
onMounted(() => {
  checkEnabled();
  // 延迟初始化 footer 观察器，确保 DOM 已渲染
  setTimeout(() => {
    initFooterObserver();
  }, 500);
});

onUnmounted(() => {
  stopStreaming();
  cleanupFooterObserver();
  stopTypingAnimation(); // 清理打字机动画
});

// 监听音乐播放器状态
const handleMusicPlay = () => {
  if (isPlaying.value && audioRef.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  }
};

onMounted(() => {
  window.addEventListener("music-player-play", handleMusicPlay);
});

onUnmounted(() => {
  window.removeEventListener("music-player-play", handleMusicPlay);
});
</script>

<style scoped lang="scss">
// 动画效果（与音乐胶囊一致）
@keyframes pulse {
  from {
    opacity: 1;
    transform: scaleY(1);
  }

  to {
    opacity: 0.5;
    transform: scaleY(0.3);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes wave {
  0%,
  100% {
    height: 4px;
  }

  50% {
    height: 18px;
  }
}

.ai-podcast-capsule {
  position: fixed;
  bottom: 70px;
  left: 20px;
  z-index: 1008;
  display: flex;
  align-items: center;
  width: fit-content;
  max-width: 200px;
  height: 40px;
  padding-right: 12px;
  overflow: visible;
  cursor: pointer;
  background-color: var(--anzhiyu-card-bg);
  backdrop-filter: blur(20px);
  border: var(--style-border);
  border-radius: 20px;
  transition:
    all 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.3s ease;

  // 当进入页脚区域时隐藏（快速隐藏，无延迟）
  &.in-footer-area {
    bottom: -10px;
    opacity: 0;
    pointer-events: none;
    // 隐藏时快速响应
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  // 离开页脚区域时先出现（比音乐胶囊快）
  &:not(.in-footer-area) {
    // 显示时快速响应，无延迟
    transition:
      all 0.25s cubic-bezier(0.4, 0, 0.2, 1),
      background-color 0.3s ease;
  }

  &:hover:not(.expanded) {
    background-color: var(--dominant-color) !important;
    box-shadow: 0 8px 30px rgb(0 0 0 / 25%);
    transform: scale(1.02);

    // 图标和文字变半透明（与音乐胶囊一致）
    .capsule-icon {
      color: #fff;
      opacity: 0.3;
    }

    .capsule-info .capsule-title {
      color: #fff;
      opacity: 0.3;
    }

    .pause-bars .bar {
      background: #fff;
    }

    // hover 时显示播放按钮
    .capsule-play-icon {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, -50%) scale(1.5);
    }
  }

  // 加载中时显示 loading 图标（始终显示，方便用户知道正在加载）
  &.loading:not(.expanded) {
    // 背景变成主色调
    background-color: var(--dominant-color) !important;

    .capsule-icon {
      color: #fff;
      opacity: 0.3;
    }

    .capsule-info .capsule-title {
      color: #fff;
      opacity: 0.3;
    }

    .capsule-play-icon {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, -50%) scale(1.5);
    }
  }

  // 播放中时显示播放动画（始终显示）
  &.playing:not(.expanded) {
    // 背景变成主色调
    background-color: var(--dominant-color) !important;

    .capsule-icon {
      color: #fff;
      opacity: 0.3;
    }

    .capsule-info .capsule-title {
      color: #fff;
      opacity: 0.3;
    }

    .capsule-play-icon {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, -50%) scale(1.5);
    }
  }

  &.expanded {
    bottom: 70px;
    left: 20px;
    flex-direction: column;
    align-items: stretch;
    width: 320px;
    max-width: 320px;
    height: auto;
    padding: 16px;
    cursor: default;
    border-radius: 16px;

    &:hover {
      transform: none;
    }
  }
}

// 图标区域
.capsule-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-left: 8px;
  font-size: 16px;
  color: var(--anzhiyu-fontcolor);
  transition: color 0.3s ease;

  .icon-image {
    width: 18px;
    height: 18px;
    object-fit: contain;
    border-radius: 2px;
  }
}

// 信息区域
.capsule-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
  padding: 0 4px 0 4px;
  overflow: hidden;

  .capsule-title {
    overflow: hidden;
    font-size: 13px;
    font-weight: 500;
    color: var(--anzhiyu-fontcolor);
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.3s ease;
  }
}

// Hover 遮罩层（移除，改用音乐胶囊的方式：让内容变半透明）
.capsule-hover-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: transparent;
  border-radius: 20px;
}

// 播放图标 - 默认隐藏，hover 时居中显示（与音乐胶囊一致）
.capsule-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #fff;
  pointer-events: none;
  background: transparent !important;
  backdrop-filter: none !important;
  border-radius: 50%;
  opacity: 0;
  visibility: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform: translate(-50%, -50%) scale(0.8);

  svg {
    width: 14px;
    height: 14px;
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 30%));
  }

  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;

    .spinner-ring {
      width: 14px;
      height: 14px;
      border: 2px solid rgb(255 255 255 / 30%);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      filter: drop-shadow(0 1px 2px rgb(0 0 0 / 30%));
    }
  }

  // 与音乐胶囊一致的 pause-bars 样式
  .pause-bars {
    display: flex;
    gap: 2px;

    .bar {
      width: 2px;
      height: 10px;
      background: white;
      border-radius: 1px;
      filter: drop-shadow(0 1px 2px rgb(0 0 0 / 30%));
    }

    &.playing .bar {
      animation: pulse 1.5s ease-in-out infinite alternate;

      &:nth-child(2) {
        animation-delay: 0.3s;
      }
    }
  }
}

// 进度条覆盖层（收起状态）
.progress-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: rgb(255 255 255 / 15%);
  border-radius: 20px;
  transition: width 0.1s linear;
}

// 展开视图
.expanded-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .player-title {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: #fff;

    i {
      color: #fff;
    }

    .icon-image {
      width: 16px;
      height: 16px;
      object-fit: contain;
      border-radius: 2px;
    }
  }

  .player-controls {
    display: flex;
    gap: 8px;
  }

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 14px;
    color: #fff;
    cursor: pointer;
    background: rgb(255 255 255 / 20%);
    border: none;
    border-radius: 50%;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: rgb(255 255 255 / 30%);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
}

.progress-bar {
  cursor: pointer;

  .progress-track {
    position: relative;
    height: 6px;
    overflow: hidden;
    background: rgb(255 255 255 / 20%);
    border-radius: 3px;
  }

  .progress-buffer {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgb(255 255 255 / 30%);
    border-radius: 3px;
  }

  .progress-fill {
    position: relative;
    z-index: 1;
    height: 100%;
    background: #fff;
    border-radius: 3px;
    transition: width 0.1s linear;
  }

  .time-display {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 11px;
    color: rgb(255 255 255 / 80%);
  }

  .streaming-badge {
    padding: 1px 6px;
    font-size: 10px;
    color: #fff;
    background: #e74c3c;
    border-radius: 8px;
  }
}

// 单块字幕容器
.subtitle-container {
  padding: 16px;
  background: rgb(255 255 255 / 10%);
  border-radius: 12px;
}

// 字幕块
.subtitle-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 说话人行
.speaker-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.speaker-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 16px;
  border-radius: 50%;
  transition: transform 0.3s ease;

  &.avatar-a {
    background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  }

  &.avatar-b {
    background: linear-gradient(135deg, #50c878 0%, #3cb371 100%);
  }
}

.speaker-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.round-indicator {
  padding: 2px 8px;
  font-size: 11px;
  color: rgb(255 255 255 / 60%);
  background: rgb(255 255 255 / 10%);
  border-radius: 10px;
}

// 字幕文本区域
.subtitle-text-wrapper {
  min-height: 60px;
  padding: 12px 16px;
  background: rgb(0 0 0 / 20%);
  border-radius: 8px;
}

.subtitle-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: #fff;
  word-wrap: break-word;
  word-break: break-word;

  .displayed-text {
    color: #fff;
    // 使用 GPU 加速，减少重排重绘
    will-change: contents;
    // 平滑文本渲染
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .typing-cursor {
    display: inline-block;
    width: 8px;
    height: 1em;
    margin-left: 2px;
    vertical-align: middle;
    background-color: #fff;
    border-radius: 0; // 方块形状，无圆角
    animation: cursor-blink 0.8s step-end infinite;
    // 使用 GPU 加速光标动画
    will-change: opacity;
  }
}

@keyframes cursor-blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

// 当前块进度条
// 加载、等待、准备、错误状态
.subtitle-loading,
.subtitle-waiting,
.subtitle-ready,
.subtitle-error {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  font-size: 14px;
  color: rgb(255 255 255 / 80%);
}

.loading-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.loading-text {
  font-size: 13px;
  color: rgb(255 255 255 / 70%);
}

.subtitle-waiting {
  .waiting-icon {
    font-size: 28px;
    animation: pulse 1.5s ease-in-out infinite;
  }
}

.subtitle-ready {
  .ready-icon {
    font-size: 28px;
    opacity: 0.7;
  }
}

.subtitle-error {
  color: #ffb3b3;

  i {
    font-size: 20px;
  }
}

.loading-wave {
  display: flex;
  gap: 3px;
  align-items: flex-end;
  height: 20px;

  span {
    width: 4px;
    background: #fff;
    border-radius: 2px;
    animation: wave 1.2s ease-in-out infinite;

    &:nth-child(1) {
      animation-delay: 0s;
    }

    &:nth-child(2) {
      animation-delay: 0.1s;
    }

    &:nth-child(3) {
      animation-delay: 0.2s;
    }

    &:nth-child(4) {
      animation-delay: 0.3s;
    }

    &:nth-child(5) {
      animation-delay: 0.4s;
    }
  }
}

.data-info {
  font-size: 10px;
  color: rgb(255 255 255 / 60%);
  text-align: center;
}

.spinning {
  animation: spin 1s linear infinite;
}

@media (width <= 768px) {
  .ai-podcast-capsule {
    bottom: 80px;
    left: 10px;

    &.expanded {
      right: 10px;
      left: 10px;
      width: auto;
    }
  }
}
</style>
