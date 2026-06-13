import { memo } from 'react';
import useSWR from 'swr';
import { useShallow } from 'zustand/react/shallow';
import { useMapStore } from '../../store/mapStore.js';
import { API_ENDPOINTS } from '../../config/constants.js';
import { LoadingChartSkeleton, ChartErrorState, ChartEmptyState } from './chart-helpers.jsx';
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

// Year-series composition for the focused region. The drill level (kab/kec/des)
// narrows the geometry scope; the shared chart year range (panel-level slider)
// bounds how many years are computed — keeping wide spans from being too heavy.
function useStackStats(kab, kec, des) {
  const { startYear, endYear } = useMapStore(
    useShallow((state) => ({
      startYear: state.chartStartYear,
      endYear: state.chartEndYear,
    })),
  );

  const params = new URLSearchParams({ startYear, endYear });
  if (kab) params.set('kab', kab);
  if (kec) params.set('kec', kec);
  if (des) params.set('des', des);
  const statsUrl = `${API_ENDPOINTS.TILE_SERVER}/stack-chart?${params.toString()}`;

  const { data, error, isLoading } = useSWR(statsUrl, fetchStackCoverageStats, {
    shouldRetryOnError: false,
  });

  return { data, error, isLoading };
}

function StackCoverageChart({ kabupaten = null, kec = null, des = null }) {
  const { data, error, isLoading } = useStackStats(kabupaten, kec, des);

  if (isLoading) return <LoadingChartSkeleton />;
  if (error) return <ChartErrorState message={error.message} />;
  if (!data || !Array.isArray(data.rows) || data.rows.length === 0) return <ChartEmptyState />;

  // No remount key: a single persistent ECharts instance animates each option
  // update natively (grow-from-baseline on first mount, morph on drill/range
  // change) — the same path the Sankey chart uses, which animates reliably even
  // on a cold cache-hydrated page refresh.
  return <StackBarChart data={data} kab={kabupaten} kec={kec} des={des} />;
}

export default memo(StackCoverageChart);
