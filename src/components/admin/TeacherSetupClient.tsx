'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, CheckCircle, XCircle } from 'lucide-react';

export default function TeacherSetupClient() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    syncedTeacherId: '',
    email: '',
    password: '',
    gradeLevel: 'Grade 1',
    subjectId: '',
    academicYearId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, subjectsRes] = await Promise.all([
        fetch('/api/sync/teachers').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
      ]);
      
      // Get synced teachers without user accounts
      const syncedTeachers = await fetch('/api/admin/users').then(r => r.json());
      const teacherUserIds = syncedTeachers.filter((u: any) => u.role === 'TEACHER').map((u: any) => u.syncedTeacherId);
      
      const availableTeachers = teachersRes.filter((t: any) => !teacherUserIds.includes(t.id));
      
      setTeachers(availableTeachers);
      setSubjects(subjectsRes);
      
      // Mock academic year - should fetch from API
      setYears([{ id: 'current', name: '2024/25' }]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/setup-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncedTeacherId: formData.syncedTeacherId,
          email: formData.email,
          password: formData.password,
          assignments: [{
            gradeLevel: formData.gradeLevel,
            subjectId: formData.subjectId,
            academicYearId: formData.academicYearId || years[0]?.id,
          }],
        }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setFormData({
          syncedTeacherId: '',
          email: '',
          password: '',
          gradeLevel: 'Grade 1',
          subjectId: '',
          academicYearId: '',
        });
        fetchData(); // Refresh list
      }
    } catch (error) {
      setResult({ error: 'Failed to setup teacher' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Teacher Setup</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Create login accounts for synced teachers</p>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Teacher</label>
            <select
              value={formData.syncedTeacherId}
              onChange={(e) => setFormData({ ...formData, syncedTeacherId: e.target.value })}
              className="w-full px-3 py-2 border border-input bg-transparent text-foreground rounded-lg"
              required
            >
              <option value="">-- Select Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-input bg-transparent text-foreground rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-input bg-transparent text-foreground rounded-lg"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Grade Level</label>
            <select
              value={formData.gradeLevel}
              onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
              className="w-full px-3 py-2 border border-input bg-transparent text-foreground rounded-lg"
              required
            >
              <option>Playgroup</option>
              <option>KG</option>
              <option>Grade 1</option>
              <option>Grade 2</option>
              <option>Grade 3</option>
              <option>Grade 4</option>
              <option>Grade 5</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full px-3 py-2 border border-input bg-transparent text-foreground rounded-lg"
              required
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Setting up...' : 'Setup Teacher Account'}
          </button>
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-lg ${
              result.success
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-emerald-900">Teacher account created successfully!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-900">{result.error}</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Next Steps</h3>
        <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
          <li>Teacher can login at /login with the email/password</li>
          <li>Admin must create Evaluation Templates for subjects</li>
          <li>Teacher can enter marks in Mark Entry section</li>
          <li>Teacher submits marks for admin verification</li>
        </ol>
      </div>
    </motion.div>
  );
}
