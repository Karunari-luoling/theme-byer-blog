/**
 * @Description: 音乐播放器初始化逻辑
 * @Author: 安知鱼
 * @Date: 2025-12-27
 */
import { ref } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

/**
 * 获取音乐API基础地址
 */
export const getMusicAPIBaseURL = (): string => {
  const siteConfigStore = useSiteConfigStore();
  const apiBaseURL = siteConfigStore.siteConfig?.music?.api?.base_url;
  return apiBaseURL && apiBaseURL.trim() !== ""
    ? apiBaseURL.trim()
    : "https://metings.qjqq.cn";
};

/**
 * 确保URL使用HTTPS协议
 */
export const ensureHttps = (url: string): string => {
  if (!url) return url;
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
};

/**
 * 从图片提取主色
 */
export const extractDominantColor = (imgUrl: string): Promise<string> => {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("#49b1f5");
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r = 0,
          g = 0,
          b = 0;
        const sampleSize = 10;

        for (let i = 0; i < data.length; i += 4 * sampleSize) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }

        const pixels = data.length / (4 * sampleSize);
        r = Math.floor(r / pixels);
        g = Math.floor(g / pixels);
        b = Math.floor(b / pixels);

        const color = `rgb(${r}, ${g}, ${b})`;
        resolve(color);
      } catch (error) {
        console.error("[主色提取] 失败:", error);
        resolve("#49b1f5");
      }
    };
    img.onerror = () => {
      console.error("[主色提取] 图片加载失败");
      resolve("#49b1f5");
    };
    img.src = imgUrl;
  });
};

/**
 * 解码HTML实体
 */
export const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

/**
 * 格式化时间
 */
export const formatTime = (seconds: number): string => {
  if (!isFinite(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins + ":" + (secs < 10 ? "0" : "") + secs;
};

/**
 * 获取音乐资源
 */
export const fetchMusicResources = async (
  neteaseId: string
): Promise<{
  audioUrl: string;
  name: string;
  artist: string;
  pic: string;
} | null> => {
  if (!neteaseId) {
    console.error("[音乐播放器] 缺少音乐ID");
    return null;
  }

  const apiBaseURL = getMusicAPIBaseURL();

  try {
    // 尝试获取 exhigh 音质
    console.log("[音乐播放器] 尝试获取 exhigh 音质");
    const formData = new URLSearchParams();
    formData.append("url", neteaseId);
    formData.append("level", "exhigh");
    formData.append("type", "json");

    const response = await fetch(`${apiBaseURL}/Song_V1`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    });

    if (!response.ok) {
      // 如果 exhigh 失败，尝试 standard
      console.log("[音乐播放器] exhigh 失败，尝试 standard 音质");
      return await fetchMusicResourcesStandard(neteaseId, apiBaseURL);
    }

    const data = await response.json();
    if (data.status === 200 && data.success) {
      return {
        audioUrl: ensureHttps(data.data.url),
        name: data.data.name || "未知歌曲",
        artist: data.data.ar_name || "未知艺术家",
        pic: ensureHttps(data.data.pic || "")
      };
    }

    // exhigh 无资源，尝试 standard
    return await fetchMusicResourcesStandard(neteaseId, apiBaseURL);
  } catch (error) {
    console.error("[音乐播放器] 获取资源失败:", error);
  }

  return null;
};

/**
 * 获取standard音质的音乐资源
 */
const fetchMusicResourcesStandard = async (
  neteaseId: string,
  apiBaseURL: string
): Promise<{
  audioUrl: string;
  name: string;
  artist: string;
  pic: string;
} | null> => {
  try {
    const standardFormData = new URLSearchParams();
    standardFormData.append("url", neteaseId);
    standardFormData.append("level", "standard");
    standardFormData.append("type", "json");

    const standardResponse = await fetch(`${apiBaseURL}/Song_V1`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: standardFormData
    });

    if (!standardResponse.ok) {
      console.error("[音乐播放器] 所有音质都获取失败");
      return null;
    }

    const standardData = await standardResponse.json();
    if (standardData.status === 200 && standardData.success) {
      return {
        audioUrl: ensureHttps(standardData.data.url),
        name: standardData.data.name || "未知歌曲",
        artist: standardData.data.ar_name || "未知艺术家",
        pic: ensureHttps(standardData.data.pic || "")
      };
    }
    return null;
  } catch (error) {
    console.error("[音乐播放器] 获取standard音质失败:", error);
    return null;
  }
};

/**
 * 初始化单个音乐播放器
 */
export const initMusicPlayer = (player: HTMLElement): void => {
  if (player.dataset.initialized) return;
  player.dataset.initialized = "true";

  const audio = player.querySelector(
    ".music-audio-element"
  ) as HTMLAudioElement;
  const artworkWrapper = player.querySelector(
    ".music-artwork-wrapper"
  ) as HTMLElement;
  const needleEl = player.querySelector(
    ".artwork-image-needle-background"
  ) as HTMLElement;
  const playIcon = player.querySelector(".music-play-icon") as HTMLElement;
  const pauseIcon = player.querySelector(".music-pause-icon") as HTMLElement;
  const progressBar = player.querySelector(
    ".music-progress-bar"
  ) as HTMLElement;
  const progressFill = player.querySelector(
    ".music-progress-fill"
  ) as HTMLElement;
  const currentTimeEl = player.querySelector(".current-time") as HTMLElement;
  const durationEl = player.querySelector(".duration") as HTMLElement;
  const musicName = player.querySelector(".music-name") as HTMLElement;
  const musicArtist = player.querySelector(".music-artist") as HTMLElement;
  const coverImage = player.querySelector(".artwork-image") as HTMLImageElement;
  const coverBlur = player.querySelector(
    ".artwork-image-blur"
  ) as HTMLImageElement;
  const errorEl = player.querySelector(".music-error") as HTMLElement;

  const neteaseId = player.dataset.musicId;

  // 初始化音乐数据
  const initMusicData = async () => {
    // 检查是否有完整的data属性（保存后的文章会有）
    const dataName = player.dataset.musicName;
    const dataArtist = player.dataset.musicArtist;
    const dataPic = player.dataset.musicPic;
    const dataUrl = player.dataset.musicUrl;

    let resources;

    if (dataUrl && dataName) {
      // 使用data属性中的完整数据，不发起API请求
      resources = {
        audioUrl: ensureHttps(dataUrl),
        name: dataName,
        artist: dataArtist || "未知艺术家",
        pic: ensureHttps(dataPic || "")
      };
      console.log("[音乐播放器] 使用已保存的音乐数据:", dataName);
    } else if (neteaseId) {
      // 通过API获取数据（编辑器预览时）
      resources = await fetchMusicResources(neteaseId);
    }

    if (!resources || !resources.audioUrl) {
      // 显示错误信息
      if (errorEl) errorEl.style.display = "flex";
      console.error("[音乐播放器] 无法获取音乐资源");
      return false;
    }

    // 设置音频源
    audio.src = resources.audioUrl;
    audio.load();

    // 更新歌曲信息
    if (musicName) musicName.textContent = resources.name;
    if (musicArtist) musicArtist.textContent = resources.artist;

    // 更新封面
    if (resources.pic) {
      if (coverImage) coverImage.src = resources.pic;
      if (coverBlur) coverBlur.src = resources.pic;

      // 提取封面主色并应用到进度条
      extractDominantColor(resources.pic).then(color => {
        if (progressFill) {
          progressFill.style.background = color;
        }
      });
    }

    console.log("[音乐播放器] 音乐数据加载完成:", resources.name);
    return true;
  };

  // 点击封面或播放图标播放/暂停
  const togglePlay = async () => {
    if (!audio.src) {
      console.error("[音乐播放器] 音频未加载");
      return;
    }

    if (audio.paused) {
      audio.play().catch(err => console.error("[音乐播放器] 播放失败:", err));
    } else {
      audio.pause();
    }
  };

  if (artworkWrapper) {
    artworkWrapper.addEventListener("click", togglePlay);
  }

  // 页面加载时自动获取音乐信息
  initMusicData();

  // 音频事件监听
  audio.addEventListener("play", () => {
    if (artworkWrapper) artworkWrapper.classList.add("is-playing");
    if (needleEl) needleEl.classList.add("needle-playing");
    if (playIcon) playIcon.style.display = "none";
    if (pauseIcon) pauseIcon.style.display = "block";
  });

  audio.addEventListener("pause", () => {
    if (artworkWrapper) artworkWrapper.classList.remove("is-playing");
    if (needleEl) needleEl.classList.remove("needle-playing");
    if (playIcon) playIcon.style.display = "block";
    if (pauseIcon) pauseIcon.style.display = "none";
  });

  audio.addEventListener("timeupdate", () => {
    const progress = (audio.currentTime / audio.duration) * 100 || 0;
    progressFill.style.width = progress + "%";
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("ended", () => {
    audio.currentTime = 0;
    if (artworkWrapper) artworkWrapper.classList.remove("is-playing");
    if (needleEl) needleEl.classList.remove("needle-playing");
  });

  // 进度条点击
  progressBar.addEventListener("click", (e: MouseEvent) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  });
};

/**
 * 为音乐播放器注入完整数据
 */
export const enrichMusicPlayers = async (doc: Document): Promise<void> => {
  const musicPlayers = doc.querySelectorAll(".markdown-music-player");

  if (musicPlayers.length === 0) return;

  console.log(
    `[编辑器预览] 发现 ${musicPlayers.length} 个音乐播放器，开始注入数据...`
  );

  const apiBaseURL = getMusicAPIBaseURL();

  const enrichPromises = Array.from(musicPlayers).map(async player => {
    const rawMusicId = player.getAttribute("data-music-id");
    const musicDataAttr = player.getAttribute("data-music-data");
    const hasInitialized = player.getAttribute("data-initialized");

    console.log(`[编辑器预览] 检查音乐播放器:`, {
      musicId: rawMusicId,
      hasMusicData: !!musicDataAttr,
      hasInitialized: !!hasInitialized
    });

    if (!rawMusicId) return;

    // 解码HTML实体
    const musicId = decodeHtmlEntities(rawMusicId).replace(/['"]/g, "");

    // 检查是否已有完整数据
    let musicData: any = null;
    try {
      if (musicDataAttr) {
        musicData = JSON.parse(musicDataAttr.replace(/&quot;/g, '"'));
        if (
          musicData.name &&
          musicData.artist &&
          musicData.pic &&
          musicData.url
        ) {
          console.log(
            `[编辑器预览] 音乐 ${musicId} 已有完整数据（包括URL），跳过`
          );
          return;
        }
      }
    } catch (e) {
      console.warn(`[编辑器预览] 解析音乐数据失败:`, e);
    }

    try {
      console.log(`[编辑器预览] 开始获取音乐 ${musicId} 的数据...`);

      // 调用API获取音乐数据
      const formData = new URLSearchParams();
      formData.append("url", musicId);
      formData.append("level", "exhigh");
      formData.append("type", "json");

      let response = await fetch(`${apiBaseURL}/Song_V1`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      });

      let data = await response.json();

      // 如果exhigh失败，尝试standard
      if (!response.ok || data.status !== 200 || !data.success) {
        console.log(`[编辑器预览] exhigh品质失败，尝试standard品质...`);
        const standardFormData = new URLSearchParams();
        standardFormData.append("url", musicId);
        standardFormData.append("level", "standard");
        standardFormData.append("type", "json");

        response = await fetch(`${apiBaseURL}/Song_V1`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: standardFormData
        });

        data = await response.json();
      }

      if (data.status === 200 && data.success) {
        const name = data.data.name || "";
        const artist = data.data.ar_name || "";
        const pic = ensureHttps(data.data.pic || "");
        const url = ensureHttps(data.data.url || "");

        console.log(`[编辑器预览] 获取到的音乐数据:`, {
          name,
          artist,
          pic,
          url
        });

        // 提取封面主色
        const dominantColor = await extractDominantColor(pic);

        // 更新data属性
        const fullMusicData = {
          neteaseId: musicId,
          name,
          artist,
          pic,
          url,
          color: dominantColor
        };

        const musicDataJson = JSON.stringify(fullMusicData).replace(
          /"/g,
          "&quot;"
        );

        player.setAttribute("data-music-data", musicDataJson);
        player.setAttribute("data-initialized", "true");

        // 更新显示的文本和图片
        const nameEl = player.querySelector(".music-name");
        const artistEl = player.querySelector(".music-artist");
        const artworkImgs = player.querySelectorAll(
          ".artwork-image, .artwork-image-blur"
        );

        if (nameEl) nameEl.textContent = name;
        if (artistEl) artistEl.textContent = artist;
        artworkImgs.forEach(img => {
          (img as HTMLImageElement).src = pic;
        });

        console.log(`[编辑器预览] 音乐 ${musicId} 数据注入成功:`, {
          name,
          artist
        });
      } else {
        console.warn(`[编辑器预览] 获取音乐 ${musicId} 数据失败`);
      }
    } catch (error) {
      console.error(`[编辑器预览] 获取音乐 ${musicId} 数据异常:`, error);
    }
  });

  await Promise.all(enrichPromises);
  console.log(`[编辑器预览] 所有音乐播放器数据注入完成`);
};

/**
 * 为HTML中的音乐播放器注入完整数据
 */
export const enrichHtmlMusicPlayers = async (html: string): Promise<string> => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  await enrichMusicPlayers(doc);
  return doc.body.innerHTML;
};

/**
 * 音乐播放器观察器hook
 */
export const useMusicPlayerObserver = () => {
  const observerRef = ref<MutationObserver | null>(null);

  // 处理新增节点
  const processNewNode = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    // 查找音乐播放器
    const musicPlayers = element.classList?.contains("markdown-music-player")
      ? [element]
      : element.querySelectorAll?.(".markdown-music-player") || [];

    musicPlayers.forEach(player => {
      initMusicPlayer(player as HTMLElement);
    });
  };

  // 创建观察器
  const createObserver = () => {
    observerRef.value = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          processNewNode(node);
        });
      });
    });
    return observerRef.value;
  };

  // 断开观察器
  const disconnectObserver = () => {
    observerRef.value?.disconnect();
    observerRef.value = null;
  };

  return {
    createObserver,
    disconnectObserver,
    processNewNode,
    observerRef
  };
};
