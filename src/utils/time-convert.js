const TimeConvertUtil = {
  formatTimeDifference (timeDifference) {
    const SECOND = 1000
    const MINUTE = 60 * SECOND
    const HOUR = 60 * MINUTE
    const DAY = 24 * HOUR
    const WEEK = 7 * DAY

    if (timeDifference < MINUTE) {
      return '刚刚'
    } else if (timeDifference < HOUR) {
      const minutes = Math.floor(timeDifference / MINUTE)
      return `${minutes}分钟前`
    } else if (timeDifference < DAY) {
      const hours = Math.floor(timeDifference / HOUR)
      return `${hours}小时前`
    } else if (timeDifference < WEEK) {
      const days = Math.floor(timeDifference / DAY)
      return `${days}天前`
    } else {
      // 大于一周，直接显示日期
      const date = new Date(new Date().getTime() - timeDifference)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      if (new Date().getFullYear() !== date.getFullYear()) {
        return `${date.getFullYear()}-${month}-${day}`
      }
      return `${month}-${day}`
    }
  },

  formatTime (seconds) {
    if (!seconds || isNaN(seconds)) {
      return '00:00'
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
}

export default TimeConvertUtil
