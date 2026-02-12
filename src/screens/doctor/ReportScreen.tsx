import React from 'react';
import { ArrowLeft, BarChart3, Users, UserCheck, Clock, Calendar, Activity, Brain, Stethoscope, TrendingUp, PieChart, AlertTriangle, Shield } from 'lucide-react';
import { Patient, InitialHistory, SubsequentConsult } from '../../types';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Status definitions (matching PatientListScreen)
const ACTIVE_STATUSES = ['paciente', 'activo', ''];
const PROCESS_STATUSES = ['proceso1', 'proceso2', 'proceso3'];

// Helper: Get sex from patient (handles both 'sex' and 'gender' fields from migration)
const getPatientSex = (p: any): string => {
  const val = (p.sex || p.gender || '').toString().trim().toLowerCase();
  if (val === 'masculino' || val === 'male' || val === 'm') return 'masculino';
  if (val === 'femenino' || val === 'female' || val === 'f') return 'femenino';
  return '';
};

// Helper: Calculate age from birthDate (handles string, Date, or Firestore Timestamp)
const calculateAge = (birthDate: any): number => {
  if (!birthDate) return -1;
  try {
    let birth: Date;
    if (typeof birthDate === 'string') {
      birth = new Date(birthDate);
    } else if (birthDate instanceof Date) {
      birth = birthDate;
    } else if (birthDate.toDate && typeof birthDate.toDate === 'function') {
      // Firestore Timestamp
      birth = birthDate.toDate();
    } else if (birthDate.seconds) {
      // Already normalized Timestamp -> string by docToData - try parsing
      birth = new Date(birthDate);
    } else {
      birth = new Date(String(birthDate));
    }
    if (isNaN(birth.getTime())) return -1;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : -1;
  } catch {
    return -1;
  }
};

// Helper: Extract truthy items from various migrated data formats
// Migration stores antecedentes as {yes: boolean, list: string, other: string}
// New app stores as {yes: boolean, no: boolean, conditions: CheckboxData, other: string}
const extractYesNo = (field: any): { isYes: boolean; items: string[] } => {
  if (!field) return { isYes: false, items: [] };
  const isYes = field.yes === true;
  const items: string[] = [];

  // Handle 'conditions' (new app format: CheckboxData)
  if (field.conditions && typeof field.conditions === 'object') {
    Object.entries(field.conditions).forEach(([k, v]) => {
      if (v === true) items.push(k);
    });
  }
  // Handle 'list' as CheckboxData or comma-separated string
  if (field.list) {
    if (typeof field.list === 'object') {
      Object.entries(field.list).forEach(([k, v]) => {
        if (v === true) items.push(k);
      });
    } else if (typeof field.list === 'string' && field.list.trim()) {
      field.list.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((s: string) => {
        if (!items.includes(s)) items.push(s);
      });
    }
  }
  if (field.other && typeof field.other === 'string' && field.other.trim()) {
    items.push(field.other.trim());
  }
  return { isYes, items };
};

// Aggregate motives from CheckboxData or string-based motives
const extractMotives = (record: any): string[] => {
  if (!record.motives) return [];
  const motives: string[] = [];
  if (typeof record.motives === 'object') {
    Object.entries(record.motives).forEach(([k, v]) => {
      if (v === true) motives.push(k);
    });
  }
  return motives;
};

// Animated stat card
const StatCard = ({ icon: Icon, label, value, color, bgColor, animDelay = 0 }: {
  icon: any; label: string; value: string | number; color: string; bgColor: string; animDelay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: animDelay, duration: 0.4 }}
    className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
  >
    <div className={`p-3 ${bgColor} rounded-xl w-fit mb-4`}>
      <Icon className={color} size={24} />
    </div>
    <p className="text-gray-500 text-sm font-medium">{label}</p>
    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{value}</h3>
  </motion.div>
);

// Progress bar
const ProgressBar = ({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
        <span className="truncate mr-2">{label}</span>
        <span className="text-gray-500 whitespace-nowrap">{count} ({pct}%)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`${color} h-2.5 rounded-full`}
        />
      </div>
    </div>
  );
};

export const ReportScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [histories, setHistories] = React.useState<InitialHistory[]>([]);
  const [consults, setConsults] = React.useState<SubsequentConsult[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Load ALL data in parallel using optimized endpoints (3 queries total, all cached)
        const [p, h, c] = await Promise.all([
          api.getPatients(),
          api.getAllHistoriesFlat(),
          api.getAllConsultsFlat()
        ]);
        setPatients(p);
        setHistories(h);
        setConsults(c);
      } catch (e) {
        console.error("Error loading report data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ==================== STATS CALCULATION ====================

  // Active vs Pending counts
  const totalActiveCount = patients.filter(p => {
    const status = (p.registrationStatus || '').toLowerCase();
    return ACTIVE_STATUSES.includes(status);
  }).length;

  const totalPendingCount = patients.filter(p => {
    const status = (p.registrationStatus || '').toLowerCase();
    return PROCESS_STATUSES.includes(status);
  }).length;

  // Gender stats - check BOTH 'sex' and 'gender' fields
  const maleCount = patients.filter(p => getPatientSex(p) === 'masculino').length;
  const femaleCount = patients.filter(p => getPatientSex(p) === 'femenino').length;
  const unknownSexCount = patients.length - maleCount - femaleCount;

  // Age distribution from birthDate
  const ageGroups: Record<string, number> = { '0-18': 0, '19-30': 0, '31-50': 0, '51-70': 0, '71+': 0 };
  let patientsWithAge = 0;
  patients.forEach(p => {
    const age = calculateAge(p.birthDate);
    if (age >= 0) {
      patientsWithAge++;
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 30) ageGroups['19-30']++;
      else if (age <= 50) ageGroups['31-50']++;
      else if (age <= 70) ageGroups['51-70']++;
      else ageGroups['71+']++;
    }
  });

  // Patients seen this month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const isThisMonth = (dateStr: any) => {
    try {
      const d = new Date(String(dateStr));
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    } catch { return false; }
  };
  const patientsSeenThisMonth = new Set([
    ...histories.filter(h => isThisMonth(h.date)).map(h => h.patientId),
    ...consults.filter(c => isThisMonth(c.date)).map(c => c.patientId)
  ]).size;

  // ==================== CLINICAL ANALYTICS ====================
  const totalHistories = histories.length;
  const totalConsults = consults.length;
  const totalClinical = totalHistories + totalConsults;

  // Motivos de Consulta (from both histories and consults)
  const allMotiveCounts: Record<string, number> = {};
  [...histories, ...consults].forEach(record => {
    const motives = extractMotives(record);
    motives.forEach(m => {
      allMotiveCounts[m] = (allMotiveCounts[m] || 0) + 1;
    });
  });
  const sortedMotives = Object.entries(allMotiveCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);

  // Antecedentes Médicos Personales
  const antecedentFields: { key: string; label: string; path: (h: any) => any }[] = [
    { key: 'neurological', label: 'Neurológicas', path: h => h.neurological },
    { key: 'metabolic', label: 'Metabólicas', path: h => h.metabolic },
    { key: 'respiratory', label: 'Respiratorias', path: h => h.respiratory },
    { key: 'cardiac', label: 'Cardíacas', path: h => h.cardiac },
    { key: 'gastro', label: 'Gastrointestinales', path: h => h.gastro },
    { key: 'hepato', label: 'Hepatobiliopancreáticas', path: h => h.hepato },
    { key: 'peripheral', label: 'Arterias/Venas', path: h => h.peripheral },
    { key: 'hematological', label: 'Hematológicas', path: h => h.hematological },
    { key: 'renal', label: 'Renourinarias', path: h => h.renal },
    { key: 'rheumatological', label: 'Reumatológicas', path: h => h.rheumatological },
    { key: 'infectious', label: 'Infecciosas', path: h => h.infectious },
    { key: 'psychiatric', label: 'Psiquiátricas', path: h => h.psychiatric },
  ];

  const antecedentes: Record<string, { yes: number; total: number }> = {};
  histories.forEach(h => {
    antecedentFields.forEach(({ key, path }) => {
      const field = path(h);
      if (field) {
        if (!antecedentes[key]) antecedentes[key] = { yes: 0, total: 0 };
        antecedentes[key].total++;
        const { isYes } = extractYesNo(field);
        if (isYes) antecedentes[key].yes++;
      }
    });
  });

  // Pre-existing diseases
  const preExistingYes = histories.filter(h => {
    const pe = h.preExistingDiseases as any;
    return pe?.yes === true;
  }).length;

  // Allergies
  const allergyCounts: Record<string, number> = {};
  histories.forEach(h => {
    const { items } = extractYesNo(h.allergies);
    items.forEach(a => { allergyCounts[a] = (allergyCounts[a] || 0) + 1; });
  });
  const sortedAllergies = Object.entries(allergyCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Family History
  const familyHistoryCounts: Record<string, number> = {};
  histories.forEach(h => {
    const { items } = extractYesNo(h.familyHistory);
    items.forEach(f => { familyHistoryCounts[f] = (familyHistoryCounts[f] || 0) + 1; });
  });
  const sortedFamilyHistory = Object.entries(familyHistoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Food Intolerances
  const intoleranceCounts: Record<string, number> = {};
  histories.forEach(h => {
    const fi = (h as any).foodIntolerances;
    const { items } = extractYesNo(fi);
    items.forEach(f => { intoleranceCounts[f] = (intoleranceCounts[f] || 0) + 1; });
  });
  const sortedIntolerances = Object.entries(intoleranceCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Habits
  const habitCounts: Record<string, number> = {};
  histories.forEach(h => {
    const { items } = extractYesNo(h.habits);
    items.forEach(hab => { habitCounts[hab] = (habitCounts[hab] || 0) + 1; });
  });
  const sortedHabits = Object.entries(habitCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // IMC Distribution
  const imcDistribution: Record<string, number> = {
    'Bajo peso (<18.5)': 0,
    'Normal (18.5-24.9)': 0,
    'Sobrepeso (25-29.9)': 0,
    'Obesidad I (30-34.9)': 0,
    'Obesidad II (35-39.9)': 0,
    'Obesidad III (≥40)': 0
  };
  let imcCount = 0;
  [...histories, ...consults].forEach(record => {
    const exam = (record as any).physicalExam;
    if (!exam) return;
    const imc = parseFloat(exam.imc);
    if (isNaN(imc) || imc <= 0) return;
    imcCount++;
    if (imc < 18.5) imcDistribution['Bajo peso (<18.5)']++;
    else if (imc < 25) imcDistribution['Normal (18.5-24.9)']++;
    else if (imc < 30) imcDistribution['Sobrepeso (25-29.9)']++;
    else if (imc < 35) imcDistribution['Obesidad I (30-34.9)']++;
    else if (imc < 40) imcDistribution['Obesidad II (35-39.9)']++;
    else imcDistribution['Obesidad III (≥40)']++;
  });

  // Colors for progress bars
  const barColors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-rose-500',
    'bg-violet-500', 'bg-lime-500', 'bg-fuchsia-500'
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/app/home')} className="bg-white border border-gray-200 p-3 rounded-xl hover:bg-gray-50 text-gray-600 shadow-sm transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="text-blue-600" /> Reportes y Analítica Clínica
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {totalHistories} historias clínicas · {totalConsults} consultas subsecuentes · {patients.length} pacientes registrados
          </p>
        </div>
      </div>

      {/* ==================== MAIN STATS CARDS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard icon={UserCheck} label="Total Pacientes Activos" value={totalActiveCount} color="text-blue-600" bgColor="bg-blue-50" animDelay={0} />
        <StatCard icon={Clock} label="Total Pacientes Pendientes" value={totalPendingCount} color="text-amber-600" bgColor="bg-amber-50" animDelay={0.1} />
        <StatCard icon={Calendar} label="Atendidos Este Mes" value={patientsSeenThisMonth} color="text-green-600" bgColor="bg-green-50" animDelay={0.2} />
        <StatCard icon={Users} label="Total General" value={patients.length} color="text-purple-600" bgColor="bg-purple-50" animDelay={0.3} />
      </div>

      {/* ==================== DEMOGRAPHICS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gender Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-blue-500" /> Distribución por Sexo
          </h3>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-8 border-blue-500 flex items-center justify-center mb-3">
                <span className="text-xl md:text-2xl font-bold text-gray-800">
                  {patients.length > 0 ? Math.round((maleCount / patients.length) * 100) : 0}%
                </span>
              </div>
              <p className="font-medium text-gray-600">Masculino</p>
              <p className="text-sm text-gray-400">{maleCount} pacientes</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-8 border-pink-500 flex items-center justify-center mb-3">
                <span className="text-xl md:text-2xl font-bold text-gray-800">
                  {patients.length > 0 ? Math.round((femaleCount / patients.length) * 100) : 0}%
                </span>
              </div>
              <p className="font-medium text-gray-600">Femenino</p>
              <p className="text-sm text-gray-400">{femaleCount} pacientes</p>
            </div>
            {unknownSexCount > 0 && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-8 border-gray-300 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-gray-600">
                    {Math.round((unknownSexCount / patients.length) * 100)}%
                  </span>
                </div>
                <p className="font-medium text-gray-500">Sin dato</p>
                <p className="text-sm text-gray-400">{unknownSexCount}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Age Groups */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-500" /> Grupos Etarios
          </h3>
          <p className="text-xs text-gray-400 mb-4">{patientsWithAge} pacientes con fecha de nacimiento registrada</p>
          <div className="space-y-4">
            {Object.entries(ageGroups).map(([range, count], i) => (
              <ProgressBar key={range} label={`${range} años`} count={count} total={patientsWithAge} color={barColors[i % barColors.length]} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ==================== CLINICAL ANALYTICS ==================== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <Activity className="text-green-600" /> Analítica Clínica
        </h2>
        <p className="text-gray-500 text-sm">
          Datos combinados de {totalHistories} historias clínicas migradas/nuevas y {totalConsults} consultas subsecuentes
        </p>
      </motion.div>

      {/* Motivos de Consulta + IMC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Stethoscope size={20} className="text-purple-500" /> Motivos de Consulta
          </h3>
          <p className="text-xs text-gray-400 mb-4">Top 15 de {totalClinical} registros clínicos</p>
          {sortedMotives.length > 0 ? (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {sortedMotives.map(([motive, count], i) => (
                <ProgressBar key={motive} label={motive} count={count} total={totalClinical} color={barColors[i % barColors.length]} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos de motivos de consulta</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Activity size={20} className="text-orange-500" /> Distribución de IMC
          </h3>
          <p className="text-xs text-gray-400 mb-4">Clasificación OMS de {imcCount} registros</p>
          {imcCount > 0 ? (
            <div className="space-y-3">
              {Object.entries(imcDistribution).map(([label, count], i) => (
                <ProgressBar key={label} label={label} count={count} total={imcCount}
                  color={['bg-blue-400', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-red-700'][i]} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos de IMC</p>
          )}
        </motion.div>
      </div>

      {/* Antecedentes Médicos Personales + Alergias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Brain size={20} className="text-teal-500" /> Antecedentes Médicos Personales
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {preExistingYes} de {totalHistories} pacientes reportan enfermedades preexistentes
            ({totalHistories > 0 ? Math.round((preExistingYes / totalHistories) * 100) : 0}%)
          </p>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {antecedentFields.map(({ key, label }, i) => {
              const data = antecedentes[key];
              if (!data || data.total === 0) return null;
              return <ProgressBar key={key} label={label} count={data.yes} total={data.total} color={barColors[i % barColors.length]} />;
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" /> Alergias Reportadas
          </h3>
          <p className="text-xs text-gray-400 mb-4">Frecuencia en {totalHistories} historias clínicas</p>
          {sortedAllergies.length > 0 ? (
            <div className="space-y-3">
              {sortedAllergies.map(([allergy, count], i) => (
                <ProgressBar key={allergy} label={allergy} count={count} total={totalHistories} color={barColors[(i + 4) % barColors.length]} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos de alergias</p>
          )}
        </motion.div>
      </div>

      {/* Family History, Intolerances, Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={18} className="text-indigo-500" /> Antecedentes Familiares
          </h3>
          {sortedFamilyHistory.length > 0 ? (
            <div className="space-y-3">
              {sortedFamilyHistory.map(([item, count], i) => (
                <ProgressBar key={item} label={item} count={count} total={totalHistories} color={barColors[(i + 2) % barColors.length]} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">Sin datos</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Intolerancias Alimentarias
          </h3>
          {sortedIntolerances.length > 0 ? (
            <div className="space-y-3">
              {sortedIntolerances.map(([item, count], i) => (
                <ProgressBar key={item} label={item} count={count} total={totalHistories} color={barColors[(i + 6) % barColors.length]} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">Sin datos</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-rose-500" /> Hábitos
          </h3>
          {sortedHabits.length > 0 ? (
            <div className="space-y-3">
              {sortedHabits.map(([item, count], i) => (
                <ProgressBar key={item} label={item} count={count} total={totalHistories} color={barColors[(i + 8) % barColors.length]} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">Sin datos</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};
