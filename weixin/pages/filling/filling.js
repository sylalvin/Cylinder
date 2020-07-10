var app = getApp();
var util = require('../../utils/util');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    scanLogs: [],
    todayFillingTimes: 0,
    fillList: [],
    cylinderFillList: []
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
    that.getGlobal();
    that.fillingTimes();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this;
    that.fillingTimes();
    // that.returnBeginDate();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  // 今日充装次数及内容
  fillingTimes: function() {
    var that = this;
    wx.showLoading({
      title: '加载中',
    })
    var beginDate = that.returnBeginDate();

    wx.request({
      url: app.globalData.apiUrl + '/getDetectionMissionVoListByEmployeeId',
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded",
        "qcmappversion": app.globalData.qcmappversion
      },
      data: {
        "employeeId": wx.getStorageSync('pj_employee_id'),
        "begin": beginDate
      },
      success: res => {
        // 获取数据后，停止刷新动作
        wx.hideLoading();
        wx.stopPullDownRefresh();

        let returnData = res.data.data;
        if ((returnData != null) && (returnData != [])) {
          if (returnData.length > 0) {
            let scanLogs = [];
            let todayFillingTimes = 0;
            let fillList = that.data.fillList;
            for (let j = 0; j < returnData.length; j++) {
              let temp = [];
              scanLogs.push({ "id": returnData[j].id, "beginDate": returnData[j].beginDate, "name": returnData[j].mediemName, "quantity": returnData[j].yqDetectionVoList.length, "productionBatch": returnData[j].productionBatch, "status": returnData[j].status == 1 ? "充气中" : "已完成" });
              todayFillingTimes += returnData[j].yqDetectionVoList.length;
              if (that.data.fillList[j] == undefined) {
                for (let k = 0; k < returnData[j].yqDetectionVoList.length; k++) {
                  returnData[j].yqDetectionVoList[k].beforeColor == null ? returnData[j].yqDetectionVoList[k].beforeColor = 1 : returnData[j].yqDetectionVoList[k].beforeColor;

                  returnData[j].yqDetectionVoList[k].beforeAppearance == null ? returnData[j].yqDetectionVoList[k].beforeAppearance = 1 : returnData[j].yqDetectionVoList[k].beforeAppearance;

                  returnData[j].yqDetectionVoList[k].beforeSafety == null ? returnData[j].yqDetectionVoList[k].beforeSafety = 1 : returnData[j].yqDetectionVoList[k].beforeSafety;

                  returnData[j].yqDetectionVoList[k].beforeRegularInspectionDate == null ? returnData[j].yqDetectionVoList[k].beforeRegularInspectionDate = 1 : returnData[j].yqDetectionVoList[k].beforeRegularInspectionDate;

                  returnData[j].yqDetectionVoList[k].beforeResidualPressure == null ? returnData[j].yqDetectionVoList[k].beforeResidualPressure = 1 : returnData[j].yqDetectionVoList[k].beforeResidualPressure;

                  returnData[j].yqDetectionVoList[k].fillingIfNormal == null ? returnData[j].yqDetectionVoList[k].fillingIfNormal = 1 : returnData[j].yqDetectionVoList[k].fillingIfNormal;

                  returnData[j].yqDetectionVoList[k].afterPressure == null ? returnData[j].yqDetectionVoList[k].afterPressure = 1 : returnData[j].yqDetectionVoList[k].afterPressure;

                  returnData[j].yqDetectionVoList[k].afterCheckLeak == null ? returnData[j].yqDetectionVoList[k].afterCheckLeak = 1 : returnData[j].yqDetectionVoList[k].afterCheckLeak;

                  returnData[j].yqDetectionVoList[k].afterAppearance == null ? returnData[j].yqDetectionVoList[k].afterAppearance = 1 : returnData[j].yqDetectionVoList[k].afterAppearance;

                  returnData[j].yqDetectionVoList[k].afterTemperature == null ? returnData[j].yqDetectionVoList[k].ifPass = 1 : returnData[j].yqDetectionVoList[k].ifPass = 0;

                  returnData[j].yqDetectionVoList[k].afterTemperature == null ? returnData[j].yqDetectionVoList[k].afterTemperature = 1 : returnData[j].yqDetectionVoList[k].afterTemperature;
                }
                temp.push(returnData[j].id);
                temp.push(returnData[j].yqDetectionVoList);
                fillList.push(temp);
              }
            }

            that.setData({
              scanLogs: scanLogs,
              todayFillingTimes: todayFillingTimes,
              fillList: fillList
            })

            that.setGlobal();
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

  // 计算查询的开始时间
  returnBeginDate: function() {
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

  // 获取全局变量
  getGlobal: function () {
    var that = this;
    var fillList = app.globalData.fillList;
    var cylinderFillList = app.globalData.cylinderFillList;
    that.setData({
      fillList: fillList,
      cylinderFillList: cylinderFillList
    })
  },

  // 设置全局变量
  setGlobal: function () {
    var that = this;
    app.globalData.fillList = that.data.fillList;
    app.globalData.cylinderFillList = that.data.cylinderFillList;
  },

  checkRule: function(x) {
    if(x < 10) {
      return '0' + x;
    } else {
      return x;
    }
  },

  onSubmit: function() {
    wx.navigateTo({
      url: '/pages/addFilling/addFilling'
    })
  }

})