/**
 * 어드벤처 모드 비트맵 좌표 데이터
 * --------------------------------
 * - `mask`: 행 우선(row-major). 0 = 빈 격자, 1 = 스테이지가 놓일 픽셀
 * - `stageOrder`: 스테이지 클리어 순서 (행·열 좌표). 이 순서대로 stageIndex 0..N-1 부여
 * - `themeColor`: 스테이지 클리어 시 칸 채우기 색 (비트맵 완성 톤)
 *
 * 첨부 이미지(로봇/건담 실루엣) 대신, 동일한 방식으로 마스크만 교체하면 됨.
 * 새 그림을 넣을 때: 이미지를 격자로 줄이고 0/1 행렬로 옮긴 뒤 `stageOrder`만 정하면 됨.
 */

export type BitmapMaskValue = 0 | 1

export interface AdventureBitmapSpec {
  readonly id: string
  readonly name: string
  /** 가로 칸 수 */
  readonly cols: number
  /** 세로 칸 수 */
  readonly rows: number
  /** rows개 행, 각 행은 cols길이. 1 = 스테이지 칸 */
  readonly mask: BitmapMaskValue[][]
  /** 스테이지 방문 순서 (예: 왼쪽→오른쪽, 위→아래) */
  readonly stageOrder: readonly { readonly row: number; readonly col: number }[]
  readonly themeColor: string
}

/** 마스크에서 1인 칸들을 읽는 순서로 stageOrder 자동 생성 (행 우선) */
export function buildStageOrderFromMask(
  mask: BitmapMaskValue[][],
): { row: number; col: number }[] {
  const order: { row: number; col: number }[] = []
  for (let r = 0; r < mask.length; r++) {
    const row = mask[r]
    if (!row) continue
    for (let c = 0; c < row.length; c++) {
      if (row[c] === 1) order.push({ row: r, col: c })
    }
  }
  return order
}

/**
 * 스테이지 인덱스에 따른 목표 음절 수(2~4글자).
 * 앞쪽은 짧은 단어, 뒤로 갈수록 길어짐.
 */
export function syllablesForAdventureStage(
  stageIndex: number,
  totalStages: number,
): 2 | 3 | 4 {
  if (totalStages <= 0) return 2
  const t = stageIndex / Math.max(totalStages - 1, 1)
  if (t < 0.35) return 2
  if (t < 0.72) return 3
  return 4
}

/** 데모용: 간단 로봇 실루엣 (16×12). IMG_8053과 같은 방식으로 마스크 교체 가능 */
const ROBOT_DEMO_MASK: BitmapMaskValue[][] = [
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0],
  [0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0],
  [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
]

export const ADVENTURE_DEMO: AdventureBitmapSpec = {
  id: 'demo-robot',
  name: '데모 로봇',
  cols: 16,
  rows: 12,
  mask: ROBOT_DEMO_MASK,
  stageOrder: buildStageOrderFromMask(ROBOT_DEMO_MASK),
  themeColor: '#38bdf8',
}

export function getStageAt(
  spec: AdventureBitmapSpec,
  stageIndex: number,
): { row: number; col: number } | undefined {
  return spec.stageOrder[stageIndex]
}
