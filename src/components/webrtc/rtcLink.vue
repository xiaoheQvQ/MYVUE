<template>
  <div class="markdown-editor-container" :class="{ 'dark-mode': isDarkMode }">
    <el-container>

        <div class="toolbar">
          <el-button-group class="toolbar-group">
            <el-button @click="insertText('**', '**')" title="加粗" class="toolbar-button">
              <i class="el-icon-bold">B</i>
            </el-button>
            <el-button @click="insertText('*', '*')" title="斜体" class="toolbar-button">
              <i class="el-icon-italic">I</i>
            </el-button>
            <el-button @click="insertText('~~', '~~')" title="删除线" class="toolbar-button">
              <i class="el-icon-strike">S</i>
            </el-button>
            <el-button @click="insertText('`', '`')" title="行内代码" class="toolbar-button">
              <i class="el-icon-code">{{ '<\\>' }}</i>
            </el-button>
            <el-dropdown trigger="click" @command="insertHeading" class="toolbar-dropdown">
              <el-button class="toolbar-button">
                标题<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown" class="dropdown-menu">
                <el-dropdown-item command="1">一级标题</el-dropdown-item>
                <el-dropdown-item command="2">二级标题</el-dropdown-item>
                <el-dropdown-item command="3">三级标题</el-dropdown-item>
                <el-dropdown-item command="4">四级标题</el-dropdown-item>
                <el-dropdown-item command="5">五级标题</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <el-button @click="insertText('', '\n')" title="换行" class="toolbar-button">
              <i class="el-icon-line">换行</i>
            </el-button>
            <el-button @click="insertText('> ', '')" title="引用" class="toolbar-button">
              <i class="el-icon-quote">引用</i>
            </el-button>
            <el-button @click="insertText('- ', '')" title="无序列表" class="toolbar-button">
              <i class="el-icon-list">无序列表</i>
            </el-button>
            <el-button @click="insertText('1. ', '')" title="有序列表" class="toolbar-button">
              <i class="el-icon-finished">有序列表</i>
            </el-button>
            <el-button @click="insertText('- [ ] ', '')" title="任务清单" class="toolbar-button">
              <i class="el-icon-check">任务清单</i>
            </el-button>
            <el-dropdown trigger="click" @command="setSpacing" class="toolbar-dropdown">
              <el-button class="toolbar-button">
                间距控制<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown" class="dropdown-menu">
                <el-dropdown-item command="heading">标题间距</el-dropdown-item>
                <el-dropdown-item command="paragraph">段落间距</el-dropdown-item>
                <el-dropdown-item command="list">列表间距</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <el-dropdown trigger="click" @command="setListStyle" class="toolbar-dropdown">
              <el-button class="toolbar-button">
                列表样式<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown" class="dropdown-menu">
                <el-dropdown-item command="ul">无序列表样式</el-dropdown-item>
                <el-dropdown-item command="ol">有序列表样式</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <el-button @click="insertLink" title="插入链接" class="toolbar-button">
              <i class="el-icon-link"></i>
            </el-button>
            <el-button @click="insertTable" title="插入表格" class="toolbar-button">
              <i class="el-icon-s-grid"></i>
            </el-button>
            <el-upload action="" :auto-upload="false" :show-file-list="false" :on-change="handleImageUpload" accept="image/*">
              <el-button title="上传图片" class="toolbar-button">
                <i class="el-icon-picture"></i>
              </el-button>
            </el-upload>
          </el-button-group>
        </div>

      <el-main>
        <el-row :gutter="20" class="editor-row">
          <el-col :span="10" class="editor-col">
            <div class="editor-container">
              <el-select v-model="selectedTemplate" placeholder="选择Markdown模板" @change="applyTemplate">
                <el-option
                  v-for="template in markdownTemplates"
                  :key="template.name"
                  :label="template.name"
                  :value="template.content">
                </el-option>
              </el-select>
              <el-input
                type="textarea"
                :rows="25"
                placeholder="请输入Markdown内容..."
                v-model="markdownText"
                @input="updatePreview"
                class="editor-textarea"
                ref="textarea"
              ></el-input>
            </div>
          </el-col>
          <el-col :span="14" class="preview-col">
            <div class="preview-container markdown-body" v-html="compiledMarkdown" ref="previewContainer"></div>
          </el-col>
        </el-row>
      </el-main>
      <el-footer class="editor-footer">
        <el-button type="primary" @click="exportToPDF" class="footer-button">导出为PDF</el-button>
        <el-button @click="clearAllImages" class="footer-button">清除所有图片</el-button>
      </el-footer>
    </el-container>
  </div>
</template>

<script>
import marked from 'marked'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default {
  name: 'MarkdownEditor',
  data () {
    return {
      selectedTemplate: '',
      markdownTemplates: [
        { name: '模板1', content: `

:::left
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

**高级前端工程师**
- 出生日期：1995/1
- 邮箱：zhangsan@example.com
- 电话：13800138000
- 地址：北京市朝阳区
- 网站：https://zhangsan.dev
:::

:::right
**专业技能**
- 前端框架：精通 React、Vue.js，熟悉 Next.js、Nuxt.js 等 SSR 框架
- 开发语言：TypeScript、JavaScript(ES6+)、HTML5、CSS3
- UI/样式：精通 TailwindCSS、Sass/Less、CSS Module、Styled-components
- 状态管理：Redux、Vuex、Zustand、Jotai、React Query
- 工程化工具：Webpack、Vite、Rollup、Babel、ESLint
- 测试工具：Jest、React Testing Library、Cypress
- 性能优化：熟悉浏览器渲染原理、性能指标监控、代码分割、懒加载等优化技术
- 版本控制：Git、SVN
- 技术管理：具备团队管理经验，主导过多个大型项目的技术选型和架构设计
- 技术分享：定期组织团队技术分享，主导建设团队技术博客
- 敏捷开发：熟悉 Scrum 开发流程，具有良好的项目把控能力
- 英语能力：CET-6 分数 560，具备良好的英文文档阅读和技术交流能力

## 工作经验
**字节跳动 - 高级前端工程师**
**2021.07 - 至今**
* 负责抖音创作者平台的开发与维护，主导多个核心功能的技术方案设计
* 优化项目工程化配置，将构建时间从8分钟优化至2分钟，提升团队开发效率
* 设计并实现组件库，提升代码复用率达70%，显著减少开发时间
* 主导性能优化项目，使客户端首屏加载时间减少50%，接入APM监控系统
* 指导初级工程师，组织技术分享会，提升团队整体技术水平

:::


` },
        { name: '模板2', content: `
# 魔方
年龄：1995/1/1 | 全职 | 高级前端工程师

邮箱：zhangsan@example.com | 电话：13800138000 | 地址：北京市朝阳区 
 网站：https://zhangsan.dev

## 专业技能

* 前端框架：精通 React、Vue.js，熟悉 Next.js、Nuxt.js 等 SSR 框架
* 开发语言：TypeScript、JavaScript(ES6+)、HTML5、CSS3
* UI/样式：精通 TailwindCSS、Sass/Less、CSS Module、Styled-components
* 状态管理：Redux、Vuex、Zustand、Jotai、React Query
* 工程化工具：Webpack、Vite、Rollup、Babel、ESLint
* 测试工具：Jest、React Testing Library、Cypress
* 性能优化：熟悉浏览器渲染原理、性能指标监控、代码分割、懒加载等优化技术
* 版本控制：Git、SVN
* 技术管理：具备团队管理经验，主导过多个大型项目的技术选型和架构设计
* 技术分享：定期组织团队技术分享，主导建设团队技术博客
* 敏捷开发：熟悉 Scrum 开发流程，具有良好的项目把控能力
* 英语能力：CET-6 分数 560，具备良好的英文文档阅读和技术交流能力

## 工作经验
:::left
**字节跳动 - 高级前端工程师**
:::
:::right
 2021.07 - 至今
:::

* 负责抖音创作者平台的开发与维护，主导多个核心功能的技术方案设计
* 优化项目工程化配置，将构建时间从8分钟优化至2分钟，提升团队开发效率
* 设计并实现组件库，提升代码复用率达70%，显著减少开发时间
* 主导性能优化项目，使客户端首屏加载时间减少50%，接入APM监控系统
* 指导初级工程师，组织技术分享会，提升团队整体技术水平
` }
        // 可以添加更多模板
      ],
      markdownText: `

:::left
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

**高级前端工程师**
- 出生日期：1995/1
- 邮箱：zhangsan@example.com
- 电话：13800138000
- 地址：北京市朝阳区
- 网站：https://zhangsan.dev
:::

:::right
**专业技能**
- 前端框架：精通 React、Vue.js，熟悉 Next.js、Nuxt.js 等 SSR 框架
- 开发语言：TypeScript、JavaScript(ES6+)、HTML5、CSS3
- UI/样式：精通 TailwindCSS、Sass/Less、CSS Module、Styled-components
- 状态管理：Redux、Vuex、Zustand、Jotai、React Query
- 工程化工具：Webpack、Vite、Rollup、Babel、ESLint
- 测试工具：Jest、React Testing Library、Cypress
- 性能优化：熟悉浏览器渲染原理、性能指标监控、代码分割、懒加载等优化技术
- 版本控制：Git、SVN
- 技术管理：具备团队管理经验，主导过多个大型项目的技术选型和架构设计
- 技术分享：定期组织团队技术分享，主导建设团队技术博客
- 敏捷开发：熟悉 Scrum 开发流程，具有良好的项目把控能力
- 英语能力：CET-6 分数 560，具备良好的英文文档阅读和技术交流能力

## 工作经验
**字节跳动 - 高级前端工程师**
**2021.07 - 至今**
* 负责抖音创作者平台的开发与维护，主导多个核心功能的技术方案设计
* 优化项目工程化配置，将构建时间从8分钟优化至2分钟，提升团队开发效率
* 设计并实现组件库，提升代码复用率达70%，显著减少开发时间
* 主导性能优化项目，使客户端首屏加载时间减少50%，接入APM监控系统
* 指导初级工程师，组织技术分享会，提升团队整体技术水平

:::


`,
      compiledMarkdown: '',
      uploadedImages: [],
      currentImageId: 0,
      spacingOptions: {
        heading: '1.5em',
        paragraph: '1em',
        list: '0.8em'
      },
      listStyles: {
        ul: 'disc',
        ol: 'decimal'
      },
      isDarkMode: false
    }
  },
  mounted () {
    this.updatePreview()
    marked.setOptions({
      breaks: true,
      gfm: true,
      highlight: function (code, lang) {
        return code
      }
    })

    this.$nextTick(() => {
      this.initDraggableAndResizable()
    })
  },
  methods: {
    applyTemplate () {
      this.markdownText = this.selectedTemplate
      this.updatePreview()
    },
    toggleDarkMode () {
      this.isDarkMode = !this.isDarkMode
      this.updatePreview()
    },
    parseCustomMarkdown () {
      // 匹配 :::left 和多个 :::right 的模式
      const leftRightRegex = /:::left\s*([\s\S]*?)\s*:::\s*((?::::right\s*[\s\S]*?\s*:::)*)/g

      let compiled = this.markdownText.replace(leftRightRegex, (match, leftContent, rightContents) => {
        // 解析所有右侧内容块
        const rightContentRegex = /:::right\s*([\s\S]*?)\s*:::/g
        let rightContentItems = []
        let rightMatch

        while ((rightMatch = rightContentRegex.exec(rightContents))) {
          rightContentItems.push(rightMatch[1]) // 保持原始顺序
        }

        // 生成右侧内容HTML（使用flex-row-reverse实现反向排列）
        let rightContentHTML = rightContentItems.map(content =>
          `<div class="right-content-item">${marked(content)}</div>`
        ).join('')

        return `<div class="left-right-container">
                  <div class="left-content">${marked(leftContent)}</div>
                  <div class="right-content">
                    ${rightContentHTML}
                  </div>
                </div>`
      })

      // 处理非分栏部分的markdown
      compiled = marked(compiled.replace(/:::left[\s\S]*?:::/g, ''))

      // 添加对列表的处理
      compiled = marked(compiled, {
        renderer: new marked.Renderer(),
        gfm: true,
        tables: true,
        breaks: true,
        sanitize: false,
        smartLists: true,
        smartypants: false
      })

      this.compiledMarkdown = compiled
    },
    updatePreview () {
      this.parseCustomMarkdown()
      this.$nextTick(() => {
        this.initDraggableAndResizable()
        this.applyCustomStyles()
      })
    },
    applyCustomStyles () {
      const preview = this.$refs.previewContainer
      if (!preview) return;

      // 应用标题间距
      ['h1', 'h2', 'h3', 'h4', 'h5'].forEach(tag => {
        const elements = preview.querySelectorAll(tag)
        elements.forEach(el => {
          el.style.marginTop = this.spacingOptions.heading
          el.style.marginBottom = this.spacingOptions.heading
        })
      })

      // 应用段落间距
      const paragraphs = preview.querySelectorAll('p')
      paragraphs.forEach(p => {
        p.style.marginTop = this.spacingOptions.paragraph
        p.style.marginBottom = this.spacingOptions.paragraph
      })

      // 应用列表样式
      const ulElements = preview.querySelectorAll('ul')
      ulElements.forEach(ul => {
        ul.style.marginTop = this.spacingOptions.list
        ul.style.marginBottom = this.spacingOptions.list
        ul.style.listStyleType = this.listStyles.ul
      })

      const olElements = preview.querySelectorAll('ol')
      olElements.forEach(ol => {
        ol.style.marginTop = this.spacingOptions.list
        ol.style.marginBottom = this.spacingOptions.list
        ol.style.listStyleType = this.listStyles.ol
      })
    },
    async exportToPDF () {
      try {
        this.$message.info('正在生成PDF，请稍候...')

        // Clone the preview container to avoid affecting the original
        const originalElement = this.$refs.previewContainer
        const clone = originalElement.cloneNode(true)
        clone.style.position = 'absolute'
        clone.style.left = '-9999px'
        clone.style.width = originalElement.offsetWidth + 'px'
        document.body.appendChild(clone)

        // Remove all resize handles from the clone
        const resizeHandles = clone.querySelectorAll('.resize-handle')
        resizeHandles.forEach(handle => handle.parentNode.removeChild(handle))

        // Add all uploaded images to the clone
        this.uploadedImages.forEach(img => {
          const imgElement = document.createElement('img')
          imgElement.src = img.url
          imgElement.className = 'exported-image'
          imgElement.style.position = 'absolute'
          imgElement.style.left = img.x + 'px'
          imgElement.style.top = img.y + 'px'
          imgElement.style.width = img.width + 'px'
          imgElement.style.height = img.height === 'auto' ? 'auto' : img.height + 'px'
          clone.appendChild(imgElement)
        })

        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 500))

        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: clone.scrollWidth,
          windowHeight: clone.scrollHeight
        })

        document.body.removeChild(clone)

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        const imgWidth = 190
        const pageHeight = 277
        const imgHeight = canvas.height * imgWidth / canvas.width
        let heightLeft = imgHeight
        let position = 10

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        pdf.save('markdown-preview.pdf')
        this.$message.success('PDF导出成功')
      } catch (error) {
        console.error('导出PDF失败:', error)
        this.$message.error('PDF导出失败: ' + error.message)
      }
    },
    getCursorPosition () {
      const textarea = this.$refs.textarea.$refs.textarea
      return {
        start: textarea.selectionStart,
        end: textarea.selectionEnd
      }
    },
    setCursorPosition (start, end) {
      const textarea = this.$refs.textarea.$refs.textarea
      textarea.focus()
      setTimeout(() => {
        textarea.setSelectionRange(start, end)
      }, 0)
    },
    insertText (before, after) {
      const { start, end } = this.getCursorPosition()
      const selectedText = this.markdownText.substring(start, end)

      this.markdownText =
        this.markdownText.substring(0, start) +
        before + selectedText + after +
        this.markdownText.substring(end)

      this.updatePreview()

      // 设置光标位置
      if (selectedText.length > 0) {
        this.setCursorPosition(start + before.length, end + before.length)
      } else {
        this.setCursorPosition(start + before.length, start + before.length)
      }
    },
    insertHeading (level) {
      const { start } = this.getCursorPosition()
      const heading = '#'.repeat(level) + ' '

      // 获取当前行开始位置
      let lineStart = start
      while (lineStart > 0 && this.markdownText.charAt(lineStart - 1) !== '\n') {
        lineStart--
      }

      // 检查当前行是否已经是标题
      const currentLine = this.markdownText.substring(lineStart, start)
      if (currentLine.trim().startsWith('#')) {
        // 已经是标题，替换标题级别
        const match = currentLine.match(/^#+/)
        if (match) {
          const currentLevel = match[0].length
          this.markdownText =
            this.markdownText.substring(0, lineStart) +
            heading + this.markdownText.substring(lineStart + currentLevel).trimLeft() +
            this.markdownText.substring(start)
        }
      } else {
        // 不是标题，插入新标题
        this.markdownText =
          this.markdownText.substring(0, lineStart) +
          heading + this.markdownText.substring(lineStart)
      }

      this.updatePreview()
      this.setCursorPosition(lineStart + heading.length, lineStart + heading.length)
    },
    insertLink () {
      const { start, end } = this.getCursorPosition()
      const selectedText = this.markdownText.substring(start, end)
      const linkText = selectedText || '链接文本'

      this.markdownText =
        this.markdownText.substring(0, start) +
        `[${linkText}](url)` +
        this.markdownText.substring(end)

      this.updatePreview()

      if (selectedText.length > 0) {
        this.setCursorPosition(start + linkText.length + 3, start + linkText.length + 6)
      } else {
        this.setCursorPosition(start + 1, start + 1 + linkText.length)
      }
    },
    insertTable () {
      const { start } = this.getCursorPosition()
      const table = `
| 标题1 | 标题2 | 标题3 |
|-------|-------|-------|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |
`

      this.markdownText =
        this.markdownText.substring(0, start) +
        table +
        this.markdownText.substring(start)

      this.updatePreview()
      this.setCursorPosition(start + table.indexOf('内容1'), start + table.indexOf('内容1') + 3)
    },
    handleImageUpload (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target.result
        this.currentImageId++
        this.uploadedImages.push({
          id: this.currentImageId,
          url: imageUrl,
          x: 20,
          y: 20,
          width: 200,
          height: 'auto',
          originalWidth: 200,
          originalHeight: 'auto'
        })
        this.updatePreview()
      }
      reader.readAsDataURL(file.raw)
    },
    clearAllImages () {
      this.uploadedImages = []
      this.updatePreview()
    },
    setSpacing (type) {
      this.$prompt(`请输入${type === 'heading' ? '标题' : type === 'paragraph' ? '段落' : '列表'}间距(如1em, 10px)`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: this.spacingOptions[type],
        inputValidator: (value) => {
          if (!value) {
            return '请输入有效的间距值'
          }
          return true
        }
      }).then(({ value }) => {
        this.spacingOptions[type] = value
        this.updatePreview()
        this.$message.success('间距设置成功')
      }).catch(() => {})
    },
    setListStyle (type) {
      const options = type === 'ul' ? [
        { value: 'disc', label: '实心圆点' },
        { value: 'circle', label: '空心圆点' },
        { value: 'square', label: '实心方块' },
        { value: 'none', label: '无标记' }
      ] : [
        { value: 'decimal', label: '数字(1, 2, 3)' },
        { value: 'lower-roman', label: '小写罗马数字(i, ii, iii)' },
        { value: 'upper-roman', label: '大写罗马数字(I, II, III)' },
        { value: 'lower-alpha', label: '小写字母(a, b, c)' },
        { value: 'upper-alpha', label: '大写字母(A, B, C)' }
      ]

      this.$prompt('请选择列表样式', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'select',
        inputValue: this.listStyles[type],
        inputOptions: options,
        inputValidator: (value) => {
          if (!value) {
            return '请选择列表样式'
          }
          return true
        }
      }).then(({ value }) => {
        this.listStyles[type] = value
        this.updatePreview()
        this.$message.success('列表样式设置成功')
      }).catch(() => {})
    },
    initDraggableAndResizable () {
      const container = this.$refs.previewContainer
      if (!container) return

      // Remove existing event listeners
      const existingImages = container.querySelectorAll('.uploaded-image')
      existingImages.forEach(img => {
        img.onmousedown = null
        const resizeHandle = img.nextElementSibling
        if (resizeHandle && resizeHandle.classList.contains('resize-handle')) {
          resizeHandle.onmousedown = null
          img.parentNode.removeChild(resizeHandle)
        }
      })

      // Add new images and handlers
      this.uploadedImages.forEach(imgData => {
        let img = container.querySelector(`.image-${imgData.id}`)

        if (!img) {
          img = document.createElement('img')
          img.className = `uploaded-image image-${imgData.id}`
          img.src = imgData.url
          img.draggable = false

          img.style.position = 'absolute'
          img.style.left = imgData.x + 'px'
          img.style.top = imgData.y + 'px'
          img.style.width = imgData.width + 'px'
          img.style.height = imgData.height === 'auto' ? 'auto' : imgData.height + 'px'
          img.style.maxWidth = '100%'
          img.style.cursor = 'move'
          img.style.zIndex = '100'

          // Create resize handle
          const resizeHandle = document.createElement('div')
          resizeHandle.className = 'resize-handle'
          resizeHandle.style.position = 'absolute'
          resizeHandle.style.width = '10px'
          resizeHandle.style.height = '10px'
          resizeHandle.style.right = '-5px'
          resizeHandle.style.bottom = '-5px'
          resizeHandle.style.backgroundColor = this.isDarkMode ? '#67C23A' : '#409EFF'
          resizeHandle.style.borderRadius = '50%'
          resizeHandle.style.cursor = 'nwse-resize'
          resizeHandle.style.zIndex = '101'

          container.appendChild(img)
          container.appendChild(resizeHandle)

          // Drag functionality
          img.onmousedown = (e) => {
            if (e.target !== img) return

            e.preventDefault()
            e.stopPropagation()

            const startX = e.clientX
            const startY = e.clientY
            const startLeft = parseInt(img.style.left)
            const startTop = parseInt(img.style.top)

            const containerRect = container.getBoundingClientRect()

            const onMouseMove = (e) => {
              const dx = e.clientX - startX
              const dy = e.clientY - startY

              let newLeft = startLeft + dx
              let newTop = startTop + dy

              // Boundary checks
              newLeft = Math.max(0, Math.min(newLeft, containerRect.width - img.offsetWidth))
              newTop = Math.max(0, Math.min(newTop, containerRect.height - img.offsetHeight))

              img.style.left = newLeft + 'px'
              img.style.top = newTop + 'px'

              // Update position in uploadedImages array
              const imgIndex = this.uploadedImages.findIndex(i => i.id === imgData.id)
              if (imgIndex !== -1) {
                this.uploadedImages[imgIndex].x = newLeft
                this.uploadedImages[imgIndex].y = newTop
              }

              // Update resize handle position
              resizeHandle.style.left = (newLeft + img.offsetWidth - 5) + 'px'
              resizeHandle.style.top = (newTop + img.offsetHeight - 5) + 'px'
            }

            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove)
              document.removeEventListener('mouseup', onMouseUp)
            }

            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
          }

          // Resize functionality
          resizeHandle.onmousedown = (e) => {
            e.preventDefault()
            e.stopPropagation()

            const startX = e.clientX
            const startY = e.clientY
            const startWidth = img.offsetWidth
            const startHeight = img.offsetHeight
            const aspectRatio = startWidth / (imgData.height === 'auto' ? startWidth : startHeight)

            const containerRect = container.getBoundingClientRect()
            const maxWidth = containerRect.width - parseInt(img.style.left)
            const maxHeight = containerRect.height - parseInt(img.style.top)

            const onMouseMove = (e) => {
              const dx = e.clientX - startX
              const dy = e.clientY - startY

              let newWidth = Math.max(50, Math.min(startWidth + dx, maxWidth))
              let newHeight = imgData.height === 'auto' ? 'auto' : Math.max(50, Math.min(startHeight + dy, maxHeight))

              if (imgData.height !== 'auto') {
                // Maintain aspect ratio if height is not auto
                newHeight = newWidth / aspectRatio
              }

              img.style.width = newWidth + 'px'
              if (imgData.height !== 'auto') {
                img.style.height = newHeight + 'px'
              }

              // Update size in uploadedImages array
              const imgIndex = this.uploadedImages.findIndex(i => i.id === imgData.id)
              if (imgIndex !== -1) {
                this.uploadedImages[imgIndex].width = newWidth
                if (imgData.height !== 'auto') {
                  this.uploadedImages[imgIndex].height = newHeight
                }
              }

              // Update resize handle position
              resizeHandle.style.left = (parseInt(img.style.left) + newWidth - 5) + 'px'
              resizeHandle.style.top = (parseInt(img.style.top) + (imgData.height === 'auto' ? img.offsetHeight : newHeight) - 5) + 'px'
            }

            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove)
              document.removeEventListener('mouseup', onMouseUp)
            }

            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
          }
        }
      })
    }
  }
}
</script>

<style>
:root {
  /* 浅色模式变量 */
  --bg-color: #f5f7fa;
  --panel-bg: #ffffff;
  --text-color: #303133;
  --border-color: #e6e6e6;
  --primary-color: #409EFF;
  --success-color: #67C23A;
  --warning-color: #E6A23C;
  --danger-color: #F56C6C;
  --info-color: #909399;
  --hover-color: #ecf5ff;
  --shadow-color: rgba(0, 0, 0, 0.1);
  --code-bg: #f6f8fa;
  --pre-bg: #f6f8fa;
  --blockquote-bg: #f8f8f8;
  --blockquote-border: #ddd;
  --table-border: #dfe2e5;
  --table-header-bg: #f6f8fa;
}

.dark-mode {
  /* 暗黑模式变量 */
  --bg-color: #1a1a1a;
  --panel-bg: #2d2d2d;
  --text-color: #e6e6e6;
  --border-color: #4d4d4d;
  --primary-color: #66b1ff;
  --success-color: #85ce61;
  --warning-color: #ebb563;
  --danger-color: #f78989;
  --info-color: #a6a9ad;
  --hover-color: #3a3a3a;
  --shadow-color: rgba(0, 0, 0, 0.3);
  --code-bg: #3a3a3a;
  --pre-bg: #3a3a3a;
  --blockquote-bg: #3a3a3a;
  --blockquote-border: #666;
  --table-border: #4d4d4d;
  --table-header-bg: #3a3a3a;
}

.markdown-editor-container {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
  height: 100vh;
  padding: 20px;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.el-header {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
  background-color: var(--panel-bg);
  transition: background-color 0.3s, border-color 0.3s;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.toolbar-group {
  margin-right: 10px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: border-color 0.3s;
  display: flex;
  flex-wrap: wrap;
}

.toolbar-button {
  background-color: var(--panel-bg);
  color: var(--text-color);
  border: none;
  border-radius: 0;
  transition: all 0.3s;
  white-space: nowrap;
}

.toolbar-button:hover {
  background-color: var(--hover-color);
  color: var(--primary-color);
}

.toolbar-button:active {
  background-color: var(--hover-color);
}

.toolbar-button i {
  margin-right: 5px;
}

.toolbar-dropdown .el-button {
  background-color: var(--panel-bg);
  color: var(--text-color);
  border: none;
  transition: all 0.3s;
}

.toolbar-dropdown .el-button:hover {
  background-color: var(--hover-color);
  color: var(--primary-color);
}

.dropdown-menu {
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
  transition: background-color 0.3s, border-color 0.3s;
}

.dropdown-menu .el-dropdown-menu__item {
  color: var(--text-color);
  transition: background-color 0.3s;
}

.dropdown-menu .el-dropdown-menu__item:hover {
  background-color: var(--hover-color);
  color: var(--primary-color);
}

.dropdown-menu .el-dropdown-menu__item:not(.is-disabled):hover {
  background-color: var(--hover-color);
}

.mode-toggle {
  background-color: var(--primary-color) !important;
  color: white !important;
}

.mode-toggle:hover {
  opacity: 0.9;
}

.editor-row {
  margin: 0 !important;
}

.editor-col, .preview-col {
  padding: 0 !important;
}

.editor-container, .preview-container {
  background: var(--panel-bg);
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 var(--shadow-color);
  padding: 20px;
  height: calc(100vh - 180px);
  overflow: hidden;
  position: relative;
  transition: all 0.3s;
}

.editor-textarea {
  width: 100%;
  height: 100%;
}

.editor-textarea textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  border: none;
  padding: 0;
  height: 100%;
  background-color: var(--panel-bg);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.preview-container {
  overflow: auto;
  border: 1px solid var(--border-color);
  transition: border-color 0.3s;
}

.editor-footer {
  text-align: center;
  padding: 20px 0;
  margin-top: 20px;
  background-color: var(--panel-bg);
  transition: background-color 0.3s;
}

.footer-button {
  margin: 0 10px;
  transition: all 0.3s;
}

/* Markdown 基本样式 */
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
  position: relative;
  min-height: 100%;
  color: var(--text-color);
  transition: color 0.3s;
}

/* 标题样式 */
.markdown-body h1 {
  font-size: 2em;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.3em;
  color: var(--text-color);
  background: linear-gradient(to right, var(--primary-color), transparent);
  padding-left: 10px;
  border-radius: 2px;
}

.markdown-body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.3em;
  color: var(--text-color);
  background: linear-gradient(to right, var(--success-color), transparent);
  padding-left: 10px;
  border-radius: 2px;
}

.markdown-body h3 {
  font-size: 1.25em;
  color: var(--text-color);
  position: relative;
  padding-bottom: 5px;
  margin-bottom: 15px;
}

.markdown-body h3::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, var(--warning-color), transparent);
}

.markdown-body h4 {
  font-size: 1em;
  color: var(--text-color);
}

.markdown-body h5 {
  font-size: 0.875em;
  color: var(--text-color);
}

/* 列表样式 */
.markdown-body ul {
  padding-left: 15px;
}

.markdown-body ul ul {
  padding-left: 2em;
}

/* 左右分栏样式 */
.left-right-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  border-radius: 4px;
  background-color: var(--hover-color);
  padding: 10px;
  transition: background-color 0.3s;
}

.left-content {
  width: 48%;
}

.right-content {
  width: 48%;
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
}

.right-content-item {
  border-radius: 4px;
  max-width: 100%;
  background-color: var(--panel-bg);
  padding: 5px 10px;
  transition: background-color 0.3s;
}

/* 其他Markdown样式 */
.markdown-body pre {
  background-color: var(--pre-bg);
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid var(--primary-color);
  transition: background-color 0.3s, border-color 0.3s;
}

.markdown-body code {
  background-color: var(--code-bg);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  transition: background-color 0.3s;
}

.markdown-body blockquote {
  background-color: var(--blockquote-bg);
  border-left: 4px solid var(--blockquote-border);
  padding: 10px 15px;
  margin: 0 0 20px;
  border-radius: 0 4px 4px 0;
  transition: background-color 0.3s, border-color 0.3s;
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.markdown-body table th {
  background-color: var(--table-header-bg);
  font-weight: 600;
  transition: background-color 0.3s;
}

.markdown-body table th,
.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid var(--table-border);
  transition: border-color 0.3s;
}

/* Uploaded image styles */
.uploaded-image {
  position: absolute;
  max-width: 100%;
  max-height: 300px;
  cursor: move;
  z-index: 100;
  user-select: none;
  touch-action: none;
  border: 2px dashed var(--primary-color);
  border-radius: 4px;
  transition: border-color 0.3s;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--primary-color);
  border-radius: 50%;
  cursor: nwse-resize;
  z-index: 101;
  user-select: none;
  transition: background-color 0.3s;
}

/* Export image styles */
.exported-image {
  position: absolute;
  max-width: 100%;
  max-height: none;
  z-index: 100;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .editor-col, .preview-col {
    width: 100% !important;
  }

  .preview-col {
    margin-top: 20px;
  }

  .left-right-container {
    flex-direction: column;
  }

  .left-content, .right-content {
    width: 100%;
  }

  .right-content {
    margin-top: 10px;
    flex-direction: row;
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-group {
    margin-right: 0;
    margin-bottom: 5px;
  }
}
</style>
