<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-10-05 11:52:47
 * @LastEditTime: 2025-10-05 12:09:19
 * @LastEditors: 安知鱼
-->
<template>
  <div class="essay">
    <AnBannerCard
      :tips="essayConfig?.tips"
      :title="essayConfig?.title"
      :description="essayConfig?.subtitle"
      :background-image="essayConfig?.top_background"
      :button-text="essayConfig?.button_text"
      :button-link="essayConfig?.button_link"
      :height="300"
    />
    <EssayList @comment-quote="handleEssayComment" />

    <div class="link-comment-section">
      <PostComment ref="postCommentRef" :target-path="route.path" />
    </div>
  </div>
</template>

<script setup lang="ts">
import AnBannerCard from "@/components/AnBannerCard";
import EssayList from "./components/EssayList/index.vue";
import PostComment from "../components/PostComment/index.vue";
import { useRoute } from "vue-router";
import { computed, ref } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

const route = useRoute();
const siteConfigStore = useSiteConfigStore();
const postCommentRef = ref();

const essayConfig = computed(() => siteConfigStore.getSiteConfig?.essay);

// 处理即刻评论引用
const handleEssayComment = (quoteText: string) => {
  if (postCommentRef.value) {
    postCommentRef.value.setQuoteText(quoteText);
  }
};
defineOptions({
  name: "Essay"
});
</script>

<style scoped lang="scss">
.essay {
  max-width: 1400px;
  padding: 1.5rem;
  margin: 0 auto;
}

.link-comment-section {
  margin-top: 2rem;
}
</style>
