export type ShareOutcome = "shared" | "cancelled" | "downloaded";

/**
 * 휴대폰 공유 창으로 이미지를 보낸다.
 * 공유 창은 사용자 탭 직후에만 열 수 있으므로, file은 미리 만들어 두고 버튼 핸들러에서 바로 호출한다.
 * 파일 공유를 지원하지 않는 환경(카카오톡·토스 인앱 브라우저, 데스크톱 등)에서는 다운로드로 대신한다.
 * 사용자가 공유 창을 닫은 경우는 오류가 아니므로 다운로드로 넘어가지 않는다.
 */
export async function shareOrDownloadImage(file: File, objectUrl: string): Promise<ShareOutcome> {
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file] });
      return "shared";
    } catch (error) {
      // AbortError: 사용자가 공유 창을 닫음. InvalidStateError: 공유 창이 이미 열려 있음
      if (error instanceof DOMException && (error.name === "AbortError" || error.name === "InvalidStateError")) {
        return "cancelled";
      }
      // 권한 거부(NotAllowedError) 등 그 밖의 실패는 다운로드로 대신한다
    }
  }

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  return "downloaded";
}

function canShareFile(file: File) {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}
