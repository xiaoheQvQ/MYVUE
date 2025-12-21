export function getVideoMD5 (file) {
  return new Promise((resolve, reject) => {
    const chunkSize = 2 * 1024 * 1024 // 2MB
    const chunks = Math.ceil(file.size / chunkSize)
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()
    let currentChunk = 0

    fileReader.onload = function (e) {
      spark.append(e.target.result)
      currentChunk++

      if (currentChunk < chunks) {
        loadNext()
      } else {
        resolve(spark.end())
      }
    }

    fileReader.onerror = function () {
      reject(new Error('文件读取失败'))
    }

    function loadNext () {
      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      fileReader.readAsArrayBuffer(file.slice(start, end))
    }

    loadNext()
  })
}

export function formatFileSize (bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i])
}

// 在文件末尾添加
export default {
  formatDate,
  getVideoMD5,
  formatFileSize
}
