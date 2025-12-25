<!--
 * @Description: 技能卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import { computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

interface Props {
  skillsTips: {
    tips: string;
    title: string;
  };
}

defineProps<Props>();

const siteConfigStore = useSiteConfigStore();
const creativity =
  siteConfigStore.getSiteConfig?.CREATIVITY?.creativity_list || [];

// 计算技能图标对，用于旋转展示
const creativityPairs = computed(() => {
  if (!creativity || creativity.length === 0) return [];
  const list = [...creativity, ...creativity]; // 复制一份用于无缝循环
  const pairs = [];
  for (let i = 0; i < list.length; i += 2) {
    if (list[i + 1]) {
      pairs.push([list[i], list[i + 1]]);
    }
  }
  return pairs;
});
</script>

<template>
  <div class="author-content-item skills">
    <div class="card-content">
      <div class="author-content-item-tips">{{ skillsTips.tips }}</div>
      <span class="author-content-item-title">{{ skillsTips.title }}</span>
      <div class="skills-style-group">
        <!-- 旋转的技能标签组 -->
        <div id="skills-tags-group-all" class="skills-tags-group">
          <div class="tags-group-wrapper">
            <div
              v-for="(pair, index) in creativityPairs"
              :key="index"
              class="tags-group-icon-pair"
            >
              <div
                class="tags-group-icon"
                :style="{ background: pair[0].color }"
              >
                <img
                  class="no-lightbox"
                  :title="pair[0].name"
                  :src="pair[0].icon"
                  :alt="pair[0].name"
                />
              </div>
              <div
                class="tags-group-icon"
                :style="{ background: pair[1].color }"
              >
                <img
                  class="no-lightbox"
                  :title="pair[1].name"
                  :src="pair[1].icon"
                  :alt="pair[1].name"
                />
              </div>
            </div>
          </div>
        </div>
        <!-- 详细技能列表 -->
        <div class="skills-list">
          <div
            v-for="(item, index) in creativity"
            :key="index"
            class="skill-info"
          >
            <div class="skill-icon" :style="{ background: item.color }">
              <img
                class="no-lightbox"
                :title="item.name"
                :src="item.icon"
                :alt="item.name"
              />
            </div>
            <div class="skill-name">
              <span>{{ item.name }}</span>
            </div>
          </div>
          <div class="flex items-center">
            <span>...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// rowup 动画已在 animation.scss 中定义

.skills {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 50%;
  min-height: 450px;

  @media screen and (width <= 768px) {
    width: 100% !important;
  }

  .skill-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-right: 8px;
    border-radius: 32px;

    img {
      width: 18px;
      height: 18px;
      margin: 0 auto !important;
    }
  }

  .skills-list {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-flow: row wrap;
    width: 100%;
    margin-top: 10px;
    opacity: 0;
    transition: 0.3s;
  }

  .skill-info {
    display: flex;
    align-items: center;
    padding: 4px 12px 4px 8px;
    margin-top: 10px;
    margin-right: 10px;
    background: var(--anzhiyu-background);
    border: var(--style-border);
    border-radius: 40px;
    box-shadow: var(--anzhiyu-shadow-border);
  }

  .skills-style-group {
    position: relative;
  }

  .skills-tags-group {
    .skills-tag {
      display: inline-block;
      padding: 4px 12px;
      margin-top: 10px;
      background: var(--anzhiyu-background);
      border: var(--style-border);
      border-radius: 40px;
      box-shadow: var(--anzhiyu-shadow-border);
    }
  }

  // 参考 HomeTop 的旋转技能标签样式
  #skills-tags-group-all {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    display: flex;
    width: 100%;
    height: 100%;
    margin-top: 4.5rem;
    transition: 0.3s;
  }

  #skills-tags-group-all .tags-group-wrapper {
    display: flex;
    flex-wrap: nowrap;
    animation: rowup 60s linear infinite;
  }

  #skills-tags-group-all .tags-group-icon-pair {
    flex-shrink: 0;
    margin-left: 1rem;
  }

  #skills-tags-group-all .tags-group-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    font-size: 66px;
    font-weight: 700;
    color: #fff;
    border-radius: 30px;
    box-shadow: var(--anzhiyu-shadow-blackdeep);
  }

  #skills-tags-group-all .tags-group-icon img {
    width: 60px;
    height: 60px;
    object-fit: contain;
  }

  #skills-tags-group-all
    .tags-group-icon-pair
    .tags-group-icon:nth-child(even) {
    margin-top: 1rem;
    transform: translateX(-60px);
  }

  &:hover {
    .skills-style-group {
      #skills-tags-group-all {
        opacity: 0;
      }

      .skills-list {
        opacity: 1;
      }
    }
  }
}
</style>
