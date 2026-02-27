import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { KABUPATENS } from '../data/kabupatens.js';

// ─────────────────────────────────────────────────────────────────────────────
// DataUSA-style analytics profile page
// Dark hero → stats bar → section nav → Population & Diversity / Economy / Civics
// ─────────────────────────────────────────────────────────────────────────────
export function ProfilePage({ kabupatenName }) {
  const [activeSection, setActiveSection] = useState('population');

  const kabupatenData = KABUPATENS.find(
    (k) => k.name.toLowerCase() === kabupatenName.toLowerCase()
  );

  // ─── NAV SECTIONS ───
  const navSections = [
    { id: 'population', label: 'Population & Diversity', color: '#14b8a6' },
    { id: 'economy', label: 'Economy', color: '#27CBFC' },
    { id: 'civics', label: 'Civics', color: '#0f766e' },
  ];

  // ─── POPULATION PYRAMID ───
  const ageBands = ['0-4','5-9','10-14','15-19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64','65-69','70-74','75+'];
  const maleValues  = [8.2, 8.5, 8.8, 9.1, 10.2, 11.4, 12.1, 11.8, 11.2, 10.6, 9.8, 9.0, 7.8, 6.2, 4.4, 3.8];
  const femaleValues= [7.9, 8.1, 8.6, 8.9,  9.8, 11.0, 12.3, 12.0, 11.5, 10.9,10.2, 9.5, 8.4, 6.9, 5.2, 5.8];

  const pyramidOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params) => {
      const female = params.find(p => p.seriesName === 'Female');
      const male   = params.find(p => p.seriesName === 'Male');
      return `${params[0].axisValue}<br/>Female: ${female ? female.value : 0}%<br/>Male: ${male ? Math.abs(male.value) : 0}%`;
    }},
    legend: { data: ['Male', 'Female'], bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 52, right: 40, top: 10, bottom: 36 },
    xAxis: { type: 'value', axisLabel: { formatter: v => `${Math.abs(v)}%` } },
    yAxis: { type: 'category', data: ageBands, axisLabel: { fontSize: 10 } },
    series: [
      { name: 'Male',   type: 'bar', stack: 'total', data: maleValues.map(v => -v),  itemStyle: { color: '#3b82f6' }, barMaxWidth: 18 },
      { name: 'Female', type: 'bar', stack: 'total', data: femaleValues, itemStyle: { color: '#f43f5e' }, barMaxWidth: 18 },
    ],
  }), []);

  // ─── RACE/ETHNICITY STACKED BAR ───
  const raceYears = ['2015','2016','2017','2018','2019','2020','2021','2022','2023'];
  const raceOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, textStyle: { fontSize: 10 }, itemWidth: 12, itemHeight: 12 },
    grid: { left: 40, right: 20, top: 10, bottom: 60 },
    xAxis: { type: 'category', data: raceYears, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { formatter: v => `${v}k` } },
    series: [
      { name: 'Bugis',   type: 'bar', stack: 's', data: [22,23,24,25,26,27,28,29,30], itemStyle: { color: '#ef4444' } },
      { name: 'Jawa',    type: 'bar', stack: 's', data: [35,36,37,38,39,40,41,42,43], itemStyle: { color: '#3b82f6' } },
      { name: 'Toraja',  type: 'bar', stack: 's', data: [18,19,20,21,22,23,24,25,26], itemStyle: { color: '#22c55e' } },
      { name: 'Sunda',   type: 'bar', stack: 's', data: [12,12,13,13,14,14,15,15,16], itemStyle: { color: '#f59e0b' } },
      { name: 'Lainnya', type: 'bar', stack: 's', data: [8, 8, 9, 9,10,10,11,11,12],  itemStyle: { color: '#8b5cf6' } },
    ],
  }), []);

  // ─── INDUSTRIES TREEMAP ───
  const industriesTreemapOption = useMemo(() => ({
    tooltip: { formatter: p => `${p.name}<br/>${p.value.toLocaleString()} workers` },
    series: [{
      type: 'treemap', width: '100%', height: '100%',
      roam: false, nodeClick: false, breadcrumb: { show: false },
      label: { fontSize: 11, color: '#fff' },
      data: [
        { name: 'Agriculture',       value: 42000, itemStyle: { color: '#22c55e' } },
        { name: 'Manufacturing',     value: 38000, itemStyle: { color: '#3b82f6' } },
        { name: 'Trade & Commerce',  value: 31000, itemStyle: { color: '#f59e0b' } },
        { name: 'Government',        value: 28000, itemStyle: { color: '#ef4444' } },
        { name: 'Construction',      value: 22000, itemStyle: { color: '#8b5cf6' } },
        { name: 'Education',         value: 19000, itemStyle: { color: '#ec4899' } },
        { name: 'Healthcare',        value: 17000, itemStyle: { color: '#14b8a6' } },
        { name: 'Finance',           value: 13000, itemStyle: { color: '#f97316' } },
        { name: 'Transport',         value: 11000, itemStyle: { color: '#6366f1' } },
        { name: 'Other Services',    value: 9000,  itemStyle: { color: '#64748b' } },
      ],
    }],
  }), []);

  // ─── OCCUPATION HORIZONTAL BAR ───
  const occupationOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 160, right: 50, top: 10, bottom: 10 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', axisLabel: { fontSize: 10, width: 150, overflow: 'truncate' }, data: [
      'Managers','Sales Workers','Office & Admin','Service','Production',
      'Transport & Moving','Construction','Healthcare Support','Food Prep','Protective Service',
    ]},
    series: [{
      type: 'bar',
      data: [48200, 41500, 39800, 37200, 29400, 24100, 21600, 18700, 16300, 14800],
      itemStyle: { color: '#14b8a6' },
      label: { show: true, position: 'right', fontSize: 10, formatter: v => `${(v.value/1000).toFixed(0)}k` },
    }],
  }), []);

  // ─── WAGE DISTRIBUTION ───
  const wageBands = ['<Rp1Jt','Rp1-2Jt','Rp2-3Jt','Rp3-5Jt','Rp5-7Jt','Rp7-10Jt','>Rp10Jt'];
  const wageOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { fontSize: 10 } },
    grid: { left: 60, right: 20, top: 10, bottom: 40 },
    xAxis: { type: 'category', data: wageBands, axisLabel: { fontSize: 9, rotate: 20 } },
    yAxis: { type: 'value', axisLabel: { formatter: v => `${v}k` } },
    series: [
      { name: 'Male',   type: 'bar', stack: 'w', data: [4200,6800,9200,13400,9200,5200,3800], itemStyle: { color: '#3b82f6' } },
      { name: 'Female', type: 'bar', stack: 'w', data: [5800,8200,10600,14800,8400,3800,2200], itemStyle: { color: '#f43f5e' } },
    ],
  }), []);

  // ─── INCOME HISTORY LINE ───
  const incomeYears = ['2013','2014','2015','2016','2017','2018','2019','2020','2021','2022','2023'];
  const incomeOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 80, right: 20, top: 10, bottom: 30 },
    xAxis: { type: 'category', data: incomeYears, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { formatter: v => `Rp${(v/1000000).toFixed(1)}M` } },
    series: [{
      type: 'line', smooth: true,
      data: [3200000,3400000,3600000,3800000,4100000,4400000,4600000,4300000,4700000,5100000,5400000],
      lineStyle: { color: '#14b8a6', width: 2.5 },
      areaStyle: { color: 'rgba(20,184,166,0.15)' },
      itemStyle: { color: '#14b8a6' },
    }],
  }), []);

  // ─── CIVICS: ELECTION BAR ───
  const civicsOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { fontSize: 10 } },
    grid: { left: 70, right: 20, top: 10, bottom: 36 },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: v => `${v}%` } },
    yAxis: { type: 'category', data: ['2024','2019','2014','2009','2004'], axisLabel: { fontSize: 11 } },
    series: [
      { name: 'Prabowo / Koalisi Indonesia Maju', type: 'bar', stack: 'e', data: [58.6, 44.5, 46.9, 60.8, 60.6], itemStyle: { color: '#dc2626' } },
      { name: 'Ganjar / PDI-P',                  type: 'bar', stack: 'e', data: [16.5, 55.5, 53.1, 26.8, 26.2], itemStyle: { color: '#2563eb' } },
      { name: 'Anies / Koalisi Perubahan',        type: 'bar', stack: 'e', data: [24.9,  0.0,  0.0, 12.4, 13.2], itemStyle: { color: '#64748b' } },
    ],
  }), []);

  // ─── FOREIGN BORN LINE ───
  const migrantOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 56, right: 20, top: 10, bottom: 30 },
    xAxis: { type: 'category', data: incomeYears, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: v => `${v}%` } },
    series: [{
      type: 'line', smooth: true,
      data: [7.1, 7.3, 7.6, 7.9, 8.0, 8.1, 8.3, 8.4, 8.4, 8.5, 8.5],
      lineStyle: { color: '#27CBFC', width: 2.5 },
      areaStyle: { color: 'rgba(39,203,252,0.15)' },
      itemStyle: { color: '#27CBFC' },
    }],
  }), []);

  // ─── TRADE EXPORTS TREEMAP ───
  const tradeTreemapOption = useMemo(() => ({
    tooltip: { formatter: p => `${p.name}<br/>Rp${(p.value/1000).toFixed(0)}M` },
    series: [{
      type: 'treemap', width: '100%', height: '100%',
      roam: false, nodeClick: false, breadcrumb: { show: false },
      label: { fontSize: 11, color: '#fff' },
      data: [
        { name: 'Minyak Sawit',   value: 18000, itemStyle: { color: '#f59e0b' } },
        { name: 'Kakao',          value: 14000, itemStyle: { color: '#3b82f6' } },
        { name: 'Beras & Padi',   value: 11000, itemStyle: { color: '#22c55e' } },
        { name: 'Karet',          value: 8500,  itemStyle: { color: '#ef4444' } },
        { name: 'Kayu & Kertas',  value: 6200,  itemStyle: { color: '#8b5cf6' } },
        { name: 'Elektronik',     value: 5800,  itemStyle: { color: '#ec4899' } },
        { name: 'Mesin',          value: 4900,  itemStyle: { color: '#14b8a6' } },
        { name: 'Tekstil',        value: 3700,  itemStyle: { color: '#f97316' } },
      ],
    }],
  }), []);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══════════════════════════════════════════════════
          HERO — dark bg + landscape photo, centered title
      ══════════════════════════════════════════════════ */}
      <div className="relative bg-gray-900 overflow-hidden">
        {/* Photo background */}
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-black/90" />

        {/* Back nav */}
        <div className="relative z-10 px-4 md:px-8 pt-5">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition">
            <ArrowLeft size={16} />
            Back to Map
          </Link>
        </div>

        {/* Title */}
        <div className="relative z-10 text-center py-8 md:py-10 px-4 md:px-8">
          <p className="text-white/50 uppercase text-[10px] tracking-[0.3em] font-semibold mb-4">Kabupaten · Sulawesi Tengah</p>
          <div className="flex items-center justify-center gap-5">
            {kabupatenData?.logoUrl && (
              <img
                src={kabupatenData.logoUrl}
                alt={`Logo ${kabupatenName}`}
                className="w-14 h-14 md:w-20 md:h-20 object-contain drop-shadow-lg"
              />
            )}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase">{kabupatenName}</h1>
          </div>
          <p className="text-white/50 text-xs mt-4 uppercase tracking-[0.2em]">Indonesia · 2025 Profile</p>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 border-t border-white/10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-x divide-white/10 py-5 px-4 md:px-0">
            {[
              { label: '1-YR POPULATION CHANGE', value: '+2.1%',    sub: 'growth' },
              { label: 'MEDIAN HOUSEHOLD INCOME', value: 'Rp 4,5Jt', sub: 'per month' },
              { label: 'POPULATION',              value: '274,800', sub: '2025 estimate' },
              { label: 'POVERTY RATE',            value: '11.7%',   sub: '30,500 people' },
              { label: 'MEDIAN AGE',              value: '34.2',    sub: 'years' },
            ].map((s, i) => (
              <div key={i} className="px-5 text-center">
                <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">{s.label}</p>
                <p className="text-white text-xl font-bold mt-1">{s.value}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section nav tabs */}
        <div className="relative z-10 border-t border-white/10 bg-black/30">
          <div className="max-w-5xl mx-auto flex overflow-x-auto">
            {navSections.map(sec => (
              <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                className={`px-4 md:px-8 py-3 text-sm font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                  activeSection === sec.id ? 'text-white border-white' : 'text-white/40 border-transparent hover:text-white/70'
                }`}>
                {sec.label}
              </button>
            ))}
            <a href="#about" className="ml-auto px-4 md:px-8 py-3 text-white/40 hover:text-white/70 text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
              About
            </a>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          ABOUT — white bg, 2-col text + quick facts
      ══════════════════════════════════════════════════ */}
      <div id="about" className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-3 text-sm text-gray-700 leading-relaxed">
            <h2 className="text-base font-bold text-gray-900 mb-4">About</h2>
            <p>
              Kabupaten {kabupatenName} merupakan salah satu wilayah administratif di Sulawesi Tengah dengan karakteristik geografi yang unik, mencakup area pegunungan, dataran, dan pesisir. Wilayah ini memiliki kekayaan sumber daya alam yang signifikan, terutama di sektor pertanian, kehutanan, dan pertambangan.
            </p>
            <p>
              Perekonomian kabupaten bertumpu pada sektor primer dengan komoditas unggulan berupa kakao, padi, dan hasil hutan. Sektor sekunder dan tersier terus berkembang seiring investasi infrastruktur yang pesat dalam beberapa tahun terakhir.
            </p>
            <p>
              Dengan populasi sekitar 274.800 jiwa dan tingkat pertumbuhan 2,1% per tahun, {kabupatenName} menjadi salah satu kabupaten dengan dinamika kependudukan yang aktif di kawasan Indonesia Timur.
            </p>
          </div>
          <div>
            <div className="bg-white rounded border border-gray-200 p-4 text-xs space-y-2">
              <p className="font-bold text-gray-700 uppercase tracking-wide text-[10px] mb-3">Quick Facts</p>
              {[
                { k: 'Province',    v: 'Sulawesi Tengah' },
                { k: 'Area',        v: '~8,000 km²' },
                { k: 'Kecamatan',   v: '17 Sub-districts' },
                { k: 'Desa',        v: '176 Desa / Kelurahan' },
                { k: 'Ibukota',     v: `Kota ${kabupatenName}` },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between border-b border-gray-100 pb-1 last:border-0">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          POPULATION & DIVERSITY
      ══════════════════════════════════════════════════ */}
      {activeSection === 'population' && (
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-14">

          {/* Section header */}
          <div className="flex items-center gap-3 pb-2 border-b-2 border-teal-500">
            <div className="w-3 h-3 rounded-full bg-teal-500" />
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Population &amp; Diversity</h2>
          </div>

          {/* Population by Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Population by Location</h3>
              <div className="space-y-1 text-xs">
                {[
                  { name: 'Sigi Biromaru', pop: '41,200', pct: 15.0 },
                  { name: 'Dolo',          pop: '28,500', pct: 10.4 },
                  { name: 'Biromaru',      pop: '24,100', pct: 8.8  },
                  { name: 'Palolo',        pop: '21,800', pct: 7.9  },
                  { name: 'Tanambulava',   pop: '18,300', pct: 6.7  },
                ].map(r => (
                  <div key={r.name}>
                    <div className="flex justify-between py-1 border-b border-gray-100 text-gray-700">
                      <span>{r.name}</span>
                      <span className="font-semibold text-gray-900">{r.pop}</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 mt-0.5">
                      <div className="h-1 bg-teal-400" style={{ width: `${r.pct * 4}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 bg-gray-100 rounded-lg flex items-center justify-center h-52 text-gray-400 text-sm border border-gray-200 border-dashed">
              <span>[ District Choropleth Map ]</span>
            </div>
          </div>

          {/* Gender & Age Pyramid */}
          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-5">Residents by Gender &amp; Age</h3>
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="w-full md:w-40 space-y-5 md:shrink-0 pt-2">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest">Female</p>
                  <p className="text-3xl font-black text-[#27CBFC]">49.6%</p>
                  <p className="text-xs text-gray-500 mt-0.5">136,200 people</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest">Male</p>
                  <p className="text-3xl font-black text-teal-600">50.4%</p>
                  <p className="text-xs text-gray-500 mt-0.5">138,600 people</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest">Median Age</p>
                  <p className="text-3xl font-black text-gray-900">34.2</p>
                </div>
              </div>
              <div className="w-full h-60 md:h-80">
                <ReactECharts option={pyramidOption} style={{ height: '100%' }} />
              </div>
            </div>
          </div>

          {/* Citizenship */}
          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">Citizenship &amp; Origin</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Native Born</p>
                  <p className="text-3xl font-black text-teal-600">91.5%</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Migrants</p>
                  <p className="text-3xl font-black text-[#27CBFC]">8.5%</p>
                </div>
              </div>
              <div className="col-span-1 md:col-span-3">
                <div className="w-full bg-gray-200 rounded h-5 overflow-hidden flex">
                  <div className="h-5 bg-teal-500" style={{ width: '91.5%' }} />
                  <div className="h-5 bg-[#27CBFC] flex-1" />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>Native Born 91.5%</span>
                  <span>Migrants 8.5%</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Urban Population',    value: '58.2%' },
                    { label: 'Rural Population',    value: '41.8%' },
                    { label: 'Population Density',  value: '34/km²' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 border border-gray-200 p-3 rounded text-xs">
                      <p className="text-gray-500 text-[9px] uppercase">{s.label}</p>
                      <p className="font-bold text-gray-900 text-base mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Diversity */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Diversity</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-[9px] text-gray-500 uppercase mb-3">Ethnic Groups Over Time</p>
                <div className="h-60">
                  <ReactECharts option={raceOption} style={{ height: '100%' }} />
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase mb-3">Composition 2025</p>
                <div className="space-y-2.5">
                  {[
                    { name: 'Bugis',   pct: 35.2, color: '#ef4444' },
                    { name: 'Jawa',    pct: 28.1, color: '#3b82f6' },
                    { name: 'Toraja',  pct: 18.4, color: '#22c55e' },
                    { name: 'Sunda',   pct: 10.6, color: '#f59e0b' },
                    { name: 'Lainnya', pct: 7.7,  color: '#8b5cf6' },
                  ].map(e => (
                    <div key={e.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700">{e.name}</span>
                        <span className="font-semibold">{e.pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded h-3">
                        <div className="h-3 rounded" style={{ width: `${e.pct}%`, backgroundColor: e.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Migrants trend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#27CBFC]" />
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Migrants</h3>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase">Share of Population</p>
                  <p className="text-3xl font-black text-[#27CBFC]">8.5%</p>
                <p className="text-xs text-gray-500 mt-1">≈ 23,358 people</p>
              </div>
              <div className="text-xs text-gray-600 space-y-1 pt-2">
                <p>• East Java origin: 42%</p>
                <p>• South Sulawesi: 28%</p>
                <p>• Other regions: 30%</p>
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 h-48">
              <p className="text-[9px] text-gray-500 uppercase mb-2">Migrant Share Trend (%)</p>
              <ReactECharts option={migrantOption} style={{ height: '100%' }} />
            </div>
          </div>

          {/* Languages */}
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Languages at Home</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { lang: 'Bahasa Indonesia', pct: '72.1%', color: '#ef4444' },
                { lang: 'Bugis',            pct: '12.4%', color: '#3b82f6' },
                { lang: 'Jawa',             pct: '9.1%',  color: '#22c55e' },
                { lang: 'Toraja',           pct: '6.4%',  color: '#f59e0b' },
              ].map(l => (
                <div key={l.lang} className="text-center">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: l.color }}>
                    {l.pct.replace('%','')}%
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{l.lang}</p>
                  <p className="text-sm font-bold text-gray-900">{l.pct}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ECONOMY
      ══════════════════════════════════════════════════ */}
      {activeSection === 'economy' && (
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-14">

          <div className="flex items-center gap-3 pb-2 border-b-2 border-[#27CBFC]">
            <div className="w-3 h-3 rounded-full bg-[#27CBFC]" />
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Economy</h2>
          </div>

          {/* Employment overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Employment</h3>
              <div>
                <p className="text-[9px] text-gray-500 uppercase">Employed Population</p>
                <p className="text-3xl font-black text-[#27CBFC]">126,240</p>
                <p className="text-xs text-[#27CBFC] mt-0.5">+1.8% 1-year growth</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase">Unemployment Rate</p>
                <p className="text-2xl font-black text-gray-900">3.82%</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase">Labor Force Participation</p>
                <p className="text-2xl font-black text-gray-900">59.4%</p>
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <p className="text-[9px] text-gray-500 uppercase mb-2">Workers by Industry</p>
              <div className="h-64">
                <ReactECharts option={industriesTreemapOption} style={{ height: '100%' }} />
              </div>
            </div>
          </div>

          {/* Industry cards */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Top Industries</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Agriculture, Forestry & Fishing', workers: '42,000', share: '33.3%', color: '#22c55e' },
                { name: 'Manufacturing & Processing',      workers: '38,000', share: '30.2%', color: '#3b82f6' },
                { name: 'Trade & Commerce',                workers: '31,000', share: '24.6%', color: '#f59e0b' },
              ].map(ind => (
                <div key={ind.name} className="border border-gray-200 rounded-lg p-4">
                  <div className="w-full h-1 rounded mb-3" style={{ backgroundColor: ind.color }} />
                  <p className="text-xs font-semibold text-gray-800">{ind.name}</p>
                  <p className="text-2xl font-black text-gray-900 mt-2">{ind.workers}</p>
                  <p className="text-xs text-gray-500">{ind.share} of workforce</p>
                </div>
              ))}
            </div>
          </div>

          {/* Occupations */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Top Occupations</h3>
            </div>
            <div className="h-64">
              <ReactECharts option={occupationOption} style={{ height: '100%' }} />
            </div>
          </div>

          {/* Income history */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Household Income History</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Median Household Income</p>
                  <p className="text-3xl font-black text-teal-600">Rp 4,5Jt</p>
                  <p className="text-xs text-gray-500 mt-0.5">per month (2025)</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Gini Coefficient</p>
                  <p className="text-2xl font-black text-gray-900">0.412</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Poverty Rate</p>
                  <p className="text-2xl font-black text-red-600">11.7%</p>
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 h-48">
                <ReactECharts option={incomeOption} style={{ height: '100%' }} />
              </div>
            </div>
          </div>

          {/* Wage distribution */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Wage Distribution by Gender</h3>
            </div>
            <div className="h-60">
              <ReactECharts option={wageOption} style={{ height: '100%' }} />
            </div>
          </div>

          {/* Trade exports */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Trade &amp; Exports</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Total Exports</p>
                  <p className="text-3xl font-black text-teal-600">$127M</p>
                  <p className="text-xs text-gray-500 mt-0.5">USD estimate (2024)</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Top Export Commodity</p>
                  <p className="text-xl font-black text-gray-900">Minyak Sawit</p>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Main partner: Jawa (62%)</p>
                  <p>• Export growth: +8.4% YoY</p>
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 h-48">
                <ReactECharts option={tradeTreemapOption} style={{ height: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          CIVICS
      ══════════════════════════════════════════════════ */}
      {activeSection === 'civics' && (
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-14">

          <div className="flex items-center gap-3 pb-2 border-b-2 border-teal-800">
            <div className="w-3 h-3 rounded-full bg-teal-800" />
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Civics</h2>
          </div>

          {/* Local government */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Bupati',       value: 'M. Rizal Intjenae', sub: 'Incumbent since 2021' },
              { label: 'Wakil Bupati', value: 'S. Yansen Pongi',  sub: 'Incumbent since 2021' },
              { label: 'DPRD Members', value: '30',                sub: 'Regional Parliament seats' },
            ].map(g => (
              <div key={g.label} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest">{g.label}</p>
                <p className="text-base font-bold text-gray-900 mt-1">{g.value}</p>
                <p className="text-xs text-gray-500 mt-1">{g.sub}</p>
              </div>
            ))}
          </div>

          {/* Presidential elections */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-600" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Presidential Elections</h3>
            </div>
            <div className="h-56">
              <ReactECharts option={civicsOption} style={{ height: '100%' }} />
            </div>
            <div className="flex gap-6 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-600 inline-block"/><span>Prabowo coalition</span></span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600 inline-block"/><span>PDI-P / Jokowi coalition</span></span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-500 inline-block"/><span>Other candidates</span></span>
            </div>
          </div>

          {/* APBD Budget */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-600" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">APBD 2025</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total APBD',  value: 'Rp 1,42T', color: 'text-teal-700' },
                { label: 'Pendapatan', value: 'Rp 1,38T', color: 'text-green-600' },
                { label: 'Belanja',    value: 'Rp 1,45T', color: 'text-red-600'   },
                { label: 'Transfer',   value: 'Rp 0,89T', color: 'text-teal-600'  },
              ].map(b => (
                <div key={b.label} className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest">{b.label}</p>
                  <p className={`text-xl font-black mt-2 ${b.color}`}>{b.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Public services */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Public Services</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              {[
                { category: 'Education',       items: ['284 Public Schools','67 Private Schools','12 Universities','156K Students enrolled'] },
                { category: 'Healthcare',      items: ['8 Hospitals','45 Puskesmas','130+ Clinics','2,340 Healthcare workers'] },
                { category: 'Infrastructure',  items: ['340 km Roads','18 Bridges','6 Dams / Reservoirs','72% Electrification rate'] },
              ].map(s => (
                <div key={s.category}>
                  <p className="font-bold text-gray-900 mb-2 text-xs uppercase tracking-wide">{s.category}</p>
                  <ul className="space-y-1 text-xs text-gray-600">
                    {s.items.map(i => <li key={i}>• {i}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <div className="bg-gray-900 text-white px-4 md:px-8 py-8 mt-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="font-bold text-sm">Kabupaten {kabupatenName} Profile</p>
            <p className="text-white/50 text-xs mt-1">Data sources: BPS, Pemerintah Daerah, Indonesia Open Data</p>
          </div>
          <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition">
            <ArrowLeft size={16} />
            Back to Map
          </Link>
        </div>
      </div>
    </div>
  );
}

