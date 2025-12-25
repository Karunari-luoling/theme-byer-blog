<script setup lang="ts">
import { computed, type PropType } from "vue";
import { IconifyIconOnline } from "@/components/ReIcon";

interface AuthorConfig {
  userAvatar: string;
  ownerName: string;
  subTitle?: string;
  statusImg?: string;
  articleCount?: number;
  tagCount?: number;
  categoryCount?: number;
  social?: Record<string, { icon: string; link: string; title?: string }>;
}

const props = defineProps({
  config: {
    type: Object as PropType<AuthorConfig>,
    required: true
  }
});

const stats = computed(() => [
  {
    key: "articles",
    title: "文章",
    link: "/archives",
    count: props.config.articleCount ?? 0
  },
  {
    key: "tags",
    title: "标签",
    link: "/tags",
    count: props.config.tagCount ?? 0
  },
  {
    key: "categories",
    title: "分类",
    link: "/categories",
    count: props.config.categoryCount ?? 0
  }
]);

const socialList = computed(() =>
  Object.entries(props.config.social || {}).map(([name, value]) => ({
    name,
    icon: value.icon,
    link: value.link
  }))
);

const statusStyle = computed(() =>
  props.config.statusImg
    ? {
        backgroundImage: `url(${props.config.statusImg})`
      }
    : undefined
);

const isImageIcon = (icon?: string) =>
  !!icon && (icon.startsWith("http://") || icon.startsWith("https://"));

const isIconify = (icon?: string) => !!icon && icon.includes(":");
</script>

<template>
  <div class="card-widget card-aside card-info">
    <div v-if="statusStyle" class="g-status" :style="statusStyle" />
    <div class="card-info-avatar">
      <img
        class="card-info-avatar-img"
        :src="config.userAvatar"
        alt="avatar"
        loading="lazy"
      />
    </div>
    <span class="card-info-name">{{ config.ownerName }}</span>
    <div class="card-info-datas">
      <router-link
        v-for="item in stats"
        :key="item.key"
        class="card-info-data"
        :to="item.link"
      >
        <span class="card-info-data-title">{{ item.title }}</span>
        <span class="card-info-data-count">{{ item.count }}</span>
      </router-link>
    </div>
    <div class="card-info-socials">
      <a
        v-for="social in socialList"
        :key="social.name"
        class="card-info-Social"
        :href="social.link"
        :title="social.name"
        rel="external nofollow noreferrer"
        target="_blank"
      >
        <img
          v-if="isImageIcon(social.icon)"
          class="card-info-social-img"
          :src="social.icon"
          :alt="social.name"
          loading="lazy"
        />
        <IconifyIconOnline
          v-else-if="isIconify(social.icon)"
          :icon="social.icon"
          width="18"
          height="18"
        />
        <i v-else-if="social.icon" class="anzhiyufont" :class="social.icon" />
        <span v-else class="card-info-social-text">
          {{ social.name?.charAt(0) }}
        </span>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-info {
  position: relative;
  display: grid;
  grid-template-columns: 80px 1fr;
  grid-template-rows: auto auto auto;
  gap: 0px;
  padding: 14px 14px 12px;
  overflow: hidden;
  border-radius: 10px;
  color: #fffd;

  > * {
    z-index: 3;
  }

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-color: #fff2;
    border: 1px solid #0000;
    border-radius: 10px;
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    z-index: 2;
  }
}

.g-status {
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 10px;
  z-index: 1;
}

.card-info-avatar {
  grid-area: 1 / 1 / 3;
  width: 60px;
  height: 60px;

  .card-info-avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 10px;
    object-fit: cover;
  }
}

.card-info-name {
  grid-area: 1 / 2;
  font-size: 19px;
  font-weight: 500;
  align-self: end;
  margin-left: 5px;
}

.card-info-datas {
  grid-area: 2 / 2;
  display: flex;
}

.card-info-data {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 5px;
  padding: 2px 6px;
  background-color: #0003;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    background-color: #0004;
  }
}

.card-info-data-title {
  font-size: 14px;
  white-space: nowrap;
}

.card-info-socials {
  grid-area: 3 / 1 / auto / 3;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.card-info-Social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  width: 32px;
  height: 32px;
  color: #fffd;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    transform: translateY(-2px) scale(1.05);
    opacity: 0.9;
  }
}

.card-info-social-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-info-social-text {
  font-size: 13px;
  font-weight: 600;
}
</style>
