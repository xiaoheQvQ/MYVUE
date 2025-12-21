<template>
    <div class="comment-item" :class="{'is-reply': isReply}">
      <div class="comment-flex-container">
        <div class="comment-avatar">
          <el-avatar :size="32" :src="comment.user.avatar" />
        </div>
        <div class="comment-main">
          <div class="comment-user-info">
            <span class="username">{{ comment.user.nick }}</span>
            <template v-if="comment.replyToUser">
              <span class="reply-to">回复</span>
              <span class="reply-username">@{{ comment.replyToUser.nick }}</span>
            </template>
            <span class="comment-time">{{ comment.createTime }}</span>
          </div>
          <div class="comment-content">{{ comment.content.replace(/https:\/\/hsx-hb[^\s]+/g,'') }}
            <template v-for="(part, index) in splitContent(extractHsxHbUrl(comment.content))">
              <img
                v-if="isImageUrl(part)"
                :key="'img-'+index"
                :src="part"
                class="comment-image"
                @click="previewImage(part)"
              />
              <span v-else :key="'text-'+index">{{ part }}</span>
            </template>
          </div>
          <div class="comment-actions">
            <el-button
              v-if="!isFromAdmin && Global.user != null"
              class="reply-button"
              type="text"
              size="mini"
              @click="toggleReplyBox(comment)"
            >
              {{ comment.showReplyBox ? '取消回复' : '回复' }}
            </el-button>

            <el-button
              class="delete-button"
              type="text"
              size="mini"
              @click="$emit('delete', comment)"
              v-if="canDeleteComment(comment)"
            >
              删除
            </el-button>
          </div>

          <!-- 回复框 -->
          <div class="reply-box" v-if="comment.showReplyBox && !isFromAdmin && Global.user != null">
            <el-input
              type="textarea"
              v-model="comment.replyContent"
              :rows="2"
              :placeholder="`回复 @${comment.user.nick}`"
              maxlength="200000"
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
                      @click="addReplyEmoji(comment, emoji)"
                      class="emoji-item"
                    >{{ emoji }}</span>
                  </div>
                </el-popover>
              </div>
              <div class="image-upload">
                <el-upload
                  action="/api/video/comment/img"
                  :show-file-list="false"
                  :on-success="(res) => handleReplyImageSuccess(comment, res)"
                  :before-upload="beforeImageUpload"
                >
                  <el-button type="text" icon="el-icon-picture">图片</el-button>
                </el-upload>
              </div>
            </div>
            <div class="image-preview" v-if="comment.replyImage">
              <div class="preview-item">
                <img :src="comment.replyImage" class="preview-image">
                <el-button
                  circle
                  size="mini"
                  icon="el-icon-close"
                  class="delete-image"
                  @click="comment.replyImage = ''"
                ></el-button>
              </div>
            </div>

            <div class="reply-button-container">
              <el-button
                type="primary"
                size="mini"
                @click="$emit('submit-reply', comment)"
                :loading="replyLoading"
              >
                发送回复
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

<script>
import Global from '@/components/Global.vue'

export default {
  name: 'CommentNode',
  props: {
    comment: {
      type: Object,
      required: true
    },
    isFromAdmin: {
      type: Boolean,
      default: false
    },
    isReply: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      emojis: ['😀', '😂', '😍', '👍', '❤️', '🙏', '🔥', '🎉', '🤔', '😢'],
      replyLoading: false
    }
  },
  methods: {
    extractHsxHbUrl (content) {
      if (!content) return ''
      const urlMatch = content.match(/https:\/\/hsx-hb[^\s]+/)
      return urlMatch ? urlMatch[0] : ''
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
      const isLt10M = file.size / 1024 / 1024 < 10

      if (!isJPG) {
        this.$message.error('上传图片只能是 JPG/PNG 格式!')
      }
      if (!isLt10M) {
        this.$message.error('上传图片大小不能超过 10MB!')
      }
      return isJPG && isLt10M
    },
    toggleReplyBox (comment) {
      this.$emit('toggle-reply-box', comment)
    },
    addReplyEmoji (comment, emoji) {
      if (!comment.replyContent) {
        this.$set(comment, 'replyContent', '')
      }
      comment.replyContent += emoji
    },
    handleReplyImageSuccess (comment, res) {
      if (!comment.replyContent) {
        this.$set(comment, 'replyContent', '')
      }
      comment.replyContent += ' ' + ' '
      this.$set(comment, 'replyImage', res)
    },
    canDeleteComment (comment) {
      if (this.isFromAdmin) return true
      if (!Global.user) return false
      return Global.user.id === comment.user.id || Global.user.role === 'admin'
    }
  }
}
</script>

  <style scoped>
  .comment-item {
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .comment-item.is-reply {
    padding-left: 48px;
    position: relative;
  }

  .comment-item.is-reply::before {
    content: "";
    position: absolute;
    left: 20px;
    top: 20px;
    width: 20px;
    height: 20px;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>') no-repeat;
    background-size: contain;
    opacity: 0.6;
  }

  .comment-flex-container {
    display: flex;
    gap: 12px;
  }

  .comment-avatar {
    flex-shrink: 0;
  }

  .comment-main {
    flex-grow: 1;
  }

  .comment-user-info {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    font-size: 13px;
  }

  .username {
    font-weight: 500;
    color: #61666d;
  }

  .reply-to {
    color: #999;
    margin: 0 4px;
  }

  .reply-username {
    color: #5090cc;
    margin-right: 8px;
  }

  .comment-time {
    color: #999;
    font-size: 12px;
  }

  .comment-content {
    font-size: 14px;
    line-height: 1.5;
    color: #222;
    margin-bottom: 8px;
    word-break: break-word;
  }

  .comment-actions {
    display: flex;
    gap: 12px;
  }

  .reply-button, .delete-button {
    padding: 0;
    font-size: 12px;
  }

  .reply-button {
    color: #61666d;
  }

  .reply-button:hover {
    color: #00a1d6;
  }

  .delete-button {
    color: #61666d;
  }

  .delete-button:hover {
    color: #f56c6c;
  }

  .reply-box {
    margin-top: 10px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }

  .comment-tools {
    display: flex;
    margin-top: 8px;
  }

  .image-preview {
    margin-top: 8px;
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
    top: -8px;
    right: -8px;
    background: #f56c6c;
    color: white;
    padding: 0;
    width: 18px;
    height: 18px;
  }

  .comment-image {
    max-width: 200px;
    max-height: 200px;
    margin: 4px 0;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #eee;
  }

  .reply-button-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
  </style>
