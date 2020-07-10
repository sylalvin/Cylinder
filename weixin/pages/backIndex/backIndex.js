var app = getApp();
var util = require('../../utils/util');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    dataLogs: [],
    todayBackTimes: 0
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
    that.backTimes();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this;
    that.backTimes();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  // 今日充装次数及内容
  backTimes: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    })
    var beginDate = that.returnBeginDate();
    var endDate = that.returnTodayDate();
    var data = {
      "unitId": 1,
      "creator": wx.getStorageSync('pj_employee_name'),
      "begin": beginDate,
      "end": endDate
    };
    wx.request({
      url: app.globalData.apiUrl + '/getPreDetectionListByEmployeeId',
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
        if ((returnData != null) && (returnData != [])) {
          if (returnData.length > 0) {
            let dataLogs = [];
            let todayBackTimes = 0;
            for (let i = 0; i < returnData.length; i++) {
              dataLogs.push({ "date": returnData[i].date, "cylinderCount": returnData[i].cylinderCount, "batch": returnData[i].batch, "remark": returnData[i].remark, "empty": returnData[i].empty });
              todayBackTimes += Number(returnData[i].cylinderCount);
            }

            that.setData({
              dataLogs: dataLogs,
              todayBackTimes: todayBackTimes
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

  // 今天日期
  returnTodayDate: function() {
    var that = this;
    var todayDate = new Date();
    // 今天日期
    todayDate = todayDate.getFullYear() + "-" + (that.checkRule(todayDate.getMonth() + 1)) + "-" + that.checkRule(todayDate.getDate()) + ' ' + that.checkRule(todayDate.getHours()) + ':' + that.checkRule(todayDate.getMinutes()) + ':' + that.checkRule(todayDate.getSeconds());
    return todayDate;
  },

  // 计算查询的开始时间
  returnBeginDate: function () {
    var that = this;
    var beginDate = "";
    var todayDate = new Date();
    var yesterdayDate = new Date();

    // 现在时间（小时）
    var nowHours = todayDate.getHours();
    // 今天日期
    todayDate = todayDate.getFullYear() + "-" + (that.checkRule(todayDate.getMonth() + 1)) + "-" + that.checkRule(todayDate.getDate());
    // 昨天日期
    yesterdayDate.setTime(yesterdayDate.getTime() - 24 * 60 * 60 * 1000);
    yesterdayDate = yesterdayDate.getFullYear() + "-" + (that.checkRule(yesterdayDate.getMonth() + 1)) + "-" + that.checkRule(yesterdayDate.getDate());

    if (nowHours < 7) {
      beginDate = yesterdayDate + ' ' + "15:00:00";
      return beginDate;
    } else if (nowHours < 19) {
      beginDate = yesterdayDate + ' ' + "17:00:00";
      return beginDate;
    } else {
      beginDate = todayDate + ' ' + "00:00:00";
      return beginDate;
    }
  },

  checkRule: function (x) {
    if (x < 10) {
      return '0' + x;
    } else {
      return x;
    }
  },

  addBack: function () {
    wx.navigateTo({
      url: '/pages/backCheckEmpty/backCheckEmpty'
    })
  }

})