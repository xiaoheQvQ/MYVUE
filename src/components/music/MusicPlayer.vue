<template>
  <div class="netease-layout">
    <div class="sidebar">
      <div class="logo">
        <div class="logo-icon"><i class="el-icon-headset"></i></div>
        <span>TuneHub</span>
      </div>

      <div class="nav-group">
        <div class="nav-title">在线音乐</div>
        <div class="nav-item" :class="{ active: currentView === 'discover' }" @click="goDiscover">
          <i class="el-icon-finished"></i> 推荐 / 榜单
        </div>
        <div class="nav-item" :class="{ active: currentView === 'search' }" @click="currentView = 'search'">
          <i class="el-icon-search"></i> 搜索
        </div>
      </div>

      <div class="nav-group">
        <div class="nav-title">我的音乐</div>
        <div class="nav-item" :class="{ active: currentView === 'playlist_local' }" @click="currentView = 'playlist_local'">
          <i class="el-icon-tickets"></i> 播放列表
        </div>
      </div>

      <div class="user-card">
        <div class="avatar"><i class="el-icon-user-solid"></i></div>
        <div class="username">Guest User</div>
      </div>
    </div>

    <div class="main-container">
      <div class="header-bar">
        <div class="history-btns">
          <div class="h-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
          <div class="h-btn"><i class="el-icon-arrow-right"></i></div>
        </div>

        <div class="search-wrap">
          <el-input
            placeholder="搜索音乐..."
            v-model="searchKeyword"
            prefix-icon="el-icon-search"
            size="small"
            class="round-input"
            @keyup.enter.native="doSearch">
          </el-input>
        </div>

        <div class="header-actions">
          <i class="el-icon-setting"></i>
          <i class="el-icon-message"></i>
          <i class="el-icon-full-screen"></i>
        </div>
      </div>

      <div class="content-viewport" ref="scrollBox">

        <div v-if="currentView === 'discover'" class="view-discover">
          <div class="banner-section">
            <h1>探索热门音乐</h1>
            <p>全网榜单实时更新</p>
          </div>

          <h2 class="section-header">热门榜单 (Top Lists)</h2>
          <div class="playlist-grid" v-loading="loadingTopList">
            <div
              class="playlist-card"
              v-for="item in topLists"
              :key="item.id"
              @click="openTopList(item)"
            >
              <div class="card-cover">
                <div class="placeholder-cover" :style="getRandomColor(item.id)">
                  <span>{{ item.updateFrequency }}</span>
                  <i class="el-icon-video-play play-overlay"></i>
                </div>
              </div>
              <div class="card-name">{{ item.name }}</div>
            </div>
          </div>
        </div>

        <div v-if="currentView === 'playlist_detail'" class="view-detail">
          <div class="playlist-header">
            <div class="ph-cover" :style="getRandomColor(currentPlaylistId)">
              <span style="font-size: 40px; color: #fff; font-weight: bold;">{{ currentPlaylistName[0] }}</span>
            </div>
            <div class="ph-info">
              <div class="tag">榜单</div>
              <h1>{{ currentPlaylistName }}</h1>
              <div class="ph-actions">
                <el-button type="primary" round icon="el-icon-video-play" @click="playAll">播放全部</el-button>
                <el-button round icon="el-icon-folder-add">收藏</el-button>
              </div>
            </div>
          </div>

          <el-table :data="detailSongs" class="transparent-table" @row-dblclick="playMusic">
            <el-table-column type="index" width="50"></el-table-column>
            <el-table-column label="操作" width="60">
               <template slot-scope="scope">
                 <i class="el-icon-star-off action-icon"></i>
               </template>
            </el-table-column>
            <el-table-column prop="name" label="标题" min-width="200"></el-table-column>
            <el-table-column prop="artist" label="歌手" min-width="150"></el-table-column>
            <el-table-column label="时长" width="100">
               <template>03:00</template></el-table-column>
          </el-table>
        </div>

        <div v-if="currentView === 'search'" class="view-search">
           <div class="search-header">
             <h2>搜索结果: "{{ searchKeyword }}"</h2>
             <el-radio-group v-model="searchSource" size="small" @change="doSearch">
                <el-radio-button label="netease">网易云</el-radio-button>
                <el-radio-button label="qq">QQ音乐</el-radio-button>
                <el-radio-button label="kuwo">酷我</el-radio-button>
             </el-radio-group>
           </div>

           <div v-loading="loading">
              <el-table :data="searchResults" class="transparent-table" @row-dblclick="playMusic" stripe>
                <el-table-column width="60">
                   <template slot-scope="scope">
                     <span v-if="scope.$index < 3" style="color: #ec4141; font-weight: bold;">{{ scope.$index + 1 }}</span>
                     <span v-else>{{ scope.$index + 1 }}</span>
                   </template>
                </el-table-column>
                <el-table-column prop="name" label="音乐标题"></el-table-column>
                <el-table-column prop="artist" label="歌手"></el-table-column>
                <el-table-column prop="album" label="专辑"></el-table-column>
              </el-table>
           </div>
        </div>

        <div v-if="currentView === 'playlist_local'" class="view-search">
            <h2>当前播放队列</h2>
            <el-table :data="playlist" class="transparent-table" @row-dblclick="playFromPlaylist" highlight-current-row>
               <el-table-column width="50">
                  <template slot-scope="scope">
                    <i v-if="currentSong.id === scope.row.id" class="el-icon-loading" style="color:#ec4141"></i>
                    <span v-else>{{ scope.$index + 1 }}</span>
                  </template>
               </el-table-column>
               <el-table-column prop="name" label="标题"></el-table-column>
               <el-table-column prop="artist" label="歌手"></el-table-column>
               <el-table-column width="80">
                  <template slot-scope="scope">
                    <i class="el-icon-close remove-icon" @click.stop="removeFromPlaylist(scope.$index)"></i>
                  </template>
               </el-table-column>
            </el-table>
         </div>

      </div>
    </div>

    <transition name="slide-up">
      <div class="lyrics-page" v-show="showLyricsPanel">
        <div class="lp-bg" :style="{ backgroundImage: `url(${currentSong.pic || defaultCover})` }"></div>
        <div class="lp-overlay"></div>

        <div class="lp-header">
           <i class="el-icon-arrow-down" @click="showLyricsPanel = false"></i>
        </div>

        <div class="lp-content">
           <div class="lp-left">
              <div class="lp-disc-container" :class="{ playing: isPlaying }">
                 <img class="lp-needle" src="https://s4.music.126.net/style/web2/img/frame/needle.png" />
                 <div class="lp-disc">
                    <img :src="currentSong.pic || defaultCover" />
                 </div>
              </div>
           </div>
           <div class="lp-right">
              <h2>{{ currentSong.name }}</h2>
              <p>歌手：{{ currentSong.artist }} - 专辑：{{ currentSong.album || '未知' }}</p>
              <div class="lyric-scroll" ref="lyricBox">
                 <div class="placeholder" v-if="!lyrics.length">暂无歌词</div>
                 <p
                   v-for="(line, idx) in lyrics"
                   :key="idx"
                   :class="{ active: currentLyricIndex === idx }"
                 >{{ line.text }}</p>
              </div>
           </div>
        </div>
      </div>
    </transition>

    <div class="footer-player">
      <div class="fp-meta" @click="showLyricsPanel = !showLyricsPanel">
         <img :src="currentSong.pic || defaultCover" class="fp-cover" />
         <div class="fp-text">
            <div class="fp-title">{{ currentSong.name || 'TuneHub 音乐' }}</div>
            <div class="fp-artist">{{ currentSong.artist || '听你想听' }}</div>
         </div>
      </div>

      <div class="fp-control-group">
         <div class="fp-btns">
            <i class="el-icon-refresh-left tool-icon"></i> <i class="el-icon-caret-left main-icon" @click="playPrev"></i>
            <div class="play-circle" @click="togglePlay">
               <i :class="isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'"></i>
            </div>
            <i class="el-icon-caret-right main-icon" @click="playNext"></i>
            <i class="el-icon-files tool-icon" @click="currentView = 'playlist_local'"></i>
         </div>
         <div class="fp-progress">
            <span>{{ formatTime(currentTime) }}</span>
            <el-slider v-model="progressPercent" @change="handleSeek" :show-tooltip="false" class="thin-slider"></el-slider>
            <span>{{ formatTime(duration) }}</span>
         </div>
      </div>

      <div class="fp-volume">
         <i class="el-icon-headset"></i>
         <el-slider v-model="volume" class="volume-slider" :show-tooltip="false"></el-slider>
      </div>
    </div>

    <audio ref="audio" :src="audioUrl" @timeupdate="onTimeUpdate" @ended="playNext" @loadedmetadata="onLoadedMetadata" @error="onError" autoplay crossorigin="anonymous"></audio>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      baseUrl: 'https://music-dl.sayqz.com/api/',
      currentView: 'discover', // discover, search, playlist_detail, playlist_local
      searchKeyword: '',
      searchSource: 'netease',

      // 榜单/推荐数据
      topLists: [],
      loadingTopList: false,

      // 详情页数据
      detailSongs: [],
      currentPlaylistName: '',
      currentPlaylistId: '',

      // 播放状态
      playlist: [],
      searchResults: [],
      currentSong: {},
      currentIndex: -1,
      isPlaying: false,
      audioUrl: '',
      currentTime: 0,
      duration: 0,
      progressPercent: 0,
      volume: 80,

      // 歌词
      showLyricsPanel: false,
      lyrics: [],
      currentLyricIndex: 0,

      loading: false,
      defaultCover: 'https://p2.music.126.net/tGHU62DTszbFQ37W9qPH5A==/109951165607024789.jpg'
    }
  },
  mounted () {
    // 初始化获取榜单作为“推荐”
    this.fetchTopLists()
  },
  watch: {
    volume (val) {
      if (this.$refs.audio) this.$refs.audio.volume = val / 100
    }
  },
  methods: {
    // --- API 交互 ---
    async fetchTopLists () {
      this.loadingTopList = true
      try {
        // 使用 type=toplists 获取榜单列表
        const res = await axios.get(this.baseUrl, {
          params: { source: 'netease', type: 'toplists' }
        })
        if (res.data.code === 200) {
          // 只取前8个展示，作为“推荐榜单”
          this.topLists = res.data.data.list.slice(0, 8)
        }
      } catch (e) {
        console.error(e)
      } finally {
        this.loadingTopList = false
      }
    },

    async openTopList (item) {
      this.loading = true
      this.currentPlaylistName = item.name
      this.currentPlaylistId = item.id
      this.currentView = 'playlist_detail'
      this.detailSongs = [] // 清空

      try {
        // 使用 type=toplist 获取榜单内的歌曲
        const res = await axios.get(this.baseUrl, {
          params: { source: 'netease', type: 'toplist', id: item.id }
        })
        if (res.data.code === 200) {
          // 补全 source 字段，方便后续播放
          this.detailSongs = res.data.data.list.map(song => ({ ...song, source: 'netease', album: '榜单热歌' }))
        }
      } catch (e) {
        this.$message.error('榜单加载失败')
      } finally {
        this.loading = false
      }
    },

    async doSearch () {
      if (!this.searchKeyword) return
      this.currentView = 'search'
      this.loading = true
      try {
        const res = await axios.get(this.baseUrl, {
          params: {
            source: this.searchSource,
            type: 'search',
            keyword: this.searchKeyword
          }
        })
        if (res.data.code === 200) {
          this.searchResults = res.data.data.results.map(s => ({
            ...s,
            source: s.source || s.platform || this.searchSource
          }))
        }
      } catch (e) {
        this.$message.error('搜索失败')
      } finally {
        this.loading = false
      }
    },

    // --- 播放逻辑 ---
    playAll () {
      if (this.detailSongs.length > 0) {
        this.playlist = [...this.detailSongs]
        this.playFromPlaylist(this.playlist[0])
      }
    },

    playMusic (row) {
      // 插入到当前播放列表并播放
      const exist = this.playlist.find(p => p.id === row.id)
      if (!exist) {
        this.playlist.unshift(row)
      }
      this.playFromPlaylist(row)
    },

    async playFromPlaylist (row) {
      this.currentSong = row
      this.currentIndex = this.playlist.findIndex(p => p.id === row.id)

      // 1. 获取 URL (302 Redirect)
      this.audioUrl = `${this.baseUrl}?source=${row.source}&id=${row.id}&type=url`

      // 2. 获取封面
      this.currentSong.pic = `${this.baseUrl}?source=${row.source}&id=${row.id}&type=pic`

      // 3. 获取歌词
      this.fetchLyrics(row.source, row.id)

      this.isPlaying = true
    },

    async fetchLyrics (source, id) {
      this.lyrics = []
      this.currentLyricIndex = 0
      try {
        const res = await axios.get(this.baseUrl, {
          params: { source, id, type: 'lrc' }
        })
        if (typeof res.data === 'string') {
          this.parseLrc(res.data)
        }
      } catch (e) {}
    },

    parseLrc (text) {
      const lines = text.split('\n')
      const reg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/
      lines.forEach(line => {
        const match = reg.exec(line)
        if (match) {
          const t = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 1000
          const txt = line.replace(reg, '').trim()
          if (txt) this.lyrics.push({ time: t, text: txt })
        }
      })
    },

    // --- 控件 ---
    togglePlay () {
      const audio = this.$refs.audio
      if (this.isPlaying) audio.pause()
      else audio.play()
      this.isPlaying = !this.isPlaying
    },

    playNext () {
      if (!this.playlist.length) return
      let idx = this.currentIndex + 1
      if (idx >= this.playlist.length) idx = 0
      this.playFromPlaylist(this.playlist[idx])
    },

    playPrev () {
      if (!this.playlist.length) return
      let idx = this.currentIndex - 1
      if (idx < 0) idx = this.playlist.length - 1
      this.playFromPlaylist(this.playlist[idx])
    },

    onTimeUpdate (e) {
      this.currentTime = e.target.currentTime
      if (this.duration) this.progressPercent = (this.currentTime / this.duration) * 100

      // 歌词滚动
      if (this.lyrics.length) {
        for (let i = 0; i < this.lyrics.length; i++) {
          if (this.currentTime < this.lyrics[i].time) {
            if (this.currentLyricIndex !== i - 1 && i > 0) {
              this.currentLyricIndex = i - 1
              this.scrollLrc()
            }
            break
          }
          if (i === this.lyrics.length - 1) this.currentLyricIndex = i
        }
      }
    },

    scrollLrc () {
      const box = this.$refs.lyricBox
      if (box) {
        box.scrollTop = this.currentLyricIndex * 40 - 150
      }
    },

    onLoadedMetadata (e) {
      this.duration = e.target.duration
      this.isPlaying = true
    },

    onError () {
      this.isPlaying = false
      // this.$message.error('无法播放，可能源受限');
      // 自动切歌
      setTimeout(() => this.playNext(), 1000)
    },

    handleSeek (val) {
      const t = (val / 100) * this.duration
      this.$refs.audio.currentTime = t
    },

    removeFromPlaylist (idx) {
      this.playlist.splice(idx, 1)
    },

    // UI Helpers
    goDiscover () {
      this.currentView = 'discover'
    },
    goBack () {
      this.currentView = 'discover' // 简单模拟返回
    },
    formatTime (s) {
      if (!s) return '00:00'
      const m = Math.floor(s / 60).toString().padStart(2, '0')
      const sc = Math.floor(s % 60).toString().padStart(2, '0')
      return `${m}:${sc}`
    },
    getRandomColor (id) {
      // 根据ID生成一个固定渐变色，模拟封面
      const colors = [
        'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%)',
        'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
        'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)',
        'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)'
      ]
      const idx = (parseInt(id) || 0) % colors.length
      return { background: colors[idx] }
    }
  }
}
</script>

<style scoped>
/* 全局重置与变量 */
* { box-sizing: border-box; }
.netease-layout {
  display: flex;
  height: 100vh;
  background: #fff;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  color: #333;
  overflow: hidden;
}

/* 1. 侧边栏 */
.sidebar {
  width: 220px;
  background: #f6f6f6;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  border-right: 1px solid #e0e0e0;
}
.logo {
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 30px;
}
.logo-icon {
  width: 32px;
  height: 32px;
  background: #ec4141;
  color: #fff;
  border-radius: 50%;
  text-align: center;
  line-height: 32px;
  margin-right: 10px;
  font-size: 18px;
}
.nav-group { margin-bottom: 20px; }
.nav-title {
  padding: 0 20px;
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}
.nav-item {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 14px;
  color: #555;
  cursor: pointer;
  border-left: 3px solid transparent;
}
.nav-item:hover { background: #edEDED; }
.nav-item.active {
  background: #e6e7ea;
  color: #ec4141;
  font-weight: 600;
  border-left-color: #ec4141;
}
.nav-item i { margin-right: 10px; font-size: 16px; }

.user-card {
  margin-top: auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ddd;
  text-align: center;
  line-height: 30px;
  margin-right: 10px;
  color: #fff;
}

/* 2. 主内容区 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #fff;
}
.header-bar {
  height: 60px;
  background: #fff; /* 网易云新版是白色或红色 */
  display: flex;
  align-items: center;
  padding: 0 30px;
  justify-content: space-between;
  z-index: 10;
  /* border-bottom: 1px solid #f2f2f2; */
}
.history-btns .h-btn {
  display: inline-block;
  width: 28px;
  height: 28px;
  background: #ededed;
  border-radius: 50%;
  text-align: center;
  line-height: 28px;
  margin-right: 10px;
  cursor: pointer;
  color: #666;
}
.search-wrap { width: 300px; }
/* Element UI Input Override */
.round-input >>> .el-input__inner {
  border-radius: 20px;
  background: #f7f7f7;
  border: none;
}
.header-actions i {
  font-size: 18px;
  color: #999;
  margin-left: 20px;
  cursor: pointer;
}
.header-actions i:hover { color: #333; }

.content-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 20px 30px 90px 30px; /* Bottom padding for player */
}

/* Discover Page */
.banner-section {
  margin-bottom: 30px;
}
.banner-section h1 { font-size: 28px; margin: 0 0 5px 0; }
.banner-section p { color: #999; margin: 0; }

.section-header {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  border-left: 4px solid #ec4141;
  padding-left: 10px;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}
.playlist-card {
  cursor: pointer;
}
.card-cover {
  width: 100%;
  padding-bottom: 100%; /* 1:1 Aspect Ratio */
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}
.placeholder-cover {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 16px;
  background-size: 200% 200%;
}
.play-overlay {
  position: absolute;
  right: 10px;
  bottom: 10px;
  font-size: 32px;
  color: rgba(255,255,255,0.8);
  opacity: 0;
  transition: all 0.3s;
}
.playlist-card:hover .play-overlay { opacity: 1; transform: scale(1.1); }
.card-name {
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

/* Detail Page */
.playlist-header {
  display: flex;
  margin-bottom: 30px;
}
.ph-cover {
  width: 180px;
  height: 180px;
  border-radius: 8px;
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ph-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.ph-info .tag {
  border: 1px solid #ec4141;
  color: #ec4141;
  font-size: 12px;
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
  margin-bottom: 10px;
}
.ph-info h1 { margin: 0 0 10px 0; font-size: 24px; }
.ph-actions { margin-top: auto; }

/* Table Styles */
.transparent-table { background: transparent !important; }
.transparent-table >>> th { background: transparent !important; border-bottom: 1px solid #eee; }
.transparent-table >>> tr { background: transparent !important; }
.transparent-table >>> .el-table__row:hover > td { background-color: #f5f5f7 !important; cursor: pointer; }
.action-icon { cursor: pointer; color: #999; font-size: 16px; }
.remove-icon { cursor: pointer; color: #999; }
.remove-icon:hover { color: #ec4141; }

/* 3. Footer Player */
.footer-player {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 72px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 20px;
  z-index: 200;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}
.fp-meta {
  width: 250px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.fp-cover { width: 48px; height: 48px; border-radius: 4px; margin-right: 10px; }
.fp-text { display: flex; flex-direction: column; overflow: hidden; }
.fp-title { font-size: 14px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fp-artist { font-size: 12px; color: #666; }

.fp-control-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.fp-btns {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 4px;
}
.tool-icon { font-size: 18px; color: #666; cursor: pointer; }
.main-icon { font-size: 28px; color: #333; cursor: pointer; }
.main-icon:hover { color: #ec4141; }
.play-circle {
  width: 36px; height: 36px;
  background: #f4f4f4;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; cursor: pointer;
}
.play-circle:hover { background: #e0e0e0; }

.fp-progress {
  width: 400px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
}
.thin-slider { flex: 1; margin: 0 10px; }
.thin-slider >>> .el-slider__bar { background-color: #ec4141; }
.thin-slider >>> .el-slider__button { border-color: #ec4141; width: 10px; height: 10px; }

.fp-volume {
  width: 150px;
  display: flex;
  align-items: center;
  margin-left: 20px;
}
.fp-volume i { font-size: 20px; margin-right: 10px; color: #666; }
.volume-slider { flex: 1; }

/* 4. Lyrics Page Overlay */
.lyrics-page {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 72px; /* Above footer */
  z-index: 100;
  background: #333;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.lp-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-size: cover;
  background-position: center;
  filter: blur(60px) brightness(0.5);
  transform: scale(1.2);
  z-index: 1;
}
.lp-overlay {
  position: absolute; top:0;left:0;right:0;bottom:0;
  background: rgba(0,0,0,0.3);
  z-index: 2;
}
.lp-header {
  position: relative; z-index: 10;
  padding: 20px 30px;
}
.lp-header i { color: #fff; font-size: 24px; cursor: pointer; opacity: 0.6; }
.lp-header i:hover { opacity: 1; }

.lp-content {
  flex: 1;
  position: relative;
  z-index: 10;
  display: flex;
  padding: 0 50px;
}
.lp-left { flex: 1; display: flex; justify-content: center; align-items: center; position: relative; }
.lp-disc-container {
  position: relative;
  width: 320px; height: 320px;
}
.lp-needle {
  position: absolute; top: -70px; left: 50%; width: 100px;
  transform-origin: 0 0;
  transform: rotate(-30deg);
  transition: all 0.5s;
  z-index: 20;
}
.lp-disc-container.playing .lp-needle { transform: rotate(0deg); }

.lp-disc {
  width: 300px; height: 300px;
  background: #111;
  border-radius: 50%;
  border: 8px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  animation: rotate 20s linear infinite;
  animation-play-state: paused;
}
.lp-disc-container.playing .lp-disc { animation-play-state: running; }

.lp-disc img { width: 200px; height: 200px; border-radius: 50%; }

@keyframes rotate { from{transform: rotate(0deg)} to{transform: rotate(360deg)} }

.lp-right {
  flex: 1;
  color: #fff;
  text-align: center;
  display: flex;
  flex-direction: column;
}
.lp-right h2 { margin-bottom: 10px; font-weight: normal; }
.lp-right p { color: #ccc; font-size: 14px; margin-bottom: 30px; }

.lyric-scroll {
  flex: 1;
  overflow-y: auto;
  mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
  scrollbar-width: none;
}
.lyric-scroll::-webkit-scrollbar { display: none; }
.lyric-scroll p {
  color: rgba(255,255,255,0.4);
  margin: 16px 0;
  font-size: 15px;
  transition: all 0.3s;
}
.lyric-scroll p.active {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255,255,255,0.5);
}

/* 动画 */
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.4s; }
.slide-up-enter, .slide-up-leave-to { transform: translateY(100%); }
</style>
