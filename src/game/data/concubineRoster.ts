import type { ConcubineProfile, ConcubineStatus, RouteId } from '../types';

type WomenPortraitId =
  | '陈妙仪'
  | '陈婉宁'
  | '崔令蓉'
  | '崔莺莺'
  | '杜若蘅'
  | '冯妙莲'
  | '顾雨杏'
  | '花棠'
  | '江晚晚'
  | '姜芷'
  | '李若瑶'
  | '连翘'
  | '柳仪芳'
  | '年欣兰'
  | '裴静姝'
  | '容可儿'
  | '沈妙清'
  | '水兰婷'
  | '孙玉娥'
  | '姚铃儿'
  | '叶琳珊'
  | '虞秋池';

type ConcubineSeed = Omit<ConcubineProfile, 'id' | 'source' | 'allies' | 'rivals'> & {
  allies?: string[];
  rivals?: string[];
};

type GeneratedConcubineTemplate = {
  portraitId: WomenPortraitId;
  name: string;
  familyBackground: string;
  personality: string;
  summary: string;
  ageRange: readonly [number, number];
  possibleRanks: readonly string[];
  possibleResidences: readonly string[];
  stats: ConcubineProfile['stats'];
};

const WOMEN_ASSET_EXT_BY_ID: Record<WomenPortraitId, 'jpg' | 'png'> = {
  陈妙仪: 'jpg',
  陈婉宁: 'png',
  崔令蓉: 'jpg',
  崔莺莺: 'jpg',
  杜若蘅: 'jpg',
  冯妙莲: 'jpg',
  顾雨杏: 'jpg',
  花棠: 'jpg',
  江晚晚: 'png',
  姜芷: 'jpg',
  李若瑶: 'jpg',
  连翘: 'jpg',
  柳仪芳: 'png',
  年欣兰: 'jpg',
  裴静姝: 'jpg',
  容可儿: 'jpg',
  沈妙清: 'png',
  水兰婷: 'jpg',
  孙玉娥: 'jpg',
  姚铃儿: 'png',
  叶琳珊: 'jpg',
  虞秋池: 'jpg',
};

const rankWeightMap: Record<string, number> = {
  皇后: 110,
  皇贵妃: 102,
  贵妃: 96,
  淑妃: 90,
  德妃: 88,
  贤妃: 86,
  妃: 82,
  昭仪: 78,
  昭容: 74,
  婕妤: 70,
  嫔: 64,
  贵人: 56,
  美人: 50,
  才人: 44,
  宝林: 38,
  常在: 32,
  答应: 28,
  庶人: 4,
};

const ROUTE_FIXED_CONSORTS: Record<RouteId, readonly ConcubineSeed[]> = {
  lanyinxuguo: [
    {
      routeScope: 'lanyinxuguo',
      portraitId: '姚铃儿',
      name: '姚铃儿',
      rankLabel: '贵妃',
      status: 'live',
      residence: '昭阳宫主殿',
      stateLabel: '盛宠',
      age: 19,
      familyBackground: '镇北将门嫡女',
      personality: '娇俏乖滑',
      summary: '最擅在盛宠里藏锋，看似轻快，实则每一句都在探人的底。',
      stats: {
        prestige: 90,
        favor: 84,
        familyInfluence: 88,
        health: 76,
        appearance: 92,
        relationToPlayer: -18,
        childrenCount: 1,
        ambition: 78,
        stress: 24,
        intrigue: 81,
        temperament: 88,
        affection: 44,
        fortune: 55,
      },
    },
    {
      routeScope: 'lanyinxuguo',
      portraitId: '江晚晚',
      name: '江晚晚',
      rankLabel: '淑妃',
      status: 'live',
      residence: '长春宫主殿',
      stateLabel: '得宠',
      age: 22,
      familyBackground: '江南盐商义女',
      personality: '温雅藏锋',
      summary: '礼数周全，账目分明，最喜欢在安静处把恩怨算清。',
      stats: {
        prestige: 82,
        favor: 70,
        familyInfluence: 72,
        health: 71,
        appearance: 84,
        relationToPlayer: -8,
        childrenCount: 0,
        ambition: 66,
        stress: 30,
        intrigue: 73,
        temperament: 82,
        affection: 36,
        fortune: 58,
      },
    },
    {
      routeScope: 'lanyinxuguo',
      portraitId: '柳仪芳',
      name: '柳仪芳',
      rankLabel: '美人',
      status: 'live',
      residence: '玉清宫西偏殿',
      stateLabel: '安稳',
      age: 18,
      familyBackground: '江南清流嫡次女',
      personality: '柔静识礼',
      summary: '不爱争先，却很会审时度势，在后宫里总能给自己留余地。',
      stats: {
        prestige: 64,
        favor: 42,
        familyInfluence: 62,
        health: 80,
        appearance: 79,
        relationToPlayer: 26,
        childrenCount: 0,
        ambition: 32,
        stress: 18,
        intrigue: 48,
        temperament: 81,
        affection: 18,
        fortune: 66,
      },
    },
  ],
  fushengrumeng: [
    {
      routeScope: 'fushengrumeng',
      portraitId: '沈妙清',
      name: '沈妙清',
      rankLabel: '昭仪',
      status: 'live',
      residence: '披香殿主殿',
      stateLabel: '得宠',
      age: 15,
      familyBackground: '江南世家嫡幼女',
      personality: '清灵敏锐',
      summary: '年纪尚小，却比许多老人看得更快，最会从细枝末节里觅机会。',
      stats: {
        prestige: 78,
        favor: 68,
        familyInfluence: 70,
        health: 74,
        appearance: 88,
        relationToPlayer: 34,
        childrenCount: 0,
        ambition: 62,
        stress: 27,
        intrigue: 69,
        temperament: 87,
        affection: 28,
        fortune: 61,
      },
    },
    {
      routeScope: 'fushengrumeng',
      portraitId: '姚铃儿',
      name: '姚铃儿',
      rankLabel: '贵妃',
      status: 'live',
      residence: '昭阳宫主殿',
      stateLabel: '盛宠',
      age: 19,
      familyBackground: '镇北将门嫡女',
      personality: '娇俏乖滑',
      summary: '最会在一片笑语里伸手落子，宠爱越盛，她越从容。',
      stats: {
        prestige: 92,
        favor: 86,
        familyInfluence: 88,
        health: 75,
        appearance: 92,
        relationToPlayer: -14,
        childrenCount: 1,
        ambition: 80,
        stress: 22,
        intrigue: 82,
        temperament: 89,
        affection: 43,
        fortune: 54,
      },
    },
    {
      routeScope: 'fushengrumeng',
      portraitId: '裴静姝',
      name: '裴静姝',
      rankLabel: '婕妤',
      status: 'live',
      residence: '永宁宫东偏殿',
      stateLabel: '安稳',
      age: 20,
      familyBackground: '京兆裴氏嫡次女',
      personality: '端谨疏淡',
      summary: '表面上离纷争最远，实则对宫里风向看得极准。',
      stats: {
        prestige: 70,
        favor: 38,
        familyInfluence: 77,
        health: 78,
        appearance: 75,
        relationToPlayer: 12,
        childrenCount: 0,
        ambition: 44,
        stress: 20,
        intrigue: 58,
        temperament: 84,
        affection: 16,
        fortune: 64,
      },
    },
  ],
  yingluoyeting: [
    {
      routeScope: 'yingluoyeting',
      portraitId: '陈婉宁',
      name: '陈婉宁',
      rankLabel: '德妃',
      status: 'live',
      residence: '昭华殿主殿',
      stateLabel: '安稳',
      age: 20,
      familyBackground: '外放巡抚嫡女',
      personality: '温顺持衡',
      summary: '不轻易露锋芒，却总能在两难之间给自己找出最稳的路。',
      stats: {
        prestige: 84,
        favor: 52,
        familyInfluence: 80,
        health: 82,
        appearance: 86,
        relationToPlayer: 10,
        childrenCount: 1,
        ambition: 54,
        stress: 25,
        intrigue: 64,
        temperament: 88,
        affection: 34,
        fortune: 63,
      },
    },
    {
      routeScope: 'yingluoyeting',
      portraitId: '顾雨杏',
      name: '顾雨杏',
      rankLabel: '嫔',
      status: 'live',
      residence: '永和宫西偏殿',
      stateLabel: '得宠',
      age: 18,
      familyBackground: '武门旁支之女',
      personality: '明艳爽利',
      summary: '说话快，出手也快，最不耐烦虚与委蛇。',
      stats: {
        prestige: 74,
        favor: 62,
        familyInfluence: 68,
        health: 85,
        appearance: 87,
        relationToPlayer: -6,
        childrenCount: 0,
        ambition: 58,
        stress: 32,
        intrigue: 55,
        temperament: 72,
        affection: 24,
        fortune: 60,
      },
    },
    {
      routeScope: 'yingluoyeting',
      portraitId: '容可儿',
      name: '容可儿',
      rankLabel: '贵人',
      status: 'live',
      residence: '临华殿东偏殿',
      stateLabel: '避锋',
      age: 17,
      familyBackground: '商贾义女',
      personality: '甜软机敏',
      summary: '惯会察言观色，谁都不得罪，却也从不轻易吃亏。',
      stats: {
        prestige: 60,
        favor: 34,
        familyInfluence: 48,
        health: 74,
        appearance: 83,
        relationToPlayer: 18,
        childrenCount: 0,
        ambition: 52,
        stress: 21,
        intrigue: 61,
        temperament: 70,
        affection: 14,
        fortune: 72,
      },
    },
  ],
  chenyuansucuo: [
    {
      routeScope: 'chenyuansucuo',
      portraitId: '崔令蓉',
      name: '崔令蓉',
      rankLabel: '嫔',
      status: 'live',
      residence: '启祥宫主殿',
      stateLabel: '安稳',
      age: 21,
      familyBackground: '陇右世家旁支嫡女',
      personality: '冷静沉着',
      summary: '不爱在明处喧哗，很多事总等到最后一步才真正出手。',
      stats: {
        prestige: 76,
        favor: 48,
        familyInfluence: 74,
        health: 73,
        appearance: 78,
        relationToPlayer: -4,
        childrenCount: 1,
        ambition: 70,
        stress: 29,
        intrigue: 82,
        temperament: 77,
        affection: 19,
        fortune: 52,
      },
    },
    {
      routeScope: 'chenyuansucuo',
      portraitId: '年欣兰',
      name: '年欣兰',
      rankLabel: '婕妤',
      status: 'live',
      residence: '钟粹宫东偏殿',
      stateLabel: '避锋',
      age: 19,
      familyBackground: '边镇武家庶女',
      personality: '克制隐忍',
      summary: '看着总在退让，其实把每一次吃亏都记在心里。',
      stats: {
        prestige: 72,
        favor: 32,
        familyInfluence: 69,
        health: 82,
        appearance: 74,
        relationToPlayer: 6,
        childrenCount: 0,
        ambition: 63,
        stress: 36,
        intrigue: 67,
        temperament: 68,
        affection: 12,
        fortune: 49,
      },
    },
    {
      routeScope: 'chenyuansucuo',
      portraitId: '顾雨杏',
      name: '顾雨杏',
      rankLabel: '美人',
      status: 'live',
      residence: '永和宫西偏殿',
      stateLabel: '安稳',
      age: 18,
      familyBackground: '武门旁支之女',
      personality: '明艳爽利',
      summary: '脾性直，锋芒也直，最见不得背后做局的人。',
      stats: {
        prestige: 66,
        favor: 38,
        familyInfluence: 66,
        health: 84,
        appearance: 86,
        relationToPlayer: -2,
        childrenCount: 0,
        ambition: 54,
        stress: 33,
        intrigue: 52,
        temperament: 71,
        affection: 13,
        fortune: 58,
      },
    },
  ],
};

const SPECIAL_START_CONSORTS: readonly ConcubineSeed[] = [
  {
    routeScope: 'all',
    portraitId: '杜若蘅',
    name: '杜若蘅',
    rankLabel: '庶人',
    status: 'limbo',
    residence: '冷宫北院',
    stateLabel: '幽居',
    age: 21,
    familyBackground: '清流寒门女',
    personality: '寡言清醒',
    summary: '昔年也曾得宠，如今被废入冷宫，只剩一身清明和旧账。',
    stats: {
      prestige: 22,
      favor: 8,
      familyInfluence: 34,
      health: 57,
      appearance: 68,
      relationToPlayer: 14,
      childrenCount: 0,
      ambition: 41,
      stress: 67,
      intrigue: 63,
      temperament: 74,
      affection: 6,
      fortune: 35,
    },
  },
  {
    routeScope: 'all',
    portraitId: '崔莺莺',
    name: '崔莺莺',
    rankLabel: '庶人',
    status: 'limbo',
    residence: '冷宫西偏院',
    stateLabel: '禁足',
    age: 23,
    familyBackground: '罪臣家眷',
    personality: '偏执刚烈',
    summary: '一朝失势后再不肯低头，眼底只剩被废前后的因果。',
    stats: {
      prestige: 14,
      favor: 0,
      familyInfluence: 16,
      health: 48,
      appearance: 62,
      relationToPlayer: -22,
      childrenCount: 0,
      ambition: 53,
      stress: 79,
      intrigue: 66,
      temperament: 58,
      affection: 0,
      fortune: 22,
    },
  },
  {
    routeScope: 'all',
    portraitId: '冯妙莲',
    name: '冯妙莲',
    rankLabel: '嫔',
    posthumousTitle: '悼嫔',
    status: 'deceased',
    residence: '旧居披香殿',
    stateLabel: '病逝',
    age: 20,
    familyBackground: '太医院世家女',
    personality: '温柔敏慧',
    summary: '谥号仍在，旧居亦在，宫里关于她的旧事却始终没有真正散尽。',
    stats: {
      prestige: 58,
      favor: 46,
      familyInfluence: 60,
      health: 0,
      appearance: 85,
      relationToPlayer: 0,
      childrenCount: 0,
      ambition: 37,
      stress: 0,
      intrigue: 48,
      temperament: 86,
      affection: 0,
      fortune: 44,
    },
  },
];

const GENERATED_CONSORT_TEMPLATES: readonly GeneratedConcubineTemplate[] = [
  {
    portraitId: '陈妙仪',
    name: '陈妙仪',
    familyBackground: '画院供奉之女',
    personality: '清疏自持',
    summary: '擅丹青，最懂如何把情绪藏进笑意和笔墨之间。',
    ageRange: [16, 20],
    possibleRanks: ['美人', '才人', '贵人'],
    possibleResidences: ['披香殿东偏殿', '临华殿西偏殿', '永宁宫西偏殿'],
    stats: {
      prestige: 58,
      favor: 41,
      familyInfluence: 46,
      health: 69,
      appearance: 80,
      relationToPlayer: 8,
      childrenCount: 0,
      ambition: 49,
      stress: 26,
      intrigue: 56,
      temperament: 84,
      affection: 16,
      fortune: 60,
    },
  },
  {
    portraitId: '花棠',
    name: '花棠',
    familyBackground: '南曲名伶抬籍',
    personality: '明媚轻狂',
    summary: '进退都像唱词，越是人多的地方，她越显得光彩夺目。',
    ageRange: [17, 21],
    possibleRanks: ['贵人', '美人', '才人'],
    possibleResidences: ['昭华殿西偏殿', '长春宫东偏殿', '玉清宫东偏殿'],
    stats: {
      prestige: 62,
      favor: 56,
      familyInfluence: 38,
      health: 72,
      appearance: 91,
      relationToPlayer: -10,
      childrenCount: 0,
      ambition: 61,
      stress: 29,
      intrigue: 47,
      temperament: 79,
      affection: 22,
      fortune: 58,
    },
  },
  {
    portraitId: '姜芷',
    name: '姜芷',
    familyBackground: '太医院旁支医女',
    personality: '沉静耐心',
    summary: '看诊时比谁都温和，轮到自己谋算时却从不手软。',
    ageRange: [18, 22],
    possibleRanks: ['贵人', '常在', '美人'],
    possibleResidences: ['永和宫东偏殿', '钟粹宫西偏殿', '临华殿东偏殿'],
    stats: {
      prestige: 54,
      favor: 35,
      familyInfluence: 44,
      health: 86,
      appearance: 72,
      relationToPlayer: 18,
      childrenCount: 0,
      ambition: 42,
      stress: 19,
      intrigue: 64,
      temperament: 75,
      affection: 12,
      fortune: 67,
    },
  },
  {
    portraitId: '李若瑶',
    name: '李若瑶',
    familyBackground: '礼部侍郎嫡女',
    personality: '端肃守矩',
    summary: '在规矩里长大，也最擅借规矩钳制旁人。',
    ageRange: [17, 22],
    possibleRanks: ['嫔', '贵人', '婕妤'],
    possibleResidences: ['永宁宫主殿', '昭阳宫东偏殿', '启祥宫东偏殿'],
    stats: {
      prestige: 68,
      favor: 44,
      familyInfluence: 78,
      health: 70,
      appearance: 76,
      relationToPlayer: -5,
      childrenCount: 1,
      ambition: 58,
      stress: 31,
      intrigue: 69,
      temperament: 83,
      affection: 15,
      fortune: 52,
    },
  },
  {
    portraitId: '连翘',
    name: '连翘',
    familyBackground: '御前女官抬位',
    personality: '灵巧细致',
    summary: '看着总是笑意盈盈，可每一眼都落在最要紧的地方。',
    ageRange: [16, 20],
    possibleRanks: ['才人', '美人', '常在'],
    possibleResidences: ['玉清宫西偏殿', '延禧宫东偏殿', '临华殿西偏殿'],
    stats: {
      prestige: 52,
      favor: 39,
      familyInfluence: 35,
      health: 71,
      appearance: 77,
      relationToPlayer: 22,
      childrenCount: 0,
      ambition: 47,
      stress: 24,
      intrigue: 58,
      temperament: 81,
      affection: 19,
      fortune: 69,
    },
  },
  {
    portraitId: '容可儿',
    name: '容可儿',
    familyBackground: '商贾义女',
    personality: '甜软机敏',
    summary: '最会看人下菜碟，一张笑脸能哄住半个宫。',
    ageRange: [16, 19],
    possibleRanks: ['美人', '贵人', '才人'],
    possibleResidences: ['昭华殿东偏殿', '启祥宫西偏殿', '钟粹宫西偏殿'],
    stats: {
      prestige: 50,
      favor: 34,
      familyInfluence: 42,
      health: 74,
      appearance: 82,
      relationToPlayer: 16,
      childrenCount: 0,
      ambition: 55,
      stress: 22,
      intrigue: 63,
      temperament: 71,
      affection: 14,
      fortune: 74,
    },
  },
  {
    portraitId: '水兰婷',
    name: '水兰婷',
    familyBackground: '边地贡女',
    personality: '冷艳寡言',
    summary: '平日里话少，动起念头来却极果断，很少给人第二次机会。',
    ageRange: [18, 22],
    possibleRanks: ['贵人', '嫔', '美人'],
    possibleResidences: ['永和宫主殿', '长春宫西偏殿', '启祥宫东偏殿'],
    stats: {
      prestige: 66,
      favor: 46,
      familyInfluence: 58,
      health: 80,
      appearance: 88,
      relationToPlayer: -12,
      childrenCount: 0,
      ambition: 72,
      stress: 35,
      intrigue: 74,
      temperament: 78,
      affection: 13,
      fortune: 45,
    },
  },
  {
    portraitId: '孙玉娥',
    name: '孙玉娥',
    familyBackground: '工部郎中庶女',
    personality: '务实隐忍',
    summary: '宫里的账、人情和短长，她都记得很牢，从不白白吃亏。',
    ageRange: [18, 23],
    possibleRanks: ['常在', '贵人', '才人'],
    possibleResidences: ['临华殿主殿', '延禧宫西偏殿', '玉清宫东偏殿'],
    stats: {
      prestige: 48,
      favor: 27,
      familyInfluence: 51,
      health: 68,
      appearance: 70,
      relationToPlayer: 11,
      childrenCount: 1,
      ambition: 57,
      stress: 28,
      intrigue: 67,
      temperament: 64,
      affection: 10,
      fortune: 57,
    },
  },
  {
    portraitId: '叶琳珊',
    name: '叶琳珊',
    familyBackground: '旧勋门第嫡女',
    personality: '傲气清贵',
    summary: '门第好，气性也高，最看不起靠取巧上位的人。',
    ageRange: [17, 21],
    possibleRanks: ['婕妤', '贵人', '嫔'],
    possibleResidences: ['昭阳宫西偏殿', '永宁宫东偏殿', '钟粹宫主殿'],
    stats: {
      prestige: 72,
      favor: 43,
      familyInfluence: 82,
      health: 75,
      appearance: 79,
      relationToPlayer: -9,
      childrenCount: 0,
      ambition: 64,
      stress: 33,
      intrigue: 60,
      temperament: 85,
      affection: 18,
      fortune: 51,
    },
  },
  {
    portraitId: '虞秋池',
    name: '虞秋池',
    familyBackground: '地方守臣嫡女',
    personality: '沉静孤高',
    summary: '极少主动亲近谁，偏偏越是如此，越容易让人记住。',
    ageRange: [18, 22],
    possibleRanks: ['嫔', '贵人', '美人'],
    possibleResidences: ['昭华殿主殿', '启祥宫西偏殿', '长春宫东偏殿'],
    stats: {
      prestige: 70,
      favor: 40,
      familyInfluence: 75,
      health: 77,
      appearance: 84,
      relationToPlayer: -3,
      childrenCount: 0,
      ambition: 69,
      stress: 30,
      intrigue: 72,
      temperament: 87,
      affection: 12,
      fortune: 50,
    },
  },
];

const GENERATED_CONSORT_COUNT = 5;

const createSeededRandom = (seedSource: string): (() => number) => {
  let seed = 0;
  for (let index = 0; index < seedSource.length; index += 1) {
    seed = (seed * 31 + seedSource.charCodeAt(index)) >>> 0;
  }

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const jitterStat = (value: number, random: () => number, spread = 8): number =>
  clamp(value + Math.round((random() - 0.5) * spread * 2), 0, 100);

const pickOne = <T,>(items: readonly T[], random: () => number): T =>
  items[Math.min(items.length - 1, Math.floor(random() * items.length))];

const shuffle = <T,>(items: readonly T[], random: () => number): T[] => {
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }
  return cloned;
};

const resolveGeneratedStateLabel = (favor: number): string => {
  if (favor >= 70) return '得宠';
  if (favor >= 46) return '安稳';
  if (favor >= 30) return '观望';
  return '避锋';
};

const createConcubineFromSeed = (
  seed: ConcubineSeed,
  source: ConcubineProfile['source'],
  idPrefix: string,
  index: number,
): ConcubineProfile => ({
  ...seed,
  id: `${idPrefix}-${seed.portraitId}-${index}`,
  source,
  allies: seed.allies ?? [],
  rivals: seed.rivals ?? [],
});

const createGeneratedConcubine = (
  template: GeneratedConcubineTemplate,
  routeId: RouteId,
  random: () => number,
  index: number,
): ConcubineProfile => {
  const age = clamp(
    template.ageRange[0] + Math.floor(random() * (template.ageRange[1] - template.ageRange[0] + 1)),
    15,
    23,
  );
  const rankLabel = pickOne(template.possibleRanks, random);
  const favor = jitterStat(template.stats.favor, random, 10);
  const childrenCount =
    template.stats.childrenCount > 0 ? clamp(template.stats.childrenCount + Math.round(random() - 0.45), 0, 3) : 0;

  return {
    id: `generated-${routeId}-${template.portraitId}-${index}`,
    routeScope: routeId,
    portraitId: template.portraitId,
    name: template.name,
    rankLabel,
    status: 'live',
    residence: pickOne(template.possibleResidences, random),
    stateLabel: resolveGeneratedStateLabel(favor),
    age,
    familyBackground: template.familyBackground,
    personality: template.personality,
    summary: template.summary,
    source: 'generated',
    stats: {
      prestige: jitterStat(template.stats.prestige, random),
      favor,
      familyInfluence: jitterStat(template.stats.familyInfluence, random, 6),
      health: jitterStat(template.stats.health, random, 7),
      appearance: jitterStat(template.stats.appearance, random, 7),
      relationToPlayer: clamp(template.stats.relationToPlayer + Math.round((random() - 0.5) * 20), -100, 100),
      childrenCount,
      ambition: jitterStat(template.stats.ambition, random),
      stress: jitterStat(template.stats.stress, random, 10),
      intrigue: jitterStat(template.stats.intrigue, random),
      temperament: jitterStat(template.stats.temperament, random, 6),
      affection: jitterStat(template.stats.affection, random, 10),
      fortune: jitterStat(template.stats.fortune, random, 8),
    },
    allies: [],
    rivals: [],
  };
};

const attachRelations = (roster: ConcubineProfile[]): ConcubineProfile[] => {
  const livePool = roster.filter((item) => item.status === 'live');
  const fallbackPool = roster;

  return roster.map((item, index) => {
    const pool = (livePool.length > 1 ? livePool : fallbackPool).filter((other) => other.id !== item.id);
    if (pool.length === 0) {
      return item;
    }

    const allies =
      item.allies.length > 0
        ? item.allies.slice(0, 3)
        : [pool[index % pool.length]?.name, pool[(index + 2) % pool.length]?.name].filter(
            (value, currentIndex, array): value is string => Boolean(value) && array.indexOf(value) === currentIndex,
          );

    const rivals =
      item.rivals.length > 0
        ? item.rivals.slice(0, 3)
        : [pool[(index + 1) % pool.length]?.name, pool[(index + 3) % pool.length]?.name]
            .filter((value): value is string => Boolean(value) && !allies.includes(value))
            .slice(0, 2);

    return {
      ...item,
      allies,
      rivals,
    };
  });
};

const normalizeCustomConsort = (consort: ConcubineProfile, index: number): ConcubineProfile => ({
  ...consort,
  id: consort.id || `custom-${consort.portraitId}-${index}`,
  source: 'custom',
  status: consort.status ?? 'live',
  stateLabel: consort.stateLabel || (consort.status === 'deceased' ? '已逝' : consort.status === 'limbo' ? '幽居' : '安稳'),
  allies: consort.allies ?? [],
  rivals: consort.rivals ?? [],
  isCustomConsort: true,
  customSource: consort.customSource ?? 'player',
});

export const getConcubinePortraitPath = (portraitId: string): string => {
  const ext = WOMEN_ASSET_EXT_BY_ID[portraitId as WomenPortraitId] ?? 'jpg';
  return `/assets/characters/women/${portraitId}.${ext}`;
};

export const getConcubineListLabel = (consort: ConcubineProfile): string => {
  if (consort.status === 'limbo') {
    return `庶人 ${consort.name}`;
  }
  if (consort.status === 'deceased') {
    return `${consort.posthumousTitle ?? consort.rankLabel} ${consort.name}`;
  }
  return `${consort.rankLabel} ${consort.name}`;
};

export const getConcubineSortWeight = (consort: ConcubineProfile): number => {
  if (consort.status === 'deceased') {
    return consort.stats.prestige;
  }
  if (consort.status === 'limbo') {
    return consort.stats.intrigue;
  }
  return (rankWeightMap[consort.rankLabel] ?? 0) * 100 + consort.stats.favor;
};

export const buildInitialConcubineRoster = (
  routeId: RouteId,
  customConsorts: ConcubineProfile[] = [],
): ConcubineProfile[] => {
  const random = createSeededRandom(`concubine-roster:${routeId}`);
  const fixed = ROUTE_FIXED_CONSORTS[routeId].map((seed, index) => createConcubineFromSeed(seed, 'fixed', routeId, index));
  const specials = SPECIAL_START_CONSORTS.map((seed, index) => createConcubineFromSeed(seed, 'fixed', 'special', index));
  const usedPortraitIds = new Set([...fixed, ...specials].map((item) => item.portraitId));
  const generatedTemplates = shuffle(
    GENERATED_CONSORT_TEMPLATES.filter((template) => !usedPortraitIds.has(template.portraitId)),
    random,
  ).slice(0, GENERATED_CONSORT_COUNT);

  const generated = generatedTemplates.map((template, index) => createGeneratedConcubine(template, routeId, random, index));
  const availableCustomConsorts = customConsorts
    .filter((consort) => !consort.routeScope || consort.routeScope === 'all' || consort.routeScope === routeId)
    .map((consort, index) => normalizeCustomConsort(consort, index));

  return attachRelations([...fixed, ...specials, ...generated, ...availableCustomConsorts]);
};

export const sortConcubinesByStatus = (
  concubines: ConcubineProfile[],
  status: ConcubineStatus,
): ConcubineProfile[] =>
  [...concubines]
    .filter((consort) => consort.status === status)
    .sort((left, right) => getConcubineSortWeight(right) - getConcubineSortWeight(left));
