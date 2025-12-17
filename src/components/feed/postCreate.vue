<template>
  <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
    <div style="background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="padding: 15px 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 18px; font-weight: 500; color: #333;">发布新动态</span>
        <button 
          @click="resetForm"
          :disabled="submitting"
          style="background: none; border: none; color: #409EFF; cursor: pointer; padding: 3px 0;"
        >清空</button>
      </div>
      
      <div style="padding: 20px;">
        <form @submit.prevent="submitForm">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; color: #666;">分享你的想法</label>
            <textarea
              v-model="form.content"
              placeholder="这一刻的想法..."
              style="width: 100%; padding: 10px; border: 1px solid #dcdfe6; border-radius: 4px; min-height: 100px; resize: none;"
              maxlength="500"
            ></textarea>
            <div style="text-align: right; font-size: 12px; color: #999; margin-top: 5px;">
              {{ form.content.length }}/500
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; color: #666;">添加位置（可选）</label>
            <div style="position: relative;">
              <i style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #c0c4cc;"></i>
              <input
                v-model="form.location"
                placeholder="例如：北京故宫"
                style="width: 100%; padding: 10px 10px 10px 30px; border: 1px solid #dcdfe6; border-radius: 4px;"
              >
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; color: #666;">添加图片（最多9张）</label>
            <div>
              <input 
                type="file"
                ref="fileInput"
                multiple
                accept="image/*"
                @change="handleFileChange"
                style="display: none;"
              >
              <button 
                type="button"
                @click="$refs.fileInput.click()"
                v-if="fileList.length < 9"
                style="width: 100px; height: 100px; border: 1px dashed #d9d9d9; border-radius: 6px; background: #fbfdff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; margin-bottom: 10px;"
              >
                <span style="font-size: 24px; color: #8c939d;">+</span>
              </button>
              
              <div v-for="(file, index) in fileList" :key="index" style="display: inline-block; margin-right: 10px; margin-bottom: 10px; position: relative;">
                <img 
                  :src="file.url"
                  style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px;"
                >
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.3s; display: flex; align-items: center; justify-content: center;"
                  @mouseenter="hoverIndex = index"
                  @mouseleave="hoverIndex = -1"
                  :style="{ opacity: hoverIndex === index ? 1 : 0 }"
                >
                  <button 
                    type="button"
                    @click.stop="handlePreview(file)"
                    style="background: none; border: none; color: white; margin: 0 5px; cursor: pointer;"
                  >
                    <span style="font-size: 18px;">👁️</span>
                  </button>
                  <button 
                    type="button"
                    @click.stop="handleRemove(index)"
                    style="background: none; border: none; color: white; margin: 0 5px; cursor: pointer;"
                  >
                    <span style="font-size: 18px;">🗑️</span>
                  </button>
                </div>
              </div>
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 8px;">
              <span>📌 支持 JPG/PNG 格式，单张不超过 5MB</span>
            </div>
          </div>
          
          <div>
            <button 
              type="submit"
              :disabled="submitting || (fileList.length === 0 && !form.content.trim())"
              style="padding: 10px 20px; background: #409EFF; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;"
            >
              {{ submitting ? '发布中...' : '发布动态' }}
            </button>
            <button 
              type="button"
              @click="resetForm"
              :disabled="submitting"
              style="padding: 10px 20px; background: white; color: #606266; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer;"
            >
              重置
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 图片预览模态框 -->
    <div v-if="previewVisible" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;"
      @click="previewVisible = false"
    >
      <img :src="previewImage" style="max-width: 90%; max-height: 90%;">
    </div>
  </div>
</template>

<script>
import feedApi from '@/api/feed/feed'

export default {
  name: 'PostCreate',
  data() {
    return {
      form: {
        content: '',
        location: '',
      },
      fileList: [],
      submitting: false,
      previewVisible: false,
      previewImage: '',
      hoverIndex: -1
    }
  },
  methods: {
    async submitForm() {
      if (this.fileList.length === 0 && !this.form.content.trim()) {
        alert('请填写内容或添加图片')
        return
      }
      
      this.submitting = true
      
      try {
        // 上传图片
        const imageUrls = []
        for (const file of this.fileList) {
          try {
            const res = await feedApi.uploadImage(file.raw)
            imageUrls.push(res.data)
            console.log(`图片 ${file.name} 上传成功`)
          } catch (error) {
            console.error(`图片 ${file.name} 上传失败:`, error)
            throw error
          }
        }
        
        // 提交动态
        await feedApi.createPost({
          content: this.form.content.trim(),
          location: this.form.location.trim(),
          imageUrls
        })
        
        alert('动态发布成功')
        this.resetForm()
        this.$emit('success')
      } catch (error) {
        console.error('发布失败:', error)
alert('发布失败: ' + (
  (error.response && error.response.data && error.response.data.message) 
  || error.message 
  || '未知错误'
))      } finally {
        this.submitting = false
      }
    },
    
    handleFileChange(e) {
      const files = Array.from(e.target.files)
      if (files.length + this.fileList.length > 9) {
        alert('最多只能上传9张图片')
        return
      }
      
      files.forEach(file => {
        if (!file.type.startsWith('image/')) {
          alert(`文件 ${file.name} 不是图片类型`)
          return
        }
        
        if (file.size > 5 * 1024 * 1024) {
          alert(`图片 ${file.name} 大小不能超过5MB`)
          return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
          this.fileList.push({
            name: file.name,
            raw: file,
            url: e.target.result
          })
        }
        reader.readAsDataURL(file)
      })
      
      // 清空input以便重复选择相同文件
      this.$refs.fileInput.value = ''
    },
    
    handleRemove(index) {
      this.fileList.splice(index, 1)
    },
    
    handlePreview(file) {
      this.previewImage = file.url
      this.previewVisible = true
    },
    
    resetForm() {
      this.form = {
        content: '',
        location: ''
      }
      this.fileList = []
    }
  }
}
</script>