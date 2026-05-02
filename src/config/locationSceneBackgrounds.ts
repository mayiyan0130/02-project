import type { MapAreaId } from '../game/types';

export const HAREM_OVERVIEW_BACKGROUND = new URL('../../picture/background/背景.jpg', import.meta.url).href;

const baohuadianBackground = new URL('../../picture/background/宝华殿.jpg', import.meta.url).href;
const chuxiugongBackground = new URL('../../picture/background/储秀宫.jpg', import.meta.url).href;
const jianzhanggongBackground = new URL('../../picture/background/建章宫.jpg', import.meta.url).href;
const gongmenBackground = new URL('../../picture/background/宫门.jpg', import.meta.url).href;
const jiaofangdianBackground = new URL('../../picture/background/椒房殿.jpg', import.meta.url).href;
const linhuadianBackground = new URL('../../picture/background/临华殿.jpg', import.meta.url).href;
const taiyiyuanBackground = new URL('../../picture/background/太医院.jpg', import.meta.url).href;
const miaoyintangBackground = new URL('../../picture/background/妙音堂.jpg', import.meta.url).href;
const lenggongBackground = new URL('../../picture/background/冷宫.jpg', import.meta.url).href;
const yushanfangBackground = new URL('../../picture/background/御膳房.jpg', import.meta.url).href;
const yuhuayuanBackground = new URL('../../picture/background/御花园.jpg', import.meta.url).href;
const qixianggongBackground = new URL('../../picture/background/启祥宫.jpg', import.meta.url).href;
const zhengyangmenBackground = new URL('../../picture/background/正阳门.jpg', import.meta.url).href;
const chonghuagongBackground = new URL('../../picture/background/重华宫.jpg', import.meta.url).href;
const yushufangBackground = new URL('../../picture/background/御书房.webp', import.meta.url).href;
const yangxindianBackground = new URL('../../picture/background/养心殿.jpg', import.meta.url).href;
const huaqingchiBackground = new URL('../../picture/background/华清池.jpg', import.meta.url).href;
const yongninggongBackground = new URL('../../picture/background/永宁宫.jpg', import.meta.url).href;
const yonghegongBackground = new URL('../../picture/background/永和宫.jpg', import.meta.url).href;
const yanxigongBackground = new URL('../../picture/background/延禧宫.jpg', import.meta.url).href;
const yuqinggongBackground = new URL('../../picture/background/玉清宫.jpg', import.meta.url).href;
const changchungongBackground = new URL('../../picture/background/长春宫.jpg', import.meta.url).href;
const pixiangdianBackground = new URL('../../picture/background/披香殿.jpg', import.meta.url).href;
const zhaohuadianBackground = new URL('../../picture/background/昭华殿.jpg', import.meta.url).href;
const zhaoyanggongBackground = new URL('../../picture/background/昭阳宫.webp', import.meta.url).href;
const zhongcuigongBackground = new URL('../../picture/background/钟粹宫.jpg', import.meta.url).href;

export const LOCATION_SCENE_BACKGROUNDS: Partial<Record<MapAreaId, string>> = {
  宝华殿: baohuadianBackground,
  储秀宫: chuxiugongBackground,
  建章宫: jianzhanggongBackground,
  宫门: gongmenBackground,
  椒房殿: jiaofangdianBackground,
  临华殿: linhuadianBackground,
  太医院: taiyiyuanBackground,
  妙音堂: miaoyintangBackground,
  冷宫: lenggongBackground,
  御膳房: yushanfangBackground,
  御花园: yuhuayuanBackground,
  启祥宫: qixianggongBackground,
  正阳门: zhengyangmenBackground,
  重华宫: chonghuagongBackground,
  御书房: yushufangBackground,
  养心殿: yangxindianBackground,
  华清池: huaqingchiBackground,
  永宁宫: yongninggongBackground,
  永和宫: yonghegongBackground,
  延禧宫: yanxigongBackground,
  玉清宫: yuqinggongBackground,
  长春宫: changchungongBackground,
  披香殿: pixiangdianBackground,
  昭华殿: zhaohuadianBackground,
  昭阳宫: zhaoyanggongBackground,
  钟粹宫: zhongcuigongBackground,
};
