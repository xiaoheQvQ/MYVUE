<!-- MusicList.vue -->
<template>
    <div class="music-list-container">
        <!-- 搜索栏 -->
        <div class="search-bar">
            <el-input v-model="searchKeyword" placeholder="搜索音乐、专辑、歌单" @keyup.enter="handleSearch"
                @input="handleSearchSuggest">
                <template #prefix>
                    <i class="el-icon-search"></i>
                </template>
            </el-input>
            <el-button type="primary" @click="handleSearch">
                搜索
            </el-button>
            <el-button @click="showAdvancedSearch = !showAdvancedSearch">
                高级搜索
            </el-button>
        </div>

        <!-- 高级搜索 -->
        <div v-if="showAdvancedSearch" class="advanced-search">
            <el-form :model="searchForm" label-width="80px">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="风格">
                            <el-select v-model="searchForm.genre" placeholder="请选择风格">
                                <el-option label="全部" value=""></el-option>
                                <el-option label="流行" value="pop"></el-option>
                                <el-option label="摇滚" value="rock"></el-option>
                                <el-option label="民谣" value="folk"></el-option>
                                <el-option label="电子" value="electronic"></el-option>
                                <el-option label="说唱" value="rap"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="语种">
                            <el-select v-model="searchForm.language" placeholder="请选择语种">
                                <el-option label="全部" value=""></el-option>
                                <el-option label="国语" value="chinese"></el-option>
                                <el-option label="英语" value="english"></el-option>
                                <el-option label="日语" value="japanese"></el-option>
                                <el-option label="韩语" value="korean"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="年份">
                            <el-date-picker v-model="searchForm.year" type="year" placeholder="选择年份"
                                value-format="yyyy" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="排序">
                            <el-select v-model="searchForm.sort" placeholder="请选择排序">
                                <el-option label="热度" value="hot"></el-option>
                                <el-option label="最新" value="new"></el-option>
                                <el-option label="播放量" value="play"></el-option>
                                <el-option label="点赞数" value="like"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </div>

        <!-- 搜索结果 -->
        <div v-if="searchResult" class="search-result">
            <el-tabs v-model="activeTab" @tab-click="handleTabChange">
                <el-tab-pane label="音乐" name="music">
                    <music-grid :music-list="searchResult.musicList" />
                </el-tab-pane>
                <el-tab-pane label="专辑" name="album">
                    <album-grid :album-list="searchResult.albumList" />
                </el-tab-pane>
                <el-tab-pane label="歌单" name="playlist">
                    <playlist-grid :playlist-list="searchResult.playlistList" />
                </el-tab-pane>
                <el-tab-pane label="艺术家" name="artist">
                    <artist-grid :artist-list="searchResult.artistList" />
                </el-tab-pane>
            </el-tabs>
        </div>

        <!-- 音乐推荐 -->
        <div v-else>
            <!-- 热门推荐 -->
            <div class="recommend-section">
                <h3 class="section-title">
                    <i class="el-icon-fire"></i>
                    热门推荐
                </h3>
                <music-grid :music-list="hotMusicList" />
            </div>

            <!-- 新歌速递 -->
            <div class="recommend-section">
                <h3 class="section-title">
                    <i class="el-icon-star"></i>
                    新歌速递
                </h3>
                <music-grid :music-list="newMusicList" />
            </div>

            <!-- 歌单推荐 -->
            <div class="recommend-section">
                <h3 class="section-title">
                    <i class="el-icon-collection"></i>
                    热门歌单
                </h3>
                <playlist-grid :playlist-list="hotPlaylistList" />
            </div>

            <!-- 专辑推荐 -->
            <div class="recommend-section">
                <h3 class="section-title">
                    <i class="el-icon-disc"></i>
                    精选专辑
                </h3>
                <album-grid :album-list="hotAlbumList" />
            </div>
        </div>

        <!-- 分页 -->
        <div v-if="total > pageSize" class="pagination-container">
            <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total"
                layout="prev, pager, next, jumper" @current-change="handlePageChange" />
        </div>
    </div>
</template>

<script>
import { searchMusic, getHotKeywords, getSearchSuggest } from '@/api/search'
import { getHotMusic, getNewMusic } from '@/api/recommend'
import MusicGrid from '@/components/music/MusicGrid.vue'
import AlbumGrid from '@/components/music/AlbumGrid.vue'
import PlaylistGrid from '@/components/music/PlaylistGrid.vue'
import ArtistGrid from '@/components/music/ArtistGrid.vue'

export default {
    name: 'MusicList',
    components: {
        MusicGrid,
        AlbumGrid,
        PlaylistGrid,
        ArtistGrid
    },
    data() {
        return {
            searchKeyword: '',
            showAdvancedSearch: false,
            searchForm: {
                genre: '',
                language: '',
                year: '',
                sort: 'hot'
            },
            activeTab: 'music',
            searchResult: null,
            hotMusicList: [],
            newMusicList: [],
            hotPlaylistList: [],
            hotAlbumList: [],
            currentPage: 1,
            pageSize: 20,
            total: 0,
            searchTimer: null
        }
    },
    created() {
        this.loadRecommendations()
    },
    methods: {
        async loadRecommendations() {
            try {
                // 加载热门音乐
                const hotMusicRes = await getHotMusic(8)
                this.hotMusicList = hotMusicRes.data

                // 加载新歌
                const newMusicRes = await getNewMusic(8)
                this.newMusicList = newMusicRes.data

                // 这里可以加载歌单和专辑推荐
                // this.hotPlaylistList = await getHotPlaylists()
                // this.hotAlbumList = await getHotAlbums()
            } catch (error) {
                console.error('加载推荐失败:', error)
            }
        },

        async handleSearch() {
            if (!this.searchKeyword.trim()) {
                this.$message.warning('请输入搜索关键词')
                return
            }

            try {
                const params = {
                    keyword: this.searchKeyword,
                    page: this.currentPage,
                    size: this.pageSize,
                    ...this.searchForm
                }

                const res = await searchMusic(params)
                this.searchResult = res.data
                this.total = this.searchResult.total || 0
            } catch (error) {
                console.error('搜索失败:', error)
                this.$message.error('搜索失败，请重试')
            }
        },

        handleSearchSuggest() {
            if (this.searchTimer) {
                clearTimeout(this.searchTimer)
            }

            if (this.searchKeyword.length >= 2) {
                this.searchTimer = setTimeout(async () => {
                    try {
                        const res = await getSearchSuggest(this.searchKeyword)
                        // 这里可以显示搜索建议
                        console.log('搜索建议:', res.data)
                    } catch (error) {
                        console.error('获取搜索建议失败:', error)
                    }
                }, 300)
            }
        },

        handleTabChange(tab) {
            this.activeTab = tab.name
            // 可以根据标签重新加载数据
        },

        handlePageChange(page) {
            this.currentPage = page
            if (this.searchKeyword) {
                this.handleSearch()
            }
        },

        resetSearch() {
            this.searchKeyword = ''
            this.searchForm = {
                genre: '',
                language: '',
                year: '',
                sort: 'hot'
            }
            this.searchResult = null
            this.currentPage = 1
        }
    }
}
</script>

<style scoped>
.music-list-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.search-bar {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.search-bar .el-input {
    flex: 1;
}

.advanced-search {
    background: #f5f7fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.recommend-section {
    margin-bottom: 40px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    font-size: 20px;
    color: #333;
    border-left: 4px solid #409eff;
    padding-left: 10px;
}

.section-title i {
    color: #409eff;
}

.pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 30px;
}
</style>