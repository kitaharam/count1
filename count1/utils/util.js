/**
 * 工具函数集合
 */

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @returns {string} - 格式化后的时间字符串，格式：YYYY/MM/DD HH:mm:ss
 */
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

/**
 * 数字补零
 * @param {number} n - 需要格式化的数字
 * @returns {string} - 补零后的字符串
 */
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 导出工具函数
module.exports = {
  formatTime
} 