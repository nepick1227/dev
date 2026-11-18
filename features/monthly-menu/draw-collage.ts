import type { MonthlyMenuRecord } from "@/lib/monthly-menu";

export interface CollageItem {
  record: MonthlyMenuRecord;
  /** 추천 메뉴. 비어 있으면 이미지에 그 줄을 그리지 않는다 */
  menu: string;
}

const WIDTH = 1080;
const HEIGHT = 1920;
const MARGIN_X = 72;
const CONTENT_WIDTH = WIDTH - MARGIN_X * 2;
// 인스타그램 스토리 UI(상단 프로필, 하단 답장 입력)에 가리지 않도록 중요한 글자는 이 사이에 둔다
const SAFE_TOP = 260;
const CONTENT_TOP = 460;
const CONTENT_BOTTOM = 1610;
const FOOTER_LINE_Y = 1640;
const FONT = '"Pretendard Variable", Pretendard, -apple-system, sans-serif';

const COLOR = {
  paper: "#FFFDFC",
  photoBg: "#F8F2EA",
  primary: "#D32F2F",
  textPrimary: "#17191C",
  textSecondary: "#6E7379",
  textTertiary: "#9AA0A6",
  border: "#E6E8EB",
};

/** 콜라주를 그려 PNG Blob으로 돌려준다. 사진을 하나라도 불러오지 못하면 throw */
export async function drawMonthlyMenuCollage(title: string, items: CollageItem[]) {
  const [images] = await Promise.all([
    Promise.all(items.map((item) => loadCanvasImage(item.record.imageUrl))),
    loadFonts(),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas_unavailable");

  context.fillStyle = COLOR.paper;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.textBaseline = "alphabetic";

  context.fillStyle = COLOR.primary;
  context.font = `700 26px ${FONT}`;
  context.fillText("NEPICK MONTHLY MENU", MARGIN_X, SAFE_TOP + 30);

  context.fillStyle = COLOR.textPrimary;
  context.font = `900 84px ${FONT}`;
  context.fillText(title, MARGIN_X, SAFE_TOP + 118);

  context.fillStyle = COLOR.primary;
  context.fillRect(MARGIN_X, SAFE_TOP + 148, CONTENT_WIDTH, 4);

  if (items.length === 2) {
    drawColumnItems(context, items, images);
  } else {
    drawRowItems(context, items, images);
  }

  context.strokeStyle = COLOR.border;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(MARGIN_X, FOOTER_LINE_Y);
  context.lineTo(WIDTH - MARGIN_X, FOOTER_LINE_Y);
  context.stroke();

  context.fillStyle = COLOR.primary;
  context.font = `800 26px ${FONT}`;
  context.fillText("NEPICK", MARGIN_X, FOOTER_LINE_Y + 44);
  context.fillStyle = COLOR.textTertiary;
  context.textAlign = "right";
  context.font = `400 24px ${FONT}`;
  context.fillText("나의 지난달 맛집 기록", WIDTH - MARGIN_X, FOOTER_LINE_Y + 44);
  context.textAlign = "left";

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("canvas_export_failed"))), "image/png");
  });
}

/** 사진 2장: 세로로 긴 사진 두 칸을 나란히, 글은 사진 아래 */
function drawColumnItems(
  context: CanvasRenderingContext2D,
  items: CollageItem[],
  images: HTMLImageElement[]
) {
  const gap = 36;
  const columnWidth = (CONTENT_WIDTH - gap) / 2;
  const photoHeight = 780;
  const textHeight = 260;
  const top = CONTENT_TOP + (CONTENT_BOTTOM - CONTENT_TOP - photoHeight - textHeight) / 2;

  items.forEach((item, index) => {
    const x = MARGIN_X + index * (columnWidth + gap);
    drawPhoto(context, images[index], x, top, columnWidth, photoHeight);
    drawLabels(context, item, x, top + photoHeight + 60, columnWidth);
  });
}

/** 사진 3장: 정사각형 사진 왼쪽, 글은 오른쪽 */
function drawRowItems(
  context: CanvasRenderingContext2D,
  items: CollageItem[],
  images: HTMLImageElement[]
) {
  const gap = 36;
  const blockHeight = (CONTENT_BOTTOM - CONTENT_TOP - gap * 2) / 3;
  const textX = MARGIN_X + blockHeight + 36;

  items.forEach((item, index) => {
    const y = CONTENT_TOP + index * (blockHeight + gap);
    drawPhoto(context, images[index], MARGIN_X, y, blockHeight, blockHeight);
    drawLabels(context, item, textX, y + 72, WIDTH - MARGIN_X - textX);
  });
}

function drawPhoto(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  context.save();
  context.beginPath();
  // 오래된 iOS WebView(16 미만)에는 roundRect가 없어 그때는 각진 칸으로 그린다
  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, 24);
  } else {
    context.rect(x, y, width, height);
  }
  context.clip();
  context.fillStyle = COLOR.photoBg;
  context.fillRect(x, y, width, height);
  drawCoverImage(context, image, x, y, width, height);
  context.restore();
}

/** 가게명(최대 2줄) → 위치 → 추천 메뉴(있을 때) */
function drawLabels(
  context: CanvasRenderingContext2D,
  item: CollageItem,
  x: number,
  y: number,
  maxWidth: number
) {
  context.fillStyle = COLOR.textPrimary;
  context.font = `800 44px ${FONT}`;
  const nameLines = drawWrappedText(context, item.record.storeName, x, y, maxWidth, 54, 2);
  let nextY = y + (nameLines - 1) * 54 + 48;

  if (item.record.storeArea) {
    context.fillStyle = COLOR.textSecondary;
    context.font = `500 30px ${FONT}`;
    drawWrappedText(context, item.record.storeArea, x, nextY, maxWidth, 38, 1);
    nextY += 46;
  }

  const menu = item.menu.trim();
  if (menu) {
    context.fillStyle = COLOR.primary;
    context.font = `700 30px ${FONT}`;
    drawWrappedText(context, `추천 메뉴 · ${menu}`, x, nextY, maxWidth, 38, 2);
  }
}

/** canvas는 화면에 아직 안 쓰인 굵기를 자동으로 받지 않으므로 미리 불러 둔다. 실패하면 대체 글꼴로 그린다 */
async function loadFonts() {
  if (!document.fonts) return;
  await Promise.allSettled(
    ["400", "500", "700", "800", "900"].map((weight) => document.fonts.load(`${weight} 40px ${FONT}`))
  );
}

async function loadCanvasImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("image_fetch_failed");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

/** 칸을 꽉 채우도록 가운데 기준으로 잘라 그린다 */
function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

/** 글자 단위로 줄바꿈하고 maxLines를 넘으면 마지막 줄 끝을 "…"로 자른다. 그린 줄 수를 돌려준다 */
function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const lines: string[] = [];
  let line = "";

  for (const character of Array.from(text)) {
    const nextLine = line + character;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line.trimEnd());
      // 줄바꿈한 줄이 공백으로 시작하지 않게 한다
      line = character.trim() ? character : "";
    } else {
      line = nextLine;
    }
  }
  if (line) lines.push(line);

  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let last = visible[maxLines - 1];
    while (last && context.measureText(`${last}…`).width > maxWidth) {
      last = Array.from(last).slice(0, -1).join("");
    }
    visible[maxLines - 1] = `${last}…`;
  }

  visible.forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
  return Math.max(visible.length, 1);
}
