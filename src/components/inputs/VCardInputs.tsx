import React, { useState, useRef } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  Globe, 
  MapPin, 
  FileText, 
  Share2, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Code
} from 'lucide-react';
import { VCardData } from '../../types';
import { generateVCardString, parseVCardString } from '../../utils/vcard-wifi-helpers';

interface VCardInputsProps {
  vcard: VCardData;
  onChange: (vcard: VCardData) => void;
}

const PRESETS: { label: string; data: Partial<VCardData> }[] = [
  {
    label: 'Tech Executive',
    data: {
      prefix: '',
      firstName: 'Sarah',
      lastName: 'Chen',
      title: 'Chief Technology Officer',
      company: 'Apex Cloud Systems',
      department: 'Infrastructure',
      phone: '+1 (415) 555-0192',
      workPhone: '+1 (415) 555-0100',
      email: 'sarah.chen@apexcloud.io',
      workEmail: 'cto@apexcloud.io',
      website: 'https://apexcloud.io',
      street: '500 Howard Street, Suite 800',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA',
      socialLinkedIn: 'sarahchen-tech',
      socialTwitter: 'sarahchen_cto',
      notes: 'Available for technical partnerships & advisory.',
    },
  },
  {
    label: 'Creative Freelancer',
    data: {
      prefix: '',
      firstName: 'Mateo',
      lastName: 'Rivera',
      title: 'Senior Brand & Product Designer',
      company: 'Studio Form & Light',
      phone: '+1 (555) 782-9011',
      email: 'mateo@formandlight.design',
      website: 'https://formandlight.design',
      city: 'Brooklyn',
      state: 'NY',
      country: 'USA',
      socialLinkedIn: 'mateo-rivera-design',
      notes: 'Accepting select branding & UX commissions for Q4.',
    },
  },
  {
    label: 'Medical / Healthcare',
    data: {
      prefix: 'Dr.',
      firstName: 'Elena',
      lastName: 'Rostova',
      title: 'Dermatologist & Medical Director',
      company: 'Aura Skin Dermatology',
      department: 'Clinical Aesthetics',
      phone: '+1 (212) 555-0144',
      workPhone: '+1 (212) 555-0140',
      email: 'dr.rostova@auraskin.clinic',
      website: 'https://auraskin.clinic',
      street: '720 Park Avenue, Floor 4',
      city: 'New York',
      state: 'NY',
      zip: '10021',
      country: 'USA',
      notes: 'Office Hours: Mon-Thu 9am-5pm. By appointment only.',
    },
  },
  {
    label: 'Restaurant / Hospitality',
    data: {
      prefix: '',
      firstName: 'Marco',
      lastName: 'Bellini',
      title: 'General Manager & Sommelier',
      company: 'Trattoria Il Giardino',
      phone: '+1 (312) 555-0178',
      workPhone: '+1 (312) 555-0170',
      email: 'reservations@ilgiardino-bistro.com',
      website: 'https://ilgiardino-bistro.com',
      street: '142 Michigan Avenue',
      city: 'Chicago',
      state: 'IL',
      zip: '60603',
      country: 'USA',
      notes: 'Table bookings, private dining & wine tastings.',
    },
  },
];

export const VCardInputs: React.FC<VCardInputsProps> = ({ vcard, onChange }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'contact' | 'work' | 'address' | 'social'>('info');
  const [showRawVcf, setShowRawVcf] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (fields: Partial<VCardData>) => {
    onChange({ ...vcard, ...fields });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseVCardString(text);
        onChange({
          ...vcard,
          ...parsed,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadVcf = () => {
    const vcfString = generateVCardString(vcard);
    const blob = new Blob([vcfString], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fullName = [vcard.firstName, vcard.lastName].filter(Boolean).join('_') || 'contact';
    a.href = url;
    a.download = `${fullName}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyRaw = () => {
    const vcfString = generateVCardString(vcard);
    navigator.clipboard.writeText(vcfString);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const currentVcfString = generateVCardString(vcard);

  return (
    <div className="space-y-4">
      {/* Top Header with Presets, Import, Export */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Digital Contact Card (vCard 3.0)
          </label>
          <p className="text-[11px] text-slate-400">
            Scanning prompts smartphone camera to save contact instantly
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Import .vcf */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            title="Upload an existing .vcf contact file to populate fields"
          >
            <Upload className="h-3 w-3 text-indigo-500" />
            <span>Import .vcf</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".vcf,text/vcard"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Export .vcf */}
          <button
            type="button"
            onClick={handleDownloadVcf}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            title="Download test .vcf file"
          >
            <Download className="h-3 w-3 text-emerald-500" />
            <span>Download .vcf</span>
          </button>

          {/* View Raw vCard */}
          <button
            type="button"
            onClick={() => setShowRawVcf(!showRawVcf)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            <Code className="h-3 w-3 text-slate-500" />
            <span>{showRawVcf ? 'Hide Raw' : 'Raw VCF'}</span>
          </button>
        </div>
      </div>

      {/* Quick Role Presets */}
      <div>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
          Role Templates:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => update(preset.data)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Raw vCard Code Preview if toggled */}
      {showRawVcf && (
        <div className="rounded-xl border border-slate-200 bg-slate-900 p-3.5 text-xs text-slate-200 font-mono relative dark:border-slate-700">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-[11px] text-slate-400">vCard 3.0 Spec Output:</span>
            <button
              type="button"
              onClick={handleCopyRaw}
              className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
            >
              {copiedRaw ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copiedRaw ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre leading-relaxed text-[11px] text-emerald-400">
            {currentVcfString}
          </pre>
        </div>
      )}

      {/* Sub-Navigation Tabs for Detailed vCard Fields */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'info', label: 'Name & Role', icon: User },
          { id: 'contact', label: 'Phones & Email', icon: Phone },
          { id: 'work', label: 'Company & Web', icon: Building },
          { id: 'address', label: 'Address', icon: MapPin },
          { id: 'social', label: 'Social & Notes', icon: Share2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: NAME & ROLE */}
      {activeTab === 'info' && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Prefix / Salutation
              </label>
              <input
                type="text"
                value={vcard.prefix || ''}
                onChange={(e) => update({ prefix: e.target.value })}
                placeholder="Dr. / Mr. / Ms."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                First Name *
              </label>
              <input
                type="text"
                value={vcard.firstName}
                onChange={(e) => update({ firstName: e.target.value })}
                placeholder="First name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              />
            </div>
            <div className="col-span-12 sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Last Name
              </label>
              <input
                type="text"
                value={vcard.lastName}
                onChange={(e) => update({ lastName: e.target.value })}
                placeholder="Last name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Job Title / Profession
              </label>
              <input
                type="text"
                value={vcard.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="Senior Product Designer"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Department / Division
              </label>
              <input
                type="text"
                value={vcard.department || ''}
                onChange={(e) => update({ department: e.target.value })}
                placeholder="Design & Innovation"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHONES & EMAIL */}
      {activeTab === 'contact' && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Primary Mobile Phone *
              </label>
              <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  value={vcard.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="+1 (555) 019-2831"
                  className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Work / Office Phone (Optional)
              </label>
              <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  value={vcard.workPhone || ''}
                  onChange={(e) => update({ workPhone: e.target.value })}
                  placeholder="+1 (555) 019-2800 ext. 4"
                  className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Primary Email *
              </label>
              <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={vcard.email}
                  onChange={(e) => update({ email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Work / Alternate Email
              </label>
              <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={vcard.workEmail || ''}
                  onChange={(e) => update({ workEmail: e.target.value })}
                  placeholder="support@company.com"
                  className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPANY & WEBSITE */}
      {activeTab === 'work' && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Company / Organization Name
            </label>
            <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center pl-3 text-slate-400">
                <Building className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={vcard.company}
                onChange={(e) => update({ company: e.target.value })}
                placeholder="Acme Innovations Corp."
                className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Website / Portfolio URL
            </label>
            <div className="relative flex rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-500 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center pl-3 text-slate-400">
                <Globe className="h-4 w-4" />
              </div>
              <input
                type="url"
                value={vcard.website}
                onChange={(e) => update({ website: e.target.value })}
                placeholder="https://company.com"
                className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PHYSICAL ADDRESS */}
      {activeTab === 'address' && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Street Address
            </label>
            <input
              type="text"
              value={vcard.street || ''}
              onChange={(e) => update({ street: e.target.value, address: e.target.value })}
              placeholder="742 Evergreen Terrace, Suite 400"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                City
              </label>
              <input
                type="text"
                value={vcard.city || ''}
                onChange={(e) => update({ city: e.target.value })}
                placeholder="Springfield"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                State / Prov
              </label>
              <input
                type="text"
                value={vcard.state || ''}
                onChange={(e) => update({ state: e.target.value })}
                placeholder="IL"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                ZIP / Postal
              </label>
              <input
                type="text"
                value={vcard.zip || ''}
                onChange={(e) => update({ zip: e.target.value })}
                placeholder="62704"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                Country
              </label>
              <input
                type="text"
                value={vcard.country || ''}
                onChange={(e) => update({ country: e.target.value })}
                placeholder="USA"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SOCIAL & NOTES */}
      {activeTab === 'social' && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                LinkedIn Username / URL
              </label>
              <input
                type="text"
                value={vcard.socialLinkedIn || ''}
                onChange={(e) => update({ socialLinkedIn: e.target.value })}
                placeholder="username or profile link"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
                X / Twitter Handle
              </label>
              <input
                type="text"
                value={vcard.socialTwitter || ''}
                onChange={(e) => update({ socialTwitter: e.target.value })}
                placeholder="@handle"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
              Personal Bio / Memo / Notes
            </label>
            <textarea
              rows={3}
              value={vcard.notes || ''}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Book meeting or scan to chat..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Live Contact Card Preview Summary */}
      <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shrink-0">
            {vcard.firstName?.[0] || 'C'}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 truncate dark:text-white">
              {[vcard.prefix, vcard.firstName, vcard.lastName].filter(Boolean).join(' ') || 'Unnamed Contact'}
            </h4>
            <p className="text-[11px] text-slate-500 truncate dark:text-slate-400">
              {[vcard.title, vcard.company].filter(Boolean).join(' • ') || 'Contact Profile'}
            </p>
            <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 truncate">
              {vcard.phone || vcard.email || 'No phone set'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
