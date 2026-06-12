import { memo, useMemo } from 'react';
import useSWR from 'swr';
import { useMapStore } from '../../store/mapStore.js';
import { API_ENDPOINTS, YEAR_CONFIG } from '../../config/constants.js';
import { LoadingChartSkeleton, ChartErrorState, ChartEmptyState } from './chart-helpers.jsx';
import CompositionPieChart from './CompositionPieChart.jsx';
import StackBarChart from './StackBarChart.jsx';

async function fetchStackCoverageStats(statsUrl) {
  const response = await fetch(statsUrl);
  const responseText = await response.text();
  let parsedJson = null;

  try {
    parsedJson = JSON.parse(responseText);
  } catch {
    if (response.ok) {
      throw new Error(`Respons JSON dari server tidak valid. Isi respons: ${responseText}`);
    }
  }

  if (!response.ok) {
    throw new Error(`Server ${response.status}: ${response.statusText} — ${responseText}`);
  }
  if (!parsedJson) {
    throw new Error(`Respons JSON dari server tidak valid. Isi respons: ${responseText}`);
  }

  return parsedJson;
}

function useStackStats(kab, kec, des) {
  const yearFromStore = useMapStore((state) => state.year);
  const year = Number(yearFromStore) || YEAR_CONFIG.DEFAULT;

  const params = new URLSearchParams({ year });
  if (kab) params.set('kab', kab);
  if (kec) params.set('kec', kec);
  if (des) params.set('des', des);
  const statsUrl = `${API_ENDPOINTS.TILE_SERVER}/stack-chart?${params.toString()}`;

  const { data, error, isLoading } = useSWR(statsUrl, fetchStackCoverageStats, {
    shouldRetryOnError: false,
  });

  return { data, error, isLoading, year };
}

function StackCoverageChart({
  kabupaten: kabupatenProp = null,
  kec: kecProp = null,
  des: desProp = null,
}) {
  const { data: rawData, error, isLoading, year } = useStackStats(kabupatenProp, kecProp, desProp);

  // Normalize old backend response (kabupaten array) → new format (rows array)
  const data = useMemo(() => {
    if (!rawData) return null;
    if (Array.isArray(rawData.rows)) return rawData;
    if (Array.isArray(rawData.kabupaten)) {
      return {
        ...rawData,
        level: 'kabupaten',
        rows: rawData.kabupaten.map((r) => ({ ...r, name: r.kabupaten })),
      };
    }
    return rawData;
  }, [rawData]);

  if (isLoading) return <LoadingChartSkeleton />;
  if (error) return <ChartErrorState message={error.message} />;
  if (!data || !Array.isArray(data.rows)) return <ChartEmptyState />;

  // Single row → pie chart (desa level)
  if (data.rows.length === 1) {
    return <CompositionPieChart data={data} year={year} />;
  }

  // Multiple rows → stacked bar
  return <StackBarChart data={data} year={year} kab={kabupatenProp} kec={kecProp} />;
}

export default memo(StackCoverageChart);
