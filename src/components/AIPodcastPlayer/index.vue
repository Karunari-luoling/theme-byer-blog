<!--
 * @Description: AI播客播放器组件 - 文章顶部内嵌版本
 * @Author: 安知鱼
 * @Date: 2025-01-23
 * 说明：此组件用于在文章顶部显示 AI 播客播放器
 *       - 有简介时：集成在简介板块内
 *       - 无简介时：独立显示在文章顶部
-->
<template>
  <div
    v-if="isEnabled"
    class="ai-podcast-player"
    :class="{
      playing: isPlaying,
      loading: isLoading,
      expanded: isExpanded,
      'inline-mode': inlineMode
    }"
    :style="{ '--dominant-color': dominantColor }"
  >
    <!-- 收起状态 - 简洁的播放条 -->
    <div v-if="!isExpanded" class="player-bar" @click="handleBarClick">
      <!-- 左侧：图标和标题 -->
      <div class="player-left">
        <div class="player-icon" :class="{ spinning: isLoading }">
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
        <span class="player-title">{{ buttonText }}</span>
        <span v-if="isPlaying && currentSpeaker" class="current-speaker">
          {{ currentSpeaker }}
        </span>
      </div>

      <!-- 中间：进度条（播放时显示） -->
      <div v-if="isPlaying || currentTime > 0" class="player-progress">
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: progressPercent + '%' }"
          />
        </div>
        <span class="time-text">{{ formatTime(currentTime) }}</span>
      </div>

      <!-- 右侧：播放控制 -->
      <div class="player-controls">
        <button
          class="control-btn play-btn"
          :disabled="isLoading && !isPlaying"
          @click.stop="togglePlay"
        >
          <!-- 加载状态 -->
          <div v-if="isLoading && !isPlaying" class="loading-spinner">
            <div class="spinner-ring" />
          </div>
          <!-- 播放/暂停 -->
          <template v-else>
            <i v-if="isPlaying" class="anzhiyufont anzhiyu-icon-pause" />
            <i v-else class="anzhiyufont anzhiyu-icon-play" />
          </template>
        </button>
        <!-- 展开按钮 -->
        <button
          v-if="subtitleList.length > 0"
          class="control-btn expand-btn"
          @click.stop="isExpanded = true"
        >
          <i class="anzhiyufont anzhiyu-icon-chevron-down" />
        </button>
      </div>
    </div>

    <!-- 展开状态 - 完整播放器 -->
    <div v-else class="player-expanded">
      <!-- 头部控制栏 -->
      <div class="expanded-header">
        <div class="header-left">
          <div class="player-icon">
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
          <span class="player-title">AI 播客</span>
        </div>
        <div class="header-controls">
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
          <button class="control-btn" @click.stop="isExpanded = false">
            <i class="anzhiyufont anzhiyu-icon-chevron-up" />
          </button>
        </div>
      </div>

      <!-- 进度条 -->
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

      <!-- 字幕显示区域 -->
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
                currentSubtitleItem.speakerIndex === 0 ? 'avatar-a' : 'avatar-b'
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { IconifyIconOnline } from "@/components/ReIcon";
import { checkAIPodcastEnabled } from "@/api/ai-podcast";

interface Props {
  articleId: string;
  articleTitle?: string;
  contentHtml?: string;
  primaryColor?: string;
  enableAIPodcast?: boolean;
  inlineMode?: boolean; // 是否是内嵌模式（在简介中）
}

const props = withDefaults(defineProps<Props>(), {
  inlineMode: false
});

// 状态
const isEnabled = ref(false);
const isGlobalEnabled = ref(false);
const isExpanded = ref(false);
const isLoading = ref(false);
const isPlaying = ref(false);
const isStreaming = ref(false);
const isBuffering = ref(false);
const audioRef = ref<HTMLAudioElement | null>(null);
const currentTime = ref(0);
const duration = ref(0);
const statusMessage = ref("");
const errorMessage = ref("");
const receivedBytes = ref(0);
const currentSpeaker = ref("");
const currentSubtitle = ref("");

// 字幕列表
interface SubtitleItem {
  round: number;
  speaker: string;
  speakerIndex: number;
  text: string;
  estimatedStartTime: number;
  estimatedDuration: number;
  estimatedEndTime: number;
  actualStartTime: number;
  actualDuration: number;
  dataReceived: boolean;
  dataReceivedAtTime: number;
}
const subtitleList = ref<SubtitleItem[]>([]);
const currentSubtitleIndex = ref(-1);
let speakerMap = new Map<string, number>();
let accumulatedEstimatedDuration = 0;
let lastBufferedEndTime = 0;

// 待处理的 round_end 事件队列
interface PendingRoundEnd {
  round: number;
  roundIndex: number;
}
let pendingRoundEnds: PendingRoundEnd[] = [];
let lastProcessedBufferEnd = 0;

// 流式播放相关
let abortController: AbortController | null = null;
let mediaSource: MediaSource | null = null;
let sourceBuffer: SourceBuffer | null = null;
let audioQueue: Uint8Array[] = [];
let isAppending = ref(false);
let streamComplete = ref(false);
let streamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
let isStreamPaused = ref(false);

// 打字机效果相关
const TYPING_SPEED_FACTOR = 0.7;
const DEFAULT_CHARS_PER_SECOND = 8;
const MIN_CHAR_INTERVAL = 50;
let typingAnimationId: number | null = null;
let lastTypingUpdate = 0;
let lastDisplayedLength = 0;
const displayedText = ref("");

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

const dominantColor = computed(() => {
  if (props.primaryColor) {
    return props.primaryColor;
  }
  if (typeof document !== "undefined") {
    const style = getComputedStyle(document.documentElement);
    const mainColor = style.getPropertyValue("--anzhiyu-main").trim();
    if (mainColor) return mainColor;
  }
  return "#49b1f5";
});

const progressPercent = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

const hasValidDuration = computed(() => {
  return duration.value > 0 && isFinite(duration.value) && !isStreaming.value;
});

const currentSubtitleItem = computed(() => {
  if (
    currentSubtitleIndex.value < 0 ||
    currentSubtitleIndex.value >= subtitleList.value.length
  ) {
    return null;
  }
  return subtitleList.value[currentSubtitleIndex.value];
});

const isTyping = computed(() => {
  const item = currentSubtitleItem.value;
  if (!item || !isPlaying.value) return false;
  return displayedText.value.length < item.text.length;
});

// 工具函数
const isImageUrl = (icon: string) => {
  return icon?.startsWith("http") || icon?.startsWith("/");
};

const isIconifyIcon = (icon: string) => {
  return icon?.includes(":");
};

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

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
const processPendingRoundEnds = () => {
  if (pendingRoundEnds.length === 0) return;

  const currentBufferedEnd = getBufferedEndTime();
  if (currentBufferedEnd <= lastProcessedBufferEnd) return;

  const pending = pendingRoundEnds[0];
  const targetItem = subtitleList.value[pending.roundIndex];

  if (targetItem && !targetItem.dataReceived) {
    const startTime = lastBufferedEndTime;
    const endTime = currentBufferedEnd;
    const duration = endTime - startTime;

    targetItem.actualStartTime = startTime;
    targetItem.estimatedDuration = duration;
    targetItem.estimatedEndTime = endTime;
    targetItem.dataReceived = true;
    targetItem.dataReceivedAtTime = currentTime.value;

    lastBufferedEndTime = currentBufferedEnd;
    lastProcessedBufferEnd = currentBufferedEnd;
    pendingRoundEnds.shift();
  }
};

// 处理播放条点击
const handleBarClick = () => {
  if (!isPlaying.value && !isLoading.value) {
    if (audioRef.value?.src && audioRef.value.src !== "") {
      togglePlay();
    } else {
      startGeneration();
    }
  }
};

// 切换播放状态
const togglePlay = () => {
  if (isLoading.value && !isPlaying.value) return;

  if (!audioRef.value?.src || audioRef.value.src === "") {
    startGeneration();
  } else if (isPlaying.value) {
    audioRef.value?.pause();
    isPlaying.value = false;
    isStreamPaused.value = true;
  } else {
    window.dispatchEvent(new CustomEvent("ai-podcast-play"));
    audioRef.value?.play();
    isPlaying.value = true;
    isStreamPaused.value = false;
  }
};

// 初始化 MediaSource
const initMediaSource = (): Promise<void> => {
  return new Promise((resolve, reject) => {
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
          sourceBuffer = mediaSource!.addSourceBuffer("audio/mpeg");
          sourceBuffer.mode = "sequence";

          sourceBuffer.addEventListener("updateend", () => {
            isAppending.value = false;
            appendNextChunk();
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
    if (
      streamComplete.value &&
      audioQueue.length === 0 &&
      mediaSource &&
      mediaSource.readyState === "open"
    ) {
      try {
        mediaSource.endOfStream();
      } catch (e) {
        // 忽略错误
      }
    }
    return;
  }

  isAppending.value = true;
  const chunk = audioQueue.shift();

  try {
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
  isStreamPaused.value = false;
  errorMessage.value = "";
  statusMessage.value = "正在连接 AI 服务...";
  receivedBytes.value = 0;
  currentSpeaker.value = "";
  currentSubtitle.value = "";

  subtitleList.value = [];
  currentSubtitleIndex.value = -1;
  speakerMap.clear();
  accumulatedEstimatedDuration = 0;
  lastBufferedEndTime = 0;
  pendingRoundEnds = [];
  lastProcessedBufferEnd = 0;

  try {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    try {
      await initMediaSource();
    } catch (e) {
      console.error("[AI播客] MediaSource 初始化失败:", e);
    }

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

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }
    streamReader = reader;

    let buffer = new Uint8Array(0);
    let firstAudioReceived = false;
    let fallbackChunks: ArrayBuffer[] = [];

    const processStream = async () => {
      while (true) {
        while (isStreamPaused.value && !streamComplete.value) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (streamComplete.value) break;

        const { done, value } = await reader.read();

        if (done) {
          isStreaming.value = false;
          streamComplete.value = true;
          appendNextChunk();

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
          const newBuffer = new Uint8Array(buffer.length + value.length);
          newBuffer.set(buffer);
          newBuffer.set(value, buffer.length);
          buffer = newBuffer;

          while (buffer.length >= 5) {
            const frameType = buffer[0];
            const frameLength = new DataView(
              buffer.buffer,
              buffer.byteOffset + 1,
              4
            ).getUint32(0, false);

            if (buffer.length < 5 + frameLength) break;

            const frameData = buffer.slice(5, 5 + frameLength);
            buffer = buffer.slice(5 + frameLength);

            if (frameType === 0) {
              receivedBytes.value += frameData.length;

              if (sourceBuffer) {
                queueAudioData(frameData);
              } else {
                const ab = new ArrayBuffer(frameData.length);
                new Uint8Array(ab).set(frameData);
                fallbackChunks.push(ab);
              }

              if (!firstAudioReceived) {
                firstAudioReceived = true;
                statusMessage.value = "";

                if (sourceBuffer && audioRef.value) {
                  try {
                    window.dispatchEvent(new CustomEvent("ai-podcast-play"));
                    await audioRef.value.play();
                  } catch (e) {
                    isLoading.value = false;
                  }
                }
              }
            } else if (frameType === 1) {
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
  switch (event.event) {
    case "connecting":
      statusMessage.value = event.message || "正在连接...";
      break;
    case "connected":
      statusMessage.value = event.message || "已连接";
      break;
    case "generating":
      statusMessage.value = event.message || "生成中...";
      break;
    case "round_start":
      if (event.text) {
        const speaker = event.speaker || "";
        if (!speakerMap.has(speaker)) {
          speakerMap.set(speaker, speakerMap.size % 2);
        }
        const speakerIndex = speakerMap.get(speaker) || 0;

        subtitleList.value.push({
          round: event.round ?? subtitleList.value.length,
          speaker,
          speakerIndex,
          text: event.text,
          estimatedStartTime: accumulatedEstimatedDuration,
          estimatedDuration: 0,
          estimatedEndTime: 0,
          actualStartTime: 0,
          actualDuration: 0,
          dataReceived: false,
          dataReceivedAtTime: 0
        });

        if (subtitleList.value.length === 1) {
          currentSubtitleIndex.value = 0;
          currentSpeaker.value = speaker;
          currentSubtitle.value = event.text;
          subtitleList.value[0].actualStartTime = 0;
        }
      }
      break;
    case "round_end":
      if (subtitleList.value.length > 0 && event.round !== undefined) {
        const roundIndex = subtitleList.value.findIndex(
          item => item.round === event.round
        );
        if (roundIndex >= 0) {
          pendingRoundEnds.push({
            round: event.round,
            roundIndex: roundIndex
          });
          processPendingRoundEnds();
        }
      }
      break;
    case "progress":
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

  if (streamReader) {
    streamReader.cancel().catch(() => {});
    streamReader = null;
  }

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

  subtitleList.value = [];
  currentSubtitleIndex.value = -1;
  currentSubtitle.value = "";
  currentSpeaker.value = "";
  speakerMap.clear();
  accumulatedEstimatedDuration = 0;
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
  updateCurrentSubtitle();
};

// 根据播放进度更新当前显示的字幕
const updateCurrentSubtitle = () => {
  if (subtitleList.value.length === 0) return;

  const playTime = currentTime.value;
  const currentIdx = currentSubtitleIndex.value;
  const currentItem = subtitleList.value[currentIdx];

  if (!currentItem) return;

  const currentStartTime =
    currentIdx > 0 ? subtitleList.value[currentIdx - 1].estimatedEndTime : 0;

  if (playTime < currentStartTime && currentIdx > 0) {
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

  const isDataReceived = currentItem.dataReceived;
  const hasNextSubtitle = currentIdx < subtitleList.value.length - 1;

  if (!hasNextSubtitle || !isDataReceived) return;

  const nextItem = subtitleList.value[currentIdx + 1];
  const realEndTime = currentItem.estimatedEndTime;
  const isAudioFinished = playTime >= realEndTime && realEndTime > 0;

  if (isAudioFinished) {
    const nextIndex = currentIdx + 1;
    currentItem.actualDuration = playTime - currentItem.actualStartTime;

    if (!nextItem.dataReceived && nextItem.actualStartTime === 0) {
      nextItem.actualStartTime = playTime;
    }

    currentSubtitleIndex.value = nextIndex;
    currentSpeaker.value = nextItem.speaker;
    currentSubtitle.value = nextItem.text;
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

// 打字机动画相关
const calculateCharsToShow = (
  item: SubtitleItem,
  elapsedTime: number
): number => {
  if (elapsedTime <= 0) return 1;

  const itemDuration = item.estimatedDuration;
  if (itemDuration <= 0) {
    return Math.max(1, Math.floor(elapsedTime * DEFAULT_CHARS_PER_SECOND));
  }

  const typingDuration = itemDuration * TYPING_SPEED_FACTOR;
  const progress = Math.min(Math.max(elapsedTime / typingDuration, 0), 1);
  return Math.max(1, Math.ceil(item.text.length * progress));
};

const updateTypingAnimation = () => {
  const item = currentSubtitleItem.value;
  if (!item) {
    displayedText.value = "";
    lastDisplayedLength = 0;
    typingAnimationId = null;
    return;
  }

  const now = performance.now();
  const realCurrentTime = audioRef.value?.currentTime ?? currentTime.value;
  const elapsedTime = realCurrentTime - item.actualStartTime;
  const targetLength = Math.min(
    calculateCharsToShow(item, elapsedTime),
    item.text.length
  );

  if (
    targetLength !== lastDisplayedLength &&
    (now - lastTypingUpdate >= MIN_CHAR_INTERVAL ||
      targetLength === item.text.length)
  ) {
    displayedText.value = item.text.substring(0, targetLength);
    lastDisplayedLength = targetLength;
    lastTypingUpdate = now;
  }

  if (isPlaying.value && targetLength < item.text.length) {
    typingAnimationId = requestAnimationFrame(updateTypingAnimation);
  } else {
    typingAnimationId = null;
  }
};

const startTypingAnimation = () => {
  if (typingAnimationId !== null) {
    cancelAnimationFrame(typingAnimationId);
  }
  lastTypingUpdate = 0;
  lastDisplayedLength = 0;
  typingAnimationId = requestAnimationFrame(updateTypingAnimation);
};

const stopTypingAnimation = () => {
  if (typingAnimationId !== null) {
    cancelAnimationFrame(typingAnimationId);
    typingAnimationId = null;
  }
};

watch(currentSubtitleIndex, () => {
  lastDisplayedLength = 0;
  if (isPlaying.value) {
    startTypingAnimation();
  }
});

watch(isPlaying, playing => {
  if (playing) {
    startTypingAnimation();
  } else {
    stopTypingAnimation();
  }
});

// 检查是否启用
const checkEnabled = async () => {
  try {
    const res = await checkAIPodcastEnabled();
    isGlobalEnabled.value = res.data?.enabled ?? false;
    isEnabled.value = isGlobalEnabled.value && props.enableAIPodcast === true;
  } catch (error) {
    console.error("[AI播客] 检查启用状态失败:", error);
    isGlobalEnabled.value = false;
    isEnabled.value = false;
  }
};

watch(
  () => props.enableAIPodcast,
  () => {
    isEnabled.value = isGlobalEnabled.value && props.enableAIPodcast === true;
  }
);

// 监听音乐播放器状态
const handleMusicPlay = () => {
  if (isPlaying.value && audioRef.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  }
};

onMounted(() => {
  checkEnabled();
  window.addEventListener("music-player-play", handleMusicPlay);
});

onUnmounted(() => {
  stopStreaming();
  stopTypingAnimation();
  window.removeEventListener("music-player-play", handleMusicPlay);
});
</script>

<style scoped lang="scss">
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

@keyframes cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.ai-podcast-player {
  margin-top: 8px;
  overflow: hidden;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border-always);
  border-radius: 12px;
  transition: all 0.3s ease;

  &.inline-mode {
    margin-top: 12px;
    background: rgb(0 0 0 / 5%);
    border: none;
    border-radius: 8px;

    [data-theme="dark"] & {
      background: rgb(255 255 255 / 5%);
    }
  }

  &.expanded {
    background: var(--dominant-color);
  }
}

// 收起状态 - 播放条
.player-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgb(0 0 0 / 3%);

    [data-theme="dark"] & {
      background: rgb(255 255 255 / 5%);
    }
  }

  .expanded & {
    cursor: default;
    background: transparent;

    &:hover {
      background: transparent;
    }
  }
}

.player-left {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.player-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 14px;
  color: var(--anzhiyu-main);
  background: var(--anzhiyu-main-op);
  border-radius: 50%;

  .icon-image {
    width: 16px;
    height: 16px;
    object-fit: contain;
    border-radius: 2px;
  }

  &.spinning {
    animation: spin 1s linear infinite;
  }
}

.player-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--anzhiyu-fontcolor);
}

.current-speaker {
  padding: 2px 8px;
  font-size: 12px;
  color: var(--anzhiyu-main);
  background: var(--anzhiyu-main-op);
  border-radius: 10px;
}

.player-progress {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  max-width: 200px;

  .progress-track {
    position: relative;
    flex: 1;
    height: 4px;
    overflow: hidden;
    background: var(--anzhiyu-secondbg);
    border-radius: 2px;
  }

  .progress-fill {
    height: 100%;
    background: var(--anzhiyu-main);
    border-radius: 2px;
    transition: width 0.1s linear;
  }

  .time-text {
    font-size: 12px;
    color: var(--anzhiyu-secondtext);
  }
}

.player-controls {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 14px;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--anzhiyu-main-op);
    color: var(--anzhiyu-main);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &.play-btn {
    background: var(--anzhiyu-main);
    color: var(--anzhiyu-white);

    &:hover:not(:disabled) {
      background: var(--anzhiyu-main);
      opacity: 0.9;
      color: var(--anzhiyu-white);
    }
  }

  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;

    .spinner-ring {
      width: 14px;
      height: 14px;
      border: 2px solid rgb(255 255 255 / 30%);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }
}

// 展开状态
.player-expanded {
  padding: 16px;
}

.expanded-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  gap: 8px;
  align-items: center;

  .player-icon {
    background: rgb(255 255 255 / 20%);
    color: #fff;
  }

  .player-title {
    font-weight: 600;
    color: #fff;
  }
}

.header-controls {
  display: flex;
  gap: 8px;

  .control-btn {
    width: 36px;
    height: 36px;
    color: #fff;
    background: rgb(255 255 255 / 20%);

    &:hover:not(:disabled) {
      background: rgb(255 255 255 / 30%);
      color: #fff;
    }
  }
}

.progress-bar {
  margin-bottom: 12px;
  cursor: pointer;

  .progress-track {
    position: relative;
    height: 6px;
    overflow: hidden;
    background: rgb(255 255 255 / 20%);
    border-radius: 3px;
  }

  .progress-fill {
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
}

// 字幕容器
.subtitle-container {
  padding: 16px;
  background: rgb(255 255 255 / 10%);
  border-radius: 12px;
}

.subtitle-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

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
  }

  .typing-cursor {
    display: inline-block;
    width: 8px;
    height: 1em;
    margin-left: 2px;
    vertical-align: middle;
    background-color: #fff;
    animation: cursor-blink 0.8s step-end infinite;
  }
}

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

.subtitle-waiting .waiting-icon,
.subtitle-ready .ready-icon {
  font-size: 28px;
}

.subtitle-error {
  color: #ffb3b3;

  i {
    font-size: 20px;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}
</style>
