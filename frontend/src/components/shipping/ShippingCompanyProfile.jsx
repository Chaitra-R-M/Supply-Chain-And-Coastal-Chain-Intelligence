import React, { useState } from 'react';
import { Building2, Edit3, Mail, MapPin, Phone, Plus, Ship, User, X } from 'lucide-react';

const initProfile = {
  name: 'India Coastal Shipping Ltd',
  registration: 'CIN-U61100MH2008PLC182340',
  address: '5th Floor, Maritime House, BKC, Mumbai – 400051',
  phone: '+91-22-6612 9000',
  email: 'operations@indiashipping.in',
  website: 'www.indiashipping.in',
  fleet_size: 8,
  established: '2008',
};

const initEmployees = [
  { id: 1, name: 'Capt. Arjun Sharma',  role: 'Fleet Manager',       email: 'fleet@indiashipping.in',  phone: '+91-98201-00001', active: true },
  { id: 2, name: 'Mgr. Deepa Krishnan', role: 'Operations Manager',  email: 'ops@coastallines.in',     phone: '+91-98201-00002', active: true },
  { id: 3, name: 'Eng. Suresh Babu',    role: 'Marine Engineer',      email: 'eng@indiashipping.in',    phone: '+91-98201-00003', active: true },
  { id: 4, name: 'Ms. Priya Nair',       role: 'Port Liaison Officer', email: 'liaison@indiashipping.in',phone: '+91-98201-00004', active: false },
];

const vessels = [
  { name: 'MV Bharat',       type: 'Bulk Carrier',   imo: 'IMO9234561', status: 'En Route'   },
  { name: 'SS Konkan',        type: 'Container',       imo: 'IMO8876543', status: 'At Berth'   },
  { name: 'MV Malabar',       type: 'Tanker',          imo: 'IMO7654321', status: 'Anchored'   },
  { name: 'MV Sahyadri',      type: 'General Cargo',   imo: 'IMO6543219', status: 'Delayed'    },
  { name: 'MV Coastal Queen', type: 'General Cargo',   imo: 'IMO5432198', status: 'Docked'     },
  { name: 'MV Deccan Star',   type: 'Container',       imo: 'IMO4321987', status: 'En Route'   },
  { name: 'MV Indian Ocean',  type: 'Bulk Carrier',    imo: 'IMO3219876', status: 'Maintenance'},
  { name: 'MV Western Ghats', type: 'Tanker',          imo: 'IMO2198765', status: 'En Route'   },
];

const STATUS_DOT = {
  'En Route': 'bg-emerald-500', 'At Berth': 'bg-ink-black-500',
  Anchored: 'bg-eggshell-500', Delayed: 'bg-rose-500',
  Docked: 'bg-blue-slate-500', Maintenance: 'bg-dusty-denim-400',
};

export default function ShippingCompanyProfile() {
  const [profile, setProfile]       = useState(initProfile);
  const [employees, setEmployees]   = useState(initEmployees);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm]       = useState({ ...initProfile });
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [empForm, setEmpForm]       = useState({ name:'', role:'', email:'', phone:'' });
  const [toast, setToast]           = useState('');

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const saveProfile = (e) => {
    e.preventDefault();
    setProfile({ ...profileForm });
    setEditingProfile(false);
    showToast('Company profile updated');
  };

  const addEmployee = (e) => {
    e.preventDefault();
    setEmployees((prev) => [...prev, { id: Date.now(), ...empForm, active: true }]);
    setShowAddEmp(false);
    setEmpForm({ name:'', role:'', email:'', phone:'' });
    showToast('Employee added');
  };

  const toggleActive = (id) =>
    setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, active: !e.active } : e));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink-black-900 dark:text-ink-black-50">Company Profile</h1>

      {toast && <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{toast}</div>}

      {/* Company Info */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-5 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-black-500/15"><Building2 className="h-6 w-6 text-ink-black-500 dark:text-eggshell-300" /></div>
            <div>
              <h2 className="text-base font-bold text-ink-black-900 dark:text-white">{profile.name}</h2>
              <p className="text-xs text-dusty-denim-500 dark:text-blue-slate-400">{profile.registration}</p>
            </div>
          </div>
          <button onClick={() => { setProfileForm({...profile}); setEditingProfile(true); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold text-ink-black-700 hover:bg-dusty-denim-50 dark:border-deep-space-blue-700 dark:text-white">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          {[
            { icon: MapPin,  label: 'Address',   value: profile.address },
            { icon: Phone,   label: 'Phone',     value: profile.phone },
            { icon: Mail,    label: 'Email',     value: profile.email },
            { icon: Building2, label: 'Website', value: profile.website },
            { icon: Ship,    label: 'Fleet Size',value: `${profile.fleet_size} vessels` },
            { icon: Building2, label: 'Established', value: profile.established },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dusty-denim-400" />
              <span><span className="text-dusty-denim-500 dark:text-blue-slate-400">{label}: </span><span className="font-semibold text-ink-black-900 dark:text-white">{value}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Registered Vessels */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <h2 className="mb-3 text-base font-bold text-ink-black-900 dark:text-white">Registered Vessels ({vessels.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dusty-denim-100 text-[11px] font-semibold uppercase tracking-wider text-dusty-denim-500 dark:border-deep-space-blue-800 dark:text-blue-slate-400">
                <th className="py-2 pr-3">Vessel</th><th className="py-2 pr-3">IMO</th><th className="py-2 pr-3">Type</th><th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusty-denim-100 dark:divide-deep-space-blue-800/80">
              {vessels.map((v) => (
                <tr key={v.imo} className="hover:bg-dusty-denim-50/70 dark:hover:bg-deep-space-blue-800/40">
                  <td className="py-2 pr-3 font-semibold text-ink-black-900 dark:text-white">{v.name}</td>
                  <td className="py-2 pr-3 text-dusty-denim-500 dark:text-blue-slate-400">{v.imo}</td>
                  <td className="py-2 pr-3">{v.type}</td>
                  <td className="py-2">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[v.status] || 'bg-dusty-denim-300'}`} />
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employees */}
      <div className="rounded-xl border border-dusty-denim-200 bg-white p-4 shadow-sm dark:border-deep-space-blue-800 dark:bg-deep-space-blue-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-black-900 dark:text-white">Authorized Employees ({employees.length})</h2>
          <button onClick={() => setShowAddEmp(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-black-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600">
            <Plus className="h-3.5 w-3.5" /> Add Employee
          </button>
        </div>
        <div className="space-y-2">
          {employees.map((emp) => (
            <div key={emp.id} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs ${emp.active ? 'border-dusty-denim-200 dark:border-deep-space-blue-800' : 'border-dusty-denim-100 opacity-60 dark:border-deep-space-blue-900'}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-black-500/15"><User className="h-4 w-4 text-ink-black-500" /></div>
                <div>
                  <p className="font-semibold text-ink-black-900 dark:text-white">{emp.name}</p>
                  <p className="text-dusty-denim-500 dark:text-blue-slate-400">{emp.role} · {emp.email}</p>
                </div>
              </div>
              <button onClick={() => toggleActive(emp.id)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${emp.active ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-dusty-denim-200 text-dusty-denim-600'}`}>
                {emp.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form onSubmit={saveProfile} className="w-full max-w-lg rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-black-900 dark:text-white">Edit Company Profile</h3>
              <button type="button" onClick={() => setEditingProfile(false)} className="text-blue-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[['name','Company Name'],['registration','CIN / Registration'],['phone','Phone'],['email','Email'],['website','Website'],['established','Year Established']].map(([k,l]) => (
                <label key={k}><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">{l}</span>
                  <input value={profileForm[k]||''} onChange={(e)=>setProfileForm({...profileForm,[k]:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
                </label>
              ))}
              <label className="col-span-2"><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">Address</span>
                <input value={profileForm.address||''} onChange={(e)=>setProfileForm({...profileForm,address:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingProfile(false)} className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700 dark:text-white">Cancel</button>
              <button type="submit" className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black-950/70 p-4 backdrop-blur-sm">
          <form onSubmit={addEmployee} className="w-full max-w-md rounded-2xl border border-dusty-denim-200 bg-white p-5 shadow-2xl dark:border-deep-space-blue-700 dark:bg-deep-space-blue-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-black-900 dark:text-white">Add Employee</h3>
              <button type="button" onClick={() => setShowAddEmp(false)} className="text-blue-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              {[['name','Full Name'],['role','Role / Designation'],['email','Email'],['phone','Phone']].map(([k,l]) => (
                <label key={k}><span className="font-semibold text-ink-black-800 dark:text-blue-slate-200">{l}</span>
                  <input required value={empForm[k]} onChange={(e)=>setEmpForm({...empForm,[k]:e.target.value})} className="mt-1 w-full rounded-lg border border-dusty-denim-200 px-3 py-1.5 dark:border-deep-space-blue-700 dark:bg-ink-black-950 dark:text-white" />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddEmp(false)} className="rounded-lg border border-dusty-denim-200 px-3 py-1.5 text-xs font-semibold dark:border-deep-space-blue-700 dark:text-white">Cancel</button>
              <button type="submit" className="rounded-lg bg-ink-black-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-black-600">Add</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
