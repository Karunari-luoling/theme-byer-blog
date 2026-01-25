import { ref, watch, nextTick, computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

export interface EmojiItem {
  icon: string;
  text: string;
}

export interface EmojiPackage {
  name: string;
  type: string;
  icon: string;
  items: EmojiItem[];
}

export function useEmoji() {
  const siteConfigStore = useSiteConfigStore();

  const showPicker = ref(false);
  const emojiData = ref<EmojiPackage[] | null>(null);
  const activePackageIndex = ref(0);
  const containerRef = ref<HTMLElement | null>(null);

  // 评论配置
  const emojiCdn = computed(() => {
    return siteConfigStore.getSiteConfig.comment?.emoji_cdn || "";
  });

  // 获取表情数据
  const fetchEmojis = async () => {
    if (!emojiCdn.value) return;
    try {
      const response = await fetch(emojiCdn.value);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const packages = Object.keys(data).map(key => {
        const packageData = data[key];
        const items = packageData.container.map((item: any) => ({
          icon: item.icon.match(/src="([^"]+)"/)?.[1] || "",
          text: `:${item.text}:`
        }));
        return {
          name: key.match(/title="([^"]+)"/)?.[1] || "Emojis",
          type: packageData.type,
          icon: key,
          items
        };
      });
      emojiData.value = packages;
    } catch (error) {
      console.error("Failed to fetch emojis:", error);
    }
  };

  // 点击外部关闭
  const handleClickOutside = (event: MouseEvent) => {
    if (
      containerRef.value &&
      !containerRef.value.contains(event.target as Node)
    ) {
      showPicker.value = false;
    }
  };

  // 监听 showPicker 变化
  watch(showPicker, isShown => {
    nextTick(() => {
      if (isShown) {
        document.addEventListener("click", handleClickOutside);
      } else {
        document.removeEventListener("click", handleClickOutside);
      }
    });
  });

  // 切换显示
  const togglePicker = () => {
    showPicker.value = !showPicker.value;
  };

  // 关闭选择器
  const closePicker = () => {
    showPicker.value = false;
  };

  // 解析表情文本为 HTML
  const parseEmojis = (text: string): string => {
    if (!emojiData.value) return text;

    let result = text;
    emojiData.value.forEach(pkg => {
      pkg.items.forEach(emoji => {
        const regex = new RegExp(
          emoji.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        );
        result = result.replace(
          regex,
          `<img src="${emoji.icon}" alt="${emoji.text}" class="chat-emoji" />`
        );
      });
    });
    return result;
  };

  return {
    showPicker,
    emojiData,
    activePackageIndex,
    containerRef,
    fetchEmojis,
    togglePicker,
    closePicker,
    parseEmojis
  };
}
