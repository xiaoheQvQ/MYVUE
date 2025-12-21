<template>
  <div class="anime-player-container">
    <!-- 顶部面包屑导航 -->
    <div class="breadcrumb">
      <el-breadcrumb separator=">">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/animeList' }">番剧</el-breadcrumb-item>
        <el-breadcrumb-item>{{ currentAnime.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 播放器区域 -->
      <div class="player-section">
        <div class="player-wrapper">
          <div class="player-title">
            <h1>{{ currentAnime.title }} - 第{{ currentEpisode.episodeNumber }}集 {{ currentEpisode.title }}</h1>
          </div>
          <d-player ref="player" id="player" :options="options"></d-player>
        </div>

        <!-- 分集列表 -->
        <div class="episode-list">
          <div class="episode-header">
            <h3>分集列表</h3>
            <span class="episode-count">共{{ animeEpisodes.length }}集</span>
          </div>
          <div class="episode-grid">
            <div
              v-for="episode in animeEpisodes"
              :key="episode.id"
              :class="['episode-item',
                episode.id === currentEpisode.id ? 'active' : '',
                !checkVipAccess(episode) ? 'vip-locked' : ''
              ]"
              @click="handlePlayEpisode(episode)"
            >
              <span class="episode-number">{{ episode.episodeNumber }}</span>
              <div class="episode-info">
                <div class="episode-title">{{ episode.title }}</div>
                <div class="episode-status">
                  <el-tag :type="getEpisodeStatusTagType(episode.status)" size="mini">
                    {{ getEpisodeStatusText(episode.status) }}
                  </el-tag>
                  <el-tag
                    v-if="episode.min_member_level > 0"
                    type="danger"
                    size="mini"
                    style="margin-left: 5px;"
                  >
                    VIP{{ episode.min_member_level }}
                  </el-tag>
                </div>
              </div>
              <div v-if="!checkVipAccess(episode)" class="vip-lock-icon">
                <i class="el-icon-lock"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 信息与互动区 -->
      <div class="interaction-section">
        <!-- 番剧信息 -->
        <div class="anime-info">
          <div class="anime-cover">
            <el-image
              :src="currentAnime.coverUrl"
              fit="cover"
              :preview-src-list="[currentAnime.coverUrl]"
            >
              <div slot="error" class="image-slot">
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
          </div>
          <div class="anime-meta">
            <h2 class="anime-title">{{ currentAnime.title }}</h2>
            <div class="anime-stats">
              <div class="stat-item">
                <i class="el-icon-view"></i>
                <span>{{ formatNumber(currentAnime.viewCount || 0) }}播放</span>
              </div>
              <div class="stat-item">
                <i class="el-icon-chat-dot-round"></i>
                <span>{{ formatNumber(commentTotal) }}评论</span>
              </div>
            </div>
            <div class="anime-tags">
              <el-tag
                v-for="tag in currentAnime.tags"
                :key="tag"
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="anime-description">
              <h3>简介</h3>
              <p>{{ currentAnime.description || '暂无简介' }}</p>
            </div>
          </div>
        </div>

        <!-- 评分区域 -->
        <div class="rating-section">
          <div class="rating-header">
            <h3>番剧评分</h3>
            <div class="rating-score" v-if="ratingInfo.averageScore > 0">
              <span class="score">{{ ratingInfo.averageScore.toFixed(1) }}</span>
              <span class="total">/10</span>
              <span class="count">{{ ratingInfo.ratingCount }}人评分</span>
            </div>
            <div class="no-rating" v-else>
              暂无评分
            </div>
          </div>
          <div class="rating-action">
            <div class="user-rating" v-if="userRating.score">
              <span>我的评分：</span>
              <el-rate
                v-model="userRating.score"
                disabled
                :max="10"
                :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
              />
              <el-button size="mini" @click="showEditRating = true">修改</el-button>
            </div>
            <el-rate
              v-else
              v-model="tempRating"
              :max="10"
              :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
              show-score
              score-template="{value} 分"
              @change="handleRateChange"
            />
          </div>
        </div>

        <!-- 评论区域 -->
        <div class="comment-section">
          <div class="comment-header">
            <h3>评论 <span class="comment-count">{{ commentTotal }}条</span></h3>
          </div>

          <!-- 评论输入框 -->
          <div class="comment-input">
            <el-input
              type="textarea"
              :rows="3"
              placeholder="发表你的评论..."
              v-model="commentContent"
              resize="none"
            />
            <div class="comment-actions">
              <el-button
                type="primary"
                size="small"
                @click="submitComment"
                :disabled="!commentContent.trim()"
              >
                发表评论
              </el-button>
            </div>
          </div>

          <!-- 评论列表 -->
          <div class="comment-list">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="comment-item"
            >
              <div class="comment-avatar">
                <el-avatar :src="comment.avatar" size="medium"></el-avatar>
              </div>
              <div class="comment-content">
                <div class="comment-user">
                  <span class="username">{{ comment.username }}</span>
                  <span class="time">{{ comment.createTime }}</span>
                </div>
                <div class="comment-text">{{ comment.content }}</div>
                <div class="comment-footer">
                  <span
                    class="reply-action"
                    @click="showReplyInput(comment)"
                  >
                    <i class="el-icon-chat-round"></i> 回复
                  </span>
                </div>

                <!-- 回复输入框 -->
                <div class="reply-input" v-if="comment.showReply">
                  <el-input
                    type="textarea"
                    :rows="2"
                    placeholder="回复..."
                    v-model="comment.replyContent"
                    resize="none"
                  />
                  <div class="reply-actions">
                    <el-button
                      size="mini"
                      @click="cancelReply(comment)"
                    >
                      取消
                    </el-button>
                    <el-button
                      type="primary"
                      size="mini"
                      @click="submitReply(comment)"
                      :disabled="!comment.replyContent.trim()"
                    >
                      回复
                    </el-button>
                  </div>
                </div>

                <!-- 回复列表 -->
                <div
                  v-if="comment.replies && comment.replies.length > 0"
                  class="reply-list"
                >
                  <div
                    v-for="reply in comment.replies"
                    :key="reply.id"
                  class="reply-item"
                  >
                    <div class="reply-avatar">
                      <el-avatar :src="reply.avatar" size="small"></el-avatar>
                    </div>
                    <div class="reply-content">
                      <div class="reply-user">
                        <span class="username">{{ reply.username }}</span>
                        <span class="time">{{ reply.createTime }}</span>
                      </div>
                      <div class="reply-text">
                        <span v-if="reply.parentId !== reply.rootId" class="reply-to">
                          @{{ getReplyToUsername(reply.parentId, comment.replies) }}
                        </span>
                        {{ reply.content }}
                      </div>
                      <div class="reply-footer">
                        <span
                          class="reply-action"
                          @click="showReplyToReplyInput(comment, reply)"
                        >
                          <i class="el-icon-chat-round"></i> 回复
                        </span>
                      </div>

                      <!-- 对回复的回复输入框 -->
                      <div class="reply-input" v-if="reply.showReply">
                        <el-input
                          type="textarea"
                          :rows="2"
                          placeholder="回复..."
                          v-model="reply.replyContent"
                          resize="none"
                        />
                        <div class="reply-actions">
                          <el-button
                            size="mini"
                            @click="cancelReply(reply)"
                          >
                            取消
                          </el-button>
                          <el-button
                            type="primary"
                            size="mini"
                            @click="submitReplyToReply(comment, reply)"
                            :disabled="!reply.replyContent.trim()"
                          >
                            回复
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 加载更多 -->
            <div class="load-more" v-if="hasMoreComments">
              <el-button
                type="text"
                @click="loadMoreComments"
                :loading="loadingMore"
              >
                加载更多评论
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改评分对话框 -->
    <el-dialog
      title="修改评分"
      :visible.sync="showEditRating"
      width="30%"
    >
      <div class="edit-rating-dialog">
        <el-rate
          v-model="editRating"
          :max="10"
          :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
          show-score
          score-template="{value} 分"
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showEditRating = false">取消</el-button>
        <el-button type="primary" @click="updateRating">确定</el-button>
      </span>
    </el-dialog>

    <!-- VIP提示对话框 -->
    <el-dialog
      title="VIP会员专享"
      :visible.sync="showVipDialog"
      width="400px"
    >
      <div class="vip-dialog-content">
        <div class="vip-icon">
          <i class="el-icon-lock" style="font-size: 40px; color: #F7BA2A;"></i>
        </div>
        <div class="vip-message">
          <p>该集需要VIP{{ requiredVipLevel }}及以上会员才能观看</p>
          <p>立即开通VIP会员，畅享更多精彩内容</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showVipDialog = false">取消</el-button>
        <el-button type="primary" @click="goToVip">开通VIP</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import dPlayer from 'vue-dplayer'
import animeApi from '@/api/anime/anime'
import Global from '@/components/Global.vue'

export default {
  name: 'AnimePlayer',
  components: {
    dPlayer
  },
  data () {
    return {
      options: {
        video: {
          url: '', // 动态设置
          pic: '' // 封面
        },
        danmaku: {
          id: '', // 动态设置
          api: '/api/anime/danmakus/'
        }
      },
      currentAnime: {
        id: null,
        title: '',
        coverUrl: '',
        description: '...',
        area: '',
        seasonNumber: 0,
        status: 0,
        tags: [],
        viewCount: 0,
        episodes: []
      },
      currentEpisode: {
        id: null,
        episodeNumber: 1,
        title: '',
        videoUrl: '',
        status: 2,
        min_member_level: 0
      },
      animeEpisodes: [],
      dp: null,

      // 评分相关
      ratingInfo: {
        averageScore: 0,
        ratingCount: 0
      },
      userRating: {
        score: 0
      },
      tempRating: 0,
      showEditRating: false,
      editRating: 0,

      // 评论相关
      comments: [],
      commentContent: '',
      commentTotal: 0,
      currentPage: 1,
      pageSize: 10,
      hasMoreComments: true,
      loadingMore: false,

      // VIP相关
      showVipDialog: false,
      requiredVipLevel: 0
    }
  },
  computed: {

    episodeId () {
      return this.$route.query.episodeId
    },
    seriesId () {
      return this.$route.query.seriesId
    }
  },
  mounted () {
    this.initPlayer()
    this.loadData()
  },
  beforeDestroy () {
    if (this.dp) {
      this.dp.destroy()
    }
  },
  methods: {
    formatNumber (num) {
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万'
      }
      return num.toString()
    },

    initPlayer () {
      this.$nextTick(() => {
        if (this.$refs.player) {
          this.dp = this.$refs.player.dp
          this.setupPlayerEvents()
        }
      })
    },

    setupPlayerEvents () {
      if (!this.dp) return

      this.dp.on('play', () => {
        animeApi.updateViewCount(this.currentEpisode.id)
      })
    },

    async loadData () {
      if (!this.episodeId) {
        this.$message.error('缺少分集ID')
        this.$router.back()
        return
      }

      try {
        const episodeRes = await animeApi.getEpisodePlayInfo(this.episodeId)
        this.currentEpisode = episodeRes.data

        const seriesRes = await animeApi.getAnimeSeries(this.seriesId || this.currentEpisode.seriesId)
        this.currentAnime = seriesRes.data
        this.animeEpisodes = this.currentAnime.episodes || []

        if (this.dp) {
          this.dp.switchVideo({
            url: this.currentEpisode.videoUrl,
            pic: this.currentAnime.coverUrl
          }, {
            id: this.currentEpisode.id,
            api: '/api/anime/danmakus/'
          })
        }

        this.loadRatingInfo()
        this.loadComments()
      } catch (error) {
        console.error('加载数据失败:', error)
        this.$message.error('加载番剧信息失败')
        this.$router.back()
      }
    },

    // 检查VIP访问权限
    checkVipAccess (episode) {
      if (episode.min_member_level <= 0) {
        return true
      }

      // 检查用户VIP等级是否足够
      return Global.user && Global.user.memberInfoVO.memberLevel >= episode.min_member_level
    },

    // 处理播放集数
    handlePlayEpisode (episode) {
      if (!this.checkVipAccess(episode)) {
        this.requiredVipLevel = episode.min_member_level
        this.showVipDialog = true
        return
      }
      this.playEpisode(episode.id)
    },

    playEpisode (episodeId) {
      this.$router.push({
        path: '/player',
        query: {
          episodeId,
          seriesId: this.currentAnime.id
        }
      }).then(() => {
        location.reload()
      })
    },

    // 跳转到VIP开通页面
    goToVip () {
      this.showVipDialog = false
      this.$router.push('/vip')
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

    async loadRatingInfo () {
      try {
        const ratingRes = await animeApi.getRatingInfo(this.currentAnime.id)
        this.ratingInfo = ratingRes.data

        const userRatingRes = await animeApi.getUserRating(this.currentAnime.id)
        if (userRatingRes.data && userRatingRes.data.score) {
          this.userRating = userRatingRes.data
        }
      } catch (error) {
        console.error('加载评分信息失败:', error)
      }
    },

    handleRateChange (score) {
      this.submitRating(score)
    },

    async submitRating (score) {
      try {
        const res = await animeApi.addRating({
          seriesId: this.currentAnime.id,
          score
        })
        this.$message.success('评分成功')
        this.userRating.score = score
        this.loadRatingInfo()
      } catch (error) {
        console.error('评分失败:', error)
        this.$message.error('评分失败')
      }
    },

    updateRating () {
      this.submitRating(this.editRating)
      this.showEditRating = false
    },

    async loadComments () {
      try {
        const res = await animeApi.listComments({
          seriesId: this.currentAnime.id,
          episodeId: this.episodeId,
          page: this.currentPage,
          size: this.pageSize
        })

        if (this.currentPage === 1) {
          this.comments = res.data
          this.commentTotal = res.data.length
        } else {
          this.comments = [...this.comments, ...(res.data.list || [])]
        }

        this.hasMoreComments = this.comments.length < this.commentTotal
      } catch (error) {
        console.error('加载评论失败:', error)
      } finally {
        this.loadingMore = false
      }
    },

    async submitComment () {
      if (!this.commentContent.trim()) return

      try {
        const res = await animeApi.addComment({
          seriesId: this.currentAnime.id,
          episodeId: this.episodeId,
          content: this.commentContent
        })

        this.$message.success('评论成功')
        this.commentContent = ''
        this.currentPage = 1
        this.loadComments()
      } catch (error) {
        console.error('发表评论失败:', error)
        this.$message.error('发表评论失败')
      }
    },

    showReplyInput (comment) {
      this.$set(comment, 'showReply', true)
      this.$set(comment, 'replyContent', '')
    },

    cancelReply (comment) {
      this.$set(comment, 'showReply', false)
    },

    async submitReply (comment) {
      if (!comment.replyContent.trim()) return

      try {
        const res = await animeApi.addComment({
          seriesId: this.currentAnime.id,
          episodeId: this.episodeId,
          content: comment.replyContent,
          parentId: comment.id,
          rootId: comment.rootId || comment.id
        })

        this.$message.success('回复成功')
        this.$set(comment, 'showReply', false)
        this.currentPage = 1
        this.loadComments()
      } catch (error) {
        console.error('回复失败:', error)
        this.$message.error('回复失败')
      }
    },

    showReplyToReplyInput (comment, reply) {
      this.$set(reply, 'showReply', true)
      this.$set(reply, 'replyContent', '')
    },

    async submitReplyToReply (comment, reply) {
      if (!reply.replyContent.trim()) return

      try {
        const res = await animeApi.addComment({
          seriesId: this.currentAnime.id,
          episodeId: this.episodeId,
          content: reply.replyContent,
          parentId: reply.id,
          rootId: reply.rootId || comment.id
        })

        this.$message.success('回复成功')
        this.$set(reply, 'showReply', false)
        this.currentPage = 1
        this.loadComments()
      } catch (error) {
        console.error('回复失败:', error)
        this.$message.error('回复失败')
      }
    },

    getReplyToUsername (parentId, replies) {
      const parentReply = replies.find(r => r.id === parentId)
      return parentReply ? parentReply.username : ''
    },

    loadMoreComments () {
      this.loadingMore = true
      this.currentPage++
      this.loadComments()
    }
  }
}
</script>

<style scoped>
.anime-player-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 15px;
  background-color: #fff;
}

.breadcrumb {
  margin-bottom: 15px;
  padding: 0 10px;

  .el-breadcrumb {
    font-size: 12px;
  }
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.player-section {
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.player-wrapper {
  padding: 15px;

  .player-title {
    margin-bottom: 15px;

    h1 {
      font-size: 20px;
      font-weight: 500;
      margin: 0;
      color: #222;
    }
  }
}

#player {
  width: 100%;
  aspect-ratio: 16/9;
  background-color: #000;
  border-radius: 4px;
}

.episode-list {
  padding: 15px;
  border-top: 1px solid #f1f2f3;

  .episode-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;

    h3 {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: #222;
    }

    .episode-count {
      font-size: 12px;
      color: #999;
    }
  }

  .episode-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .episode-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;

    &:hover {
      background-color: #e5f1fb;
    }

    &.active {
      background-color: #e3f1ff;
      border-left: 3px solid #00a1d6;
    }

    &.vip-locked {
      background-color: #fef0f0;
      cursor: not-allowed;

      &:hover {
        background-color: #fde2e2;
      }

      .episode-number {
        background-color: #f56c6c;
        color: #fff;
      }

      .episode-title {
        color: #f56c6c;
      }
    }
  }

  .episode-number {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e5e9ef;
    color: #505050;
    border-radius: 4px;
    margin-right: 10px;
    font-size: 13px;
  }

  .active .episode-number {
    background-color: #00a1d6;
    color: #fff;
  }

  .episode-info {
    flex: 1;
    min-width: 0;
  }

  .episode-title {
    font-size: 13px;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .active .episode-title {
    color: #00a1d6;
  }

  .episode-status {
    margin-top: 4px;
    display: flex;
    align-items: center;

    .el-tag {
      height: 18px;
      line-height: 18px;
      padding: 0 5px;
    }
  }

  .vip-lock-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: #f56c6c;
  }
}

.interaction-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.anime-info {
  display: flex;
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 15px;

  .anime-cover {
    width: 120px;
    height: 160px;
    flex-shrink: 0;
    margin-right: 15px;
    border-radius: 4px;
    overflow: hidden;
    background-color: #f5f5f5;

    .el-image {
      width: 100%;
      height: 100%;
    }
  }

  .anime-meta {
    flex: 1;

    .anime-title {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 10px 0;
      color: #222;
    }

    .anime-stats {
      display: flex;
      gap: 15px;
      margin-bottom: 10px;
      font-size: 12px;
      color: #999;

      .stat-item {
        display: flex;
        align-items: center;

        i {
          margin-right: 3px;
        }
      }
    }

    .anime-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 15px;

      .el-tag {
        margin-right: 0;
      }
    }

    .anime-description {
      h3 {
        font-size: 14px;
        margin: 0 0 8px 0;
        color: #222;
      }

      p {
        font-size: 12px;
        line-height: 1.6;
        color: #666;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }
}

.rating-section {
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .rating-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;

    h3 {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: #222;
    }

    .rating-score {
      display: flex;
      align-items: baseline;

      .score {
        font-size: 20px;
        font-weight: bold;
        color: #f7ba2a;
        margin-right: 3px;
      }

      .total {
        font-size: 14px;
        color: #999;
        margin-right: 10px;
      }

      .count {
        font-size: 12px;
        color: #999;
      }
    }

    .no-rating {
      font-size: 12px;
      color: #999;
    }
  }

  .rating-action {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .user-rating {
      display: flex;
      align-items: center;
      gap: 10px;

      span {
        font-size: 14px;
        color: #666;
      }

      .el-button {
        margin-left: 10px;
      }
    }

    .el-rate {
      display: flex;
      align-items: center;
    }
  }
}

.comment-section {
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .comment-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;

    h3 {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: #222;
    }

    .comment-count {
      font-size: 12px;
      color: #999;
      margin-left: 8px;
    }
  }

  .comment-input {
    margin-bottom: 20px;

    .el-textarea {
      margin-bottom: 10px;
    }

    .comment-actions {
      text-align: right;
    }
  }

  .comment-list {
    .comment-item {
      display: flex;
      padding: 15px 0;
      border-bottom: 1px solid #f1f2f3;

      &:last-child {
        border-bottom: none;
      }
    }

    .comment-avatar {
      margin-right: 12px;
    }

    .comment-content {
      flex: 1;
    }

    .comment-user {
      margin-bottom: 8px;

      .username {
        font-weight: bold;
        margin-right: 8px;
        font-size: 14px;
      }

      .time {
        color: #999;
        font-size: 12px;
      }
    }

    .comment-text {
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .comment-footer {
      .reply-action {
        color: #999;
        font-size: 12px;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
          color: #00a1d6;
        }

        i {
          margin-right: 3px;
        }
      }
    }

    .reply-input {
      margin-top: 10px;

      .reply-actions {
        margin-top: 8px;
        text-align: right;
      }
    }

    .reply-list {
      margin-top: 10px;
      padding-left: 12px;
      border-left: 2px solid #f1f2f3;
    }

    .reply-item {
      display: flex;
      padding: 10px 0;

      .reply-avatar {
        margin-right: 8px;
      }

      .reply-content {
        flex: 1;
      }

      .reply-user {
        margin-bottom: 5px;

        .username {
          font-weight: bold;
          margin-right: 6px;
          font-size: 13px;
        }

        .time {
          color: #999;
          font-size: 11px;
        }
      }

      .reply-text {
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;

        .reply-to {
          color: #00a1d6;
          margin-right: 3px;
        }
      }

      .reply-footer {
        margin-top: 5px;

        .reply-action {
          color: #999;
          font-size: 11px;
          cursor: pointer;
          transition: color 0.2s;

          &:hover {
            color: #00a1d6;
          }

          i {
            margin-right: 2px;
          }
        }
      }
    }

    .load-more {
      text-align: center;
      padding: 15px 0;

      .el-button {
        color: #00a1d6;
      }
    }
  }
}

.edit-rating-dialog {
  text-align: center;
  padding: 20px 0;
}

.vip-dialog-content {
  text-align: center;
  padding: 20px 0;

  .vip-icon {
    margin-bottom: 15px;
  }

  .vip-message {
    p {
      margin: 5px 0;
      font-size: 14px;

      &:first-child {
        font-weight: bold;
        font-size: 16px;
      }
    }
  }
}

@media (max-width: 768px) {
  .anime-info {
    flex-direction: column;

    .anime-cover {
      width: 100%;
      height: auto;
      aspect-ratio: 3/4;
      margin-right: 0;
      margin-bottom: 15px;
    }
  }

  .episode-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
  }
}
</style>
