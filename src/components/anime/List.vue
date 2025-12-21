<template>
  <div class="anime-list-container">
    <div class="filter-container">
      <el-form :inline="true" :model="filterParams" class="filter-form">
        <el-form-item label="番剧名称">
          <el-autocomplete
            v-model="filterParams.title"
            placeholder="请输入番剧名称"
            clearable
            :fetch-suggestions="querySearchAsync"
            @select="handleFilter"
            @clear="handleFilter"
          />
        </el-form-item>

        <el-form-item label="地区">
          <el-select
            v-model="filterParams.area"
            placeholder="请选择地区"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="area in availableAreas"
              :key="area"
              :label="area"
              :value="area"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="filterParams.tag"
            placeholder="请选择标签"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            icon="el-icon-search"
            @click="handleFilter"
          >
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="anime-list">
      <el-row :gutter="20">
        <el-col
          v-for="anime in animeList"
          :key="anime.id"
          :xs="12"
          :sm="8"
          :md="6"
          :lg="4"
          :xl="3"
        >
          <el-card
            :body-style="{ padding: '0px' }"
            class="anime-card"
            shadow="hover"
            @click.native="showAnimeDetail(anime.id)"
          >
            <div class="cover-container">
              <img :src="anime.coverUrl" class="anime-cover" />
              <div class="status-tag">
                <el-tag
                  :type="getStatusTagType(anime.status)"
                  size="mini"
                >
                  {{ getStatusText(anime.status) }}
                </el-tag>
              </div>
            </div>
            <div class="anime-info">
              <div class="title">{{ anime.title }}</div>
              <div class="season">第{{ anime.seasonNumber }}季</div>
              <div class="tags">
                <el-tag
                  v-for="tag in anime.tags"
                  :key="tag"
                  size="mini"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="pagination-container">
      <el-pagination
        background
        :current-page="pagination.current"
        :page-sizes="[10, 20, 30, 50]"
        :page-size="pagination.size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 番剧详情对话框 -->
    <el-dialog
      :title="currentAnime.title"
      :visible.sync="dialogVisible"
      width="70%"
    >
      <div class="anime-detail">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="detail-cover">
              <img :src="currentAnime.coverUrl" />
            </div>
          </el-col>
          <el-col :span="18">
            <div class="detail-info">
              <h2>{{ currentAnime.title }}</h2>
              <p class="description">{{ currentAnime.description }}</p>
              <div class="meta">
                <span>地区: {{ currentAnime.area }}</span>
                <span>季数: 第{{ currentAnime.seasonNumber }}季</span>
                <span>状态: {{ getStatusText(currentAnime.status) }}</span>
              </div>
              <div class="tags">
                <el-tag
                  v-for="tag in currentAnime.tags"
                  :key="tag"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </el-col>
        </el-row>

        <div class="episodes">
          <h3>分集列表</h3>
          <el-table :data="currentAnime.episodes" border style="width: 100%">
            <el-table-column prop="episodeNumber" label="集数" width="80" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="duration" label="时长" width="100">
              <template slot-scope="scope">
                {{ formatDuration(scope.row.duration) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template slot-scope="scope">
                <el-tag :type="getEpisodeStatusTagType(scope.row.status)" size="mini">
                  {{ getEpisodeStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template slot-scope="scope">
                <el-button
                  size="mini"
                  type="primary"
                  :disabled="scope.row.status !== 2"
                  @click="playEpisode(scope.row)"
                >
                  播放
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import animeApi from '@/api/anime/anime'

export default {
  name: 'AnimeList',
  data () {
    return {
      filterParams: {
        title: '',
        tag: '',
        area: ''
      },
      animeList: [],
      availableAreas: [ '中国大陆', '日本', '欧美', '其他'],
      availableTags: ['热血', '恋爱', '搞笑', '玄幻', '科幻', '悬疑', '治愈', '校园'],
      pagination: {
        current: 1,
        size: 10,
        total: 0
      },
      dialogVisible: false,
      currentAnime: {
        id: null,
        title: '',
        coverUrl: '',
        description: '',
        area: '',
        seasonNumber: 1,
        status: 0,
        tags: [],
        episodes: []
      },
      allTitles: [] // 用于存储所有番剧标题用于自动完成
    }
  },
  created () {
    this.fetchData()
    // 初始化时获取所有标题用于自动完成
    this.getAllTitles()
  },
  methods: {
    fetchData () {
      const params = {
        ...this.filterParams,
        page: this.pagination.current,
        size: this.pagination.size
      }

      animeApi.listAnimeSeries(params).then(response => {
        this.animeList = response.data
        this.pagination.total = response.total || 0
      }).catch(error => {
        console.error('获取番剧列表失败:', error)
        this.$message.error('获取番剧列表失败')
      })
    },

    // 获取所有番剧标题用于自动完成
    getAllTitles () {
      animeApi.listAnimeSeries({ size: 1000 }).then(response => {
        this.allTitles = response.data.map(item => ({
          value: item.title,
          id: item.id
        }))
      })
    },

    querySearchAsync (queryString, cb) {
      const results = queryString
        ? this.allTitles.filter(item =>
          item.value.toLowerCase().includes(queryString.toLowerCase()))
        : this.allTitles.slice(0, 10)

      cb(results)
    },

    handleFilter () {
      this.pagination.current = 1
      this.fetchData()
    },

    handleSizeChange (size) {
      this.pagination.size = size
      this.fetchData()
    },

    handleCurrentChange (current) {
      this.pagination.current = current
      this.fetchData()
    },

    showAnimeDetail (id) {
      animeApi.getAnimeSeries(id).then(response => {
        this.currentAnime = response.data
        this.dialogVisible = true
      }).catch(error => {
        console.error('获取番剧详情失败:', error)
        this.$message.error('获取番剧详情失败')
      })
    },

    playEpisode (episode) {
      this.$message.success(`开始播放: ${this.currentAnime.title} 第${episode.episodeNumber}集`)
      this.$router.push({
        path: '/player',
        query: {
          episodeId: episode.id,
          seriesId: this.currentAnime.id
        }
      })
    },

    getStatusText (status) {
      const statusMap = {
        0: '未发布',
        1: '已发布',
        2: '下架'
      }
      return statusMap[status] || '未知'
    },

    getStatusTagType (status) {
      const typeMap = {
        0: 'info',
        1: 'success',
        2: 'warning'
      }
      return typeMap[status] || 'info'
    },

    getEpisodeStatusText (status) {
      const statusMap = {
        0: '上传中',
        1: '转码中',
        2: '可播放',
        3: '转码失败'
      }
      return statusMap[status] || '未知'
    },

    getEpisodeStatusTagType (status) {
      const typeMap = {
        0: 'info',
        1: 'warning',
        2: 'success',
        3: 'danger'
      }
      return typeMap[status] || 'info'
    },

    formatDuration (seconds) {
      if (!seconds) return '00:00'
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.anime-list-container {
  padding: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.anime-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s;
}

.anime-card:hover {
  transform: translateY(-5px);
}

.cover-container {
  position: relative;
  height: 0;
  padding-bottom: 140%;
  overflow: hidden;
}

.anime-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-tag {
  position: absolute;
  top: 5px;
  right: 5px;
}

.anime-info {
  padding: 10px;
}

.anime-info .title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anime-info .season {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.anime-info .tags {
  margin-top: 5px;
}

.anime-info .tags .el-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

.detail-cover img {
  width: 100%;
  border-radius: 4px;
}

.detail-info h2 {
  margin-top: 0;
}

.detail-info .description {
  color: #666;
  line-height: 1.6;
}

.detail-info .meta {
  margin: 10px 0;
  color: #999;
  font-size: 14px;
}

.detail-info .meta span {
  margin-right: 15px;
}

.detail-info .tags .el-tag {
  margin-right: 10px;
  margin-bottom: 10px;
}

.episodes {
  margin-top: 20px;
}
</style>
