/**
 * @Description: 单首歌曲获取逻辑 composable (用于 Essay)
 * @Author: 安知鱼
 * @Date: 2025-10-05
 */
import { ref } from "vue";
import type { Song } from "../types/music";

export interface SongV1Response {
  status: number;
  success: boolean;
  message?: string;
  data: {
    id: string;
    name: string;
    ar_name: string; // 艺术家名称
    al_name: string; // 专辑名称
    url: string;
    pic: string;
    lyric: string;
    tlyric: string; // 翻译歌词
    level: string;
    size: string;
  };
}

/**
 * 确保URL使用HTTPS协议
 * @param url 原始URL
 * @returns HTTPS URL
 */
const ensureHttps = (url: string): string => {
  if (!url) return url;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

export function useEssaySingleMusic() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 调用 Song_V1 API 获取单曲资源
   * @param songId 网易云音乐歌曲ID
   * @param level 音质等级
   */
  const fetchSongV1 = async (
    songId: string,
    level: "exhigh" | "standard"
  ): Promise<{
    id: string;
    name: string;
    ar_name: string;
    al_name: string;
    url: string;
    pic: string;
    lyric: string;
    level: string;
    size: string;
    error?: "server_error" | "not_found";
  } | null> => {
    try {
      const formData = new URLSearchParams();
      formData.append("url", songId);
      formData.append("level", level);
      formData.append("type", "json");

      console.log(` [Song_V1 API] 调用获取 - ID: ${songId}, 音质: ${level}`);

      const response = await fetch("https://metings.qjqq.cn/Song_V1", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
      });

      // 区分服务器错误和资源不存在
      if (!response.ok) {
        if (response.status >= 500) {
          console.warn(
            ` [Song_V1 API] 服务器错误 ${response.status}，不尝试降级`
          );
          return {
            id: "",
            name: "",
            ar_name: "",
            al_name: "",
            url: "",
            pic: "",
            lyric: "",
            level: "",
            size: "",
            error: "server_error"
          };
        }
        console.warn(` [Song_V1 API] 请求失败 - 状态码: ${response.status}`);
        return {
          id: "",
          name: "",
          ar_name: "",
          al_name: "",
          url: "",
          pic: "",
          lyric: "",
          level: "",
          size: "",
          error: "not_found"
        };
      }

      const data: SongV1Response = await response.json();

      if (data.status !== 200 || !data.success) {
        console.warn(
          ` [Song_V1 API] API返回错误 - 状态: ${data.status}, 消息: ${data.message}`
        );
        return {
          id: "",
          name: "",
          ar_name: "",
          al_name: "",
          url: "",
          pic: "",
          lyric: "",
          level: "",
          size: "",
          error: "not_found"
        };
      }

      console.log(
        ` [Song_V1 API] 成功获取 - 歌曲: ${data.data.name}, 音质: ${data.data.level}, 大小: ${data.data.size}`
      );

      return {
        id: data.data.id,
        name: data.data.name,
        ar_name: data.data.ar_name,
        al_name: data.data.al_name,
        url: ensureHttps(data.data.url || ""),
        pic: ensureHttps(data.data.pic || ""),
        lyric: data.data.lyric || "",
        level: data.data.level,
        size: data.data.size
      };
    } catch (error) {
      console.error(` [Song_V1 API] 请求异常 (网络错误):`, error);
      return {
        id: "",
        name: "",
        ar_name: "",
        al_name: "",
        url: "",
        pic: "",
        lyric: "",
        level: "",
        size: "",
        error: "server_error"
      };
    }
  };

  /**
   * 通过 Song_V1 API 获取单首歌曲数据（带音质自动降级）
   * @param songId 网易云音乐歌曲ID
   */
  const fetchSingleSong = async (songId: string): Promise<Song | null> => {
    isLoading.value = true;
    error.value = null;

    try {
      console.log(` [单首歌曲] 开始获取歌曲 - ID: ${songId}`);

      // 第一步：尝试获取 exhigh 音质
      console.log(` [音质降级] 步骤1 - 尝试 exhigh 音质`);
      let result = await fetchSongV1(songId, "exhigh");

      // 第二步：根据错误类型决定是否降级
      if (result?.error === "server_error") {
        console.log(` [音质降级] ⚠️ 检测到服务器错误/网络异常，不尝试降级`);
        throw new Error("音乐服务暂时不可用");
      }

      // 如果是资源不存在，尝试降级到 standard
      if (!result || !result.url) {
        console.log(` [音质降级] 步骤2 - exhigh 无资源，尝试 standard 音质`);
        result = await fetchSongV1(songId, "standard");

        // 如果 standard 也是服务器错误，直接返回
        if (result?.error === "server_error") {
          console.log(` [音质降级] ⚠️ standard 也是服务器错误`);
          throw new Error("音乐服务暂时不可用");
        }
      }

      // 第三步：检查最终结果
      if (!result || !result.url) {
        console.log(` [音质降级] 所有音质都不可用`);
        throw new Error("该歌曲暂无可用音源");
      }

      const song: Song = {
        id: result.id || songId,
        neteaseId: result.id || songId,
        name: result.name || "未知歌曲",
        artist: result.ar_name || "未知艺术家",
        url: result.url,
        pic: ensureHttps(result.pic || ""),
        lrc: result.lyric
      };

      console.log(` [单首歌曲] 歌曲数据处理完成:`, {
        id: song.id,
        name: song.name,
        artist: song.artist,
        hasUrl: !!song.url,
        hasPic: !!song.pic,
        hasLyrics: !!song.lrc,
        lyricsLength: song.lrc?.length || 0,
        level: result.level,
        size: result.size
      });

      return song;
    } catch (err) {
      console.error(` [单首歌曲] 获取失败:`, err);
      error.value = err instanceof Error ? err.message : "获取歌曲数据失败";
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    fetchSingleSong
  };
}
