<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-04 10:11:57
 * @LastEditTime: 2025-11-03 12:25:54
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useUiStore } from "@/store/modules/uiStore";
import { useArticleStore } from "@/store/modules/articleStore";
import AuthorInfoCard from "./components/AuthorInfoCard.vue";
import CardWechat from "./components/CardWechat.vue";
import Sticky from "./components/Sticky.vue";

defineOptions({
  name: "Sidebar"
});

const siteConfigStore = useSiteConfigStore();
const siteConfig = computed(() => siteConfigStore.getSiteConfig);

const uiStore = useUiStore();
const { isSidebarVisible } = storeToRefs(uiStore);

const articleStore = useArticleStore();
const { tags, categories, archives } = storeToRefs(articleStore);

const articleCount = computed(() => {
  const total = siteConfig.value?.sidebar?.siteinfo?.totalPostCount;
  if (typeof total === "number" && total >= 0) return total;
  return (archives.value || []).reduce(
    (sum, item) => sum + (item?.count || 0),
    0
  );
});

const tagCount = computed(() => tags.value?.length || 0);
const categoryCount = computed(() => categories.value?.length || 0);

const authorInfoConfig = computed(() => {
  if (!siteConfig.value?.sidebar?.author?.enable) return null;
  return {
    description: siteConfig.value.sidebar.author.description,
    statusImg: siteConfig.value.sidebar.author.statusImg,
    skills: siteConfig.value.sidebar.author.skills,
    social: siteConfig.value.sidebar.author.social,
    userAvatar: siteConfig.value.USER_AVATAR,
    ownerName: siteConfig.value.frontDesk.siteOwner.name,
    subTitle: siteConfig.value.SUB_TITLE,
    articleCount: articleCount.value,
    tagCount: tagCount.value,
    categoryCount: categoryCount.value
  };
});

const wechatConfig = computed(() => {
  if (!siteConfig.value?.sidebar?.wechat?.enable) return null;
  return {
    face: siteConfig.value.sidebar.wechat.face,
    backFace: siteConfig.value.sidebar.wechat.backFace,
    blurBackground: siteConfig.value.sidebar.wechat.blurBackground
  };
});
</script>

<template>
  <aside v-if="isSidebarVisible" class="aside-content">
    <AuthorInfoCard v-if="authorInfoConfig" :config="authorInfoConfig" />
    <CardWechat v-if="wechatConfig" :config="wechatConfig" />

    <Sticky :config="siteConfig" />
  </aside>
</template>

<style lang="scss" scoped>
.aside-content {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  width: 270px;
  transition: all 0.3s;
  opacity: 1;
  animation: slide-in 0.6s 0.1s backwards;
  visibility: visible;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (width <= 992px) {
  .aside-content {
    display: none;
  }
}
</style>
