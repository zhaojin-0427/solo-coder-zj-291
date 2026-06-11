import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Phaser from 'phaser';
import { FreeCreateScene } from '@/game/FreeCreateScene';
import { DrawnPoint, CakeShape, NozzleType, BackgroundDecoration, CakeArtwork } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { ExpSettlement } from '@/types/skill';
import { ArrowLeft, Undo2, Trash2, Save, Palette, Circle, Square, Heart, Star, Leaf, Edit3, Sparkles } from 'lucide-react';
import ExpSettlementToast from '@/components/ExpSettlementToast';

const CAKE_SHAPES: { value: CakeShape; label: string; icon: React.ReactNode }[] = [
  { value: 'circle', label: '圆形', icon: <Circle className="w-5 h-5" /> },
  { value: 'square', label: '方形', icon: <Square className="w-5 h-5" /> },
  { value: 'heart', label: '爱心', icon: <Heart className="w-5 h-5" /> },
];

const CAKE_COLORS = [
  '#FFE4C4', '#FFDAB9', '#DEB887', '#FFE4B5', '#FAEBD7',
  '#FFF0F5', '#F0FFF0', '#E6E6FA', '#FFFACD', '#E0FFFF',
];

const NOZZLE_TYPES: { value: NozzleType; label: string; icon: string }[] = [
  { value: 'round', label: '圆口', icon: '⭕' },
  { value: 'star', label: '星形', icon: '⭐' },
  { value: 'leaf', label: '叶片', icon: '🍃' },
  { value: 'writing', label: '写字', icon: '✏️' },
];

const CREAM_COLORS = [
  '#FFB6C1', '#FF69B4', '#FF1493', '#FFC0CB',
  '#87CEEB', '#ADD8E6', '#4169E1',
  '#90EE90', '#98FB98', '#228B22',
  '#FFD700', '#FFA500', '#FF6347',
  '#DDA0DD', '#9370DB', '#8B4513',
  '#FFFFFF', '#000000', '#808080',
];

const BACKGROUND_COLORS = [
  '#FFF8E7', '#FFE4E1', '#E6E6FA', '#F0FFF0',
  '#FFF0F5', '#F0F8FF', '#FFFACD', '#FFE4B5',
  '#E0FFFF', '#DDA0DD',
];

const BACKGROUND_DECORATIONS: { value: BackgroundDecoration; label: string; icon: string }[] = [
  { value: 'none', label: '无装饰', icon: '❌' },
  { value: 'sprinkles', label: '糖珠', icon: '🌈' },
  { value: 'flowers', label: '花朵', icon: '🌸' },
  { value: 'stars', label: '星星', icon: '⭐' },
  { value: 'hearts', label: '爱心', icon: '💕' },
];

const AVAILABLE_TAGS = ['浪漫', '可爱', '简约', '华丽', '清新', '复古', '梦幻', '甜美', '优雅', '俏皮'];

const FreeCreate: React.FC = () => {
  const navigate = useNavigate();
  const { artworkId } = useParams<{ artworkId?: string }>();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<FreeCreateScene | null>(null);

  const { saveArtwork, getArtworkById, updateArtwork, submitFreeCreateResult } = useGameStore();

  const [cakeShape, setCakeShape] = useState<CakeShape>('circle');
  const [cakeColor, setCakeColor] = useState('#FFE4C4');
  const [nozzleType, setNozzleType] = useState<NozzleType>('round');
  const [creamColor, setCreamColor] = useState('#FFB6C1');
  const [pressure, setPressure] = useState(0.5);
  const [backgroundColor, setBackgroundColor] = useState('#FFF8E7');
  const [backgroundDecoration, setBackgroundDecoration] = useState<BackgroundDecoration>('none');
  const [canUndo, setCanUndo] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [artworkName, setArtworkName] = useState('');
  const [artworkRating, setArtworkRating] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [existingArtwork, setExistingArtwork] = useState<CakeArtwork | null>(null);
  const [expSettlement, setExpSettlement] = useState<ExpSettlement | null>(null);

  const drawnPathsRef = useRef<DrawnPoint[][]>([]);

  useEffect(() => {
    if (artworkId) {
      const artwork = getArtworkById(artworkId);
      if (artwork) {
        setExistingArtwork(artwork);
        setIsEditing(true);
        setCakeShape(artwork.cakeShape);
        setCakeColor(artwork.cakeColor);
        setBackgroundColor(artwork.backgroundColor);
        setBackgroundDecoration(artwork.backgroundDecoration);
        setArtworkName(artwork.name);
        setArtworkRating(artwork.rating);
        setSelectedTags(artwork.tags);
        if (artwork.nozzleTypes.length > 0) {
          setNozzleType(artwork.nozzleTypes[0]);
        }
        if (artwork.mainColors.length > 0) {
          setCreamColor(artwork.mainColors[0]);
        }
        drawnPathsRef.current = artwork.drawnPaths;
      }
    }
  }, [artworkId, getArtworkById]);

  const handlePressureUpdate = useCallback((p: number) => {
    setPressure(p);
  }, []);

  const handlePathsChange = useCallback((paths: DrawnPoint[][]) => {
    drawnPathsRef.current = paths;
    if (sceneRef.current) {
      setCanUndo(sceneRef.current.canUndo());
    }
  }, []);

  useEffect(() => {
    if (!gameContainerRef.current) return;
    if (gameRef.current) return;

    const logicalWidth = 800;
    const logicalHeight = 600;

    const sceneConfig = {
      cakeShape,
      cakeColor,
      nozzleType,
      creamColor,
      backgroundColor,
      backgroundDecoration,
      onPressureUpdate: handlePressureUpdate,
      onPathsChange: handlePathsChange,
      existingPaths: drawnPathsRef.current,
    };

    const freeCreateSceneInstance = new FreeCreateScene();
    (freeCreateSceneInstance as any).initData = sceneConfig;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: logicalWidth,
      height: logicalHeight,
      backgroundColor: backgroundColor,
      scene: [],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: logicalWidth,
        height: logicalHeight,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once('ready', () => {
      game.scene.add('FreeCreateScene', freeCreateSceneInstance, true, sceneConfig);
      sceneRef.current = freeCreateSceneInstance;
    });

    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.refresh();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setCakeShape(cakeShape);
    }
  }, [cakeShape]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setCakeColor(cakeColor);
    }
  }, [cakeColor]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setNozzleType(nozzleType);
    }
  }, [nozzleType]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setCreamColor(creamColor);
    }
  }, [creamColor]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setBackgroundColor(backgroundColor);
    }
  }, [backgroundColor]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setBackgroundDecoration(backgroundDecoration);
    }
  }, [backgroundDecoration]);

  const handleUndo = () => {
    if (sceneRef.current) {
      sceneRef.current.undo();
      setCanUndo(sceneRef.current.canUndo());
    }
  };

  const handleClear = () => {
    if (sceneRef.current) {
      sceneRef.current.clearAll();
      setCanUndo(sceneRef.current.canUndo());
    }
  };

  const handlePressureSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setPressure(value);
    if (sceneRef.current) {
      sceneRef.current.setPressure(value);
    }
  };

  const handleSave = () => {
    if (!sceneRef.current) return;
    if (!artworkName.trim()) {
      alert('请输入作品名称');
      return;
    }

    const thumbnail = sceneRef.current.generateThumbnail();
    const paths = sceneRef.current.getDrawnPaths();

    const usedNozzleTypes = new Set<NozzleType>();
    const usedColors = new Set<string>();
    for (const path of paths) {
      for (const point of path as any) {
        if (point.nozzleType) usedNozzleTypes.add(point.nozzleType);
        if (point.color) usedColors.add(point.color);
      }
    }

    if (isEditing && existingArtwork) {
      updateArtwork(existingArtwork.id, {
        name: artworkName,
        thumbnail,
        cakeShape,
        cakeColor,
        nozzleTypes: Array.from(usedNozzleTypes),
        mainColors: Array.from(usedColors),
        drawnPaths: paths,
        backgroundColor,
        backgroundDecoration,
        rating: artworkRating,
        tags: selectedTags,
        createdAt: existingArtwork.createdAt,
      });
    } else {
      const newArtwork: CakeArtwork = {
        id: `artwork-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: artworkName,
        thumbnail,
        createdAt: new Date().toISOString(),
        cakeShape,
        cakeColor,
        nozzleTypes: Array.from(usedNozzleTypes),
        mainColors: Array.from(usedColors),
        drawnPaths: paths,
        backgroundColor,
        backgroundDecoration,
        rating: artworkRating,
        tags: selectedTags,
      };
      saveArtwork(newArtwork);
      const settlement = submitFreeCreateResult();
      setExpSettlement(settlement);
    }

    setShowSaveModal(false);
    navigate('/gallery');
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < 3) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const renderStarRating = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setArtworkRating(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= artworkRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/gallery')}
            className="flex items-center gap-2 bg-white/80 hover:bg-white text-pink-700 font-medium py-2 px-4 rounded-xl shadow-md transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回展厅</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-pink-600" style={{ fontFamily: 'cursive' }}>
            {isEditing ? '🎨 编辑作品' : '🎨 自由创作'}
          </h1>
          <div className="w-28" />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="flex-1 w-full">
            <div
              ref={gameContainerRef}
              className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border-4 border-pink-200 w-full"
              style={{ aspectRatio: '4/3', maxWidth: '800px' }}
            />
            <div className="mt-3 text-center text-sm text-pink-700 bg-white/70 rounded-xl py-2 px-4">
              🎮 按住鼠标左键裱花，滚轮调节力度
            </div>
          </div>

          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-pink-200">
              <h3 className="font-bold text-pink-700 mb-3 flex items-center gap-2">
                <Circle className="w-5 h-5" />
                蛋糕胚形状
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {CAKE_SHAPES.map((shape) => (
                  <button
                    key={shape.value}
                    onClick={() => setCakeShape(shape.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      cakeShape === shape.value
                        ? 'border-pink-400 bg-pink-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-pink-300'
                    }`}
                  >
                    {shape.icon}
                    <span className="text-xs font-medium text-gray-700">{shape.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-orange-200">
              <h3 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                蛋糕底色
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {CAKE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCakeColor(color)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                      cakeColor === color ? 'border-orange-400 ring-2 ring-orange-300' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-purple-200">
              <h3 className="font-bold text-purple-700 mb-3 flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                花嘴类型
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {NOZZLE_TYPES.map((nozzle) => (
                  <button
                    key={nozzle.value}
                    onClick={() => setNozzleType(nozzle.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                      nozzleType === nozzle.value
                        ? 'border-purple-400 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <span className="text-xl">{nozzle.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{nozzle.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-pink-200">
              <h3 className="font-bold text-pink-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                奶油颜色
              </h3>
              <div className="grid grid-cols-6 gap-2">
                {CREAM_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCreamColor(color)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                      creamColor === color ? 'border-pink-400 ring-2 ring-pink-300' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-green-200">
              <h3 className="font-bold text-green-700 mb-3">力度控制</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">轻</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={pressure}
                  onChange={handlePressureSlider}
                  className="flex-1 h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <span className="text-xs text-gray-500">重</span>
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                当前力度: {Math.round(pressure * 100)}%
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-blue-200">
              <h3 className="font-bold text-blue-700 mb-3">背景装饰</h3>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {BACKGROUND_DECORATIONS.map((deco) => (
                  <button
                    key={deco.value}
                    onClick={() => setBackgroundDecoration(deco.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                      backgroundDecoration === deco.value
                        ? 'border-blue-400 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <span className="text-lg">{deco.icon}</span>
                    <span className="text-xs text-gray-600">{deco.label}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {BACKGROUND_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    className={`w-full aspect-square rounded-md border transition-all hover:scale-110 ${
                      backgroundColor === color ? 'border-blue-400 ring-2 ring-blue-300' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-bold py-3 px-4 rounded-xl shadow transition-all"
              >
                <Undo2 className="w-5 h-5" />
                <span>撤销</span>
              </button>
              <button
                onClick={handleClear}
                className="flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 px-4 rounded-xl shadow transition-all"
              >
                <Trash2 className="w-5 h-5" />
                <span>清空</span>
              </button>
            </div>

            <button
              onClick={() => setShowSaveModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <Save className="w-5 h-5" />
              <span>保存作品</span>
            </button>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-4 border-pink-200">
            <h2 className="text-2xl font-bold text-pink-600 mb-4 text-center" style={{ fontFamily: 'cursive' }}>
              💝 保存作品
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">作品名称</label>
                <input
                  type="text"
                  value={artworkName}
                  onChange={(e) => setArtworkName(e.target.value)}
                  placeholder="给你的蛋糕起个名字吧~"
                  className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">自评评分</label>
                <div className="flex justify-center">{renderStarRating()}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择标签 (最多3个)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-pink-400 text-white'
                          : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
              >
                {isEditing ? '更新作品' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {expSettlement && (
        <ExpSettlementToast
          settlement={expSettlement}
          onClose={() => setExpSettlement(null)}
        />
      )}
    </div>
  );
};

export default FreeCreate;
