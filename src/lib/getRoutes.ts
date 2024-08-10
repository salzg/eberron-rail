// lib/getRoutes.ts
import path from 'path';
import fs from 'fs/promises';
import { RoutesData } from '@/types/types';

export async function getRoutes(): Promise<RoutesData> {
  const filePath = path.join(process.cwd(), 'data', 'routes.json');
  const jsonData = await fs.readFile(filePath, 'utf-8');
  const data: RoutesData = JSON.parse(jsonData);
  return data;
}
