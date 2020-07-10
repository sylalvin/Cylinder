const sliderWidth = 96;
var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    ishideBottom: true,
    detectionMissionId: 0,
    status: 1,
    scan_sum: 0,
    gasMediumName: "",
    productionBatch: "",
    purenessItems: ["普", "2N", "3N", "4N", "5N", "6N"],
    pureness: "暂无",
    areaName: "",
    companyAreaId: 0,
    remark: "暂无",
    beginDate:"",
    beginTime: "",
    endTime:"",
    fillList: [],
    cylinderFillList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
    //获取充装任务ID
    var detectionMissionId = options.detectionMissionId;
    that.setData({
      detectionMissionId: detectionMissionId
    })
    let fillList = that.data.fillList;
    if((fillList != []) && (fillList.length > 0)) {
      for (let i = 0; i < fillList.length; i++) {
        if(fillList[i][0] == detectionMissionId) {
          let cylinderFillList = fillList[i][1];
          that.setData({
            cylinderFillList: cylinderFillList
          })
          break;
        }
      }
      that.setGlobal();
    }
    
    

    //获取充装任务并填充内容
    wx.request({
      url: app.globalData.apiUrl + '/getDetectionMissionVoById',
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded",
        "qcmappversion": app.globalData.qcmappversion
      },
      data: {
        detectionMissionId: detectionMissionId
      },
      success: res => {
        that.setData({
          status: res.data.data.status
        })
        if (that.judge(res.data.data.yqDetectionVoList)) {
          var list = res.data.data.yqDetectionVoList;
          var timeStr = list[0].beginDate;
          var timeArr = String(timeStr).split(' ');
          if (timeArr.length == 2) {
            that.setData({ "beginTime": timeArr[1] });
          }
          var timeStr2 = list[0].endDate;
          var timeArr2 = String(timeStr2).split(' ');
          if (timeArr2.length == 2) {
            that.setData({ "endTime": timeArr2[1] });
          }
          var pureness = that.data.purenessItems[(list[0].pureness - 1)];
          // 备注默认显示从服务器获取到的第一条数据的备注内容
          that.setData({
            "cylinderCheckList": list,
            "scan_sum": list.length,
            "gasMediumName": list[0].mediemName,
            "productionBatch": list[0].productionBatch,
            "pureness": pureness,
            "companyAreaId": list[0].companyAreaId,
            "areaName": list[0].areaName,
            "remark": list[0].remark
          })
        }
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;
    that.getGlobal();
  },

  onHide: function () {
    var that = this;
    that.setGlobal();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  setBeginTime: function (e) {
    wx.showToast({
      title: "任务已开始，无法修改开始时间",
      icon: 'none',
      duration: 3600
    });
  },

  setEndTime: function (e) {
    let day = new Date();
    var now_hour, now_minute, now_second;
    if (day.getHours() < 9) {
      now_hour = "0" + day.getHours();
    } else {
      now_hour = day.getHours();
    }
    if (day.getMinutes() < 9) {
      now_minute = "0" + day.getMinutes();
    } else {
      now_minute = day.getMinutes();
    }
    if (day.getSeconds() < 9) {
      now_second = "0" + day.getSeconds();
    } else {
      now_second = day.getSeconds();
    }
    this.setData({
      "endTime": now_hour + ":" + now_minute + ":" + now_second,
      ishideBottom: false
    });
  },

  onChangeRemark: function (e) {
    this.setData({
      "remark": e.detail.value
    });
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

  onSubmitMission: function (e) {
    var that = this;
    if (this.data.endTime == "") {
      wx.showToast({
        title: "请添加结束时间",
        icon: 'none',
        duration: 3000
      });
      return false;
    }
    // 防重复提交
    wx.showLoading({
      title: '正在提交',
      mask: true
    })
    var cylinderCheckList = that.data.cylinderFillList;
    wx.request({
      url: app.globalData.apiUrl + '/v2/updateDetection',
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded",
        "qcmappversion": app.globalData.qcmappversion
      },
      data: {
        detectionMissionId: that.data.detectionMissionId,
        endDate: new Date().getFullYear() + "-" + ((new Date().getMonth() + 1) < 10 ? "0" + (new Date().getMonth() + 1) : (new Date().getMonth() + 1)) + "-" + ((new Date().getDate() < 10) ? ("0" + new Date().getDate()) : (new Date().getDate())) + " " + that.data.endTime,
        remark: that.data.remark,
        cylinderCheckList: JSON.stringify(cylinderCheckList)
      },
      success: res => {
        wx.hideLoading();
        if (res.data.code == 200) {
          wx.showToast({
            title: "修改成功",
            icon: 'none',
            duration: 3000
          });
          wx.navigateTo({
            url: '/pages/filling/filling'
          })
        } else {
          wx.showToast({
            title: "添加失败，请检查网络或信息",
            icon: 'none',
            duration: 3000
          });
        }
      }
    });

  },

  judge: function (x) {
    if ((x == "") || (x == null)) {
      return false;
    } else {
      return true;
    }
  },
})