<!--
 * @Description: 横幅卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
 * @LastEditTime: 2025-11-09 13:33:23
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

defineOptions({
  name: "AnBannerCard"
});

const router = useRouter();

interface Props {
  /** 提示文字 */
  tips?: string;
  /** 标题 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 背景图片URL */
  backgroundImage?: string;
  /** 组件高度 */
  height?: string | number;
  /** 是否圆角 */
  rounded?: boolean;
  /** 按钮文字 */
  buttonText?: string;
  /** 按钮链接 */
  buttonLink?: string;
}

const props = withDefaults(defineProps<Props>(), {
  tips: "好物",
  title: "实物装备推荐",
  description: "跟 安知鱼 一起享受科技带来的乐趣",
  height: 300,
  rounded: true,
  buttonText: "",
  buttonLink: ""
});

// 计算样式
const containerStyle = computed(() => ({
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
  borderRadius: props.rounded ? "12px" : "0"
}));

const backgroundStyle = computed(() => ({
  background: props.backgroundImage
    ? `url(${props.backgroundImage}) left 37%/cover no-repeat`
    : "none"
}));

// 后端渲染的页面路径（不应使用 Vue Router 跳转）
const BACKEND_RENDERED_EXTENSIONS = [".xml", ".json", ".txt", ".rss"];

// 判断是否为后端渲染的页面（如 sitemap.xml, atom.xml, rss.xml 等）
const isBackendRenderedPath = (link: string) => {
  if (!link) return false;
  const lowerLink = link.toLowerCase();
  return BACKEND_RENDERED_EXTENSIONS.some(ext => lowerLink.endsWith(ext));
};

// 判断是否是内部链接（排除后端渲染的页面）
const isInternalLink = computed(() => {
  if (!props.buttonLink) return false;
  // 后端渲染的页面不应使用 Vue Router 跳转
  if (isBackendRenderedPath(props.buttonLink)) return false;
  return (
    props.buttonLink.startsWith("/") &&
    !props.buttonLink.startsWith("//") &&
    !props.buttonLink.startsWith("http://") &&
    !props.buttonLink.startsWith("https://")
  );
});

// 处理按钮点击
const handleButtonClick = (e: Event) => {
  if (isInternalLink.value && props.buttonLink) {
    e.preventDefault();
    router.push(props.buttonLink);
  }
};
</script>

<template>
  <div class="an-banner-card" :style="containerStyle">
    <div class="author-content" :style="backgroundStyle">
      <div class="card-content">
        <div class="author-content-item-tips">{{ tips }}</div>
        <span class="author-content-item-title">{{ title }}</span>
        <div class="content-bottom">
          <div class="tips">{{ description }}</div>
          <div v-if="buttonText && buttonLink" class="banner-button-group">
            <a
              :href="isInternalLink ? undefined : buttonLink"
              class="banner-button"
              data-pjax-state=""
              @click="handleButtonClick"
            >
              <i class="anzhiyufont anzhiyu-icon-arrow-circle-right" />
              <span class="banner-button-text">{{ buttonText }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.an-banner-card {
  position: relative;
  width: 100%;
  margin-top: 0;
  overflow: hidden;
  color: var(--anzhiyu-white);
  background-color: var(--anzhiyu-main);
  background-image: linear-gradient(
    -45deg,
    var(--anzhiyu-main),
    #0f4667,
    #2a6973 150%,
    #67044d
  );
  background-repeat: no-repeat;
  background-position: left 28%;
  background-size: cover;
  background-size: 400%;

  .author-content {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    padding: 2rem;
    color: white;

    &::before {
      position: absolute;
      inset: 0;
      z-index: 1;
      content: "";
      background: rgb(0 0 0 / 40%);
    }

    .card-content {
      position: relative;
      z-index: 2;
      width: 100%;
      text-align: left;

      .author-content-item-tips {
        margin-bottom: 0.5rem;
        font-size: 0.75rem;
        font-weight: 500;
        opacity: 0.8;
      }

      .author-content-item-title {
        display: block;
        margin-bottom: 1rem;
        font-size: 2.25rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .content-bottom {
        position: absolute;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;

        .tips {
          font-size: 0.875rem;
          line-height: 1.5;
          opacity: 0.9;
        }

        .banner-button-group {
          display: flex;
          gap: 0.75rem;

          .banner-button {
            display: inline-flex;
            gap: 0.5rem;
            align-items: center;
            padding: 0.625rem 1.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: #fff;
            text-decoration: none;
            cursor: pointer;
            background: rgb(255 255 255 / 20%);
            backdrop-filter: blur(10px);
            border: 1px solid rgb(255 255 255 / 30%);
            border-radius: 25px;
            transition: all 0.3s ease;

            i {
              font-size: 1rem;
            }

            .banner-button-text {
              white-space: nowrap;
            }

            &:hover {
              background: rgb(255 255 255 / 30%);
              box-shadow: 0 4px 12px rgb(0 0 0 / 20%);
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (width <= 768px) {
  .an-banner-card {
    .author-content {
      padding: 1.5rem;

      .card-content {
        .author-content-item-title {
          font-size: 1.5rem;
        }
      }
    }
  }
}
</style>
