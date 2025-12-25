<script setup lang="ts">
import { type PropType } from "vue";

defineOptions({
  name: "PostPagination"
});

interface ArticleLink {
  id: string;
  title: string;
  abbrlink: string;
}

defineProps({
  prevArticle: {
    type: Object as PropType<ArticleLink | null>,
    default: null
  },
  nextArticle: {
    type: Object as PropType<ArticleLink | null>,
    default: null
  }
});
</script>

<template>
  <nav
    v-if="prevArticle || nextArticle"
    id="pagination"
    class="pagination-post"
  >
    <router-link
      v-if="prevArticle"
      class="pagination-item left"
      :to="`/posts/${prevArticle.abbrlink || prevArticle.id}`"
    >
      <div class="pagination-info">
        <div class="label">上一篇</div>
        <div class="info-title">{{ prevArticle.title }}</div>
      </div>
    </router-link>

    <router-link
      v-if="nextArticle"
      class="pagination-item right"
      :to="`/posts/${nextArticle.abbrlink || nextArticle.id}`"
    >
      <div class="pagination-info">
        <div class="label">下一篇</div>
        <div class="info-title">{{ nextArticle.title }}</div>
      </div>
    </router-link>
  </nav>
</template>

<style lang="scss" scoped>
.pagination-post {
  position: relative;
  display: flex;
  width: 100%;
  margin: 0 0 1rem;
  overflow: hidden;
  cursor: pointer;
  background: 0 0;
  border: var(--style-border-always);
  border-radius: 12px;

  // 使用伪元素创建居中的分隔线，只有当有两个子元素时才显示
  &:has(.pagination-item:nth-child(2))::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    z-index: 1;
    width: 1px;
    content: "";
    background: var(--anzhiyu-card-border);
    transform: translateX(-50%);
  }
}

.pagination-item {
  display: flex;
  flex: 1;
  align-items: flex-start;
  height: fit-content;
  height: 150px;
  padding: 0.5rem 0;
  text-decoration: none;
  background: var(--anzhiyu-secondbg);
  backdrop-filter: blur(5px);
  border: none;
  transform: translateZ(0);

  &.right {
    .pagination-info {
      text-align: right;
    }
  }

  &:hover {
    background: var(--anzhiyu-main);

    .pagination-info .label,
    .pagination-info .info-title {
      color: var(--anzhiyu-white);
    }
  }
}

.pagination-info {
  position: relative;
  top: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0.625rem 1.25rem;
  margin: auto;
  text-align: left;
  transform: none;

  .label {
    padding-bottom: 0.625rem;
    margin-bottom: 0.625rem;
    font-size: 0.875rem;
    line-height: 1;
    color: var(--anzhiyu-fontcolor);
  }
}

.info-title {
  display: -webkit-box;
  margin-bottom: 0;
  overflow: hidden;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--anzhiyu-fontcolor);
  -webkit-line-clamp: 2;
  line-clamp: 2;
  white-space: normal;
  -webkit-box-orient: vertical;
}
</style>
