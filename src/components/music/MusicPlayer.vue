<template>
    <div class="mu-player" :class="{ 'fullscreen-mode': isFullscreen }">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="logo">
                <div class="logo-inner">
                    <i class="el-icon-headset"></i>
                    <span>漫跃</span>
                </div>
            </div>

            <nav class="nav-menu">
                <div class="menu-item" :class="{ active: activeMenu === 'search' }" @click="activeMenu = 'search'">
                    <i class="el-icon-search"></i> 搜索音乐
                </div>
                <div class="menu-item" :class="{ active: activeMenu === 'discover' }" @click="activeMenu = 'discover'">
                    <i class="el-icon-discover"></i> 发现音乐
                </div>
                <div class="menu-item" :class="{ active: activeMenu === 'results' }" @click="activeMenu = 'results'">
                    <i class="el-icon-refresh"></i> 搜索结果
                </div>
                <div class="menu-item">
                    <i class="el-icon-tickets"></i> 播放列表
                </div>
                <div class="menu-item" :class="{ active: activeMenu === 'favorites' }"
                    @click="activeMenu = 'favorites'">
                    <i class="el-icon-star-on"></i> 我的收藏
                </div>
            </nav>

            <div class="sidebar-bottom">
                <div class="settings-item">
                    <i class="el-icon-setting"></i> 设置
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-container">
            <!-- Content Area -->
            <div class="content-scroll">
                <!-- Favorites View (as per Screenshot 2) -->
                <div v-if="activeMenu === 'favorites'" class="favorites-view">
                    <div class="view-header">
                        <div class="title-section">
                            <h1>我的收藏</h1>
                            <p>管理你的歌单和收藏</p>
                        </div>
                        <div class="action-btns">
                            <el-button type="primary" size="small" icon="el-icon-plus" round
                                @click="showNewPlaylistModal">新建歌单</el-button>
                            <el-button size="small" icon="el-icon-download" round
                                @click="importModalVisible = true">导入歌单</el-button>
                        </div>
                    </div>

                    <div class="playlist-list">
                        <div class="playlist-item default">
                            <div class="playlist-cover">
                                <i class="el-icon-star-on"></i>
                            </div>
                            <div class="playlist-info">
                                <h3>我喜欢的音乐</h3>
                                <p>收藏你最喜欢的音乐</p>
                                <div class="songs-count">345首</div>
                            </div>
                        </div>
                    </div>

                    <div class="songs-table-container">
                        <div class="table-header">
                            <div class="play-all" @click="playAll">
                                <i class="el-icon-video-play"></i> 播放全部 <span>345 首</span>
                            </div>
                        </div>

                        <el-table :data="favoritesSongs" class="music-table" @row-dblclick="playSong"
                            :show-header="false">
                            <el-table-column width="60">
                                <template slot-scope="scope">
                                    <span class="index">{{ scope.$index + 1 }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column width="60">
                                <template slot-scope="scope">
                                    <img :src="getCover(scope.row)" class="table-cover">
                                </template>
                            </el-table-column>
                            <el-table-column label="歌曲">
                                <template slot-scope="scope">
                                    <div class="song-info">
                                        <span class="name">{{ scope.row.name }}</span>
                                        <span class="artist">{{ scope.row.artist }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column width="150" align="right">
                                <template slot-scope="scope">
                                    <div class="platform-tags">
                                        <span :class="['tag', scope.row.platform]">{{
                                            getPlatformName(scope.row.platform) }}</span>
                                        <i class="el-icon-close remove-song"
                                            @click.stop="removeFromFavorites(scope.row)"></i>
                                    </div>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </div>

                <!-- Discover View -->
                <div v-if="activeMenu === 'discover'" class="discover-view">
                    <div class="view-header">
                        <div class="title-section">
                            <h1>发现音乐</h1>
                            <p>探索各大平台热门排行榜</p>
                        </div>
                        <div class="platform-tabs">
                            <el-radio-group v-model="discoverPlatform" size="mini" @change="fetchToplists">
                                <el-radio-button label="netease">网易云</el-radio-button>
                                <el-radio-button label="kuwo">酷我</el-radio-button>
                                <el-radio-button label="qq">QQ音乐</el-radio-button>
                            </el-radio-group>
                        </div>
                    </div>

                    <div v-loading="loading" class="toplist-grid">
                        <div v-for="item in toplists" :key="item.id" class="toplist-card" @click="loadToplist(item)">
                            <div class="card-cover">
                                <img :src="item.pic || 'https://picsum.photos/200'" alt="">
                                <div class="play-hover"><i class="el-icon-video-play"></i></div>
                            </div>
                            <div class="card-info">
                                <h4>{{ item.name }}</h4>
                                <p>{{ item.updateFrequency || '每日更新' }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Search View -->
                <div v-if="activeMenu === 'search' || activeMenu === 'results'" class="search-view">
                    <div class="search-bar-inner">
                        <el-input v-model="keyword" placeholder="搜索音乐、歌手、专辑" prefix-icon="el-icon-search"
                            @keyup.enter.native="handleSearch" clearable class="premium-search-input"></el-input>
                        <el-button type="primary" class="premium-search-btn" @click="handleSearch" :loading="loading">
                            <i class="el-icon-search"></i> 搜索
                        </el-button>
                    </div>

                    <el-table v-if="results.length > 0" :data="results" v-loading="loading" class="music-table"
                        @row-dblclick="playSong" :row-class-name="tableRowClassName">
                        <el-table-column label="#" width="60">
                            <template slot-scope="scope">
                                <span class="index-num">{{ scope.$index + 1 }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="name" label="歌名" min-width="200"></el-table-column>
                        <el-table-column prop="artist" label="歌手" width="150"></el-table-column>
                        <el-table-column prop="album" label="专辑" width="180"></el-table-column>
                        <el-table-column label="平台" width="100">
                            <template slot-scope="scope">
                                <span :class="['tag', scope.row.platform]">{{ getPlatformName(scope.row.platform)
                                    }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column width="100" align="right">
                            <template slot-scope="scope">
                                <div class="row-actions">
                                    <div class="index-cell">
                                        <i v-if="isCurrent(scope.row)" class="el-icon-headset playing-icon"></i>
                                        <div class="row-play-btn" @click.stop="playSong(scope.row)">
                                            <i class="el-icon-video-play"></i>
                                        </div>
                                    </div>
                                    <i :class="isFavorite(scope.row) ? 'el-icon-star-on active' : 'el-icon-star-off'"
                                        class="favorite-row-btn" @click.stop="toggleFavorite(scope.row)"></i>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>

                    <div v-else-if="!loading && activeMenu === 'results'" class="empty-state">
                        <i class="el-icon-search"></i>
                        <p>输入关键词并按回车搜索</p>
                    </div>
                </div>
            </div>
        </main>

        <!-- Player Bar -->
        <footer class="player-bar" v-if="currentSong">
            <div class="player-left">
                <div class="cover-wrapper" @click="toggleFullscreen">
                    <img :src="currentSong.pic" class="bar-cover">
                    <div class="hover-overlay">
                        <i class="el-icon-arrow-up"></i>
                    </div>
                </div>
                <div class="song-meta">
                    <div class="name-row">
                        <span class="name">{{ currentSong.name }}</span>
                    </div>
                    <div class="artist-row">
                        <span class="artist">{{ currentSong.artist }}</span>
                        <span class="platform-tag" :class="currentSong.platform">{{
                            getPlatformName(currentSong.platform)
                            }}</span>
                        <el-dropdown trigger="click" @command="handleQualityChange">
                            <span class="quality-tag clickable">{{ currentQuality.toUpperCase() }}</span>
                            <el-dropdown-menu slot="dropdown" class="quality-dropdown">
                                <el-dropdown-item command="128k" :class="{ active: currentQuality === '128k' }">128K
                                    标准</el-dropdown-item>
                                <el-dropdown-item command="320k" :class="{ active: currentQuality === '320k' }">320K
                                    高品质</el-dropdown-item>
                                <el-dropdown-item command="flac" :class="{ active: currentQuality === 'flac' }">FLAC
                                    无损</el-dropdown-item>
                                <el-dropdown-item command="flac24bit"
                                    :class="{ active: currentQuality === 'flac24bit' }">HI-RES
                                    音质</el-dropdown-item>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </div>
            </div>

            <div class="player-center">
                <div class="main-controls">
                    <i class="el-icon-refresh shuffle" title="随机播放"></i>
                    <i class="el-icon-caret-left prev" @click="playPrev" title="上一首"></i>
                    <div class="play-pause" @click="togglePlay">
                        <i :class="isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'"></i>
                    </div>
                    <i class="el-icon-caret-right next" @click="playNext" title="下一首"></i>
                    <i class="el-icon-refresh-left repeat" title="单曲循环"></i>
                </div>
                <div class="progress-wrapper">
                    <span class="time">{{ formatTime(currentTime) }}</span>
                    <el-slider v-model="progress" :show-tooltip="false" @change="seek" class="mini-slider"></el-slider>
                    <span class="time">{{ formatTime(duration) }}</span>
                </div>
            </div>

            <div class="player-right">
                <i class="el-icon-folder-add" title="添加到歌单"></i>
                <i class="el-icon-chat-dot-round" title="查看歌词" @click="toggleFullscreen"></i>
                <i class="el-icon-menu" title="当前队列"></i>
                <div class="volume-control">
                    <i :class="volume === 0 ? 'el-icon-message-solid mute' : 'el-icon-bell'" @click="toggleMute"></i>
                    <el-slider v-model="volume" :max="100" class="volume-slider"></el-slider>
                </div>
                <i class="el-icon-full-screen" title="全屏" @click="toggleFullscreen"></i>
            </div>

            <audio ref="audioPlayer" :src="currentSong.url" @timeupdate="onTimeUpdate"
                @loadedmetadata="onLoadedMetadata" @ended="onEnded" style="display: none"></audio>
        </footer>

        <!-- Fullscreen Visualizer & Lyrics -->
        <transition name="up">
            <div v-if="isFullscreen" class="fullscreen-view">
                <div class="glass-bg" :style="{ backgroundImage: `url(${currentSong.pic})` }"></div>
                <div class="fs-overlay"></div>

                <!-- Fullscreen mode should respect the global header if it's there, 
                     but typically fullscreen apps hide it. The user wants the header shown.
                     We keep the internal one for controls but adjust z-index to not conflict. -->
                <header class="fs-header">
                    <div class="header-left">
                        <!-- Left side can keep its own logo or be empty to avoid duplication -->
                    </div>
                    <div class="header-right">
                        <!-- Lyric Sync Controls -->
                        <div class="lyric-sync-ctrls">
                            <span class="ctrl-label">歌词同步:</span>
                            <el-button type="text" icon="el-icon-minus" @click="adjustLyricOffset(-0.5)"
                                title="提前0.5秒"></el-button>
                            <span class="offset-val">{{ lyricOffset > 0 ? '+' : '' }}{{ lyricOffset.toFixed(1)
                                }}s</span>
                            <el-button type="text" icon="el-icon-plus" @click="adjustLyricOffset(0.5)"
                                title="延后0.5秒"></el-button>
                            <el-button type="text" @click="lyricOffset = 0" title="重置">重置</el-button>
                        </div>
                        <api-switch />
                        <div class="window-controls">
                            <i class="el-icon-arrow-down" @click="toggleFullscreen" title="收起全屏"></i>
                        </div>
                    </div>
                </header>

                <div class="fs-body">
                    <div class="fs-left">
                        <div class="fs-album-card">
                            <img :src="currentSong.pic" alt="cover" @error="handleImgError">
                        </div>
                        <div class="fs-info">
                            <h1 class="fs-title" style="color: white;">{{ currentSong.name }}</h1>
                            <div class="fs-artist-line">
                                <span>{{ currentSong.artist }}</span>
                                <span class="source-badge">{{ getPlatformName(currentSong.platform) }}</span>
                            </div>
                        </div>

                        <div class="fs-controls">
                            <div class="fs-progress">
                                <span class="time">{{ formatTime(currentTime) }}</span>
                                <el-slider v-model="progress" :show-tooltip="false" @change="seek"
                                    class="fs-slider-el"></el-slider>
                                <span class="time">{{ formatTime(duration) }}</span>
                            </div>
                            <div class="fs-btns">
                                <i class="el-icon-refresh shuffle" title="随机播放"></i>
                                <i class="el-icon-caret-left" @click="playPrev"></i>
                                <div class="fs-play-btn" @click="togglePlay">
                                    <i :class="isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'"></i>
                                </div>
                                <i class="el-icon-caret-right" @click="playNext"></i>
                                <div class="fs-volume-wrap">
                                    <i :class="volume === 0 ? 'el-icon-message-solid mute' : 'el-icon-bell'"
                                        @click="toggleMute"></i>
                                    <el-slider v-model="volume" :max="100" class="fs-volume-slider"></el-slider>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="fs-right-container">
                        <div class="fs-right" ref="lyricContainer" @mousedown="handleLyricMouseDown"
                            @mousemove="handleLyricMouseMove" @mouseup="handleLyricMouseUp"
                            @mouseleave="handleLyricMouseUp" :class="{ 'dragging': isDraggingLyric }">
                            <div class="lyric-scroll" v-if="lyrics.length > 0">
                                <div v-for="(line, index) in lyrics" :key="index" class="lrc-line" :class="{
                                    active: currentLyricIndex === index,
                                    'next-line': currentLyricIndex + 1 === index,
                                    'prev-line': currentLyricIndex - 1 === index,
                                    'drag-target': isDraggingLyric && hoveredLyricIndex === index
                                }">
                                    <div class="lrc-text" :style="getKaraokeStyle(index)">{{ line.text }}</div>
                                </div>
                            </div>
                            <div v-else class="fs-no-lyric">
                                <i class="el-icon-loading" v-if="loadingLrc"></i>
                                <span v-else>纯音乐，请欣赏</span>
                            </div>

                            <!-- Drag Indicator Line -->
                            <div class="drag-indicator" v-if="isDraggingLyric && hoveredTime !== null">
                                <span class="drag-time">{{ formatTime(hoveredTime) }}</span>
                                <div class="line"></div>
                                <i class="el-icon-caret-right"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Import Modal (Screenshot 2 style) -->
        <el-dialog title="导入在线歌单" :visible.sync="importModalVisible" width="450px" custom-class="premium-dialog"
            append-to-body>
            <div class="import-modal-body">
                <div class="form-section">
                    <label>歌单链接或ID</label>
                    <el-input v-model="importForm.url" placeholder="https://music.163.com/#/playlist?id=..."
                        class="premium-input"></el-input>
                </div>

                <div class="form-row">
                    <div class="form-section flex-1">
                        <label>平台</label>
                        <el-select v-model="importForm.source" class="premium-select">
                            <el-option label="自动识别" value="auto"></el-option>
                            <el-option label="网易云音乐" value="netease"></el-option>
                            <el-option label="酷我音乐" value="kuwo"></el-option>
                            <el-option label="QQ音乐" value="qq"></el-option>
                        </el-select>
                    </div>
                    <el-button type="primary" class="get-btn" @click="fetchPlaylistInfo" :loading="fetchingPlaylist">
                        <i class="el-icon-search"></i> 获取歌单
                    </el-button>
                </div>

                <transition name="fade">
                    <div v-if="importedInfo" class="import-status">
                        <div class="status-icon"><i class="el-icon-success"></i></div>
                        <div class="status-content">
                            <h4>{{ importedInfo.name }}</h4>
                            <p>{{ importedInfo.count }} 首歌曲</p>
                        </div>
                    </div>
                </transition>

                <div class="import-method">
                    <label>导入方式</label>
                    <el-radio-group v-model="importForm.method">
                        <el-radio label="new">新建歌单 <small>创建一个新的本地歌单</small></el-radio>
                        <el-radio label="merge">合并到已有歌单 <small>添加到现有歌单，保留享有歌曲</small></el-radio>
                        <el-radio label="overlay">覆盖已有歌单 <small>清空目标歌单，完全替换</small></el-radio>
                    </el-radio-group>
                </div>
            </div>
            <div slot="footer" class="dialog-footer">
                <el-button @click="importModalVisible = false" type="text">取消</el-button>
                <el-button type="primary" round class="import-btn" @click="handleImport"
                    :disabled="!importedInfo">导入</el-button>
            </div>
        </el-dialog>
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
            activeMenu: 'search',
            keyword: '',
            loading: false,
            loadingLrc: false,
            results: [],
            playlists: [],
            favoritesSongs: JSON.parse(localStorage.getItem('my_favorites') || '[]'),
            currentSong: null,
            currentList: [],
            currentIndex: -1,
            lyrics: [],
            currentLyricIndex: 0,
            isFullscreen: false,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            progress: 0,
            volume: parseInt(localStorage.getItem('player_volume') || '80'),
            prevVolume: 80,
            currentQuality: localStorage.getItem('player_quality') || '320k',

            // Discover
            discoverPlatform: 'netease',
            toplists: [],

            // Import Modal
            importModalVisible: false,
            fetchingPlaylist: false,
            importedInfo: null,
            importForm: {
                source: 'auto',
                method: 'new'
            },

            // Lyric drag seek state
            isDraggingLyric: false,
            dragStartY: 0,
            dragStartScrollTop: 0,
            hasMoved: false,
            hoveredLyricIndex: -1,
            hoveredTime: null,

            // Smooth progress for lyrics
            smoothProgressTime: 0,
            animationId: null,

            // Sync adjustment
            lyricOffset: parseFloat(localStorage.getItem('lyric_offset') || '0')
        }
    },
    watch: {
        volume(val) {
            if (this.$refs.audioPlayer) {
                this.$refs.audioPlayer.volume = val / 100
            }
            localStorage.setItem('player_volume', val)
        },
        favoritesSongs: {
            deep: true,
            handler(val) {
                localStorage.setItem('my_favorites', JSON.stringify(val))
            }
        },
        isPlaying(val) {
            if (val) {
                this.startSmoothProgress()
            } else {
                this.stopSmoothProgress()
            }
        }
    },
    mounted() {
        // try to load last played song
        const lastSong = localStorage.getItem('last_played_song')
        if (lastSong) {
            this.currentSong = JSON.parse(lastSong)
            this.fetchLyrics(this.currentSong.platform, this.currentSong.id)
        }
        this.fetchToplists()
        document.body.classList.add('music-page-body')
    },
    beforeDestroy() {
        document.body.classList.remove('music-page-body')
        this.stopSmoothProgress()
    },
    methods: {
        getPlatformName(p) {
            const map = { netease: '网易云', kuwo: '酷我', qq: 'QQ音乐' }
            return map[p] || '未知'
        },
        getCover(song) {
            return song.pic || musicApi.getAlbumPic(song.platform, song.id)
        },
        async handleSearch() {
            if (!this.keyword) return
            this.loading = true
            this.activeMenu = 'results'
            try {
                const res = await musicApi.aggregateSearch(this.keyword)
                if (res.code === 200) {
                    this.results = res.data.results
                    this.currentList = [...this.results]
                }
            } catch (err) {
                this.$message.error('搜索失败')
            } finally {
                this.loading = false
            }
        },
        async fetchToplists() {
            this.loading = true
            try {
                const res = await musicApi.getToplists(this.discoverPlatform)
                if (res.code === 200) {
                    this.toplists = res.data.list || res.data
                }
            } catch (e) {
                this.$message.error('获取排行榜失败')
            } finally {
                this.loading = false
            }
        },
        async loadToplist(item) {
            this.loading = true
            try {
                const res = await musicApi.getToplist(this.discoverPlatform, item.id)
                if (res.code === 200) {
                    this.results = (res.data.list || res.data).map(song => ({
                        ...song,
                        platform: this.discoverPlatform
                    }))
                    this.currentList = [...this.results]
                    this.activeMenu = 'results'
                    this.$message.success(`已加载: ${item.name}`)
                }
            } catch (e) {
                this.$message.error('无法加载排行榜详情')
            } finally {
                this.loading = false
            }
        },
        async playSong(row) {
            try {
                this.loadingLrc = true
                const infoRes = await musicApi.getSongInfo(row.platform, row.id)
                if (infoRes.code === 200) {
                    const songInfo = infoRes.data
                    this.currentSong = {
                        ...songInfo,
                        id: row.id,
                        platform: row.platform,
                        url: musicApi.getSongUrl(row.platform, row.id, this.currentQuality),
                        pic: musicApi.getAlbumPic(row.platform, row.id)
                    }

                    localStorage.setItem('last_played_song', JSON.stringify(this.currentSong))

                    // Update index in current list
                    this.currentIndex = this.currentList.findIndex(s => s.id === row.id && s.platform === row.platform)
                    if (this.currentIndex === -1) {
                        this.currentList.unshift(this.currentSong)
                        this.currentIndex = 0
                    }

                    this.fetchLyrics(row.platform, row.id)

                    this.$nextTick(() => {
                        if (this.$refs.audioPlayer) {
                            this.$refs.audioPlayer.load()
                            this.$refs.audioPlayer.play().then(() => {
                                this.isPlaying = true
                            }).catch(e => {
                                console.error('Play failed', e)
                                this.$message.warning('播放失败，自动尝试下一首')
                                this.playNext()
                            })
                        }
                    })
                }
            } catch (err) {
                this.$message.error('获取歌曲详情失败')
            } finally {
                this.loadingLrc = false
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
                    const m = parseInt(matches[1])
                    const s = parseInt(matches[2])
                    const ms = matches[3].length === 3 ? parseInt(matches[3]) : parseInt(matches[3]) * 10
                    const time = m * 60 + s + ms / 1000
                    const content = line.replace(pattern, '').trim()
                    if (content) {
                        result.push({ time, text: content })
                    }
                }
            })
            this.lyrics = result.sort((a, b) => a.time - b.time)
        },
        togglePlay() {
            const audio = this.$refs.audioPlayer
            if (!audio) return
            if (this.isPlaying) {
                audio.pause()
            } else {
                audio.play()
            }
            this.isPlaying = !this.isPlaying
        },
        playNext() {
            if (this.currentList.length === 0) return
            this.currentIndex = (this.currentIndex + 1) % this.currentList.length
            this.playSong(this.currentList[this.currentIndex])
        },
        playPrev() {
            if (this.currentList.length === 0) return
            this.currentIndex = (this.currentIndex - 1 + this.currentList.length) % this.currentList.length
            this.playSong(this.currentList[this.currentIndex])
        },
        toggleFullscreen() {
            this.isFullscreen = !this.isFullscreen
        },
        toggleMute() {
            if (this.volume > 0) {
                this.prevVolume = this.volume
                this.volume = 0
            } else {
                this.volume = this.prevVolume
            }
        },
        onTimeUpdate() {
            const audio = this.$refs.audioPlayer
            if (!audio) return
            this.currentTime = audio.currentTime
            this.progress = (this.currentTime / this.duration) * 100

            if (this.lyrics.length > 0) {
                const effectiveTime = this.currentTime + this.lyricOffset
                let index = this.lyrics.findIndex(l => l.time > effectiveTime)
                if (index === -1) index = this.lyrics.length
                this.currentLyricIndex = index - 1

                if (this.isFullscreen && this.currentLyricIndex >= 0 && !this.isDraggingLyric) {
                    const container = this.$refs.lyricContainer
                    const activeLine = container.querySelectorAll('.lrc-line')[this.currentLyricIndex]
                    if (activeLine) {
                        const offset = activeLine.offsetTop - container.clientHeight / 2 + 50
                        container.scrollTo({ top: offset, behavior: 'smooth' })
                    }
                }
            }
        },
        getKaraokeStyle(index) {
            if (index !== this.currentLyricIndex || !this.isPlaying || this.isDraggingLyric) {
                return {}
            }
            const line = this.lyrics[index]
            const nextLine = this.lyrics[index + 1]
            const duration = nextLine ? nextLine.time - line.time : 5 // fallback to 5s

            // Use smoothProgressTime for much smoother transitions
            const time = (this.smoothProgressTime || this.currentTime) + this.lyricOffset
            const progress = Math.min(Math.max((time - line.time) / duration, 0), 1) * 100

            return {
                backgroundImage: `linear-gradient(to right, var(--primary-color) ${progress}%, white ${progress}%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent'
            }
        },
        startSmoothProgress() {
            if (this.animationId) return
            const update = () => {
                if (this.$refs.audioPlayer) {
                    this.smoothProgressTime = this.$refs.audioPlayer.currentTime
                }
                this.animationId = requestAnimationFrame(update)
            }
            this.animationId = requestAnimationFrame(update)
        },
        stopSmoothProgress() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId)
                this.animationId = null
            }
        },
        handleImgError(e) {
            e.target.src = 'https://picsum.photos/400'
        },
        adjustLyricOffset(delta) {
            this.lyricOffset += delta
            localStorage.setItem('lyric_offset', this.lyricOffset)
            this.$message({
                message: `歌词已${delta > 0 ? '延后' : '提前'}0.5秒`,
                type: 'info',
                duration: 1000
            })
        },
        onLoadedMetadata() {
            this.duration = this.$refs.audioPlayer.duration
        },
        onEnded() {
            this.playNext()
        },
        seek(val) {
            const audio = this.$refs.audioPlayer
            if (audio) {
                audio.currentTime = (val / 100) * this.duration
            }
        },
        formatTime(seconds) {
            if (isNaN(seconds)) return '00:00'
            const min = Math.floor(seconds / 60)
            const sec = Math.floor(seconds % 60)
            return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
        },

        // Favorites Logic
        toggleFavorite(song) {
            const idx = this.favoritesSongs.findIndex(s => s.id === song.id && s.platform === song.platform)
            if (idx > -1) {
                this.favoritesSongs.splice(idx, 1)
                this.$message.info('从收藏中移除')
            } else {
                this.favoritesSongs.push(song)
                this.$message.success('已添加到收藏')
            }
        },
        removeFromFavorites(song) {
            this.toggleFavorite(song)
        },
        playAll() {
            if (this.favoritesSongs.length > 0) {
                this.currentList = [...this.favoritesSongs]
                this.playSong(this.currentList[0])
            }
        },
        showNewPlaylistModal() {
            this.$message('功能开发中...')
        },

        // Import logic
        async fetchPlaylistInfo() {
            if (!this.importForm.url) return
            this.fetchingPlaylist = true
            try {
                // Extract ID from URL if possible
                let id = this.importForm.url
                let source = this.importForm.source

                if (id.includes('playlist?id=')) {
                    id = id.split('playlist?id=')[1].split('&')[0]
                    source = 'netease'
                }

                const res = await musicApi.getPlaylist(source === 'auto' ? 'netease' : source, id)
                if (res.code === 200) {
                    this.importedInfo = {
                        name: res.data.info.name,
                        count: res.data.list.length,
                        songs: res.data.list.map(s => ({ ...s, platform: source === 'auto' ? 'netease' : source }))
                    }
                } else {
                    this.$message.error('无法获取歌单，请检查ID或链接')
                }
            } catch (e) {
                this.$message.error('网络错误')
            } finally {
                this.fetchingPlaylist = false
            }
        },
        handleImport() {
            if (!this.importedInfo) return

            if (this.importForm.method === 'overlay') {
                this.favoritesSongs = this.importedInfo.songs
            } else {
                // Merge: avoid duplicates
                const existing = new Set(this.favoritesSongs.map(s => `${s.platform}-${s.id}`))
                this.importedInfo.songs.forEach(s => {
                    if (!existing.has(`${s.platform}-${s.id}`)) {
                        this.favoritesSongs.push(s)
                    }
                })
            }

            this.$message.success(`成功导入 ${this.importedInfo.count} 首歌曲`)
            this.importModalVisible = false
            this.importedInfo = null
            this.importForm.url = ''
        },
        isCurrent(song) {
            return this.currentSong && this.currentSong.id === song.id && this.currentSong.platform === song.platform
        },
        isFavorite(song) {
            return this.favoritesSongs.some(s => s.id === song.id && s.platform === song.platform)
        },
        tableRowClassName({ row }) {
            if (this.isCurrent(row)) {
                return 'current-row'
            }
            return ''
        },
        handleQualityChange(q) {
            this.currentQuality = q
            localStorage.setItem('player_quality', q)
            this.$message.success(`已切换音质: ${q.toUpperCase()}`)
            if (this.currentSong) {
                const currentTime = this.currentTime
                this.playSong(this.currentSong).then(() => {
                    this.$nextTick(() => {
                        if (this.$refs.audioPlayer) {
                            this.$refs.audioPlayer.currentTime = currentTime
                        }
                    })
                })
            }
        },
        seekTo(time) {
            if (this.$refs.audioPlayer) {
                this.$refs.audioPlayer.currentTime = time
            }
        },
        handleLyricMouseDown(e) {
            if (!this.isFullscreen || this.lyrics.length === 0) return
            e.preventDefault()
            this.isDraggingLyric = true
            this.dragStartY = e.clientY
            this.dragStartScrollTop = this.$refs.lyricContainer.scrollTop
            this.hasMoved = false
        },
        handleLyricMouseMove(e) {
            if (!this.isDraggingLyric) return
            const deltaY = e.clientY - this.dragStartY
            if (Math.abs(deltaY) > 5) {
                this.hasMoved = true
                // Scroll container manually
                this.$refs.lyricContainer.scrollTop = this.dragStartScrollTop - deltaY

                // Find the lyric closest to the center of the container
                const container = this.$refs.lyricContainer
                const lines = container.querySelectorAll('.lrc-line')
                const containerRect = container.getBoundingClientRect()
                const containerCenter = containerRect.top + containerRect.height / 2

                let minDiff = Infinity
                let closestIdx = -1

                lines.forEach((line, index) => {
                    const rect = line.getBoundingClientRect()
                    const lineCenter = rect.top + rect.height / 2
                    const diff = Math.abs(lineCenter - containerCenter)
                    if (diff < minDiff) {
                        minDiff = diff
                        closestIdx = index
                    }
                })

                if (closestIdx !== -1) {
                    this.hoveredLyricIndex = closestIdx
                    this.hoveredTime = this.lyrics[closestIdx].time
                }
            }
        },
        handleLyricMouseUp() {
            if (this.isDraggingLyric) {
                if (this.hasMoved && this.hoveredTime !== null) {
                    this.seekTo(this.hoveredTime)
                }
                this.isDraggingLyric = false
                this.hasMoved = false
                this.hoveredLyricIndex = -1
                this.hoveredTime = null
            }
        }
    }
}
</script>

<style scoped>
/* Core Variables */
.mu-player {
    --primary-color: #1ed760;
    --bg-darker: #0b0b0b;
    --bg-dark: #121212;
    --bg-light: #282828;
    --text-main: #ffffff;
    --text-dim: #b3b3b3;
    --glass: rgba(255, 255, 255, 0.05);

    height: calc(100vh - 64px);
    width: 100%;
    display: flex;
    background: var(--bg-darker);
    color: var(--text-main);
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    overflow: hidden;
    user-select: none;
}

/* Sidebar */
.sidebar {
    width: 200px;
    background: var(--bg-darker);
    padding: 24px 12px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.logo {
    padding: 0 12px 32px;
}

.logo-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 800;
    color: var(--primary-color);
    letter-spacing: -0.5px;
}

.nav-menu {
    flex: 1;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    color: var(--text-dim);
    cursor: pointer;
    transition: 0.3s;
    font-size: 14px;
}

.menu-item i {
    font-size: 18px;
}

.menu-item:hover {
    color: var(--text-main);
    background: var(--glass);
}

.menu-item.active {
    color: var(--text-main);
    background: var(--glass);
    font-weight: 600;
}

.sidebar-bottom {
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.settings-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 14px;
}

/* Main Container */
.main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #1a1a1a 0%, var(--bg-darker) 100%);
    position: relative;
}

.top-header {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
}

.window-controls {
    display: flex;
    gap: 8px;
}

.dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.dot.red {
    background: #ff5f56;
}

.dot.yellow {
    background: #ffbd2e;
}

.dot.green {
    background: #27c93f;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.user-avatar img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
}

.window-actions {
    display: flex;
    gap: 16px;
    color: var(--text-dim);
    font-size: 18px;
}

.content-scroll {
    flex: 1;
    padding: 0 5% 100px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--glass) transparent;
}

/* Favorites View */
.view-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 32px;
}

.view-header h1 {
    font-size: 32px;
    margin: 0 0 8px;
}

.view-header p {
    color: var(--text-dim);
    margin: 0;
}

.action-btns {
    display: flex;
    gap: 12px;
}

.playlist-list {
    margin-bottom: 24px;
}

.playlist-item {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px;
    background: var(--glass);
    border-radius: 12px;
    width: fit-content;
    min-width: 300px;
}

.playlist-cover {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    background: linear-gradient(135deg, #1ed76022, #1ed76066);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: var(--primary-color);
}

.playlist-info h3 {
    margin: 0 0 4px;
    font-size: 18px;
}

.playlist-info p {
    margin: 0;
    font-size: 12px;
    color: var(--text-dim);
}

.songs-count {
    font-size: 12px;
    color: var(--primary-color);
    margin-top: 4px;
}

.table-header {
    padding: 16px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.play-all {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    color: var(--primary-color);
    font-weight: 600;
}

.play-all i {
    font-size: 24px;
}

.play-all span {
    color: var(--text-dim);
    font-weight: normal;
    font-size: 14px;
}

/* Music Table */
.music-table {
    background: transparent !important;
}

.music-table /deep/ tr {
    background: transparent !important;
    cursor: pointer;
}

.music-table /deep/ tr:hover td,
.music-table /deep/ tr.el-table__row--hover td,
.music-table /deep/ tr.hover-row td {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: var(--text-main) !important;
}

/* Fix for the bright white row issue */
.music-table /deep/ .el-table__body tr.current-row>td,
.music-table /deep/ .el-table__body tr.current-row:hover>td {
    background-color: rgba(30, 215, 96, 0.2) !important;
    color: var(--primary-color) !important;
}

.music-table /deep/ .el-table__body tr.current-row td .name,
.music-table /deep/ .el-table__body tr.current-row td .artist,
.music-table /deep/ .el-table__body tr.current-row td .index {
    color: var(--primary-color) !important;
}

.music-table /deep/ td {
    border: none !important;
    color: var(--text-main);
    transition: 0.2s;
}

.index {
    color: var(--text-dim);
    font-size: 14px;
}

.index-cell {
    position: relative;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.row-play-btn {
    display: none;
    cursor: pointer;
    font-size: 20px;
    color: var(--primary-color);
}

.music-table /deep/ tr:hover .index-num,
.music-table /deep/ tr:hover .playing-icon {
    display: none;
}

.music-table /deep/ tr:hover .row-play-btn {
    display: block;
}

.playing-icon {
    color: var(--primary-color);
    font-size: 16px;
    animation: bounce 1s infinite alternate;
}

.row-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
}

@keyframes bounce {
    from {
        transform: scale(1);
        opacity: 0.8;
    }

    to {
        transform: scale(1.2);
        opacity: 1;
    }
}

.table-cover {
    width: 40px;
    height: 40px;
    border-radius: 4px;
}

.song-info {
    display: flex;
    flex-direction: column;
}

.song-info .name {
    font-weight: 500;
    margin-bottom: 2px;
}

.song-info .artist {
    font-size: 12px;
    color: var(--text-dim);
}

.platform-tags {
    display: flex;
    align-items: center;
    gap: 12px;
}

.tag {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
}

.tag.netease {
    background: #e6002622;
    color: #e60026;
    border: 1px solid #e6002633;
}

.tag.kuwo {
    background: #ffee0022;
    color: #ffee00;
    border: 1px solid #ffee0033;
}

.tag.qq {
    background: #31c27c22;
    color: #31c27c;
    border: 1px solid #31c27c33;
}

.remove-song {
    color: var(--text-dim);
    opacity: 0.5;
    transition: 0.3s;
}

.remove-song:hover {
    opacity: 1;
    color: #ff4d4d;
}

/* Search Page */
.search-bar-inner {
    display: flex;
    gap: 16px;
    margin: 40px auto;
    padding: 0 20px;
    max-width: 700px;
    justify-content: center;
}

.search-bar-inner /deep/ .el-input__inner {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: white;
    height: 48px;
    line-height: normal;
    /* Use normal and flex for centering */
    display: flex;
    align-items: center;
    transition: 0.3s;
    font-size: 15px;
    padding: 0 15px 0 40px;
    /* Adjust padding for icon */
}

.search-bar-inner /deep/ .el-input__prefix {
    left: 12px;
    display: flex;
    align-items: center;
    color: var(--text-dim);
}

.search-bar-inner /deep/ .el-input__icon {
    line-height: 48px;
    font-size: 18px;
}

.search-bar-inner /deep/ .el-input__inner:focus {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--primary-color);
}

.premium-search-btn.el-button--primary {
    height: 48px;
    border-radius: 12px;
    padding: 0 28px;
    font-weight: 600;
    letter-spacing: 1px;
    background: var(--primary-color) !important;
    border: none !important;
    color: black !important;
    box-shadow: 0 4px 15px rgba(30, 215, 96, 0.3);
    display: flex;
    align-items: center;
    gap: 8px;
}

.premium-search-btn.el-button--primary:hover {
    background: #1fef6c !important;
    transform: translateY(-1px);
    opacity: 1;
}

.premium-search-btn.el-button--primary i {
    font-size: 18px;
    font-weight: bold;
}

/* Table Header Styling */
.music-table /deep/ .el-table__header-wrapper th {
    background: transparent !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    color: var(--text-dim) !important;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 1px;
}

.music-table /deep/ .current-row {
    background: rgba(30, 215, 96, 0.1) !important;
}

.music-table /deep/ .current-row td {
    color: var(--primary-color) !important;
}

.favorite-row-btn {
    cursor: pointer;
    font-size: 18px;
    color: var(--text-dim);
    transition: 0.2s;
}

.favorite-row-btn:hover {
    color: #ff4d4f;
    transform: scale(1.2);
}

.favorite-row-btn.active {
    color: #ff4d4f;
}

/* Discover Page */
.toplist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 24px;
    margin-top: 24px;
}

.toplist-card {
    background: var(--glass);
    padding: 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: 0.3s;
}

.toplist-card:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-5px);
}

.card-cover {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    margin-bottom: 12px;
}

.card-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.play-hover {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: white;
    opacity: 0;
    transition: 0.3s;
}

.toplist-card:hover .play-hover {
    opacity: 1;
}

.card-info h4 {
    margin: 0 0 6px;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.card-info p {
    margin: 0;
    font-size: 12px;
    color: var(--text-dim);
}

.platform-tabs /deep/ .el-radio-button__inner {
    background: var(--glass);
    border: none;
    color: var(--text-dim);
}

.platform-tabs /deep/ .el-radio-button__orig-radio:checked+.el-radio-button__inner {
    background: var(--primary-color);
    color: black;
    box-shadow: none;
}

/* Player Bar */
.player-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 90px;
    background: rgba(18, 18, 18, 0.95);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    padding: 0 24px;
    z-index: 1000;
}

.player-left {
    width: 30%;
    display: flex;
    align-items: center;
    gap: 16px;
}

.cover-wrapper {
    position: relative;
    width: 56px;
    height: 56px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
}

.bar-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.hover-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: 0.3s;
}

.cover-wrapper:hover .hover-overlay {
    opacity: 1;
}

.song-meta .name {
    display: block;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 4px;
}

.artist-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-dim);
}

.platform-tag {
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 2px;
    border: 1px solid currentColor;
    font-weight: bold;
}

.quality-tag {
    font-size: 9px;
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
    padding: 1px 4px;
    border-radius: 2px;
}

.quality-tag.clickable {
    cursor: pointer;
    transition: 0.2s;
}

.quality-tag.clickable:hover {
    background: var(--primary-color);
    color: black;
}

.quality-dropdown {
    background: #282828 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.quality-dropdown /deep/ .el-dropdown-menu__item {
    color: var(--text-dim) !important;
}

.quality-dropdown /deep/ .el-dropdown-menu__item:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
}

.quality-dropdown /deep/ .el-dropdown-menu__item.active {
    color: var(--primary-color) !important;
    font-weight: bold;
}

.player-center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.main-controls {
    display: flex;
    align-items: center;
    gap: 24px;
    color: var(--text-dim);
}

.main-controls i {
    cursor: pointer;
    font-size: 20px;
    transition: 0.2s;
}

.main-controls i:hover {
    color: var(--text-main);
}

.play-pause {
    width: 36px;
    height: 36px;
    color: black !important;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px !important;
    transition: 0.2s;
}

.play-pause i {
    color: white;
}

.play-pause:hover {
    transform: scale(1.05);
}

.progress-wrapper {
    width: 100%;
    max-width: 600px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.time {
    font-size: 11px;
    color: var(--text-dim);
    min-width: 40px;
}

.mini-slider {
    flex: 1;
}

.player-right {
    width: 30%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 20px;
    color: var(--text-dim);
}

.player-right i {
    cursor: pointer;
    font-size: 18px;
}

.player-right i:hover {
    color: var(--text-main);
}

.volume-control {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 120px;
}

.volume-slider {
    flex: 1;
}

/* Fullscreen View */
.fullscreen-view {
    position: fixed;
    top: 64px;
    /* Start below the global header as requested */
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2000;
    background: black;
    display: flex;
    flex-direction: column;
}

.glass-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: cover;
    background-position: center;
    filter: blur(80px) brightness(0.4);
    transform: scale(1.2);
}

.fs-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
}

.fs-header {
    height: 80px;
    padding: 0 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 100;
}

.fs-header .header-left,
.fs-header .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
}

.fs-header .logo-inner {
    color: white;
}

.fs-header .logo-inner span {
    font-weight: 700;
    font-size: 20px;
}

.fs-header .window-controls i {
    cursor: pointer;
    font-size: 28px;
    color: var(--text-dim);
    transition: 0.3s;
}

.fs-header .window-controls i:hover {
    color: white;
    transform: translateY(4px);
}

.fs-body {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 10%;
    position: relative;
    z-index: 10;
    overflow: hidden;
    gap: 80px;
    height: calc(100% - 80px);
}

.fs-left {
    flex: 0 0 400px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    height: 100%;
    padding-top: 0;
}

.fs-album-card {
    width: 350px;
    height: 350px;
    border-radius: 12px;
    margin-bottom: 40px;
    margin-top: 0;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    /* Soft dark shadow */
    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fs-album-card:hover {
    transform: translateY(-5px);
}

.fs-album-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
}

.fs-info {
    width: 100%;
    margin-bottom: 20px;
    text-align: left;
}

.fs-info h1 {
    font-size: 28px;
    margin: 0 0 8px;
    font-weight: 700;
    line-height: 1.2;
}

.fs-artist-line {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 20px;
    color: var(--text-dim);
}

.source-badge {
    font-size: 14px;
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 12px;
    border-radius: 20px;
}

.fs-controls {
    width: 100%;
}

.fs-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
}

.fs-slider-el {
    flex: 1;
}

.fs-btns {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    color: rgba(255, 255, 255, 0.8);
}

.fs-btns i {
    font-size: 22px;
    cursor: pointer;
    transition: color 0.2s;
}

.fs-btns i:hover {
    color: white;
}

.fs-play-btn {
    width: 30px;
    height: 30px;
    color: black !important;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    transition: transform 0.5s;
}

.fs-play-btn:hover {
    transform: scale(1.05);
}

.fs-play-btn i {
    color: white;
}

.fs-right-container {
    flex: 1;
    height: 100%;
    /* Increased from 60% to align with left content */
    position: relative;
    display: flex;
    align-items: center;
}

.fs-right {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    scrollbar-width: none;
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
    mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
    cursor: grab;
}

.fs-right.dragging {
    cursor: grabbing;
}

.fs-right::-webkit-scrollbar {
    display: none;
}

.lyric-scroll {
    padding: 30vh 0;
}

.lrc-line {
    padding: 20px 0;
    font-size: 28px;
    color: rgba(255, 255, 255, 0.2);
    font-weight: 700;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: left;
}

.lrc-line.active {
    color: white;
    font-size: 38px;
    text-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    transform: scale(1.05);
}

.lrc-line.active~.lrc-line {
    color: white;
}

.lrc-line.prev-line,
.lrc-line.next-line {
    opacity: 0.8;
}

.lrc-text {
    display: inline-block;
    background-size: 100% 100%;
    background-repeat: no-repeat;
}

.lrc-line.drag-target {
    color: var(--primary-color) !important;
    opacity: 1 !important;
    transform: scale(1.1) translateX(10px);
}

.lrc-text {
    transition: 0.2s;
}

/* Volume in FS */
.fs-volume-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 150px;
}

.fs-volume-slider {
    flex: 1;
}

/* Drag Indicator */
.drag-indicator {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    transform: translateY(-50%);
    pointer-events: none;
    z-index: 100;
    padding: 0 10px;
}

.drag-time {
    background: var(--primary-color);
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 14px;
    color: black;
    font-weight: bold;
    margin-right: 12px;
    box-shadow: 0 4px 12px rgba(30, 215, 96, 0.4);
}

.drag-indicator .line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--primary-color), transparent);
    margin-right: 12px;
}

.drag-indicator i {
    color: var(--primary-color);
    font-size: 20px;
}

/* Animations */
.up-enter-active,
.up-leave-active {
    transition: all 0.5s ease;
}

.up-enter,
.up-leave-to {
    transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}

/* Dialog Styling */
.premium-dialog /deep/ .el-dialog {
    background: #E3E9EE;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.premium-dialog /deep/ .el-dialog__title {
    color: white;
    font-weight: 800;
}

.import-modal-body label {
    display: block;
    font-size: 13px;
    color: var(--text-dim);
    margin-bottom: 12px;
}

.form-section {
    margin-bottom: 24px;
}

.form-row {
    display: flex;
    gap: 16px;
    align-items: flex-end;
    margin-bottom: 24px;
}

.flex-1 {
    flex: 1;
}

.premium-input /deep/ .el-input__inner {
    background: #2a2a2a;
    border: none;
    color: white;
    height: 48px;
    border-radius: 12px;
}

.premium-select /deep/ .el-input__inner {
    background: #2a2a2a;
    border: none;
    color: white;
    height: 48px;
    border-radius: 12px;
}

.get-btn {
    height: 48px;
    border-radius: 12px;
    padding: 0 24px;
    background: #333;
    border: none;
}

.get-btn:hover {
    background: #444;
}

.import-status {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(30, 215, 96, 0.1);
    border-radius: 12px;
    margin-bottom: 24px;
}

.status-icon {
    font-size: 32px;
    color: var(--primary-color);
}

.status-content h4 {
    margin: 0;
}

.status-content p {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--text-dim);
}

.import-method /deep/ .el-radio {
    display: flex;
    margin-bottom: 16px;
    color: var(--text-dim);
    align-items: center;
}

.import-method /deep/ .el-radio.is-checked {
    color: white;
}

.import-method /deep/ .el-radio__label small {
    display: block;
    font-size: 11px;
    margin-top: 4px;
    opacity: 0.6;
}

.import-btn {
    width: 120px;
    height: 44px;
    font-weight: bold;
}
</style>

<style>
/* Sync controls symbols */
.lyric-sync-ctrls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 20px;
    background: rgba(255, 255, 255, 0.05);
    padding: 4px 12px;
    border-radius: 20px;
    color: var(--text-dim);
}

.lyric-sync-ctrls .ctrl-label {
    font-size: 12px;
}

.lyric-sync-ctrls .offset-val {
    font-size: 13px;
    font-family: monospace;
    color: var(--primary-color);
    min-width: 40px;
    text-align: center;
}

.lyric-sync-ctrls .el-button {
    color: var(--text-dim);
    padding: 0;
}

.lyric-sync-ctrls .el-button:hover {
    color: white;
}

/* Global overrides for Music Page */
.music-page-body {
    background-color: #0b0b0b !important;
    overflow: hidden;
}

.music-page-body #header {
    background: rgba(11, 11, 11, 0.9) !important;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: white !important;
    z-index: 3000;
}

.music-page-body #header .logo {
    color: #1ed760 !important;
}

.music-page-body #header .search-input .el-input__inner {
    background: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
}

.music-page-body #component {
    margin-top: 64px !important;
    height: calc(100vh - 64px) !important;
    overflow: hidden;
}
</style>
