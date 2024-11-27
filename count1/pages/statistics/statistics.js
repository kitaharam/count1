// pages/statistics/statistics.js
const echarts = require('../../ec-canvas/echarts.js');

const app = getApp()

Page({
  data: {
    timeRanges: ['本月', '本年', '全部'],
    timeRangeIndex: 0,
    totalAmount: '0.00',
    trendChart: null,
    compositionChart: null
  },

  onLoad() {
    if (!app.globalData.isLogin) {
      wx.switchTab({ url: '/pages/user/user' })
      return
    }
    // 延迟初始化图表，确保 canvas 已经渲染
    setTimeout(() => {
      this.initCharts()
    }, 500)
  },

  onShow() {
    if (!app.globalData.isLogin) {
      wx.switchTab({ url: '/pages/user/user' })
      return
    }
    // 每次显示页面时都重新加载数据
    this.loadData()
  },

  // 初始化图表
  async initCharts() {
    try {
      // 初始化趋势图
      const trendCanvas = await this.getCanvasById('trend-chart')
      if (trendCanvas) {
        const trendChart = echarts.init(trendCanvas, null, {
          width: trendCanvas.width,
          height: trendCanvas.height,
          devicePixelRatio: wx.getSystemInfoSync().pixelRatio
        })
        trendChart.setOption(this.getTrendOption())
        this.setData({ trendChart })
      }

      // 初始化构成图
      const compositionCanvas = await this.getCanvasById('composition-chart')
      if (compositionCanvas) {
        const compositionChart = echarts.init(compositionCanvas, null, {
          width: compositionCanvas.width,
          height: compositionCanvas.height,
          devicePixelRatio: wx.getSystemInfoSync().pixelRatio
        })
        compositionChart.setOption(this.getCompositionOption())
        this.setData({ compositionChart })
      }

      // 加载数据
      this.loadData()
    } catch (err) {
      console.error('初始化图表失败：', err)
    }
  },

  // 获取 Canvas 实例
  getCanvasById(canvasId) {
    return new Promise((resolve) => {
      wx.createSelectorQuery()
        .select('#' + canvasId)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')
            const dpr = wx.getSystemInfoSync().pixelRatio
            canvas.width = res[0].width * dpr
            canvas.height = res[0].height * dpr
            ctx.scale(dpr, dpr)
            resolve(canvas)
          } else {
            resolve(null)
          }
        })
    })
  },

  // 获取趋势图配置
  getTrendOption() {
    return {
      grid: {
        top: 40,
        right: 20,
        bottom: 40,
        left: 60,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [],
        axisLine: { lineStyle: { color: '#999' } },
        axisLabel: {
          color: '#666',
          fontSize: 12,
          interval: 'auto',
          rotate: 30
        }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#999' } },
        axisLabel: {
          color: '#666',
          fontSize: 12,
          formatter: (value) => `¥${value}`
        },
        splitLine: { lineStyle: { color: '#eee' } }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const data = params[0]
          return `${data.name}\n支出：¥${data.value.toFixed(2)}`
        }
      },
      series: [{
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#007AFF' },
        lineStyle: { width: 3 },
        data: []
      }]
    }
  },

  // 获取构成图配置
  getCompositionOption() {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        itemWidth: 14,
        itemHeight: 14,
        textStyle: {
          color: '#666',
          fontSize: 12
        }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            formatter: '{b}: {d}%'
          }
        },
        data: []
      }]
    }
  },

  // 加载数据
  async loadData() {
    if (!app.globalData.isLogin) return

    const { timeRangeIndex } = this.data
    const now = new Date()
    let startDate

    if (timeRangeIndex === 0) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (timeRangeIndex === 1) {
      startDate = new Date(now.getFullYear(), 0, 1)
    } else {
      startDate = new Date(2000, 0, 1)
    }

    try {
      const db = app.c1.database()
      const { data } = await db.collection('bills')
        .where({
          userId: app.globalData.userInfo._id,
          date: db.command.gte(startDate)
        })
        .orderBy('date', 'asc')
        .get()

      if (!data || data.length === 0) {
        this.setData({ totalAmount: '0.00' })
        this.updateCharts(new Map(), [])
        return
      }

      const totalAmount = data.reduce((sum, bill) => sum + Number(bill.amount), 0)
      this.setData({ totalAmount: totalAmount.toFixed(2) })

      this.processChartData(data)
    } catch (err) {
      console.error('Load bills error:', err)
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      })
    }
  },

  // 处理图表数据
  processChartData(bills) {
    // 处理趋势图数据
    const dateMap = new Map()
    bills.forEach(bill => {
      const date = new Date(bill.date)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
      const amount = Number(bill.amount)
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + amount)
    })

    // 处理构成图数据
    const tagMap = new Map()
    bills.forEach(bill => {
      const amount = Number(bill.amount)
      tagMap.set(bill.tag, (tagMap.get(bill.tag) || 0) + amount)
    })

    const pieData = Array.from(tagMap.entries())
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value)

    // 更新图表
    this.updateCharts(dateMap, pieData)
  },

  // 更新图表
  updateCharts(dateMap, pieData) {
    if (this.data.trendChart) {
      this.data.trendChart.setOption({
        xAxis: { data: Array.from(dateMap.keys()) },
        series: [{ data: Array.from(dateMap.values()) }]
      })
    }

    if (this.data.compositionChart) {
      this.data.compositionChart.setOption({
        series: [{ data: pieData }]
      })
    }
  },

  onTimeRangeChange(e) {
    this.setData({
      timeRangeIndex: Number(e.detail.value)
    }, () => {
      this.loadData()
    })
  }
})