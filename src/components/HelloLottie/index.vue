<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

defineOptions({
  name: "HelloLottie"
});

interface Props {
  width?: string;
  height?: string;
}

withDefaults(defineProps<Props>(), {
  width: "100%",
  height: "100%"
});

const containerRef = ref<HTMLElement | null>(null);
const animationInstance = ref<any>(null);
const isLoading = ref(true);

// 动态导入 lottie-web 精简版本 - 只支持 SVG 渲染器，体积更小
// lottie_light 只包含 SVG 渲染器，压缩后约 144KB，Gzip 后约 39KB
const loadLottie = async () => {
  try {
    // 导入精简版本（只支持 SVG）
    // 使用 ESM 版本的精简文件
    // @ts-ignore - lottie_light.min.js 没有类型声明
    const lottieLight = await import(
      /* @vite-ignore */
      "lottie-web/build/player/esm/lottie_light.min.js"
    );
    // 精简版本可能通过 default 导出或直接导出
    return lottieLight.default || lottieLight;
  } catch (error) {
    // 如果精简版本不可用，回退到完整版本
    try {
      const lottie = await import("lottie-web");
      return lottie.default;
    } catch (fallbackError) {
      console.error("Failed to load lottie-web:", fallbackError);
      return null;
    }
  }
};

// 获取 Vite 的 base 路径
const basePath = import.meta.env.BASE_URL || "/";
// 获取 .lottie 文件路径
const getLottiePath = () => {
  const base = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  return `${base}/static/hello.lottie`;
};

// 从 .lottie 文件中提取 JSON 动画数据
const extractLottieJson = async (lottiePath: string): Promise<any> => {
  try {
    // 动态导入 jszip
    const JSZip = (await import("jszip")).default;

    // 获取 .lottie 文件
    const response = await fetch(lottiePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch .lottie file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 读取 manifest.json
    const manifestFile = zip.file("manifest.json");
    if (!manifestFile) {
      throw new Error("manifest.json not found in .lottie file");
    }

    const manifestContent = await manifestFile.async("string");
    const manifest = JSON.parse(manifestContent);

    // 获取第一个动画的路径（根据 manifest 结构）
    let animationPath: string;
    if (manifest.animations && manifest.animations.length > 0) {
      const animationId = manifest.animations[0].id || manifest.animations[0];

      // 根据 manifest 版本判断路径格式
      // v2.0+ 使用 a/ 前缀，v1.0 使用 animations/ 前缀
      if (manifest.version === "2" || zip.file(`a/${animationId}.json`)) {
        // 新格式（dotLottie v2.0+）：使用 a/ 前缀
        animationPath = `a/${animationId}.json`;
      } else {
        // 旧格式（dotLottie v1.0）：使用 animations/ 前缀
        animationPath = `animations/${animationId}.json`;
      }
    } else {
      // 如果没有 manifest.animations，尝试查找所有可能的动画文件
      const animationFiles = Object.keys(zip.files).filter(
        name =>
          (name.startsWith("animations/") || name.startsWith("a/")) &&
          name.endsWith(".json")
      );
      if (animationFiles.length === 0) {
        throw new Error("No animation JSON found in .lottie file");
      }
      animationPath = animationFiles[0];
    }

    // 读取动画 JSON
    const animationFile = zip.file(animationPath);
    if (!animationFile) {
      throw new Error(`Animation file not found: ${animationPath}`);
    }

    const animationJson = await animationFile.async("string");
    return JSON.parse(animationJson);
  } catch (error) {
    console.error("Failed to extract JSON from .lottie file:", error);
    throw error;
  }
};

onMounted(async () => {
  if (!containerRef.value) return;

  const lottie = await loadLottie();
  if (!lottie) {
    isLoading.value = false;
    return;
  }

  try {
    // 从 .lottie 文件中提取 JSON 动画数据
    const animationData = await extractLottieJson(getLottiePath());

    // 使用 lottie-web 加载动画，指定 SVG 渲染器
    // lottie_light 精简版本直接导出 loadAnimation 方法
    const loadAnimation =
      lottie.loadAnimation || (lottie as any).default?.loadAnimation || lottie;

    animationInstance.value = loadAnimation({
      container: containerRef.value,
      renderer: "svg", // 使用 SVG 渲染器
      loop: false,
      autoplay: true,
      animationData // 使用从 .lottie 文件中提取的 JSON 数据
    });

    // 当使用 animationData 时，动画数据是同步的，使用 DOMLoaded 事件
    animationInstance.value.addEventListener("DOMLoaded", () => {
      isLoading.value = false;
    });

    // 备用：如果 DOMLoaded 不触发，使用 complete 事件
    animationInstance.value.addEventListener("complete", () => {
      isLoading.value = false;
    });

    // 如果动画已经加载完成（可能很快），直接隐藏 loading
    if (animationInstance.value.isLoaded) {
      isLoading.value = false;
    }

    animationInstance.value.addEventListener("data_failed", () => {
      isLoading.value = false;
      console.error("Failed to load Lottie animation");
    });

    // 超时保护：如果 3 秒后还没加载完成，强制隐藏 loading
    setTimeout(() => {
      if (isLoading.value) {
        isLoading.value = false;
        console.warn("Lottie animation loading timeout");
      }
    }, 3000);
  } catch (error) {
    console.error("Error loading Lottie animation:", error);
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (animationInstance.value) {
    animationInstance.value.destroy();
    animationInstance.value = null;
  }
});
</script>

<template>
  <div class="hello-lottie-container">
    <div ref="containerRef" class="hello-lottie-animation" />
    <div v-if="isLoading" class="hello-lottie-loading">
      <div class="loading-spinner" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.hello-lottie-container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 0;
  // Apple 官方风格渐变背景：从浅薄荷绿 -> 几乎白色浅蓝 -> 淡薰衣草紫
  // 参考图2：左侧 soft light teal/mint green，中间 very pale almost white light blue，右侧 light lavender/pale purple
  // 磨砂玻璃效果：使用半透明背景 + backdrop-filter
  background: linear-gradient(
    to right,
    rgba(224, 245, 240, 0.85) 0%,
    rgba(226, 245, 242, 0.85) 5%,
    rgba(228, 245, 244, 0.85) 10%,
    rgba(230, 245, 246, 0.85) 15%,
    rgba(232, 245, 248, 0.85) 20%,
    rgba(234, 245, 250, 0.85) 25%,
    rgba(236, 245, 252, 0.85) 30%,
    rgba(238, 245, 254, 0.85) 35%,
    rgba(240, 245, 255, 0.85) 40%,
    rgba(242, 245, 255, 0.85) 45%,
    rgba(244, 245, 255, 0.85) 50%,
    rgba(246, 245, 255, 0.85) 55%,
    rgba(248, 245, 255, 0.85) 60%,
    rgba(250, 245, 255, 0.85) 65%,
    rgba(252, 245, 255, 0.85) 70%,
    rgba(254, 245, 255, 0.85) 75%,
    rgba(255, 245, 255, 0.85) 80%,
    rgba(255, 245, 253, 0.85) 85%,
    rgba(255, 245, 251, 0.85) 90%,
    rgba(255, 245, 249, 0.85) 95%,
    rgba(255, 245, 247, 0.85) 100%
  );
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
}

.hello-lottie-animation {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  :deep(svg) {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
}

.hello-lottie-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  // Spline 官方风格渐变背景：从左上角浅青色到右下角淡紫色
  // 参考 https://my.spline.design/hello-758c41e85f321bd5541486507586e685/
  // 左上角：very light pastel teal/cyan，右下角：soft light lavender/pale purple
  // 使用更细腻的渐变，确保四角颜色不同且过渡平滑
  background: linear-gradient(
    to bottom right,
    #e9f3fe 0%,
    #eaf3fd 6.25%,
    #ebf3fc 12.5%,
    #ecf3fb 18.75%,
    #edf3fa 25%,
    #eef3f9 31.25%,
    #eff3f8 37.5%,
    #f0f3f7 43.75%,
    #f1f3f6 50%,
    #f2f3f5 56.25%,
    #f3f3f4 62.5%,
    #f4f3f3 68.75%,
    #f5f3f2 75%,
    #f6f3f1 81.25%,
    #f7f3f0 87.5%,
    #f8f3ef 93.75%,
    #f9f3ee 100%
  );
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--anzhiyu-secondbg);
  border-top-color: var(--anzhiyu-theme);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
