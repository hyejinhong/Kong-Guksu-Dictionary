import imageCompression from 'browser-image-compression';

/**
 * 이미지 압축 기본 옵션
 * - 최대 해상도: 1280px (FHD급)
 * - 최대 용량: 1MB 이하
 * - 품질: 85%
 * - Web Worker 사용으로 UI 프리징 방지 및 EXIF 회전 자동 보정
 */
const DEFAULT_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  initialQuality: 0.85,
};

/**
 * 이미지 파일을 압축합니다.
 * @param {File} file - 원본 이미지 파일
 * @param {Object} customOptions - 사용자 정의 옵션 (선택 사항)
 * @returns {Promise<File>} 압축된 File 객체
 */
export const compressImage = async (file, customOptions = {}) => {
  if (!file) return null;

  // 이미지가 아닌 경우 그대로 반환
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // GIF 애니메이션 파일의 경우 압축 시 첫 프레임 정지 이미지로 변환될 수 있으므로 그대로 반환
  if (file.type === 'image/gif') {
    return file;
  }

  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  try {
    const compressedBlob = await imageCompression(file, options);

    // 원본 파일명과 확장자 유지하여 File 객체 생성
    const compressedFile = new File([compressedBlob], file.name, {
      type: compressedBlob.type || file.type,
      lastModified: Date.now(),
    });

    console.info(
      `[ImageCompression] Original: ${(file.size / 1024 / 1024).toFixed(2)}MB -> Compressed: ${(compressedFile.size / 1024).toFixed(2)}KB`
    );

    return compressedFile;
  } catch (error) {
    console.warn('[ImageCompression] 압축 실패, 원본 파일을 사용합니다:', error);
    return file;
  }
};
