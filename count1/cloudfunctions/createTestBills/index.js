const cloud = require('wx-server-sdk')
cloud.init({
  env: 'education-3g59nmtk9211bb2f',
  resourceAppid: 'wx3199c80279c7b8c3'
})
const db = cloud.database()

exports.main = async (event, context) => {
  const { userId } = event
  
  // 测试数据
  const testBills = [
    {
      userId,
      amount: 25.5,
      tag: '餐饮',
      note: '午餐',
      date: new Date('2024-01-15'),
      createdAt: new Date()
    },
    {
      userId,
      amount: 15.0,
      tag: '餐饮',
      note: '早餐',
      date: new Date('2024-01-15'),
      createdAt: new Date()
    },
    {
      userId,
      amount: 8.5,
      tag: '交通',
      note: '公交车',
      date: new Date('2024-01-16'),
      createdAt: new Date()
    },
    {
      userId,
      amount: 199.9,
      tag: '购物',
      note: '买衣服',
      date: new Date('2024-01-17'),
      createdAt: new Date()
    },
    {
      userId,
      amount: 45.0,
      tag: '娱乐',
      note: '电影票',
      date: new Date('2024-01-18'),
      createdAt: new Date()
    },
    {
      userId,
      amount: 2500.0,
      tag: '居住',
      note: '房租',
      date: new Date('2024-01-01'),
      createdAt: new Date()
    },
    {
      userId,
      amount: 128.5,
      tag: '医疗',
      note: '感冒药',
      date: new Date('2024-01-19'),
      createdAt: new Date()
    },
    {
      userId,
      amount: 299.0,
      tag: '教育',
      note: '编程课程',
      date: new Date('2024-01-20'),
      createdAt: new Date()
    }
  ]

  try {
    // 批量添加账单
    const tasks = testBills.map(bill => db.collection('bills').add({ data: bill }))
    await Promise.all(tasks)
    return {
      success: true,
      message: '测试数据创建成功'
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      message: '测试数据创建失败',
      error: err
    }
  }
} 