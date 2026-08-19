// ============================================
// Admin - Settings Page (with QR Code + Game Config)
// Responsive with shared AdminLayout
// ============================================
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Save, Loader2, Upload, Image, Trash2, Plane, Rocket, Dice5, Power
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GameConfig {
  gameType: string;
  name: string;
  minMultiplier: number;
  maxMultiplier: number;
  minBet: number;
  maxBet: number;
  enabled: boolean;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // QR Code
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrUploading, setQrUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Game Configs
  const [gameConfigs, setGameConfigs] = useState<GameConfig[]>([]);
  const [gcLoading, setGcLoading] = useState(true);
  const [gcSaving, setGcSaving] = useState<string | null>(null);
  const [editedConfigs, setEditedConfigs] = useState<Record<string, { min: number; max: number }>>({});

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadSettings();
      loadQrCode();
      loadGameConfigs();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch { } finally { setLoading(false); }
  };

  const loadQrCode = async () => {
    setQrLoading(true);
    try {
      const data = await api.getQrCode();
      setQrCodeData(data.qrCodeData);
    } catch { } finally { setQrLoading(false); }
  };

  const loadGameConfigs = async () => {
    setGcLoading(true);
    try {
      const configs = await api.getGameConfigs();
      setGameConfigs(configs);
      const edits: Record<string, { min: number; max: number }> = {};
      configs.forEach((c: GameConfig) => {
        edits[c.gameType] = { min: c.minMultiplier, max: c.maxMultiplier };
      });
      setEditedConfigs(edits);
    } catch { } finally { setGcLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings({
        commissionRate: settings.commissionRate,
        countdownDuration: settings.countdownDuration,
        maintenanceMode: settings.maintenanceMode,
      });
      toast.success('Settings saved');
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleSaveMultiplierRange = async (gameType: string) => {
    const edit = editedConfigs[gameType];
    if (!edit) return;
    if (edit.min < 1) { toast.error('Min must be >= 1.00'); return; }
    if (edit.max < edit.min) { toast.error('Max must be >= min'); return; }
    if (edit.max > 10000) { toast.error('Max cannot exceed 10000'); return; }

    setGcSaving(gameType);
    try {
      const result = await api.setMultiplierRange(gameType, edit.min, edit.max);
      if (result.error) { toast.error(result.error); return; }
      toast.success(`${gameType} multiplier range updated: ${edit.min}x — ${edit.max}x`);
      // Update local state
      setGameConfigs(prev => prev.map(c =>
        c.gameType === gameType ? { ...c, minMultiplier: edit.min, maxMultiplier: edit.max } : c
      ));
    } catch (err: any) { toast.error(err.message); }
    finally { setGcSaving(null); }
  };

  const handleToggleGame = async (gameType: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    try {
      await api.toggleGame(gameType, newEnabled);
      setGameConfigs(prev => prev.map(c =>
        c.gameType === gameType ? { ...c, enabled: newEnabled } : c
      ));
      toast.success(`${gameType} ${newEnabled ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle game');
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image size must be under 5MB'); return; }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setQrUploading(true);
      try {
        await api.updateQrCode(base64);
        setQrCodeData(base64);
        toast.success('QR code updated successfully');
      } catch (err: any) { toast.error(err.message); }
      finally { setQrUploading(false); }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleQrDelete = async () => {
    setQrUploading(true);
    try {
      await api.updateQrCode('');
      setQrCodeData(null);
      toast.success('QR code removed — default will be used');
    } catch (err: any) { toast.error(err.message); }
    finally { setQrUploading(false); }
  };

  const getGameIcon = (gameType: string) => {
    if (gameType === 'JETX') return <Rocket size={14} />;
    if (gameType === 'LUDO') return <Dice5 size={14} />;
    return <Plane size={14} />;
  };

  const getGameColor = (gameType: string) => {
    if (gameType === 'JETX') return 'text-yellow-400';
    if (gameType === 'LUDO') return 'text-green-400';
    return 'text-red-400';
  };

  if (authLoading || !user) return null;

  return (
    <AdminLayout activeItem="/admin/settings">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Platform Settings</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent-cyan" /></div>
      ) : settings ? (
        <div className="max-w-2xl space-y-6">
          {/* General Settings */}
          <div className="glass rounded-xl p-4 sm:p-5 space-y-4">
            <h2 className="text-sm font-semibold text-accent-cyan">General</h2>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Commission Rate (%)</label>
              <input type="number" step="0.01" min="0" max="1" value={settings.commissionRate}
                onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50" />
              <p className="text-[10px] text-gray-500 mt-1">Current: {(settings.commissionRate * 100).toFixed(1)}% — Enter as decimal (0.10 = 10%)</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Countdown Duration (seconds)</label>
              <input type="number" min="5" max="60" value={settings.countdownDuration}
                onChange={(e) => setSettings({ ...settings, countdownDuration: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-sky-surface-2 border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Maintenance Mode</p>
                <p className="text-[10px] text-gray-500">Prevents players from accessing the game</p>
              </div>
              <button onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                className={`w-12 h-6 rounded-full transition-all ${settings.maintenanceMode ? 'bg-accent-red' : 'bg-sky-surface-3'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Settings
            </button>
          </div>

          {/* ── Game On/Off Switches ── */}
          <div className="glass rounded-xl p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-accent-cyan flex items-center gap-2">
                <Power size={14} /> Game Controls
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Turn games on/off. Disabled games are hidden from players but still accessible to admin.
              </p>
            </div>

            {gcLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-accent-cyan" /></div>
            ) : gameConfigs.length === 0 ? (
              <p className="text-xs text-gray-500">No game configs found.</p>
            ) : (
              <div className="space-y-2">
                {gameConfigs.map(gc => (
                  <div key={`toggle-${gc.gameType}`}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      gc.enabled
                        ? 'bg-sky-surface-2 border-sky-border'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={getGameColor(gc.gameType)}>{getGameIcon(gc.gameType)}</span>
                      <div>
                        <h3 className="text-sm font-bold">{gc.name}</h3>
                        <p className="text-[10px] text-gray-500">
                          {gc.enabled ? '✅ Players can access this game' : '🚫 Hidden from players'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleGame(gc.gameType, gc.enabled)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                        gc.enabled ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                        gc.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-sky-surface-2 rounded-lg p-3 border border-sky-border">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                <strong className="text-gray-400">Note:</strong> When a game is disabled, players will see a "Game Unavailable" message. As admin, you can still access and test the game.
              </p>
            </div>
          </div>

          {/* ── Game Multiplier Range Control ── */}
          <div className="glass rounded-xl p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-accent-cyan flex items-center gap-2">
                <Plane size={14} /> Game Multiplier Range
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Control the minimum and maximum crash multiplier for each game. All rounds will crash within this range until you change it.
              </p>
            </div>

            {gcLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-accent-cyan" /></div>
            ) : gameConfigs.length === 0 ? (
              <p className="text-xs text-gray-500">No game configs found. Run seed to create them.</p>
            ) : (
              <div className="space-y-4">
                {gameConfigs.map(gc => {
                  const edit = editedConfigs[gc.gameType] || { min: gc.minMultiplier, max: gc.maxMultiplier };
                  const hasChanges = edit.min !== gc.minMultiplier || edit.max !== gc.maxMultiplier;
                  const isSaving = gcSaving === gc.gameType;

                  return (
                    <div key={gc.gameType} className="bg-sky-surface-2 rounded-xl p-4 border border-sky-border">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={getGameColor(gc.gameType)}>{getGameIcon(gc.gameType)}</span>
                        <h3 className="text-sm font-bold">{gc.name}</h3>
                        <span className="text-[10px] text-gray-500 ml-auto bg-sky-surface-3 px-2 py-0.5 rounded">
                          Current: {gc.minMultiplier}x — {gc.maxMultiplier}x
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-[10px] text-gray-400 mb-1 block">Min Multiplier</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="1"
                              value={edit.min}
                              onChange={(e) => setEditedConfigs(prev => ({
                                ...prev,
                                [gc.gameType]: { ...edit, min: Number(e.target.value) }
                              }))}
                              className="w-full px-3 py-2 rounded-lg bg-sky-surface border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs text-gray-500 shrink-0">x</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 mb-1 block">Max Multiplier</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="1"
                              value={edit.max}
                              onChange={(e) => setEditedConfigs(prev => ({
                                ...prev,
                                [gc.gameType]: { ...edit, max: Number(e.target.value) }
                              }))}
                              className="w-full px-3 py-2 rounded-lg bg-sky-surface border border-sky-border text-sm focus:outline-none focus:border-accent-cyan/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs text-gray-500 shrink-0">x</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick presets */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {[
                          { label: '1x – 2x', min: 1, max: 2 },
                          { label: '1x – 5x', min: 1, max: 5 },
                          { label: '1x – 10x', min: 1, max: 10 },
                          { label: '2x – 20x', min: 2, max: 20 },
                          { label: '1x – 100x', min: 1, max: 100 },
                          { label: 'Default', min: 1, max: 1000 },
                        ].map(preset => (
                          <button
                            key={preset.label}
                            onClick={() => setEditedConfigs(prev => ({
                              ...prev,
                              [gc.gameType]: { min: preset.min, max: preset.max }
                            }))}
                            className="text-[10px] px-2 py-1 rounded-md bg-sky-surface-3 text-gray-400 hover:text-white hover:bg-accent-cyan/20 transition-colors border border-sky-border"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handleSaveMultiplierRange(gc.gameType)}
                        disabled={!hasChanges || isSaving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 ${
                          hasChanges
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90'
                            : 'bg-sky-surface-3 text-gray-500'
                        }`}
                      >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {hasChanges ? 'Save Range' : 'No Changes'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-sky-surface-2 rounded-lg p-3 border border-sky-border">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                <strong className="text-gray-400">How it works:</strong> Every round's crash point will be generated within your set range. For example, setting Aviation to 1x–3x means the plane will ALWAYS crash between 1.00x and 3.00x. Forced rounds (from Game Control) bypass this limit.
              </p>
            </div>
          </div>

          {/* QR Code Management */}
          <div className="glass rounded-xl p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-accent-cyan flex items-center gap-2"><Image size={14} /> Payment QR Code</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">This QR code is shown to players when they add money</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start">
              {/* Preview */}
              <div className="bg-white rounded-xl p-3 shrink-0">
                {qrLoading ? (
                  <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : qrCodeData ? (
                  <img src={qrCodeData} alt="Payment QR" className="w-36 h-36 sm:w-40 sm:h-40 object-contain" />
                ) : (
                  <div className="w-36 h-36 sm:w-40 sm:h-40 flex flex-col items-center justify-center text-gray-400">
                    <Image className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs text-gray-500">Default QR</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex-1 space-y-3 w-full sm:w-auto">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Upload a new QR code image (PNG, JPG — max 5MB)</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={qrUploading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 text-sm font-medium hover:bg-accent-cyan/20 transition-all disabled:opacity-50 w-full sm:w-auto justify-center sm:justify-start"
                  >
                    {qrUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Upload New QR Code
                  </button>
                </div>
                {qrCodeData && (
                  <button onClick={handleQrDelete} disabled={qrUploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:bg-red-400/10 text-xs transition-all disabled:opacity-50">
                    <Trash2 size={12} /> Remove (use default)
                  </button>
                )}
                <div className="bg-sky-surface-2 rounded-lg p-3 border border-sky-border">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <strong className="text-gray-400">Tip:</strong> Upload your UPI payment QR code from any app (Google Pay, PhonePe, Paytm etc). Players will scan this QR to make payments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
