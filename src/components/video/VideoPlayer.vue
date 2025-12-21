<template>
  <div class="video-player-container">
    <div class="player-container">

  <!-- 左侧主内容区 -->
  <div class="main-content">

      <div class="player-div">
        <el-card class="player-card" shadow="hover">
          <div class="user-info">
            <div class="title-nav-container">
              <h3 class="video-title">{{ videoInfo.title }}</h3>
            </div>

            <div v-if="isFromAdmin" class="admin-back-container">
              <el-button type="primary" size="small" icon="el-icon-back" @click="goBackToAdmin">返回</el-button>
            </div>
          </div>
          <d-player ref="player" id="player" :options="options"></d-player>

          <!-- 分p列表 -->
          <div v-if="videoSeries && videoSeries.length > 0" class="video-series-container">
            <div class="series-header">
              <span class="series-title">分集列表</span>
              <span class="series-count">共{{ videoSeries.length }}个视频</span>
            </div>
            <div class="series-list">
              <div
                v-for="(item, index) in videoSeries"
                :key="item.id"
                :class="['series-item', item.videoId === videoId ? 'active' : '']"
                @click="play(item.videoId)"
              >
                <span class="series-index">{{ index + 1 }}</span>
                <div class="series-info">
                  <div class="series-part-title">{{ item.partTitle || item.title }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="icon-container">
            <!-- 普通用户才显示可交互的点赞按钮 -->
            <el-tooltip v-if="!isFromAdmin" effect="dark" content="点赞" placement="bottom">
              <div class="icon-item">
                <img class="like-icon" src="@/assets/like.png" v-if="!like" alt="点赞" @click="likeVideo" />
                <img class="like-icon" src="@/assets/like-click.png" v-if="like" alt="点赞" @click="likeVideo" />
                <span class="count">{{ videoInfo.like }}</span>
              </div>
            </el-tooltip>
            <!-- 管理员只显示点赞数量 -->
            <el-tooltip v-else effect="dark" content="点赞数量" placement="bottom">
              <div class="icon-item">
                <img class="like-icon" src="@/assets/like.png" alt="点赞数量" />
                <span class="count">{{ videoInfo.like }}</span>
              </div>
            </el-tooltip>

            <!-- 普通用户才显示可交互的收藏按钮 -->
            <el-tooltip v-if="!isFromAdmin" effect="dark" content="收藏" placement="bottom">
              <div class="icon-item">
                <img class="like-icon" src="@/assets/collect.png" v-if="!collect" alt="收藏" @click="collectVideo">
                <img class="like-icon" src="@/assets/collect-click.png" v-if="collect" alt="收藏" @click="collectVideo">
                <span class="count">{{ videoInfo.collect}}</span>
              </div>
            </el-tooltip>
            <!-- 管理员只显示收藏数量 -->
            <el-tooltip v-else effect="dark" content="收藏数量" placement="bottom">
              <div class="icon-item">
                <img class="like-icon" src="@/assets/collect.png" alt="收藏数量" />
                <span class="count">{{ videoInfo.collect}}</span>
              </div>
            </el-tooltip>

            <el-tooltip effect="dark" content="观看次数" placement="bottom">
              <div class="icon-item">
                <img class="like-icon" src="@/assets/view.png" alt="观看次数">
                <span class="count">{{ videoInfo.count}}</span>
              </div>
            </el-tooltip>
            <el-tooltip effect="dark" content="当前同时在看人数" placement="bottom">
              <div class="icon-item">
                <img class="like-icon" src="@/assets/viewers.png" alt="当前同时在看人数">
                <span class="count">{{ viewers }}</span>
              </div>
            </el-tooltip>
            <el-tooltip effect="dark" content="弹幕数量" placement="bottom">
              <div class="icon-item">
                <img class="like-icon" src="@/assets/bubble.png" alt="弹幕数量">
                <span class="count">{{ videoInfo.danmakus}}</span>
              </div>
            </el-tooltip>
          </div>
          <div class="tags">
            <el-tooltip effect="dark" content="视频标签" placement="bottom" v-for="tag in videoInfo.tags" :key="tag.id">
              <el-tag class="tag" @click="queryVideos(tag.name)">
                {{ tag.name }}
              </el-tag>
            </el-tooltip>
          </div>
          <div class="description">
            <el-tooltip effect="dark" content="视频描述" placement="bottom">
              <p>
                {{ videoInfo.description }}
              </p>
            </el-tooltip>
          </div>
        </el-card>
      </div>

      <!-- 评论区部分 -->
      <div class="comment-div">
        <!-- 评论标题部分 -->
        <h3 class="section-title">评论区</h3>

        <!-- 评论输入部分 - 仅供普通登录用户使用 -->
        <el-card v-if="!isFromAdmin && Global.user != null" class="comment-input-card" shadow="never">
          <el-input
            type="textarea"
            v-model="commentContent"
            :rows="3"
            placeholder="发表评论..."
            maxlength="300"
            show-word-limit
          ></el-input>

          <div class="comment-tools">
            <div class="emoji-picker">
              <el-popover placement="bottom" width="300" trigger="click">
                <template #reference>
                  <el-button type="text" icon="el-icon-star-off">表情</el-button>
                </template>
                <div class="emoji-container">
                  <span
                    v-for="emoji in emojis"
                    :key="emoji"
                    @click="addEmoji(emoji)"
                    class="emoji-item"
                  >{{ emoji }}</span>
                </div>
              </el-popover>
            </div>
            <div class="image-upload">
              <el-upload
                action="/api/video/comment/img"
                :show-file-list="false"
                :on-success="handleImageSuccess"
                :before-upload="beforeImageUpload"
              >
                <el-button type="text" icon="el-icon-picture">图片</el-button>
              </el-upload>
            </div>
          </div>
          <div class="image-preview" v-if="commentImage">
            <div class="preview-item">
              <img :src="commentImage" class="preview-image">
              <el-button
                circle
                size="mini"
                icon="el-icon-close"
                class="delete-image"
                @click="removeImage"
              ></el-button>
            </div>
          </div>
          <div class="comment-button" @click="publishComment">
            <el-button type="primary" :loading="commentLoading">发表评论</el-button>
          </div>
        </el-card>

        <!-- 管理员提示信息 -->
        <el-alert
          v-if="isFromAdmin"
          title="管理员模式：仅可查看评论"
          type="info"
          :closable="false"
          style="margin-bottom: 20px">
        </el-alert>

        <!-- 未登录提示信息 -->
        <el-alert
          v-if="!isFromAdmin && Global.user == null"
          title="请登录后发表评论"
          type="info"
          :closable="false"
          style="margin-bottom: 20px">
        </el-alert>

        <!-- 评论列表部分 -->
        <div class="comment-list-header">
          <h3 class="section-title comment-list-title">评论列表</h3>
          <span class="comment-count">共 {{allComments.length}} 条评论</span>
        </div>

        <el-empty v-if="pagedComments.length === 0" description="暂无评论"></el-empty>

        <!-- 评论列表 -->
<!-- 评论列表 -->

<div class="comment-list" v-if="pagedComments && pagedComments.length > 0">
  <comment-node
    v-for="comment in pagedComments"
    :key="comment.id"
    :comment="comment"
    :is-from-admin="isFromAdmin"
    :is-reply="comment.isReply"
    @delete="deleteComment"
    @submit-reply="submitReply"
    @toggle-reply-box="toggleReplyBox"
  ></comment-node>
</div>

        <!-- 分页控件 -->
        <div class="pagination-container" v-if="allComments.length > pageSize">
          <el-pagination
            background
            layout="prev, pager, next"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="allComments.length"
            @current-change="handlePageChange"
          ></el-pagination>
        </div>
      </div>
  </div>

   <!-- 右侧边栏 -->
   <div class="sidebar" style="background-color: #FFFFFF;">
      <!-- Recommended Videos Section -->
      <div style="margin-top: -15px; border-top: 1px solid #f0f0f0; margin-left: 16px;">
        <!-- up信息容器 -->
        <div class="user-info-container up-mar" v-if="videoInfo.userId">
          <UserPopUp :avatar="videoInfo.avatar" :id="videoInfo.userId" :nick="videoInfo.nick"></UserPopUp>
        </div>
      </div>

      <div class="recommend-div" style="margin-top: -10px;">
        <el-card class="recommend" v-if="recommendList != null && recommendList.length > 0">
          <h3 class="section-title">猜你喜欢</h3>
          <div class="vertical-recommend-list">
            <div class="recommend-item" v-for="video in recommendList" :key="video.id">
              <el-card shadow="hover" class="recommend-card">
                <div class="image-container">
                  <el-image class="cover" :src="video.cover" @click="play(video.id)" />
                  <div class="image-text">
                    <span>{{ formatTime(video.duration) }}</span>
                    <img class="icon" src="@/assets/view.png" alt="观看次数"> {{ video.count}}
                    <img class="icon" src="@/assets/like-click.png" alt="点赞次数"> {{video.like}}
                    <img class="icon" src="@/assets/collect-click.png" alt="收藏数量"> {{video.collect}}
                  </div>
                </div>
                <div class="title">{{video.title}}</div>
                <!---推荐视频Up信息---->
                <div class="user-info-container" >
                  <UserPopUp :avatar="video.avatar" :id="video.userId" :nick="video.nick"></UserPopUp>
                </div>
              </el-card>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import dPlayer from 'vue-dplayer'
import videoApi from '@/api/video/video'
import Global from '@/components/Global.vue'
import UserPopUp from '@/components/user/UserPopUp.vue'
import { apiHostname } from '@/config/api'
import CommentNode from './CommentNode.vue'

export default {
  name: 'VideoPlayer',
  components: {
    UserPopUp,
    dPlayer,
    CommentNode
  },
  data () {
    let that = this
    return {
      commentImage: '', // 存储上传成功的图片URL
      imageUploading: false,
      emojis: ['😀', '😂', '😍', '👍', '❤️', '🙏', '🔥', '🎉', '🤔', '😢'],
      commentContent: '',
      isSubscribe: false,
      allComments: [], // 存储所有评论数据
      pagedComments: [], // 存储当前页显示的评论
      recommendList: [],
      currentPage: 1,
      pageSize: 5, // 每页显示10条评论
      commentLoading: false,
      replyLoading: false,
      viewers: 0,
      like: false,
      collect: false,
      videoId: this.$route.query.videoId,
      videoInfo: {},
      videoSeries: [], // 存储视频分p数据
      ws: null,
      dp: null,
      updateHistoryTimer: null,
      options: {
        apiBackend: {
          read: function (options, callback) {
            that.$http.get(options).then((res) => {
              callback('', res.data.data)
            })
          },
          send: function (url, data, callback) {
            if (Global.user == null) {
              that.$message.error('请登录后再发送')
              return
            }
            data.player = that.videoId
            data.userId = Global.user.id
            data.author = Global.user.nick
            that.ws.send(JSON.stringify(data))
            console.log(JSON.stringify(data))
            callback()
          }
        },
        video: {
          url: ''
        },
        danmaku: {
          id: '',
          api: '/api/video/danmakus/'
        },
        subtitle: {
          url: 'https://man-yue.oss-cn-beijing.aliyuncs.com/2267ddec-c96f-4611-a6f1-d00f9ee28bc5.vtt',
          type: 'webvtt',
          fontSize: '25px',
          bottom: '10%',
          color: '#b7daff'
        }
      },
      isFromAdmin: this.$route.query.source === 'admin',
      replyIdCounter: 1000
    }
  },
  directives: {
    'filter-hsx': {
      bind (el, binding) {
        el.value = binding.value.replace(/https:\/\/hsx[^\s]+/g, '')
      }
    }
  },
  computed: {
    totalPages () {
      return Math.ceil(this.allComments.length / this.pageSize)
    }
  },
  beforeDestroy () {
    if (this.ws) {
      this.ws.close()
    }
    if (this.updateHistoryTimer) {
      clearInterval(this.updateHistoryTimer)
    }
  },
  mounted () {
    if (this.$route.query.videoId) {
      this.videoId = this.$route.query.videoId
      console.log('Initializing video with ID:', this.videoId)

      videoApi.getVideoDetail(this.videoId)
        .then(res => {
          console.log('Video detail response:', res)
          if (!res.data) {
            console.warn('No video data received')
            return
          }

          this.videoInfo = res.data
          videoApi.getVideoSeries(this.videoId).then(res => {
            if (res.data) {
              console.log('Video series response:', res.data)
              this.videoSeries = res.data
            }
          })

          if (Global.user != null && !this.isFromAdmin) {
            videoApi.likeInfo(this.videoId)
              .then(res => {
                this.like = res.data.isLike
                this.collect = res.data.isCollect
              })
              .catch(err => {
                console.error('Error fetching like info:', err)
              })
            this.getHistory()
          }

          if (this.$refs.player && this.$refs.player.dp) {
            this.dp = this.$refs.player.dp
            this.dp.switchVideo({
              url: res.data.playUrl,
              pic: res.data.cover
            }, {
              id: this.videoId,
              api: '/api/video/danmakus/'
            })

            this.setupPlayerEvents()
          }

          this.getBasedItemRecommendList()
          this.loadComments()
          this.setupDanmakuWebSocket()
        })
        .catch(err => {
          console.error('Error fetching video details:', err)
          this.$message.error('获取视频信息失败，请稍后重试')
        })
    }
  },
  methods: {
    handleReply (comment) {
      this.toggleReplyBox(comment)
    },

    // 显示时过滤内容
    filteredReplyContent (comment) {
      return (comment.replyContent && comment.replyContent.replace(/https:\/\/hsx[^\s]*/g, '')) || ''
    },

    // 更新时保持原始数据
    updateReplyContent (comment, newValue) {
      comment.replyContent = newValue
    },
    addReplyEmoji (comment, emoji) {
      this.$set(comment, 'replyContent', (comment.replyContent || '') + emoji)
    },
    handleReplyImageSuccess (comment, res) {
      console.log('res:' + res)
      this.$set(comment, 'replyContent', (comment.replyContent || '') + ' ' + res + ' ')
      this.$set(comment, 'replyImage', res)
    },
    extractHsxHbUrl (content) {
      if (!content) return ''
      // 使用正则匹配 https://hsx-hb 开头的链接
      const urlMatch = content.match(/https:\/\/hsx-hb[^\s]+/)
      return urlMatch ? urlMatch[0] : '' // 返回匹配到的第一个链接，如果没有则返回空
    },

    isImageUrl (text) {
      return text.startsWith('https://hsx') &&
            (text.toLowerCase().endsWith('.jpg') ||
              text.toLowerCase().endsWith('.jpeg') ||
              text.toLowerCase().endsWith('.png'))
    },
    splitContent (content) {
      if (!content) return []
      const regex = /(https:\/\/hsx[^\s]+\.(?:jpg|jpeg|png))/gi
      return content.split(regex)
    },
    previewImage (url) {
      this.$alert(`<img src="${url}" style="max-width: 100%;"/>`, '图片预览', {
        dangerouslyUseHTMLString: true,
        customClass: 'image-preview-modal'
      })
    },
    beforeImageUpload (file) {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt10M = file.size / 1024 / 1024 < 10 // 检查文件是否小于 10MB

      if (!isJPG) {
        this.$message.error('上传图片只能是 JPG/PNG 格式!')
      }
      if (!isLt10M) {
        this.$message.error('上传图片大小不能超过 10MB!')
      }
      return isJPG && isLt10M
    },
    handleImageSuccess (response) {
      this.commentImage = response
      console.log('上传返回的图片:' + response)
    },
    removeImage () {
      this.commentImage = ''
    },

    addEmoji (emoji) {
      this.commentContent += emoji
    },
    // 分页变化处理
    handlePageChange (page) {
      this.currentPage = page
      this.updatePagedComments()
    },

    // 更新当前页显示的评论
    updatePagedComments () {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      this.pagedComments = this.allComments.slice(start, end)
    },

    // 加载评论
    async loadComments () {
      try {
        const res = await videoApi.getCommentList({
          videoId: this.videoId
        })

        console.log('加载出来的评论:', res)

        if (res.code === 200000 && Array.isArray(res.data)) {
          // 扁平化处理评论数据
          const flattenComments = (comments, parentComment = null) => {
            let result = []
            comments.forEach(comment => {
              // 如果是回复评论，设置replyToUser
              if (parentComment) {
                comment.replyToUser = parentComment.user
              }

              const newComment = {
                ...comment,
                showReplyBox: false,
                replyContent: '',
                showReplies: false,
                replyImage: '',
                user: comment.user || { nick: '未知用户', avatar: '' },
                isReply: parentComment !== null
              }

              result.push(newComment)

              // 递归处理子评论
              if (comment.sons && comment.sons.length > 0) {
                result = result.concat(flattenComments(comment.sons, comment))
              }
            })
            return result
          }

          this.allComments = flattenComments(res.data)
          this.updatePagedComments()
        } else {
          console.warn('API返回数据格式不符合预期:', res)
          this.allComments = []
          this.pagedComments = []
        }
      } catch (error) {
        console.error('获取评论失败:', error)
        this.$message.error('获取评论失败，请稍后重试')
        this.allComments = []
        this.pagedComments = []
      }
    },

    // 发表评论
    async publishComment () {
      if (!this.commentContent.trim() && !this.commentImage) {
        this.$message.error('请输入评论内容或上传图片')
        return
      }

      this.commentLoading = true

      try {
        const res = await videoApi.publishComment({
          videoId: this.videoId,
          content: this.commentContent + (this.commentImage ? ' ' + this.commentImage : ''),
          parentId: 0
        })

        if (res.code === 200000) {
          this.commentImage = ''
          this.$message.success('评论发表成功')
          this.commentContent = ''
          // 重新加载评论列表
          await this.loadComments()
          // 跳转到第一页显示新评论
          this.currentPage = 1
        } else {
          this.$message.error(res.msg || '评论发表失败')
        }
      } catch (error) {
        console.error('发表评论失败:', error)
        this.$message.error('评论发表失败，请稍后重试')
      } finally {
        this.commentLoading = false
      }
    },

    // 回复评论
    async submitReply (comment, replyTo = null) {
      const replyContent = replyTo ? replyTo.replyContent : comment.replyContent

      if (!replyContent.trim()) {
        this.$message.error('请输入回复内容')
        return
      }

      this.replyLoading = true

      try {
        const parentId = replyTo ? replyTo.id : comment.id
        const replyToId = replyTo ? replyTo.user.id : comment.user.id

        console.log('createTime' + comment.createTime)
        console.log('parentId' + comment.parentId)
        console.log('replyToId' + comment.replyToId)

        const res = await videoApi.replyComment({
          videoId: this.videoId,
          content: replyContent.trim() + (replyTo ? (replyTo.replyImage ? ' ' + replyTo.replyImage : '') : (comment.replyImage ? ' ' + comment.replyImage : '')),
          parentId: parentId,
          replyCommentId: comment.id,
          replyToId: comment.user.id,
          toCreateTime: comment.createTime

        })

        if (res.code === 200000) {
          this.$message.success('回复成功')
          if (replyTo) {
            replyTo.replyContent = ''
            replyTo.replyImage = ''
            replyTo.showReplyBox = false
          } else {
            comment.replyContent = ''
            comment.replyImage = ''
            comment.showReplyBox = false
          }
          // 重新加载评论列表
          await this.loadComments()
        } else {
          this.$message.error(res.msg || '回复失败')
        }
      } catch (error) {
        console.error('回复评论失败:', error)
        this.$message.error('回复失败，请稍后重试')
      } finally {
        this.replyLoading = false
      }
    },

    // 删除评论
    async deleteComment (comment) {
      try {
        await this.$confirm('确定要删除这条评论吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        console.log('commentId：' + comment.id)

        const res = await videoApi.deleteComment(comment.id)

        if (res.code === 200000) {
          this.$message.success('删除成功')
          // 重新加载评论列表
          await this.loadComments()
          // 如果当前页没有评论了，且不是第一页，则跳转到前一页
          if (this.pagedComments.length === 0 && this.currentPage > 1) {
            this.currentPage -= 1
          }
        } else {
          this.$message.error(res.msg || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除评论失败:', error)
          this.$message.error('删除失败，请稍后重试')
        }
      }
    },

    // 其他原有方法保持不变...
    wsOpen () {
    },
    wsClose () {
      this.viewers--
    },
    wsMessage (message) {
      let res = JSON.parse(message.data)
      console.log('res=' + res)
      this.viewers = res.viewers
      if (res.text === null || !this.dp || !this.dp.danmaku || res.text === undefined) {
        return
      }
      this.dp.danmaku.draw({
        text: res.text,
        color: res.color,
        type: res.type
      })
    },
    likeVideo () {
      videoApi.like(this.videoId).then(() => {
        this.like = !this.like
        let likeCount = this.videoInfo.like
        this.videoInfo.like = this.like ? parseInt(likeCount) + 1 : parseInt(likeCount) - 1
      })
    },
    collectVideo () {
      videoApi.collect(this.videoId).then(() => {
        this.collect = !this.collect
        let collectionCount = this.videoInfo.collect
        this.videoInfo.collect = this.collect ? collectionCount + 1 : collectionCount - 1
      })
    },
    updateHistory () {
      if (Global.user !== null) {
        videoApi.updateHistory(this.videoId, this.dp.video.currentTime)
      } else {
        videoApi.updateHistoryUnlogin(this.videoId, this.dp.video.currentTime)
      }
    },
    getHistory () {
      videoApi.getHistory(this.videoId).then(res => {
        if (res.data !== -1) {
          this.$message('已为你跳转到上次的播放位置')
          this.dp.seek(res.data)
        }
      })
    },
    getBasedItemRecommendList () {
      videoApi.basedItemRecommend().then(res => {
        this.recommendList = res.data
      })
    },
    formatTime (seconds) {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = Math.floor(seconds % 60)

      const formattedHours = hours.toString().padStart(2, '0')
      const formattedMinutes = minutes.toString().padStart(2, '0')
      const formattedSeconds = remainingSeconds.toString().padStart(2, '0')

      if (hours === 0) {
        return `${formattedMinutes}:${formattedSeconds}`
      } else {
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
      }
    },
    play (videoId) {
      const query = {
        videoId: videoId
      }

      if (this.isFromAdmin) {
        query.source = 'admin'
      }

      this.$router.push({
        path: '/video-player',
        query: query
      }).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          throw err
        }
      })
    },
    queryVideos (tagName) {
      this.$router.push({
        name: 'Index',
        query: {
          keyword: tagName
        }
      })
    },
    setupPlayerEvents () {
      if (!this.dp) return

      let that = this
      this.dp.on('play', function () {
        let timer = setTimeout(() => {
          videoApi.incrViewCounts(that.videoInfo.id)
          clearTimeout(timer)
        }, 1000)
        that.updateHistoryTimer = setInterval(() => {
          that.updateHistory()
        }, 1000)
      })

      this.dp.on('pause', function () {
        if (that.updateHistoryTimer) {
          clearInterval(that.updateHistoryTimer)
        }
      })
    },
    setupDanmakuWebSocket () {
      let videoId = this.$route.query.videoId
      this.ws = new WebSocket(`ws://${apiHostname}/danmaku/${videoId}`)
      this.ws.onopen = this.wsOpen
      this.ws.onmessage = this.wsMessage
      this.ws.onclose = this.wsClose
    },
    goBackToAdmin () {
      this.$router.push({
        path: '/admin/videos',
        query: { preventRefresh: 'true' }
      })
    },
    toggleReplyBox (comment) {
      comment.showReplyBox = !comment.showReplyBox
      /* if (comment.showReplyBox) {
    this.$set(comment, 'replyContent', `@${comment.user.nick} `)
  } else {
    this.$set(comment, 'replyContent', '')
  } */
    },
    toggleShowReplies (comment) {
      comment.showReplies = !comment.showReplies
    },
    getReplyToNick (comment, reply) {
      if (reply.parentId === comment.id) {
        return comment.user.nick
      }

      const parentReply = comment.sons.find(r => r.id === reply.parentId)
      return parentReply ? parentReply.user.nick : ''
    },
    canDeleteComment (comment) {
      if (this.isFromAdmin) return true
      if (!Global.user) return false
      return Global.user.id === comment.user.id || Global.user.role === 'admin'
    }
  },
  watch: {
    $route (to, from) {
      if (to.path === from.path && to.query !== from.query) {
        location.reload()
      }
    }
  }
}
</script>

<style>
/* 分p列表样式 */
.video-series-container {
  margin: 15px 20px;
  max-width: 70vw;
  margin: 15px auto;
  border: 1px solid #e5e9ef;
  border-radius: 4px;
}

.series-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #e5e9ef;
}

.series-title {
  font-size: 16px;
  font-weight: bold;
  color: #222;
}

.series-count {
  font-size: 14px;
  color: #99a2aa;
}

.series-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px 0;
  display: flex;
  flex-wrap: wrap;
}

.series-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.3s;
  width: calc(50% - 10px);
  box-sizing: border-box;
  margin: 0 5px;
  border-radius: 4px;
}

.series-item:hover {
  background-color: #f4f5f7;
}

.series-item.active {
  background-color: #e3f1ff;
}

.series-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f2f3;
  color: #505050;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 13px;
}

.series-item.active .series-index {
  background-color: #00a1d6;
  color: #fff;
}

.series-info {
  flex: 1;
  overflow: hidden;
}

.series-part-title {
  font-size: 14px;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.series-item.active .series-part-title {
  color: #00a1d6;
}

/* 适配移动设备 */
@media (max-width: 768px) {
  .series-item {
    width: 100%;
  }
}

.emoji-picker {
  margin-bottom: 10px;
}

.emoji-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emoji-item {
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.emoji-item:hover {
  transform: scale(1.2);
}

/* 原有样式保持不变... */
.video-title {
  text-align: left;
}
.video-player-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.player-container {
  display: flex;
  align-items: stretch; /* 确保两侧等高 */
  gap: 20px;
}

.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
}

.player-div {
  margin-bottom: 20px;
}

.player-div {
  display: flex;
  justify-content: center;
  padding: 0;
  background-color: #fff;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 0;
  width: 100%;
}

.player-card {
  position: relative;
  width: 100%;
  max-width: 70vw;
  margin: 0 auto;
  padding: 0;
  overflow: hidden;
}

#player {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
  height: auto;
}

#player>>>.dplayer-video-wrap,
#player>>>.dplayer-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.like-icon {
  cursor: pointer;
  max-width: 24px;
  margin-right: 5px;
}

.icon-container {
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  padding: 15px 20px;
  max-width: 70vw;
  margin: 0 auto;
}

.icon-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  margin-right: 5px;
  color: #606266;
}

.count {
  font-weight: bold;
  margin-left: 4px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid #409EFF;
}

.comment-div {
  padding: 20px;
  background-color: #fff;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.comment-h4 {
  text-align: left;
  margin-bottom: 10px;
}

.comment-button {
  text-align: left;
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.comment-button .el-button {
  padding: 8px 15px;
  font-size: 13px;
}

.comment-list-title {
  margin-top: 30px;
}

.comment-flex-container {
  display: flex;
  gap: 15px;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-main {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-grow: 1;
}

.username {
  font-weight: bold;
  font-size: 14px;
  color: #6d757a;
}

.comment-meta {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.comment-time {
  font-size: 12px;
  color: #999;
}
.vertical-recommend-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}
.comment-actions {
  display: flex;
  gap: 10px;
}

.reply-button {
  color: #606266;
  padding: 0;
}

.reply-button:hover {
  color: #409EFF;
}

.delete-button {
  color: #606266;
  padding: 0;
}

.delete-button:hover {
  color: #F56C6C;
}

.comment-card {
  margin-top: 8px
}

.comment-item {
  padding: 15px 0;
  border-top: 1px solid #ebeef5;
}

.comment-item.has-replies {
  margin-bottom: 10px;
}

.description {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  max-width: 70vw;
  margin: 0 auto;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  max-width: 70vw;
  margin: 0 auto;
}

.info-container {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.tags {
  margin: 10px 0;
  padding: 15px 20px;
  max-width: 70vw;
  margin: 0 auto;
}

.tag {
  margin: 5px 5px;
  cursor: pointer;
}

.recommend {
  box-shadow: none;
  border: none;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.recommend-div {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.recommend h3 {}

.recommend-card {
  transition: transform 0.3s;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.recommend-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.image-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  overflow: hidden;
  flex-shrink: 0;
}

.image-container .cover,
.image-container .el-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  display: block;
}

.image-text {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 6px;
  box-sizing: border-box;
  font-size: 12px;
  display: flex;          /* 启用 Flex 布局 */
  justify-content: space-between; /* 左对齐时长，右对齐其他元素 */
  align-items: center;    /* 垂直居中 */
}

/* 时长部分左对齐 */
.image-text > :first-child {
  margin-right: auto;     /* 将时长推到最左侧 */
}

.title {
  margin: 6px 8px;
  font-size: 13px;
  font-weight: bold;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 36px;
  line-height: 1.3;
  flex-shrink: 0;
}

.user-info-container {
  padding: 0 8px 8px 8px;
  flex-shrink: 0;
  margin-top: auto;
}

.icon {
  margin-left: 8px;
  max-width: 14px;
  vertical-align: middle;
}

.upload-status-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.recommend-item {
  width: 100%;
}

.recommend-card {
  width: 100%;
  margin-bottom: 0;
}

.image-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 比例 */
}

.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-text {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  margin-top: 8px;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info-container {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}
.status-card {
  border-radius: 8px;
}

.video-basic-info {
  display: flex;
  gap: 20px;
}

.cover-container {
  width: 320px;
  height: 180px;
  overflow: hidden;
  border-radius: 4px;
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-content {
  flex: 1;
}

.video-title {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #303133;
}

.video-description {
  color: #606266;
  font-size: 14px;
  margin-bottom: 20px;
}

.upload-status {
  margin: 20px 0;
}

.status-message {
  margin-top: 15px;
  padding: 10px;
  background-color: #f0f9eb;
  color: #67c23a;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.status-message.error {
  background-color: #fef0f0;
  color: #f56c6c;
}

.tags {
  margin-top: 15px;
}

.tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

:deep(.el-step__title) {
  font-size: 14px;
}

:deep(.el-step__icon) {
  width: 24px;
  height: 24px;
}

.watch-button {
  margin-left: 10px;
  vertical-align: middle;
}

.title-nav-container {
  display: flex;
  align-items: center;
  flex: 1;
}

.admin-back-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* 评论区新增样式 */
.comment-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.comment-count {
  font-size: 14px;
  color: #909399;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.comment-item.has-replies {
  margin-bottom: 10px;
}

.comment-user-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.username {
  font-weight: bold;
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
}

.like-button {
  color: #606266;
  padding: 0 5px;
}

.like-button:hover {
  color: #409EFF;
}

.like-button .liked {
  color: #409EFF;
}

.reply-button {
  color: #606266;
  padding: 0 5px;
}

.reply-button:hover {
  color: #409EFF;
}

.delete-button {
  color: #606266;
  padding: 0 5px;
}

.delete-button:hover {
  color: #F56C6C;
}

.reply-box {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.reply-button-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.reply-list {
  margin-top: 10px;
  padding-left: 15px;
  border-left: 2px solid #e6e6e6;
}

.reply-list.expanded {
  max-height: none;
}

.reply-item {
  padding: 10px 0;
  border-bottom: 1px dashed #ebeef5;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-flex-container {
  display: flex;
  gap: 10px;
}

.reply-user-info {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-size: 13px;
}

.reply-to {
  color: #909399;
  margin: 0 5px;
  font-size: 12px;
}

.reply-content {
  font-size: 13px;
  line-height: 1.5;
  color: #303133;
  margin-bottom: 5px;
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-actions {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.view-more-replies {
  color: #409EFF;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  padding: 5px 0;
  margin-top: 5px;
}

.view-more-replies:hover {
  text-decoration: underline;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .comment-flex-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .comment-avatar {
    margin-bottom: 10px;
  }

  .reply-flex-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .reply-avatar {
    margin-bottom: 5px;
  }
}

/*覆盖 dplayer 顶部、底部样式，解决弹幕位置错误问题*/
.dplayer-danmaku-bottom {
  position: absolute;
  width: 100%;
  text-align: center;
  visibility: hidden;
  left: 50%;
  transform: translateX(-50%);
}

.dplayer-danmaku-top {
  transform: translateX(-50%);
  position: absolute;
  width: 100%;
  text-align: center;
  visibility: hidden;
  left: 50%;
}
.comment-tools {
  display: flex;
  margin-bottom: 10px;
}

.image-upload {
  margin-left: 10px;
}

.image-preview {
  margin-top: 10px;
  position: relative;
}

.preview-item {
  position: relative;
  display: inline-block;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 4px;
}

.delete-image {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #f56c6c;
  color: white;
  padding: 0;
  width: 20px;
  height: 20px;
}
.comment-image {
  max-width: 200px;
  max-height: 200px;
  margin-left: -55px;
  margin-top: 0;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.comment-image:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.reply-comment-image {
  max-width: 200px;
  max-height: 200px;
  margin-left: 0;
  margin-top: 0;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.reply-comment-image:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.comment-list {
  border-top: 1px solid #f0f0f0;
}

.comment-item {
  transition: background-color 0.2s;
}

.comment-item:hover {
  background-color: #f9f9f9;
}
</style>
