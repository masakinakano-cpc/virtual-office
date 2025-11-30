'use client';

import { useState, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';

// アバタータイプ定義
export const avatarTypes = {
  cat: { emoji: '🐱', name: 'ネコ' },
  dog: { emoji: '🐶', name: 'イヌ' },
  bear: { emoji: '🐻', name: 'クマ' },
  rabbit: { emoji: '🐰', name: 'ウサギ' },
  panda: { emoji: '🐼', name: 'パンダ' },
  fox: { emoji: '🦊', name: 'キツネ' },
  penguin: { emoji: '🐧', name: 'ペンギン' },
  owl: { emoji: '🦉', name: 'フクロウ' },
  unicorn: { emoji: '🦄', name: 'ユニコーン' },
  alien: { emoji: '👽', name: 'エイリアン' },
  robot: { emoji: '🤖', name: 'ロボット' },
  ghost: { emoji: '👻', name: 'オバケ' },
};

export const avatarColors = [
  { id: 'red', color: '#FF6B6B', name: 'レッド' },
  { id: 'orange', color: '#FF9F43', name: 'オレンジ' },
  { id: 'yellow', color: '#FFEAA7', name: 'イエロー' },
  { id: 'green', color: '#4ECDC4', name: 'グリーン' },
  { id: 'blue', color: '#45B7D1', name: 'ブルー' },
  { id: 'purple', color: '#A29BFE', name: 'パープル' },
  { id: 'pink', color: '#FD79A8', name: 'ピンク' },
  { id: 'mint', color: '#00B894', name: 'ミント' },
];

interface AvatarCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

type AvatarMode = 'emoji' | 'photo';

export default function AvatarCustomizer({ isOpen, onClose }: AvatarCustomizerProps) {
  const { profile, updateProfile } = useAuth();
  const [mode, setMode] = useState<AvatarMode>(profile?.avatar_url ? 'photo' : 'emoji');
  const [selectedType, setSelectedType] = useState(profile?.avatar_type || 'cat');
  const [selectedColor, setSelectedColor] = useState(profile?.avatar_color || '#4ECDC4');
  const [photoUrl, setPhotoUrl] = useState(profile?.avatar_url || '');
  const [previewUrl, setPreviewUrl] = useState(profile?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック (2MB以下)
    if (file.size > 2 * 1024 * 1024) {
      alert('ファイルサイズは2MB以下にしてください');
      return;
    }

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Supabase Storageにアップロード
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // ストレージがない場合はBase64で保存
        setPhotoUrl(previewUrl);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        setPhotoUrl(publicUrl);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      // エラー時はBase64で保存
      setPhotoUrl(previewUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setPreviewUrl('');
    setMode('emoji');
  };

  const handleSave = async () => {
    setSaving(true);

    if (mode === 'photo' && (photoUrl || previewUrl)) {
      await updateProfile({
        avatar_type: 'custom',
        avatar_url: photoUrl || previewUrl,
        avatar_color: selectedColor,
      });
    } else {
      await updateProfile({
        avatar_type: selectedType,
        avatar_url: '',
        avatar_color: selectedColor,
      });
    }

    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4">
          <h2 className="text-xl font-bold">アバターをカスタマイズ</h2>
          <p className="text-purple-100 text-sm">写真をアップロードするか、キャラクターを選んでね</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* モード切替タブ */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('emoji')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'emoji'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              キャラクター
            </button>
            <button
              onClick={() => setMode('photo')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'photo'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              写真アップロード
            </button>
          </div>

          {/* プレビュー */}
          <div className="flex justify-center mb-6">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-lg transition-all overflow-hidden border-4 border-white"
              style={{ backgroundColor: selectedColor }}
            >
              {mode === 'photo' && (previewUrl || photoUrl) ? (
                <img
                  src={previewUrl || photoUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                avatarTypes[selectedType as keyof typeof avatarTypes]?.emoji || '🐱'
              )}
            </div>
          </div>

          {mode === 'emoji' ? (
            <>
              {/* キャラクター選択 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">キャラクター</h3>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(avatarTypes).map(([key, { emoji, name }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedType(key)}
                      className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                        selectedType === key
                          ? 'bg-purple-100 ring-2 ring-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-2xl mb-1">{emoji}</span>
                      <span className="text-xs text-gray-600">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* 写真アップロード */
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">プロフィール写真</h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">アップロード中...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">📷</span>
                      <span className="text-sm text-gray-600">
                        クリックして写真を選択
                      </span>
                      <span className="text-xs text-gray-400">
                        JPG, PNG, GIF (最大2MB)
                      </span>
                    </>
                  )}
                </button>

                {(previewUrl || photoUrl) && (
                  <button
                    onClick={handleRemovePhoto}
                    className="w-full py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    写真を削除
                  </button>
                )}
              </div>
            </div>
          )}

          {/* カラー選択 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {mode === 'photo' ? '背景カラー（枠の色）' : '背景カラー'}
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {avatarColors.map(({ id, color, name }) => (
                <button
                  key={id}
                  onClick={() => setSelectedColor(color)}
                  className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                    selectedColor === color
                      ? 'ring-2 ring-purple-500 ring-offset-2'
                      : 'hover:scale-105'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full mb-1 shadow-inner"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs text-gray-600">{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
