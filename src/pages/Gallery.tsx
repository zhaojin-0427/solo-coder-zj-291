import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { CakeArtwork, SortBy, NozzleType } from '@/types/game';
import { ArrowLeft, Plus, Trash2, Edit3, Star, Clock, Palette, Filter, Search } from 'lucide-react';

const NOZZLE_LABELS: Record<NozzleType, string> = {
  round: '圆口',
  star: '星形',
  leaf: '叶片',
  writing: '写字',
};

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'newest', label: '最新' },
  { value: 'oldest', label: '最早' },
  { value: 'highest_rated', label: '评分最高' },
  { value: 'lowest_rated', label: '评分最低' },
];

const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const { getArtworks, deleteArtwork } = useGameStore();

  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [selectedArtwork, setSelectedArtwork] = useState<CakeArtwork | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [artworkToDelete, setArtworkToDelete] = useState<string | null>(null);

  const artworks = getArtworks(sortBy);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArtworkToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (artworkToDelete) {
      deleteArtwork(artworkToDelete);
    }
    setShowDeleteConfirm(false);
    setArtworkToDelete(null);
    setSelectedArtwork(null);
  };

  const handleEdit = (id: string) => {
    navigate(`/free-create/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 p-2 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white/80 hover:bg-white text-pink-700 font-medium py-2 px-4 rounded-xl shadow-md transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回首页</span>
          </button>
          <h1 className="text-2xl md:text-4xl font-bold text-pink-600" style={{ fontFamily: 'cursive' }}>
            🎨 我的作品展厅
          </h1>
          <button
            onClick={() => navigate('/free-create')}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>新建作品</span>
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl p-4 mb-6 shadow-lg border-2 border-pink-200">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-pink-500" />
              <span className="font-medium text-pink-700">筛选排序:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    sortBy === option.value
                      ? 'bg-pink-400 text-white shadow-md'
                      : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
              <Search className="w-4 h-4" />
              <span>共 {artworks.length} 个作品</span>
            </div>
          </div>
        </div>

        {artworks.length === 0 ? (
          <div className="bg-white/80 backdrop-blur rounded-3xl p-12 shadow-lg border-4 border-pink-200 text-center">
            <div className="text-6xl mb-4">🎂</div>
            <h2 className="text-2xl font-bold text-pink-600 mb-2">还没有作品哦~</h2>
            <p className="text-gray-600 mb-6">发挥你的创意，创作第一个蛋糕作品吧！</p>
            <button
              onClick={() => navigate('/free-create')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>开始创作</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {artworks.map((artwork) => (
              <div
                key={artwork.id}
                onClick={() => setSelectedArtwork(artwork)}
                className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-pink-200 hover:border-pink-400 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  <img
                    src={artwork.thumbnail}
                    alt={artwork.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteClick(artwork.id, e)}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-2 truncate">{artwork.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    {renderStars(artwork.rating)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(artwork.createdAt)}</span>
                  </div>
                  {artwork.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {artwork.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedArtwork && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedArtwork(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-pink-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedArtwork.thumbnail}
                alt={selectedArtwork.name}
                className="w-full aspect-[4/3] object-cover"
              />
              <button
                onClick={() => setSelectedArtwork(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedArtwork.name}
                  </h2>
                  {renderStars(selectedArtwork.rating)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(selectedArtwork.id)}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500 text-white font-medium py-2 px-4 rounded-xl shadow transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>编辑</span>
                  </button>
                  <button
                    onClick={() => {
                      setArtworkToDelete(selectedArtwork.id);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 font-medium py-2 px-4 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>删除</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-pink-50 rounded-xl p-3">
                  <p className="text-xs text-pink-500 mb-1">蛋糕形状</p>
                  <p className="font-medium text-pink-700">
                    {selectedArtwork.cakeShape === 'circle'
                      ? '圆形'
                      : selectedArtwork.cakeShape === 'square'
                      ? '方形'
                      : '爱心'}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-xs text-orange-500 mb-1">蛋糕底色</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-orange-200"
                      style={{ backgroundColor: selectedArtwork.cakeColor }}
                    />
                    <span className="font-medium text-orange-700 text-sm">
                      {selectedArtwork.cakeColor}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <Palette className="w-4 h-4" />
                  使用花嘴
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedArtwork.nozzleTypes.length > 0 ? (
                    selectedArtwork.nozzleTypes.map((nozzle) => (
                      <span
                        key={nozzle}
                        className="px-3 py-1 bg-purple-100 text-purple-600 text-sm rounded-full font-medium"
                      >
                        {NOZZLE_LABELS[nozzle]}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">暂无</span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">主要颜色</p>
                <div className="flex flex-wrap gap-2">
                  {selectedArtwork.mainColors.length > 0 ? (
                    selectedArtwork.mainColors.map((color, index) => (
                      <div
                        key={index}
                        className="w-10 h-10 rounded-lg border-2 border-white shadow-md"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">暂无</span>
                  )}
                </div>
              </div>

              {selectedArtwork.tags.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">自评标签</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArtwork.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-pink-100 text-pink-600 text-sm rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  创作时间: {formatDate(selectedArtwork.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-pink-200">
            <div className="text-center">
              <div className="text-5xl mb-4">🗑️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">确定删除作品吗？</h3>
              <p className="text-gray-600 mb-6">删除后将无法恢复，请谨慎操作</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setArtworkToDelete(null);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
