var app = getApp();
var util = require('../../utils/util');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    dataLogs: [],
    outStockTimes: 0
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;
    if (!util.checkLogin()) {
      wx.showToast({
        title: '您还未登录,请先登录',
        icon: 'none',
        mask: true,
        duration: 1000
      })
      setTimeout(function () {
        wx.switchTab({
          url: '/pages/index/index',
        })
      }, 1000)
      return;
    }
    that.outTimes();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this;
    that.outTimes();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  // 近期出库次数及内容
  outTimes: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    })
    var begin = that.returnDate()[0];
    var end = that.returnDate()[1];
    var data = {
      "unitId": 1,
      "employeeId": wx.getStorageSync('pj_employee_id'),
      "begin": begin,
      "end": end
    };
    console.log("传参：" + JSON.stringify(data));
    wx.request({
      url: app.globalData.apiUrl + '/getOutStock',
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded",
        "qcmappversion": app.globalData.qcmappversion
      },
      data: data,
      success: res => {
        // 获取数据后，停止刷新动作
        wx.hideLoading();
        wx.stopPullDownRefresh();

        let returnData = res.data.data;
        console.log("回参：" + JSON.stringify(returnData));
        if ((returnData != null) && (returnData != [])) {
          if (returnData.length > 0) {
            let dataLogs = [];
            let outStockTimes = 0;
            for (let i = 0; i < returnData.length; i++) {
              dataLogs.push({ "date": returnData[i].date, "cylinderCount": returnData[i].cylinderCount, "shipNumber": returnData[i].shipNumber, "batch": returnData[i].batch, "remark": returnData[i].remark });
              outStockTimes += Number(returnData[i].cylinderCount);
            }

            that.setData({
              dataLogs: dataLogs,
              outStockTimes: outStockTimes
            })
          }
        }
      },
      fail: function (res) {
        // fail调用接口失败
        wx.showToast({
          title: '网络错误'
        })
      },
      complete: function (res) {
        // complete
      }
    });
  },

  // 计算查询时间
  returnDate: function () {
    var that = this;
    var date = [];
    var todayDate = new Date();
    var yesterdayDate = new Date();
    // 明天日期
    todayDate.setTime(todayDate.getTime() + 24 * 60 * 60 * 1000);
    date[1] = todayDate.getFullYear() + "-" + (that.checkRule(todayDate.getMonth() + 1)) + "-" + that.checkRule(todayDate.getDate());
    // 昨天日期
    yesterdayDate.setTime(yesterdayDate.getTime() - 24 * 60 * 60 * 1000);
    date[0] = yesterdayDate.getFullYear() + "-" + (that.checkRule(yesterdayDate.getMonth() + 1)) + "-" + that.checkRule(yesterdayDate.getDate());
    return date;
  },

  checkRule: function (x) {
    if (x < 10) {
      return '0' + x;
    } else {
      return x;
    }
  },

  addOutStock: function () {
    wx.navigateTo({
      url: '/pages/outStock/outStock'
    })
  }

})