<!--
 * @Description: 播放列表组件
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:30:00
-->
<template>
  <div v-show="isVisible" class="playlist-container" :style="playlistStyle">
    <div class="playlist-header">
      <span>播放列表 ({{ playlist.length }})</span>
      <div class="close-playlist" @click="emit('close')">×</div>
    </div>
    <div class="playlist-content">
      <div
        v-for="(song, index) in playlist"
        :key="song.id || index"
        :class="{
          'playlist-item': true,
          active: index === currentSongIndex,
          playing: index === currentSongIndex && isPlaying,
          loading: index === loadingPlaylistItem
        }"
        @click="emit('selectSong', index)"
      >
        <span class="item-index">{{ index + 1 }}</span>

        <!-- 播放指示器 -->
        <div class="play-indicator">
          <div class="play-bars">
            <div class="bar" />
            <div class="bar" />
            <div class="bar" />
            <div class="bar" />
          </div>
        </div>

        <!-- Loading指示器 -->
        <div class="loading-indicator">
          <div class="loading-spinner" />
        </div>

        <div class="item-content">
          <span class="item-title">{{ song.name }}</span>
          <span class="item-artist">{{ song.artist }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Song } from "../../types/music";

interface Props {
  isVisible: boolean;
  playlist: Song[];
  currentSongIndex: number;
  isPlaying: boolean;
  loadingPlaylistItem: number;
  playlistStyle: any;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
  selectSong: [index: number];
}>();
</script>

<style scoped lang="scss">
// 动画效果
@keyframes playIndicatorPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

@keyframes playBarsPulse {
  0%,
  100% {
    opacity: 0.7;
    transform: scaleY(0.3);
  }

  50% {
    opacity: 1;
    transform: scaleY(1);
  }
}

@keyframes loadingSpinner {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.playlist-container {
  position: absolute;
  top: -320px;
  left: 0;
  width: 360px;
  max-height: 300px;
  overflow: hidden;
  background: var(--anzhiyu-main);
  backdrop-filter: blur(30px);
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgb(0 0 0 / 40%),
    0 0 0 1px rgb(255 255 255 / 15%),
    inset 0 1px 0 rgb(255 255 255 / 10%);
  transform-origin: bottom left;
  animation: playlistSlideIn 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

  .playlist-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px 12px;
    font-size: 13px;
    font-weight: 600;
    color: white;
    user-select: none;
    background: linear-gradient(
      135deg,
      rgb(255 255 255 / 15%) 0%,
      rgb(255 255 255 / 8%) 100%
    );
    border-bottom: 1px solid rgb(255 255 255 / 15%);

    .close-playlist {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      font-size: 18px;
      color: rgb(255 255 255 / 80%);
      cursor: pointer;
      border-radius: 50%;
      transition: all 0.3s;

      &:hover {
        color: white;
        background: rgb(255 255 255 / 20%);
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }

  .playlist-content {
    max-height: 250px;
    overflow-y: auto;
    scrollbar-color: rgb(255 255 255 / 40%) transparent;
    scrollbar-width: thin;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgb(255 255 255 / 40%);
      border-radius: 3px;
      transition: background 0.3s ease;

      &:hover {
        background: rgb(255 255 255 / 60%);
      }
    }

    .playlist-item {
      position: relative;
      display: flex;
      gap: 12px;
      align-items: center;
      min-height: 36px;
      padding: 8px 18px;
      color: rgb(255 255 255 / 90%);
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid rgb(255 255 255 / 8%);
      transition: all 0.3s;

      // 添加序号指示器
      &::before {
        position: absolute;
        top: 0;
        left: 0;
        width: 3px;
        height: 100%;
        content: "";
        background: transparent;
        transition: all 0.3s;
      }

      &:hover:not(.active, .loading) {
        color: white;
        background: rgb(255 255 255 / 12%);
        transform: translateX(1px);

        &::before {
          background: rgb(255 255 255 / 50%);
        }

        .item-index {
          color: rgb(255 255 255 / 90%);
          opacity: 1;
        }
      }

      &.active {
        font-weight: 600;
        color: white;
        background: linear-gradient(
          135deg,
          rgb(255 255 255 / 20%) 0%,
          rgb(255 255 255 / 10%) 100%
        );

        &::before {
          background: rgb(255 255 255 / 80%);
          box-shadow: 0 0 6px rgb(255 255 255 / 30%);
        }

        .item-index {
          visibility: hidden;
          opacity: 0;
        }

        .play-indicator {
          visibility: visible;
          opacity: 1;
          animation: playIndicatorPulse 2s ease-in-out infinite;
        }

        .item-content .item-title {
          font-weight: 600;
          color: rgb(255 255 255 / 100%);
        }

        .item-content .item-artist {
          opacity: 0.9;
        }
      }

      &:last-child {
        border-bottom: none;
      }

      .item-index {
        position: relative;
        z-index: 1;
        width: 20px;
        font-size: 12px;
        font-weight: 500;
        text-align: center;
        visibility: visible;
        opacity: 0.5;
        transition: all 0.3s ease;
      }

      .play-indicator {
        position: absolute;
        top: 50%;
        left: 18px;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 14px;
        visibility: hidden;
        opacity: 0;
        transition: all 0.3s ease;
        transform: translateY(-50%);

        .play-bars {
          display: flex;
          gap: 2px;
          align-items: flex-end;
          height: 12px;

          .bar {
            width: 2px;
            background: rgb(255 255 255 / 90%);
            border-radius: 1px;
            animation: playBarsPulse 1.5s ease-in-out infinite;

            &:nth-child(1) {
              height: 4px;
              animation-delay: 0s;
            }

            &:nth-child(2) {
              height: 8px;
              animation-delay: 0.2s;
            }

            &:nth-child(3) {
              height: 6px;
              animation-delay: 0.4s;
            }

            &:nth-child(4) {
              height: 10px;
              animation-delay: 0.6s;
            }
          }
        }
      }

      .loading-indicator {
        position: absolute;
        top: 50%;
        left: 18px;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 14px;
        visibility: hidden;
        opacity: 0;
        transition: all 0.3s ease;
        transform: translateY(-50%);

        .loading-spinner {
          width: 10px;
          height: 10px;
          border: 1.5px solid rgb(255 255 255 / 30%);
          border-top: 1.5px solid rgb(255 255 255 / 80%);
          border-radius: 50%;
          animation: loadingSpinner 1s linear infinite;
        }
      }

      // Loading状态样式
      &.loading {
        cursor: wait;
        background: rgb(255 255 255 / 8%);

        .item-index {
          visibility: hidden;
          opacity: 0;
        }

        .play-indicator {
          visibility: hidden;
          opacity: 0;
        }

        .loading-indicator {
          visibility: visible;
          opacity: 1;
        }

        .item-content {
          opacity: 0.7;

          .item-title {
            color: rgb(255 255 255 / 80%);
          }
        }
      }

      .item-content {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 1px;
        min-width: 0;

        .item-title {
          overflow: hidden;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.3;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: all 0.3s ease;
        }

        .item-artist {
          overflow: hidden;
          font-size: 11px;
          font-weight: 400;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
          opacity: 0.7;
          transition: all 0.3s ease;
        }
      }
    }
  }
}
</style>
