import React from 'react';
import { ArrowLeft, BarChart3, Users, FileText, Stethoscope, Calendar } from 'lucide-react';
import { Patient, InitialHistory, SubsequentConsult } from '../types';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

// Simplified Report Screen - Fast loading, no external dependencies
export const ReportScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [histories, setHistories] = React.useState<InitialHistory[]>([]);
  const [consults, setConsults] = React.useState<SubsequentConsult[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Load only patients first for faster initial render
        const p = await api.getPatients();
        setPatients(p);
        setLoading(false);

        // Load histories and consults in background
        const [h, c] = await Promise.all([
          api.getHistories(),
          api.getConsults()
        ]);
        setHistories(h);
        setConsults(c);
      } catch (e) {
        console.error("Error loading report data", e);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate stats
  const totalPatients = patients.length;
  const totalHistories = histories.length;
  const totalConsults = consults.length;

  // Gender stats
  const maleCount = patients.filter(p => p.sex === 'Masculino').length;
  const femaleCount = patients.filter(p => p.sex === 'Femenino').length;

  // Age distribution
  const ageGroups: Record<string, number> = { '0-18': 0, '19-30': 0, '31-50': 0, '51+': 0 };
  patients.forEach(p => {
    if (!p.ageDetails) return;
    const age = parseInt(p.ageDetails.split(' ')[0]) || 0;
    if (age <= 18) ageGroups['0-18']++;
    else if (age <= 30) ageGroups['19-30']++;
    else if (age <= 50) ageGroups['31-50']++;
    else ageGroups['51+']++;
  });

  // Patients seen this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const patientsSeenThisMonth = new Set([
    ...histories.filter(h => {
      const d = new Date(h.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).map(h => h.patientId),
    ...consults.filter(c => {
      const d = new Date(c.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).map(c => c.patientId)
  ]).size;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/app/home')} className="bg-white border border-gray-200 p-3 rounded-xl hover:bg-gray-50 text-gray-600 shadow-sm transition-all">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="text-blue-600" /> Reportes
        </h2>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="p-3 bg-blue-50 rounded-xl w-fit mb-4">
            <Users className="text-blue-600" size={24} />
          </div>
          <p className="text-gray-500 text-sm font-medium">Total Pacientes</p>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{totalPatients}</h3>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="p-3 bg-purple-50 rounded-xl w-fit mb-4">
            <FileText className="text-purple-600" size={24} />
          </div>
          <p className="text-gray-500 text-sm font-medium">Historias Clínicas</p>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{totalHistories}</h3>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="p-3 bg-indigo-50 rounded-xl w-fit mb-4">
            <Stethoscope className="text-indigo-600" size={24} />
          </div>
          <p className="text-gray-500 text-sm font-medium">Consultas Totales</p>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{totalConsults}</h3>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="p-3 bg-green-50 rounded-xl w-fit mb-4">
            <Calendar className="text-green-600" size={24} />
          </div>
          <p className="text-gray-500 text-sm font-medium">Atendidos Este Mes</p>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{patientsSeenThisMonth}</h3>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Distribución por Sexo</h3>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-8 border-blue-500 flex items-center justify-center mb-3">
                <span className="text-xl md:text-2xl font-bold text-gray-800">{totalPatients > 0 ? Math.round((maleCount / totalPatients) * 100) : 0}%</span>
              </div>
              <p className="font-medium text-gray-600">Masculino</p>
              <p className="text-sm text-gray-400">{maleCount} pacientes</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-8 border-pink-500 flex items-center justify-center mb-3">
                <span className="text-xl md:text-2xl font-bold text-gray-800">{totalPatients > 0 ? Math.round((femaleCount / totalPatients) * 100) : 0}%</span>
              </div>
              <p className="font-medium text-gray-600">Femenino</p>
              <p className="text-sm text-gray-400">{femaleCount} pacientes</p>
            </div>
          </div>
        </div>

        {/* Age Groups */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Grupos Etarios</h3>
          <div className="space-y-4">
            {Object.entries(ageGroups).map(([range, count]) => (
              <div key={range}>
                <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                  <span>{range} años</span>
                  <span>{count} ({totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${totalPatients > 0 ? (count / totalPatients) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
