import type { Ref } from "vue";
import { ElMessage } from "element-plus";
import type { FileItem } from "@/api/sys-file/type";
import { getShareFilePreviewUrlsApi } from "@/api/sys-file/sys-file";
import type AzImagePreview from "@/components/AzImagePreview";
import type AzVideoPreview from "@/components/AzVideoPreview";
import type AzTextPreview from "@/components/AzTextPreview";
import { createFullScreenLoading } from "@/views/system/file-management/utils/loadingService";

/**
 * 分享页面的文件预览 Hook
 * 与后台文件管理的预览逻辑类似，但使用分享专用的 API
 */
export function useShareFilePreview() {
  // 辅助函数，用于判断文件类型
  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|avif)$/i;
    return imageExtensions.test(fileName);
  };

  const isVideoFile = (fileName: string): boolean => {
    const videoExtensions = /\.(mp4|webm|ogg|mov|avi|flv)$/i;
    return videoExtensions.test(fileName);
  };

  const isTextFile = (filename: string): boolean => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const textFileExtensions = new Set([
      "txt",
      "md",
      "markdown",
      "json",
      "xml",
      "yaml",
      "yml",
      "csv",
      "html",
      "css",
      "js",
      "ts",
      "jsx",
      "tsx",
      "vue",
      "go",
      "py",
      "java",
      "c",
      "cpp",
      "h",
      "cs",
      "sh",
      "rb",
      "rs"
    ]);
    return textFileExtensions.has(ext);
  };

  /**
   * 预览图片文件
   */
  const previewImage = async (
    item: FileItem,
    currentFiles: FileItem[],
    imagePreviewRef: Ref<InstanceType<typeof AzImagePreview> | null>,
    shareId: string,
    sign?: string
  ) => {
    if (!imagePreviewRef.value) {
      return ElMessage.error("图片预览组件不可用。");
    }

    const allImageFilesInDir = currentFiles.filter(f => isImageFile(f.name));
    if (allImageFilesInDir.length === 0) return;

    const loadingInstance = createFullScreenLoading("正在准备图片预览...");
    try {
      const res = await getShareFilePreviewUrlsApi(shareId, item.id, sign);
      const { urls, initialIndex } = res.data ?? {};
      if (res.code === 200 && urls) {
        const imageListForPreview = urls.map((url, index) => {
          const correspondingFile = allImageFilesInDir[index];
          return {
            imageUrl: url,
            downloadUrl: url,
            fileSize: correspondingFile?.size ?? 0,
            createTime: correspondingFile?.created_at ?? new Date(),
            viewCount: 0,
            downloadCount: 0
          };
        });

        // 使用后端返回的 initialIndex，如果无效则查找
        let finalInitialIndex = initialIndex ?? -1;
        if (finalInitialIndex < 0 || finalInitialIndex >= urls.length) {
          finalInitialIndex = allImageFilesInDir.findIndex(
            f => f.id === item.id
          );
        }

        if (imagePreviewRef.value) {
          imagePreviewRef.value.open(
            imageListForPreview,
            finalInitialIndex >= 0 ? finalInitialIndex : 0
          );
        }
      } else {
        ElMessage.error(res.message || "获取图片预览链接失败");
      }
    } catch (error) {
      console.error("图片预览失败:", error);
      ElMessage.error("准备图片预览时发生错误。");
    } finally {
      loadingInstance.close();
    }
  };

  /**
   * 预览视频文件
   */
  const previewVideo = async (
    item: FileItem,
    videoPreviewRef: Ref<InstanceType<typeof AzVideoPreview> | null>,
    shareId: string,
    sign?: string
  ) => {
    if (!videoPreviewRef.value) {
      return ElMessage.error("视频预览组件不可用。");
    }
    try {
      const res = await getShareFilePreviewUrlsApi(shareId, item.id, sign);
      if (res.code === 200 && res.data?.urls?.length > 0) {
        // 使用返回的 initialIndex，如果无效则使用第一个URL
        const index = res.data.initialIndex ?? 0;
        const videoUrlItem = res.data.urls[index] || res.data.urls[0];
        if (videoPreviewRef.value && videoUrlItem?.url) {
          videoPreviewRef.value.open(videoUrlItem.url);
        } else {
          ElMessage.error("视频URL获取失败");
        }
      } else {
        ElMessage.error(res.message || "获取视频预览链接失败");
      }
    } catch (error) {
      console.error("获取视频预览链接失败:", error);
      ElMessage.error("获取预览链接时发生错误。");
    }
  };

  /**
   * 预览文本文件（分享页面只读，不支持编辑）
   */
  const previewText = async (
    item: FileItem,
    textPreviewRef: Ref<InstanceType<typeof AzTextPreview> | null>,
    theme: "light" | "dark",
    shareId: string,
    sign?: string
  ) => {
    if (!textPreviewRef.value) {
      return ElMessage.error("文本预览组件不可用。");
    }
    try {
      const res = await getShareFilePreviewUrlsApi(shareId, item.id, sign);
      if (res.code === 200 && res.data?.urls?.length > 0) {
        // 使用返回的 initialIndex，如果无效则使用第一个URL
        const index = res.data.initialIndex ?? 0;
        const textUrlItem = res.data.urls[index] || res.data.urls[0];
        if (textPreviewRef.value && textUrlItem?.url) {
          // 分享页面不支持保存，传入一个拒绝保存的函数
          const readOnlySave = async () => {
            ElMessage.warning("分享页面不支持编辑文件");
            return false;
          };
          textPreviewRef.value.open(item, textUrlItem.url, readOnlySave);
        } else {
          ElMessage.error("文本URL获取失败");
        }
      } else {
        ElMessage.error(res.message || "获取文本预览链接失败");
      }
    } catch (error) {
      console.error("获取文本预览链接失败:", error);
      ElMessage.error("获取预览链接时发生错误。");
    }
  };

  /**
   * 主预览函数
   */
  const previewFile = async (
    item: FileItem,
    currentFiles: FileItem[],
    refs: {
      imagePreviewRef: Ref<InstanceType<typeof AzImagePreview> | null>;
      videoPreviewRef: Ref<InstanceType<typeof AzVideoPreview> | null>;
      textPreviewRef: Ref<InstanceType<typeof AzTextPreview> | null>;
    },
    theme: "light" | "dark",
    shareId: string,
    sign?: string
  ) => {
    if (isImageFile(item.name)) {
      await previewImage(
        item,
        currentFiles,
        refs.imagePreviewRef,
        shareId,
        sign
      );
    } else if (isVideoFile(item.name)) {
      await previewVideo(item, refs.videoPreviewRef, shareId, sign);
    } else if (isTextFile(item.name)) {
      await previewText(item, refs.textPreviewRef, theme, shareId, sign);
    } else {
      ElMessage.info("暂不支持预览此类型的文件。");
    }
  };

  // 返回主函数和辅助函数
  return {
    previewFile,
    isImageFile,
    isVideoFile,
    isTextFile
  };
}
