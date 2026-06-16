import type { PlantInfo, UserRole } from '../types';
import { PLANTS } from '../mock/data';

export function filterPlantsByPermission(
  plants: PlantInfo[],
  role: UserRole,
  userProvince?: string,
  userCity?: string
): PlantInfo[] {
  switch (role) {
    case 'national':
      return plants;
    case 'provincial':
      return plants.filter((p) => p.province === userProvince);
    case 'municipal':
      return plants.filter((p) => p.city === userCity);
    default:
      return plants;
  }
}

export function filterProvinceList(
  role: UserRole,
  userProvince?: string
): string[] {
  const allProvinces = [...new Set(PLANTS.map((p) => p.province))].sort();
  switch (role) {
    case 'national':
      return allProvinces;
    case 'provincial':
    case 'municipal':
      return userProvince ? [userProvince] : allProvinces;
    default:
      return allProvinces;
  }
}

export function filterCityList(
  role: UserRole,
  province: string,
  userProvince?: string,
  userCity?: string
): string[] {
  const plants = PLANTS.filter((p) => p.province === province);
  const allCities = [...new Set(plants.map((p) => p.city))].sort();
  switch (role) {
    case 'national':
    case 'provincial':
      return allCities;
    case 'municipal':
      return userCity ? [userCity] : allCities;
    default:
      return allCities;
  }
}

export function getPermissionScope(
  role: UserRole,
  userProvince?: string,
  userCity?: string
): string {
  switch (role) {
    case 'national':
      return '全国';
    case 'provincial':
      return userProvince || '全省';
    case 'municipal':
      return userCity || '全市';
    default:
      return '全国';
  }
}
