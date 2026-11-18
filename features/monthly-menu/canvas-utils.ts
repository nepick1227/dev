/**
 * canvas는 화면에 아직 안 쓰인 굵기·글자(한글은 글자 범위별로 나뉜 파일)를 자동으로 받지 않으므로
 * 그릴 글자를 넘겨 미리 불러 둔다. 실패하면 대체 글꼴로 그린다
 */
export async function loadFonts(fontFamily: string, weights: string[], text: string) {
  if (!document.fonts) return;
  await Promise.allSettled(
    weights.map((weight) => document.fonts.load(`${weight} 40px ${fontFamily}`, text))
  );
}

/** CORS로 사진을 받아 blob URL로 디코딩한다. canvas가 오염되지 않아 toBlob이 가능하다 */
export async function loadCanvasImage(url: string) {
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
export function drawCoverImage(
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
export function drawWrappedText(
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
