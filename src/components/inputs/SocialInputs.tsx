import React from 'react';
import { Plus, Trash2, Globe, Instagram, Youtube, Linkedin, Twitter, Github, Share2 } from 'lucide-react';
import { QRConfig, SocialData, SocialLinkItem } from '../../types';

interface SocialInputsProps {
  config: QRConfig;
  onChange: (updater: Partial<QRConfig>) => void;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  website: Globe,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  x: Twitter,
  github: Github,
  other: Share2,
};

export const SocialInputs: React.FC<SocialInputsProps> = ({ config, onChange }) => {
  const social: SocialData = config.social || {
    displayName: 'Studio Nova',
    bio: 'Design & Visual Systems Agency',
    avatarUrl: '',
    theme: 'gradient',
    links: [
      { id: '1', platform: 'website', label: 'Agency Website', url: 'https://example.com' },
      { id: '2', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
      { id: '3', platform: 'x', label: 'X (Twitter)', url: 'https://x.com' },
    ],
  };

  const updateSocial = (partial: Partial<SocialData>) => {
    onChange({ social: { ...social, ...partial } });
  };

  const addLink = () => {
    const newLink: SocialLinkItem = {
      id: `${Date.now()}`,
      platform: 'website',
      label: 'New Link',
      url: 'https://',
    };
    updateSocial({ links: [...social.links, newLink] });
  };

  const removeLink = (id: string) => {
    updateSocial({ links: social.links.filter((l) => l.id !== id) });
  };

  const updateLinkItem = (id: string, partial: Partial<SocialLinkItem>) => {
    updateSocial({
      links: social.links.map((l) => (l.id === id ? { ...l, ...partial } : l)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Social / Link-in-Bio Page
        </label>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Single QR loads all your profiles
        </span>
      </div>

      {/* Profile Name & Tagline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Display Name / Handle
          </label>
          <input
            type="text"
            value={social.displayName}
            onChange={(e) => updateSocial({ displayName: e.target.value })}
            placeholder="e.g. Alex Morgan, Acme Studio"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Short Bio / Tagline
          </label>
          <input
            type="text"
            value={social.bio}
            onChange={(e) => updateSocial({ bio: e.target.value })}
            placeholder="e.g. Digital artist & founder"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Profile & Destination Links ({social.links.length})
          </label>
          <button
            type="button"
            onClick={addLink}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Link</span>
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {social.links.map((link) => {
            const Icon = PLATFORM_ICONS[link.platform] || Globe;
            return (
              <div
                key={link.id}
                className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/40"
              >
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <select
                  value={link.platform}
                  onChange={(e) =>
                    updateLinkItem(link.id, {
                      platform: e.target.value as any,
                      label: e.target.value === 'website' ? 'Website' : e.target.value,
                    })
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 focus:outline-none"
                >
                  <option value="website">Website</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="x">X / Twitter</option>
                  <option value="github">GitHub</option>
                  <option value="other">Other Link</option>
                </select>

                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLinkItem(link.id, { label: e.target.value })}
                  placeholder="Label"
                  className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                />

                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLinkItem(link.id, { url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => removeLink(link.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Remove link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
