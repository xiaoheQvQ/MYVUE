// api/album.js
import request from '../request';

// 获取专辑详情
export function getAlbumDetail(id) {
  return request({
    url: `/api/album/${id}`,
    method: 'get'
  });
}

// 获取艺术家的专辑列表
export function getArtistAlbums(artistId) {
  return request({
    url: `/api/album/artist/${artistId}`,
    method: 'get'
  });
}

// 获取最新专辑
export function getLatestAlbums(limit = 10) {
  return request({
    url: '/api/album/latest',
    method: 'get',
    params: { limit }
  });
}

// 点赞专辑
export function likeAlbum(id, userId) {
  return request({
    url: `/api/album/${id}/like`,
    method: 'post',
    params: { userId }
  });
}

// 收藏专辑
export function collectAlbum(id, userId) {
  return request({
    url: `/api/album/${id}/collect`,
    method: 'post',
    params: { userId }
  });
}

// api/playlist.js
import request from '../request';

// 获取用户的歌单列表
export function getUserPlaylists(userId) {
  return request({
    url: `/api/playlist/user/${userId}`,
    method: 'get'
  });
}

// 获取歌单详情
export function getPlaylistDetail(id) {
  return request({
    url: `/api/playlist/${id}`,
    method: 'get'
  });
}

// 创建歌单
export function createPlaylist(data) {
  return request({
    url: '/api/playlist',
    method: 'post',
    data
  });
}

// 更新歌单
export function updatePlaylist(id, data) {
  return request({
    url: `/api/playlist/${id}`,
    method: 'put',
    data
  });
}

// 删除歌单
export function deletePlaylist(id, userId) {
  return request({
    url: `/api/playlist/${id}`,
    method: 'delete',
    params: { userId }
  });
}

// 添加歌曲到歌单
export function addMusicToPlaylist(playlistId, musicId) {
  return request({
    url: `/api/playlist/${playlistId}/music`,
    method: 'post',
    params: { musicId }
  });
}

// 从歌单移除歌曲
export function removeMusicFromPlaylist(playlistId, musicId) {
  return request({
    url: `/api/playlist/${playlistId}/music`,
    method: 'delete',
    params: { musicId }
  });
}

// 更新歌单歌曲顺序
export function updatePlaylistOrder(playlistId, musicIds) {
  return request({
    url: `/api/playlist/${playlistId}/order`,
    method: 'put',
    data: musicIds
  });
}

// 点赞歌单
export function likePlaylist(id, userId) {
  return request({
    url: `/api/playlist/${id}/like`,
    method: 'post',
    params: { userId }
  });
}

// 收藏歌单
export function collectPlaylist(id, userId) {
  return request({
    url: `/api/playlist/${id}/collect`,
    method: 'post',
    params: { userId }
  });
}

// api/search.js
import request from '../request';

// 搜索音乐
export function searchMusic(params) {
  return request({
    url: '/api/search/music',
    method: 'get',
    params
  });
}

// 获取热门搜索关键词
export function getHotKeywords(limit = 10) {
  return request({
    url: '/api/search/hot-keywords',
    method: 'get',
    params: { limit }
  });
}

// 获取搜索建议
export function getSearchSuggest(keyword, limit = 10) {
  return request({
    url: '/api/search/suggest',
    method: 'get',
    params: { keyword, limit }
  });
}

// api/recommend.js
import request from '../request';

// 获取热门音乐
export function getHotMusic(limit = 20) {
  return request({
    url: '/api/music/recommend/hot',
    method: 'get',
    params: { limit }
  });
}

// 获取新歌推荐
export function getNewMusic(limit = 20) {
  return request({
    url: '/api/music/recommend/new',
    method: 'get',
    params: { limit }
  });
}

// 获取相似音乐
export function getSimilarMusic(musicId, limit = 10) {
  return request({
    url: `/api/music/recommend/similar/${musicId}`,
    method: 'get',
    params: { limit }
  });
}

// 获取个性化推荐
export function getPersonalRecommend(userId, limit = 20) {
  return request({
    url: `/api/music/recommend/personal/${userId}`,
    method: 'get',
    params: { limit }
  });
}

// api/statistics.js
import request from '../request';

// 获取音乐统计概览
export function getMusicOverview() {
  return request({
    url: '/api/music/statistics/overview',
    method: 'get'
  });
}

// 获取播放趋势数据
export function getPlayTrend(days = 7) {
  return request({
    url: `/api/music/statistics/trend/${days}`,
    method: 'get'
  });
}