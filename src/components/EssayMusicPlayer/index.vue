<!--
 * @Description: Essay音乐播放器组件
 * @Author: 安知鱼
 * @Date: 2025-10-05
-->
<template>
  <div class="essay-music-player">
    <!-- Loading状态 -->
    <div v-if="isLoading" class="music-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载音乐中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="music-error">
      <i class="anzhiyufont anzhiyu-icon-exclamation-circle" />
      <span>{{ error }}</span>
    </div>

    <!-- 播放器 -->
    <div v-else-if="song" class="music-player-container">
      <!-- 封面和信息区域 -->
      <div class="music-main">
        <!-- 封面 -->
        <div class="music-cover" @click="togglePlay">
          <img :src="song.pic" :alt="song.name" loading="lazy" />
          <div class="play-overlay" :class="{ playing: audioState.isPlaying }">
            <i
              class="anzhiyufont"
              :class="
                audioState.isPlaying
                  ? 'anzhiyu-icon-pause'
                  : 'anzhiyu-icon-play'
              "
            />
          </div>
        </div>

        <!-- 右侧信息区域 -->
        <div class="music-right">
          <!-- 歌曲信息 -->
          <div class="music-info">
            <div class="music-title">{{ song.name }} - {{ song.artist }}</div>
          </div>

          <!-- 歌词显示区域 -->
          <div v-if="lyrics.length > 0" class="music-lyrics">
            <div class="lyrics-container">
              <div
                class="lyrics-wrapper"
                :style="{
                  transform: `translateY(${lyricsState.translateY}px)`,
                  transition:
                    'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }"
              >
                <div
                  v-for="(lyric, index) in lyrics"
                  :key="index"
                  :ref="el => setLyricRef(el, index)"
                  class="lyric-line"
                  :class="{
                    active: index === lyricsState.currentIndex,
                    'should-scroll': lyricsState.shouldScroll[index]
                  }"
                >
                  <span class="lyric-text">{{ lyric.text }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="music-progress">
            <div class="progress-time">
              {{ formatTime(audioState.currentTime) }}
            </div>
            <div class="progress-bar-wrapper" @click="handleProgressClick">
              <div class="progress-bar">
                <div
                  class="progress-bar-loaded"
                  :style="{ width: loadedPercentage + '%' }"
                />
                <div
                  class="progress-bar-played"
                  :style="{ width: playedPercentage + '%' }"
                />
              </div>
            </div>
            <div class="progress-time">
              {{ formatTime(audioState.duration) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 音频元素 -->
      <audio
        ref="audioElement"
        preload="metadata"
        crossorigin="anonymous"
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @ended="onEnded"
        @error="onError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick
} from "vue";
import { Loading } from "@element-plus/icons-vue";
import { useEssaySingleMusic } from "@/composables/useEssaySingleMusic";
import { useLyrics } from "@/composables/useLyrics";
import type { Song } from "@/types/music";

defineOptions({
  name: "EssayMusicPlayer"
});

const props = defineProps<{
  musicId: string; // 网易云音乐ID
}>();

const emit = defineEmits<{
  (e: "loaded"): void; // 音乐加载完成事件
}>();

// 音乐数据获取
const { isLoading, error, fetchSingleSong } = useEssaySingleMusic();
const song = ref<Song | null>(null);

// 音频元素引用
const audioElement = ref<HTMLAudioElement>();

// 音频状态
const audioState = ref({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false
});

// 加载进度
const loadedPercentage = ref(0);

// 播放进度百分比
const playedPercentage = computed(() => {
  return audioState.value.duration > 0
    ? (audioState.value.currentTime / audioState.value.duration) * 100
    : 0;
});

// 使用歌词 composable
const lyricsComposable = useLyrics(
  computed(() => audioState.value.currentTime)
);
const { lyrics, lyricsState, setLyricRef, setLyrics, clearLyrics } =
  lyricsComposable;

// 格式化时间显示
const formatTime = (seconds: number): string => {
  if (!seconds || !isFinite(seconds) || isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// 播放/暂停切换
const togglePlay = async () => {
  if (!audioElement.value || !song.value) return;

  if (audioState.value.isPlaying) {
    audioElement.value.pause();
  } else {
    try {
      // 设置音量
      audioElement.value.volume = audioState.value.volume;

      // 通知音乐胶囊暂停播放（避免冲突）
      window.dispatchEvent(new CustomEvent("essay-music-play"));

      await audioElement.value.play();
    } catch (error) {
      console.error(" [Essay音乐播放器] 播放失败:", error);
    }
  }
};

// 进度条点击
const handleProgressClick = (event: MouseEvent) => {
  if (!audioElement.value || !audioState.value.duration) return;

  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percentage = (event.clientX - rect.left) / rect.width;
  const targetTime = percentage * audioState.value.duration;

  audioElement.value.currentTime = targetTime;
  audioState.value.currentTime = targetTime;
};

// 更新时长（统一处理）
const updateDuration = (source: string = "unknown") => {
  if (audioElement.value && audioElement.value.duration) {
    const duration = audioElement.value.duration;
    if (isFinite(duration) && !isNaN(duration) && duration > 0) {
      audioState.value.duration = duration;
      console.log(
        ` [Essay音乐播放器] 时长更新 [${source}] - ${formatTime(duration)}`
      );
      return true;
    }
  }
  return false;
};

// 音频事件处理
const onLoadedMetadata = () => {
  updateDuration("loadedmetadata");
};

const onTimeUpdate = () => {
  if (!audioElement.value) return;

  // 更新当前时间
  audioState.value.currentTime = audioElement.value.currentTime;

  // 如果时长还未设置，尝试获取（备用机制）
  if (!audioState.value.duration || audioState.value.duration === 0) {
    updateDuration("timeupdate");
  }

  // 更新加载进度
  if (audioElement.value.buffered.length > 0) {
    const bufferedEnd = audioElement.value.buffered.end(
      audioElement.value.buffered.length - 1
    );
    loadedPercentage.value =
      audioState.value.duration > 0
        ? (bufferedEnd / audioState.value.duration) * 100
        : 0;
  }

  // 更新歌词
  lyricsComposable.updateCurrentLyricIndex();
};

const onEnded = () => {
  audioState.value.isPlaying = false;
  audioState.value.currentTime = 0;
  if (audioElement.value) {
    audioElement.value.currentTime = 0;
  }
};

const onError = (event: Event) => {
  const error = (event.target as HTMLAudioElement)?.error;
  console.error(" [Essay音乐播放器] 音频播放出错:", {
    code: error?.code,
    message: error?.message
  });
  audioState.value.isPlaying = false;
};

// 监听播放状态
let playListener: (() => void) | null = null;
let pauseListener: (() => void) | null = null;

watch(
  () => audioElement.value,
  (audio, oldAudio) => {
    // 清理旧的事件监听器
    if (oldAudio && playListener && pauseListener) {
      oldAudio.removeEventListener("play", playListener);
      oldAudio.removeEventListener("pause", pauseListener);
    }

    if (audio) {
      playListener = () => {
        audioState.value.isPlaying = true;
      };

      pauseListener = () => {
        audioState.value.isPlaying = false;
      };

      audio.addEventListener("play", playListener);
      audio.addEventListener("pause", pauseListener);
    }
  },
  { immediate: true }
);

// 监听音乐胶囊的播放事件，避免冲突
const handleGlobalMusicPlay = () => {
  if (audioElement.value && audioState.value.isPlaying) {
    console.log(" [Essay音乐播放器] 检测到音乐胶囊播放，暂停当前音乐");
    audioElement.value.pause();
  }
};

// 临时事件监听器引用（用于清理）
let durationChangeListener: (() => void) | null = null;
let canPlayListener: (() => void) | null = null;

// 初始化
onMounted(async () => {
  console.log(` [Essay音乐播放器] 开始初始化 - 音乐ID: ${props.musicId}`);
  const songData = await fetchSingleSong(props.musicId);

  if (songData) {
    song.value = songData;

    // 等待 DOM 更新
    await nextTick();

    // 预加载音频以获取时长
    if (audioElement.value && songData.url) {
      console.log(` [Essay音乐播放器] 设置音频源: ${songData.url}`);
      audioElement.value.src = songData.url;

      // 添加额外的事件监听来确保获取时长
      durationChangeListener = () => updateDuration("durationchange");
      canPlayListener = () => updateDuration("canplay");

      audioElement.value.addEventListener(
        "durationchange",
        durationChangeListener
      );
      audioElement.value.addEventListener("canplay", canPlayListener);

      // 触发元数据加载
      audioElement.value.load();
      console.log(` [Essay音乐播放器] 开始加载音频元数据`);
    }

    // 设置歌词
    if (songData.lrc) {
      console.log(` [Essay音乐播放器] 设置歌词，长度: ${songData.lrc.length}`);
      setLyrics(songData.lrc);
    }

    // 等待 DOM 更新后计算歌词位置
    await nextTick();
    lyricsComposable.calculateLyricsPosition();
    lyricsComposable.checkCurrentLyricScrollNeed();

    // 通知父组件加载完成
    console.log(` [Essay音乐播放器] 加载完成，通知父组件`);
    emit("loaded");
  }

  // 监听音乐胶囊的播放事件
  window.addEventListener("music-player-toggle-play", handleGlobalMusicPlay);
  window.addEventListener("music-player-play", handleGlobalMusicPlay);
  // 监听 AI 播客播放事件
  window.addEventListener("ai-podcast-play", handleGlobalMusicPlay);
});

// 清理
onBeforeUnmount(() => {
  // 清理音频元素
  if (audioElement.value) {
    audioElement.value.pause();

    // 移除播放状态监听器
    if (playListener) {
      audioElement.value.removeEventListener("play", playListener);
    }
    if (pauseListener) {
      audioElement.value.removeEventListener("pause", pauseListener);
    }

    // 移除临时事件监听器
    if (durationChangeListener) {
      audioElement.value.removeEventListener(
        "durationchange",
        durationChangeListener
      );
    }
    if (canPlayListener) {
      audioElement.value.removeEventListener("canplay", canPlayListener);
    }

    audioElement.value.src = "";
  }

  // 移除全局事件监听
  window.removeEventListener("music-player-toggle-play", handleGlobalMusicPlay);
  window.removeEventListener("music-player-play", handleGlobalMusicPlay);
  window.removeEventListener("ai-podcast-play", handleGlobalMusicPlay);

  // 清理歌词
  clearLyrics();
  lyricsComposable.cleanup();
});
</script>

<style scoped lang="scss">
// 歌词滚动动画
@keyframes lyricScroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(calc(-100% + 100px));
  }
}

.essay-music-player {
  margin: 1rem 0;
  overflow: hidden;
  border-radius: 12px;
}

.music-loading,
.music-error {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 91px; /* 固定最小高度，与播放器高度一致：padding(0.5rem×2) + content(80px) + gap + progress */
  padding: 1.5rem;
  font-size: 0.875rem;
  color: var(--anzhiyu-secondtext);
  background: var(--anzhiyu-secondbg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-sizing: border-box;

  .el-icon {
    font-size: 1.25rem;
  }

  i {
    font-size: 1.25rem;
  }
}

.music-error {
  color: #f56c6c;
  background: rgb(245 108 108 / 8%);
}

.music-player-container {
  padding: 0.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
}

// 主内容区域
.music-main {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

// 封面
.music-cover {
  position: relative;
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  overflow: hidden;
  cursor: pointer;
  border-radius: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.1);
  }

  .play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: rgb(0 0 0 / 50%);
    opacity: 0;
    transition: opacity 0.3s ease;

    i {
      font-size: 2rem;
      color: #fff;
    }

    &.playing {
      opacity: 0;
    }
  }

  &:hover .play-overlay {
    opacity: 1;
  }
}

// 右侧信息区域
.music-right {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  min-width: 0;
}

// 歌曲信息
.music-info {
  display: flex;
  align-items: center;
}

.music-title {
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 歌词显示
.music-lyrics {
  position: relative;
  height: 20px;
  overflow: hidden;
}

.lyrics-container {
  position: relative;
  display: flex;
  align-items: flex-start;
  height: 100%;
}

.lyrics-wrapper {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  width: 100%;
  will-change: transform;
}

.lyric-line {
  position: relative;
  height: 20px;
  overflow: hidden;
  font-size: 12px;
  line-height: 20px;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
  white-space: nowrap;
  transition: all 0.3s ease;

  &.active {
    font-size: 12px;

    .lyric-text {
      display: inline-block;
    }
  }

  &.should-scroll.active {
    .lyric-text {
      padding-right: 50px;
      animation: lyricScroll var(--scroll-duration, 10s) linear forwards;
      animation-delay: 0.5s;
    }
  }

  .lyric-text {
    display: inline;
  }
}

// 进度条
.music-progress {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

.progress-time {
  min-width: 30px;
  font-size: 10px;
  color: var(--anzhiyu-secondtext);
  text-align: center;
}

.progress-bar-wrapper {
  display: flex;
  flex: 1;
  align-items: center;
  height: 16px;
  cursor: pointer;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 4px;
  overflow: hidden;
  background: var(--anzhiyu-gray-op);
  border-radius: 2px;
}

.progress-bar-loaded {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--anzhiyu-lighttext);
  opacity: 0.3;
  transition: width 0.3s ease;
}

.progress-bar-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--anzhiyu-main);
  border-radius: 2px;
  transition: width 0.1s linear;
}

// 响应式设计
@media (width <= 768px) {
  .music-loading,
  .music-error {
    min-height: 71px; /* 移动端固定高度：padding(1.5rem×2) + icon + gap */
  }

  .music-main {
    gap: 0.75rem;
  }

  .music-cover {
    width: 60px;
    height: 60px;
  }

  .music-title {
    font-size: 0.8125rem;
  }

  .lyric-line {
    font-size: 11px;

    &.active {
      font-size: 11px;
    }
  }
}
</style>
