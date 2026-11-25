/** 게시판 주소(slug) 형식. DB의 nepick_boards.slug 제약과 같다 */
export const NEPICK_SLUG_PATTERN = /^(?=.{1,40}$)[a-z0-9]+(-[a-z0-9]+)*$/;

/** 카드를 펼치기 전에 보여 주는 글 수 */
export const NEPICK_PREVIEW_POST_COUNT = 2;

/** 예: "청국장 네픽지수 3" */
export function formatNepickIndex(foodName: string, index: number) {
  return `${foodName} 네픽지수 ${new Intl.NumberFormat("ko-KR").format(index)}`;
}
