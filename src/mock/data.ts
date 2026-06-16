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

export function generateAlerts(plants: PlantInfo[]): AlertRecord[] {
  const alerts: AlertRecord[] = [];
  const now = Date.now();
  plants.forEach((plant, idx) => {
    if (Math.random() < 0.12) {
      const type = Math.random() < 0.6 ? 'water_quality' as const : 'equipment' as const;
      alerts.push({
        id: `ALT${String(idx + 1).padStart(4, '0')}`,
        plantId: plant.id,
        plantName: plant.name,
        type,
        level: Math.random() < 0.3 ? 1 : Math.random() < 0.6 ? 2 : 3,
        message: type === 'water_quality'
          ? `${plant.name}出水COD连续2小时超标，当前值68mg/L，限值50mg/L`
          : `${plant.name}设备综合故障率${(rand(5, 12)).toFixed(1)}%，超过5%阈值`,
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
        message: `${plant.name}实际减排量低于年度计划20%，请关注`,
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

export function generateOperationReport(): OperationReport {
  const faultTypes = ['电机故障', '阀门卡死', '传感器异常', '泵体泄漏', '曝气盘堵塞', '污泥浓缩机故障', '加药泵故障', '电气故障'];
  return {
    week: '2026年第24周',
    complianceRateYoy: Math.round(rand(-5, 8) * 100) / 100,
    complianceRateMom: Math.round(rand(-3, 5) * 100) / 100,
    energyRanking: [
      { plantId: 'P010101', name: '朝阳区第一污水处理厂', unitEnergy: 0.22 },
      { plantId: 'P020101', name: '浦东新区第一污水处理厂', unitEnergy: 0.25 },
      { plantId: 'P040101', name: '南京第一污水处理厂', unitEnergy: 0.28 },
      { plantId: 'P050101', name: '杭州第一污水处理厂', unitEnergy: 0.30 },
      { plantId: 'P030101', name: '广州第一污水处理厂', unitEnergy: 0.32 },
    ],
    faultDistribution: faultTypes.map(type => ({ type, count: randInt(1, 25) })),
    recommendations: [
      '建议将A2/O工艺曝气量下调8%，预计可降低能耗约12%',
      '3号厂污泥回流比建议从80%调整至70%，改善脱氮效果',
      '5号厂鼓风机建议安排本月15日预防性维护',
      '建议东区CAST工艺厂群增加周末值班人员，降低故障响应时间',
    ],
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
