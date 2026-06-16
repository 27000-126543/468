import type { PlantInfo, WaterQuality, EquipmentStatus, EnergyConsumption, AlertRecord, EmissionPlan, OperationReport, UserInfo } from '../types';

const PROVINCES = [
  { name: '北京', cities: ['朝阳区', '海淀区', '丰台区', '通州区'], lat: 39.9, lng: 116.4 },
  { name: '上海', cities: ['浦东新区', '黄浦区', '徐汇区', '闵行区'], lat: 31.2, lng: 121.5 },
  { name: '广东', cities: ['广州', '深圳', '东莞', '佛山'], lat: 23.1, lng: 113.3 },
  { name: '江苏', cities: ['南京', '苏州', '无锡', '常州'], lat: 32.1, lng: 118.8 },
  { name: '浙江', cities: ['杭州', '宁波', '温州', '绍兴'], lat: 30.3, lng: 120.2 },
  { name: '山东', cities: ['济南', '青岛', '烟台', '潍坊'], lat: 36.7, lng: 117.0 },
  { name: '四川', cities: ['成都', '绵阳', '德阳', '宜宾'], lat: 30.6, lng: 104.1 },
  { name: '湖北', cities: ['武汉', '宜昌', '襄阳', '荆州'], lat: 30.6, lng: 114.3 },
  { name: '河南', cities: ['郑州', '洛阳', '开封', '新乡'], lat: 34.7, lng: 113.7 },
  { name: '湖南', cities: ['长沙', '株洲', '湘潭', '衡阳'], lat: 28.2, lng: 113.0 },
  { name: '河北', cities: ['石家庄', '唐山', '保定', '邯郸'], lat: 38.0, lng: 114.5 },
  { name: '福建', cities: ['福州', '厦门', '泉州', '漳州'], lat: 26.1, lng: 119.3 },
  { name: '安徽', cities: ['合肥', '芜湖', '蚌埠', '马鞍山'], lat: 31.8, lng: 117.3 },
  { name: '辽宁', cities: ['沈阳', '大连', '鞍山', '抚顺'], lat: 41.8, lng: 123.4 },
  { name: '陕西', cities: ['西安', '咸阳', '宝鸡', '渭南'], lat: 34.3, lng: 108.9 },
  { name: '江西', cities: ['南昌', '九江', '赣州', '吉安'], lat: 28.7, lng: 115.9 },
  { name: '重庆', cities: ['渝中区', '江北区', '南岸区', '沙坪坝区'], lat: 29.6, lng: 106.5 },
  { name: '广西', cities: ['南宁', '柳州', '桂林', '北海'], lat: 22.8, lng: 108.3 },
  { name: '云南', cities: ['昆明', '曲靖', '大理', '玉溪'], lat: 25.0, lng: 102.7 },
  { name: '天津', cities: ['南开区', '河西区', '东丽区', '津南区'], lat: 39.1, lng: 117.2 },
  { name: '黑龙江', cities: ['哈尔滨', '齐齐哈尔', '大庆', '牡丹江'], lat: 45.8, lng: 126.5 },
  { name: '吉林', cities: ['长春', '吉林市', '四平', '松原'], lat: 43.9, lng: 125.3 },
  { name: '贵州', cities: ['贵阳', '遵义', '六盘水', '安顺'], lat: 26.6, lng: 106.7 },
  { name: '甘肃', cities: ['兰州', '天水', '白银', '武威'], lat: 36.1, lng: 103.8 },
  { name: '内蒙古', cities: ['呼和浩特', '包头', '鄂尔多斯', '赤峰'], lat: 40.8, lng: 111.7 },
  { name: '新疆', cities: ['乌鲁木齐', '克拉玛依', '库尔勒', '喀什'], lat: 43.8, lng: 87.6 },
  { name: '海南', cities: ['海口', '三亚', '儋州', '琼海'], lat: 20.0, lng: 110.3 },
  { name: '宁夏', cities: ['银川', '石嘴山', '吴忠', '固原'], lat: 38.5, lng: 106.3 },
  { name: '青海', cities: ['西宁', '海东', '格尔木', '德令哈'], lat: 36.6, lng: 101.8 },
  { name: '西藏', cities: ['拉萨', '日喀则', '林芝', '昌都'], lat: 29.6, lng: 91.1 },
  { name: '山西', cities: ['太原', '大同', '临汾', '运城'], lat: 37.9, lng: 112.5 },
];

const PROCESS_TYPES = ['A2/O', 'SBR', 'MBR', '氧化沟', 'CAST', 'CASS', 'A/O', '生物滤池'];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePlantId(provinceIdx: number, cityIdx: number, plantIdx: number) {
  return `P${String(provinceIdx + 1).padStart(2, '0')}${String(cityIdx + 1).padStart(2, '0')}${String(plantIdx + 1).padStart(2, '0')}`;
}

export function generatePlants(): PlantInfo[] {
  const plants: PlantInfo[] = [];
  PROVINCES.forEach((prov, pi) => {
    prov.cities.forEach((city, ci) => {
      const count = randInt(1, 3);
      for (let k = 0; k < count; k++) {
        const scale = pickOne([5, 10, 15, 20, 30, 50, 80, 100]);
        plants.push({
          id: generatePlantId(pi, ci, k),
          name: `${city}${['第一', '第二', '第三'][k]}污水处理厂`,
          province: prov.name,
          city,
          district: city,
          processType: pickOne(PROCESS_TYPES),
          designScale: scale,
          currentLoad: Math.round(rand(0.4, 1.1) * scale * 100) / 100,
          lat: prov.lat + rand(-0.5, 0.5),
          lng: prov.lng + rand(-0.5, 0.5),
        });
      }
    });
  });
  return plants;
}

export function generateWaterQuality(plant: PlantInfo): WaterQuality {
  const codLimit = 50;
  const nh3nLimit = 5;
  const tpLimit = 0.5;
  const exceeding = Math.random() < 0.05;
  return {
    plantId: plant.id,
    timestamp: new Date().toISOString(),
    codIn: Math.round(rand(150, 450)),
    codOut: exceeding ? Math.round(rand(51, 80)) : Math.round(rand(15, 48)),
    codLimit,
    nh3nIn: Math.round(rand(15, 40) * 10) / 10,
    nh3nOut: exceeding ? Math.round(rand(5.5, 12) * 10) / 10 : Math.round(rand(0.5, 4.8) * 10) / 10,
    nh3nLimit,
    tpIn: Math.round(rand(2, 8) * 100) / 100,
    tpOut: exceeding ? Math.round(rand(0.55, 1.5) * 100) / 100 : Math.round(rand(0.1, 0.48) * 100) / 100,
    tpLimit,
    flowIn: Math.round(rand(0.3, 1.2) * plant.designScale * 10000) / 10000,
    flowOut: Math.round(rand(0.28, 1.15) * plant.designScale * 10000) / 10000,
  };
}

export function generateEquipmentStatus(plantId: string): EquipmentStatus {
  const total = randInt(20, 80);
  const faultCount = Math.random() < 0.08 ? randInt(2, Math.ceil(total * 0.08)) : randInt(0, Math.max(1, Math.floor(total * 0.03)));
  const faultTypes = ['电机故障', '阀门卡死', '传感器异常', '泵体泄漏', '曝气盘堵塞', '污泥浓缩机故障', '加药泵故障'];
  const equipNames = ['1号曝气机', '2号曝气机', '回流泵A', '回流泵B', '污泥泵1', '污泥泵2', '提升泵', '搅拌机', '刮泥机', '鼓风机', '加药泵', '脱水机'];
  const faults = [];
  for (let i = 0; i < faultCount; i++) {
    faults.push({
      equipmentId: `EQ${randInt(1, total)}`,
      equipmentName: pickOne(equipNames),
      faultType: pickOne(faultTypes),
      faultTime: new Date(Date.now() - randInt(1, 72) * 3600000).toISOString(),
      status: Math.random() < 0.6 ? 'active' as const : 'repaired' as const,
    });
  }
  return {
    plantId,
    totalEquipment: total,
    faultEquipment: faultCount,
    faultRate: Math.round((faultCount / total) * 10000) / 100,
    faultDetails: faults,
  };
}

export function generateEnergyData(plantId: string, days: number = 30): EnergyConsumption[] {
  const data: EnergyConsumption[] = [];
  const baseUnit = rand(0.2, 0.6);
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const unitEnergy = Math.round((baseUnit + rand(-0.05, 0.05)) * 100) / 100;
    const volume = rand(2000, 80000);
    data.push({
      plantId,
      date,
      electricityKwh: Math.round(unitEnergy * volume),
      costYuan: Math.round(unitEnergy * volume * 0.75 * 100) / 100,
      unitEnergyKwhPerTon: unitEnergy,
      sludgeIntensity: Math.round(rand(0.3, 1.2) * 100) / 100,
    });
  }
  return data;
}

function generateWaterQualityMessage(plant: PlantInfo): string {
  const indicators = [
    { name: 'COD', value: rand(51, 80).toFixed(0), limit: '50', unit: 'mg/L' },
    { name: '氨氮', value: rand(5.2, 12).toFixed(1), limit: '5', unit: 'mg/L' },
    { name: '总磷', value: rand(0.55, 1.5).toFixed(1), limit: '0.5', unit: 'mg/L' },
  ];
  const indicator = pickOne(indicators);
  const duration = randInt(1, 6);
  return `${indicator.name}${indicator.value}${indicator.unit}超标（限值${indicator.limit}${indicator.unit}），已持续${duration}小时`;
}

function generateEquipmentMessage(plant: PlantInfo): string {
  const total = randInt(100, 200);
  const faultCount = randInt(8, 25);
  const faultRate = ((faultCount / total) * 100).toFixed(1);
  return `设备综合故障率${faultRate}%（阈值5%），故障设备${faultCount}台/总数${total}台`;
}

const PUSH_PREFIX = '【已推送：厂长-张明、属地生态环境局水环境科-李强】';

export function generateAlerts(plants: PlantInfo[]): AlertRecord[] {
  const alerts: AlertRecord[] = [];
  const now = Date.now();
  plants.forEach((plant, idx) => {
    if (Math.random() < 0.12) {
      const type = Math.random() < 0.6 ? 'water_quality' as const : 'equipment' as const;
      const contentMsg = type === 'water_quality'
        ? generateWaterQualityMessage(plant)
        : generateEquipmentMessage(plant);
      alerts.push({
        id: `ALT${String(idx + 1).padStart(4, '0')}`,
        plantId: plant.id,
        plantName: plant.name,
        type,
        level: Math.random() < 0.3 ? 1 : Math.random() < 0.6 ? 2 : 3,
        message: `${PUSH_PREFIX}${contentMsg}`,
        timestamp: new Date(now - randInt(1, 48) * 3600000).toISOString(),
        status: pickOne(['pending', 'processing', 'resolved']),
        approvalFlow: [
          { role: '厂长', name: '张明', status: pickOne(['approved', 'pending']), timestamp: new Date(now - randInt(20, 30) * 3600000).toISOString() },
          { role: '区环保局复核', name: '李强', status: pickOne(['pending', 'approved']), timestamp: new Date(now - randInt(5, 15) * 3600000).toISOString() },
          { role: '省厅批准', name: '王伟', status: 'pending' },
        ],
      });
    }
    if (Math.random() < 0.05) {
      alerts.push({
        id: `ALT${String(idx + 1001).padStart(4, '0')}`,
        plantId: plant.id,
        plantName: plant.name,
        type: 'emission',
        level: 2,
        message: `${PUSH_PREFIX}${plant.name}实际减排量低于年度计划20%，请关注`,
        timestamp: new Date(now - randInt(1, 168) * 3600000).toISOString(),
        status: pickOne(['pending', 'processing']),
      });
    }
  });
  return alerts;
}

export function generateEmissionPlan(province: string): EmissionPlan {
  const target = rand(50000, 500000);
  const actualRatio = rand(0.6, 1.1);
  return {
    year: 2026,
    province,
    targetVolume: Math.round(target),
    targetCod: Math.round(target * 0.85),
    targetNh3n: Math.round(target * 0.9),
    targetTp: Math.round(target * 0.88),
    actualVolume: Math.round(target * actualRatio),
    actualCod: Math.round(target * 0.85 * rand(0.6, 1.05)),
    actualNh3n: Math.round(target * 0.9 * rand(0.65, 1.08)),
    actualTp: Math.round(target * 0.88 * rand(0.6, 1.1)),
  };
}

export function hashString(s: string): number {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function seededRange(rand: () => number, min: number, max: number): number {
  return rand() * (max - min) + min;
}

function seededInt(rand: () => number, min: number, max: number): number {
  return Math.floor(seededRange(rand, min, max + 1));
}

export function generateWeeklyReport(weekNum: number): OperationReport {
  const weekLabel = `2026年第${weekNum}周`;
  const rand = seededRandom(hashString(`week-${weekNum}`));

  const avgCompliance = +seededRange(rand, 94, 99).toFixed(1);
  const complianceRateMom = +seededRange(rand, -3, 5).toFixed(2);
  const complianceRateYoy = +seededRange(rand, -5, 8).toFixed(2);
  const lastWeekCompliance = +(avgCompliance - complianceRateMom).toFixed(1);
  const lastYearCompliance = +(avgCompliance - complianceRateYoy).toFixed(1);

  const avgEnergy = +seededRange(rand, 0.28, 0.40).toFixed(3);
  const lastWeekEnergyDelta = +seededRange(rand, -0.02, 0.02).toFixed(3);
  const lastWeekEnergy = +Math.max(0.25, avgEnergy + lastWeekEnergyDelta).toFixed(3);
  const minEnergy = +seededRange(rand, 0.20, 0.25).toFixed(2);
  const maxEnergy = +seededRange(rand, 0.52, 0.62).toFixed(2);
  const totalElectricity = seededInt(rand, 1100, 1450);
  const totalCost = +(totalElectricity * 0.75).toFixed(1);

  const rankingPlants = [
    { plantId: 'P010101', name: '朝阳区第一污水处理厂', base: 0.22 },
    { plantId: 'P020101', name: '浦东新区第一污水处理厂', base: 0.25 },
    { plantId: 'P040101', name: '南京第一污水处理厂', base: 0.28 },
    { plantId: 'P050101', name: '杭州第一污水处理厂', base: 0.30 },
    { plantId: 'P030101', name: '广州第一污水处理厂', base: 0.32 },
  ];
  const shuffleSeed = hashString(`rank-${weekNum}`);
  const order = seededRandom(shuffleSeed);
  const shuffled = [...rankingPlants].sort(() => order() - 0.5);
  const energyRanking = shuffled.map((p, idx) => ({
    plantId: p.plantId,
    name: p.name,
    unitEnergy: +(p.base + seededRange(seededRandom(hashString(`p-${weekNum}-${idx}`)), -0.015, 0.015)).toFixed(2),
  })).sort((a, b) => a.unitEnergy - b.unitEnergy);

  const faultTypes = ['电机故障', '阀门卡死', '传感器异常', '泵体泄漏', '曝气盘堵塞', '污泥浓缩机故障', '加药泵故障', '电气故障'];
  const faultDistribution = faultTypes.map((type, i) => ({
    type,
    count: seededInt(seededRandom(hashString(`fault-${weekNum}-${i}`)), 3, 28),
  }));
  const totalFaultCount = faultDistribution.reduce((s, f) => s + f.count, 0);

  const recPool = [
    '建议将A2/O工艺曝气量下调8%，预计可降低能耗约12%',
    '3号厂污泥回流比建议从80%调整至70%，改善脱氮效果',
    '5号厂鼓风机建议安排预防性维护',
    '建议东区CAST工艺厂群增加周末值班人员，降低故障响应时间',
    '建议开展污泥脱水工艺参数优化，降低出泥含水率',
    '对西北区域水厂开展节能专项审计，降低单位能耗',
    '建议升级加药系统自动控制，提高药剂投加精度',
    '建议开展生物池曝气均匀性检测，优化曝气布局',
  ];
  const recSeed = seededRandom(hashString(`rec-${weekNum}`));
  const recIndices: number[] = [];
  while (recIndices.length < 4) {
    const idx = seededInt(recSeed, 0, recPool.length - 1);
    if (!recIndices.includes(idx)) recIndices.push(idx);
  }
  const recommendations = recIndices.map((i) => recPool[i]);

  const totalPlants = 286;
  const riskPlants = seededInt(seededRandom(hashString(`risk-${weekNum}`)), 5, 15);
  const stablePlants = totalPlants - riskPlants;

  const totalEquipment = seededInt(seededRandom(hashString(`equip-total-${weekNum}`)), 12000, 13000);
  const faultEquipment = seededInt(seededRandom(hashString(`equip-fault-${weekNum}`)), Math.max(totalFaultCount, 280), 360);
  const faultRate = +((faultEquipment / totalEquipment) * 100).toFixed(2);
  const faultRepaired = +(faultEquipment * seededRange(seededRandom(hashString(`repaired-${weekNum}`)), 0.8, 0.92)).toFixed(0);
  const faultPending = faultEquipment - faultRepaired;
  const avgRepairHours = +seededRange(seededRandom(hashString(`repair-${weekNum}`)), 6.5, 10.5).toFixed(1);

  const indicatorOptions = ['COD、NH₃-N', 'COD、TP', 'NH₃-N、TP', 'COD', 'NH₃-N', 'TP、SS'];
  const mainExceedIndicators = indicatorOptions[seededInt(seededRandom(hashString(`ind-${weekNum}`)), 0, indicatorOptions.length - 1)];

  const trendWeeks = Array.from({ length: 8 }, (_, i) => `第${weekNum - 7 + i}周`);
  const trendRand = seededRandom(hashString(`trend-${weekNum}`));
  const trendCurrent = trendWeeks.map((_, i) =>
    +(93 + seededRange(seededRandom(hashString(`tc-${weekNum}-${i}`)), 0, 6)).toFixed(1)
  );
  const trendLastWeek = trendWeeks.map((_, i) =>
    +(92 + seededRange(seededRandom(hashString(`tlw-${weekNum}-${i}`)), 0, 6)).toFixed(1)
  );
  const trendLastYear = trendWeeks.map((_, i) =>
    +(90 + seededRange(seededRandom(hashString(`tly-${weekNum}-${i}`)), 0, 6)).toFixed(1)
  );
  trendCurrent[7] = avgCompliance;
  trendLastWeek[7] = lastWeekCompliance;
  trendLastYear[7] = lastYearCompliance;

  return {
    week: weekLabel,
    weekNum,
    avgCompliance,
    complianceRateYoy,
    complianceRateMom,
    lastWeekCompliance,
    lastYearCompliance,
    avgEnergy,
    lastWeekEnergy,
    minEnergy,
    maxEnergy,
    totalElectricity,
    totalCost,
    energyRanking,
    faultDistribution,
    recommendations,
    totalPlants,
    stablePlants,
    riskPlants,
    totalEquipment,
    faultEquipment,
    faultRate,
    faultRepaired,
    faultPending,
    avgRepairHours,
    mainExceedIndicators,
    trendWeeks,
    trendCurrent,
    trendLastWeek,
    trendLastYear,
  };
}

export function generate7DayTrend(plantId: string) {
  const points = 7 * 24;
  const cod: { time: string; value: number }[] = [];
  const nh3n: { time: string; value: number }[] = [];
  const tp: { time: string; value: number }[] = [];
  for (let i = points; i >= 0; i--) {
    const t = new Date(Date.now() - i * 3600000);
    const ts = t.toISOString().replace('T', ' ').substring(0, 16);
    cod.push({ time: ts, value: Math.round(rand(15, 55) * 10) / 10 });
    nh3n.push({ time: ts, value: Math.round(rand(0.5, 6) * 100) / 100 });
    tp.push({ time: ts, value: Math.round(rand(0.1, 0.8) * 100) / 100 });
  }
  return { cod, nh3n, tp };
}

export function generate90DayPrediction(province: string) {
  const data: { date: string; planned: number; actual: number; predicted: number }[] = [];
  const basePlan = rand(3000, 15000);
  const startDate = new Date('2026-01-01');
  for (let i = 0; i < 180; i++) {
    const d = new Date(startDate.getTime() + i * 86400000);
    if (d > new Date()) break;
    data.push({
      date: d.toISOString().split('T')[0],
      planned: Math.round(basePlan + rand(-200, 200)),
      actual: Math.round((basePlan + rand(-500, 200)) * rand(0.7, 1.05)),
      predicted: 0,
    });
  }
  const lastActual = data.length > 0 ? data[data.length - 1].actual : basePlan;
  for (let i = 0; i < 90; i++) {
    const d = new Date(startDate.getTime() + (data.length + i) * 86400000);
    data.push({
      date: d.toISOString().split('T')[0],
      planned: Math.round(basePlan + rand(-200, 200)),
      actual: 0,
      predicted: Math.round(lastActual * rand(0.85, 1.1)),
    });
  }
  return data;
}

export const MOCK_USER: UserInfo = {
  role: 'national',
  name: '系统管理员',
};

export const PLANTS = generatePlants();
