<template>
  <div class="music-page">
    <div class="header">
      <div class="title-section">
        <h1 class="page-title">TuneHub Local</h1>
        <api-switch class="api-toggle" />
      </div>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索歌曲、歌手、专辑..."
          prefix-icon="el-icon-search"
          @keyup.enter.native="handleSearch"
          class="custom-search"
        >
          <el-button slot="append" @click="handleSearch">搜索</el-button>
        </el-input>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧：搜索结果/歌单 -->
      <div class="content-left">
        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="10" animated />
        </div>
        <div v-else-if="results.length > 0" class="result-list">
          <div class="section-header">
            <span>搜索结果 ({{ total }})</span>
          </div>
          <el-table :data="results" style="width: 100%" @row-dblclick="playSong" highlight-current-row>
            <el-table-column label="#" type="index" width="50"></el-table-column>
            <el-table-column prop="name" label="歌名" min-width="150">
              <template slot-scope="scope">
                <span class="song-name">{{ scope.row.name }}</span>
                <el-tag v-if="scope.row.platform" size="mini" effect="plain" class="platform-tag">
                  {{ scope.row.platform }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="artist" label="歌手" width="120"></el-table-column>
            <el-table-column prop="album" label="专辑" width="150"></el-table-column>
            <el-table-column label="操作" width="100">
              <template slot-scope="scope">
                <el-button type="text" icon="el-icon-video-play" @click="playSong(scope.row)">播放</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else class="empty-state">
          <i class="el-icon-headset"></i>
          <p>开始发现好听的音乐吧</p>
        </div>
      </div>

      <!-- 右侧：播放详情与歌词 -->
      <div class="content-right" v-if="currentSong">
        <div class="player-info">
          <div class="album-cover">
            <el-image :src="currentSong.pic" fit="cover" class="cover-img">
              <div slot="placeholder" class="image-slot">
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
          </div>
          <div class="song-detail">
            <h2>{{ currentSong.name }}</h2>
            <p>{{ currentSong.artist }} - {{ currentSong.album }}</p>
          </div>
          <div class="lyric-container" ref="lyricBox">
            <div v-if="lyrics.length > 0" class="lyric-list">
              <p
                v-for="(line, index) in lyrics"
                :key="index"
                :class="{ active: currentLyricIndex === index }"
              >
                {{ line.text }}
              </p>
            </div>
            <div v-else class="no-lyric">暂无歌词</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部播放条 -->
    <div class="player-footer" v-if="currentSong">
      <div class="audio-container">
        <audio
          ref="audioPlayer"
          :src="currentSong.url"
          autoplay
          controls
          @timeupdate="onTimeUpdate"
          class="native-player"
        ></audio>
      </div>
    </div>
  </div>
</template>

<script>
import ApiSwitch from './ApiSwitch.vue'
import musicApi from '@/api/music/music'

export default {
  name: 'MusicPlayer',
  components: { ApiSwitch },
  data() {
    return {
      keyword: '',
      loading: false,
      results: [],
      total: 0,
      currentSong: null,
      lyrics: [],
      currentLyricIndex: 0,
    }
  },
  methods: {
    async handleSearch() {
      if (!this.keyword) return
      this.loading = true
      try {
        const res = await musicApi.aggregateSearch(this.keyword)
        if (res.code === 200) {
          this.results = res.data.results
          this.total = res.data.total || this.results.length
        }
      } catch (err) {
        this.$message.error('搜索失败')
      } finally {
        this.loading = false
      }
    },
    async playSong(row) {
      try {
        const res = await musicApi.getSongInfo(row.platform, row.id)
        if (res.code === 200) {
          this.currentSong = {
            ...res.data,
            id: row.id,
            platform: row.platform,
            // 修正链接，如果是本地模式，确保使用完整URL
            url: musicApi.getSongUrl(row.platform, row.id),
            pic: musicApi.getAlbumPic(row.platform, row.id)
          }
          this.fetchLyrics(row.platform, row.id)
        }
      } catch (err) {
        this.$message.error('无法获取歌曲信息')
      }
    },
    async fetchLyrics(source, id) {
      try {
        const lrc = await musicApi.getSongLrc(source, id)
        if (lrc) {
          this.parseLyric(lrc)
        } else {
          this.lyrics = []
        }
      } catch (err) {
        this.lyrics = []
      }
    },
    parseLyric(text) {
      const lines = text.split('\n')
      const result = []
      const pattern = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/
      
      lines.forEach(line => {
        const matches = line.match(pattern)
        if (matches) {
          const time = parseInt(matches[1]) * 60 + parseInt(matches[2]) + parseInt(matches[3]) / 1000
          const content = line.replace(pattern, '').trim()
          if (content) {
            result.push({ time, text: content })
          }
        }
      })
      this.lyrics = result.sort((a, b) => a.time - b.time)
    },
    onTimeUpdate() {
      if (!this.$refs.audioPlayer || this.lyrics.length === 0) return
      const currentTime = this.$refs.audioPlayer.currentTime
      
      let index = this.lyrics.findIndex(l => l.time > currentTime)
      if (index === -1) index = this.lyrics.length
      this.currentLyricIndex = index - 1
      
      // 自动滚动歌词
      if (this.currentLyricIndex >= 0) {
        const activeLine = this.$refs.lyricBox.querySelectorAll('p')[this.currentLyricIndex]
        if (activeLine) {
          this.$refs.lyricBox.scrollTop = activeLine.offsetTop - 150
        }
      }
    }
  }
}
</script>

<style scoped>
.music-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  background: #fff;
  padding: 15px 25px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.search-bar {
  width: 400px;
}

.main-content {
  display: flex;
  gap: 20px;
  flex: 1;
  margin-bottom: 80px;
}

.content-left {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.content-right {
  width: 350px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}

.section-header {
  font-weight: bold;
  margin-bottom: 15px;
  color: #606266;
}

.empty-state {
  text-align: center;
  padding: 100px 0;
  color: #909399;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 20px;
}

.song-name {
  font-weight: 500;
}

.platform-tag {
  margin-left: 8px;
}

.album-cover {
  width: 250px;
  height: 250px;
  margin: 0 auto 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.cover-img {
  width: 100%;
  height: 100%;
}

.song-detail {
  text-align: center;
  margin-bottom: 25px;
}

.song-detail h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

.song-detail p {
  color: #909399;
  margin: 0;
}

.lyric-container {
  flex: 1;
  overflow-y: auto;
  text-align: center;
  padding: 20px 0;
  mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent);
}

.lyric-list p {
  padding: 10px 0;
  margin: 0;
  color: #606266;
  transition: all 0.3s;
  font-size: 14px;
}

.lyric-list p.active {
  color: #409EFF;
  font-size: 18px;
  font-weight: bold;
  transform: scale(1.1);
}

.player-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: #fff;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  z-index: 1000;
}

.audio-container {
  width: 800px;
}

.native-player {
  width: 100%;
}

.no-lyric {
  color: #909399;
  padding-top: 50px;
}
</style>
