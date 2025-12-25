<!--
 * @Description: 朋友圈页面
 * @Author: 安知鱼
 * @Date: 2025-10-08
 * @LastEditTime: 2025-10-08
 * @LastEditors: 安知鱼
-->
<template>
  <div class="fcircle">
    <AnBannerCard
      :tips="momentsConfig?.tips"
      :title="momentsConfig?.title"
      :description="momentsConfig?.subtitle"
      :background-image="momentsConfig?.top_background"
      :button-text="momentsConfig?.button_text"
      :button-link="momentsConfig?.button_link"
      :height="300"
    />
    <MomentsList />

    <div class="link-comment-section">
      <PostComment ref="postCommentRef" :target-path="route.path" />
    </div>
  </div>
</template>

<script setup lang="ts">
import AnBannerCard from "@/components/AnBannerCard";
import MomentsList from "./components/MomentsList/index.vue";
import PostComment from "../components/PostComment/index.vue";
import { useRoute } from "vue-router";
import { computed, ref } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

const route = useRoute();
const siteConfigStore = useSiteConfigStore();
const postCommentRef = ref();

const momentsConfig = computed(() => siteConfigStore.getSiteConfig?.moments);

defineOptions({
  name: "Fcircle"
});
</script>

<style scoped lang="scss">
.fcircle {
  max-width: 1400px;
  padding: 1.5rem;
  margin: 0 auto;
}

.link-comment-section {
  margin-top: 2rem;
}
</style>
