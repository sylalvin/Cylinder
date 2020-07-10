var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    qcmappversion: '1.0.0',
    status: 1,
    title: "修改信息",
    detectionMissionId: 0,
    cylinderNumberList: [],
    fillList: [],
    cylinderFillList: [],
    cylinderInfo: {},
    checkboxItems: [],
    checkboxPass: [],
    init_checkboxItems: [
      { name: 'beforeColor', value: '充前-瓶身颜色', checked: 'true' },
      { name: 'beforeAppearance', value: '充前-气瓶外观', checked: 'true' },
      { name: 'beforeSafety', value: '充前-安全附件', checked: 'true' },
      { name: 'beforeRegularInspectionDate', value: '充前-检测日期', checked: 'true' },
      { name: 'beforeResidualPressure', value: '充前-瓶内余压', checked: 'true' },
      { name: 'fillingIfNormal', value: '充装-是否正常', checked: 'true' },
      { name: 'afterPressure', value: '充后-压力复查', checked: 'true' },
      { name: 'afterCheckLeak', value: '充后-阀门泄露', checked: 'true' },
      { name: 'afterAppearance', value: '充后-外观检查', checked: 'true' },
      { name: 'afterTemperature', value: '充后-温度检查', checked: 'true' }
    ],
    init_checkboxPass: [
      { name: 'ifPass', value: '检测通过：', checked: 'true' }
    ],
    areaArray: [],
    areaIndex: 0,
    companyAreaName: ""
  },

  /**
   * 生命周期函数--监听页面加载
   * 获取版本号、流转区域
   */
  onLoad: function (options) {
    var that = this;
    var detectionMissionId = options.detectionMissionId;
    var cylinderNumber = options.cylinderNumber;
    var status = options.status;
    if(cylinderNumber) {
      that.setData({
        detectionMissionId: detectionMissionId,
        cylinderNumber: cylinderNumber,
        status: status
      })
    }
    
    // 初始化公共数据
    that.initData();

    // 获取版本号
    wx.request({
      url: app.globalData.apiUrl + '/version',
      method: 'POST',
      success: (res) => {
        if ((res.data.data != "") && (res.data.data != null)) {
          that.setData({
            qcmappversion: res.data.data
          })
          var qcmappversion = that.data.qcmappversion;

          wx.request({
            url: app.globalData.apiUrl + '/getCompanyProjectByCompanyId',
            data: {
              'unitId': 1
            },
            header: {
              'qcmappversion': qcmappversion
            },
            method: 'GET',
            success: (res) => {
              if (res.data.data) {
                for (let i = 0; i < res.data.data.length; i++) {
                  if (res.data.data[i].projectName == "充装") {
                    // if (res.data.data[i].projectName == "充前检测") {
                    // 流转区域开始
                    wx.request({
                      url: app.globalData.apiUrl + '/getCompanyProjectAreaByCompanyProjectId',
                      data: {
                        'companyProjectId': res.data.data[i].projectId,
                        'unitId': res.data.data[i].unitId,
                        'projectId': 1
                      },
                      header: {
                        'qcmappversion': qcmappversion
                      },
                      method: 'GET',
                      success: (res1) => {
                        if (res1.data.data) {
                          var area = [];
                          for (let i = 0; i < res1.data.data.length; i++) {
                            area.push({ companyAreaId: res1.data.data[i].companyAreaId, companyAreaName: res1.data.data[i].companyAreaName });
                          }
                          that.setData({
                            areaArray: area
                          })
                          if (area.length > 0) {
                            that.setData({
                              companyAreaName: area[0].companyAreaName
                            })
                          }
                          that.showData();
                        } else {
                          wx.showToast({
                            title: '流转区不存在',
                            icon: 'none',
                            duration: 2000
                          })
                        }
                      },
                      fail: (e) => {
                        wx.showToast({
                          title: '获取气瓶流转区接口访问失败',
                          icon: 'none',
                          duration: 2000
                        })
                      }
                    })
                    // 流转区域结束
                  }
                }
              } else {
                wx.showToast({
                  title: res.data.msg,
                  icon: 'none',
                  duration: 2000
                })
              }
            },
            fail: (e) => {
              wx.showToast({
                title: 'getCompanyProjectByCompanyId 接口访问失败',
                icon: 'none',
                duration: 2000
              })
            }
          })
        } else {
          wx.showToast({
            title: '版本号不存在',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (e) => {
        wx.showToast({
          title: '获取版本号接口访问失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   * 初始化数据
   */
  onReady: function () {
    var that = this;

    wx.getStorage({
      key: 'pj_employee_name',
      success: (res) => {
        that.setData({
          'commonInfo.creator': res.data
        })
      },
    })
  },

  onShow: function () {
    // var that = this;
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
  },

  onHide: function () {
    var that = this;
    that.setGlobal();
  },

  showData: function() {
    var that = this;
    that.getGlobal();

    for (let i = 0; i < that.data.cylinderFillList.length; i++) {
      if (that.data.cylinderFillList[i].cylinderNumber == that.data.cylinderNumber) {
        that.setData({
          cylinderInfo: that.data.cylinderFillList[i]
        })
        that.setData({
          companyAreaName: that.data.cylinderInfo.areaName
        })
        for (let k = 0; k < that.data.areaArray.length; k++) {
          var areaArray = that.data.areaArray;
          if (areaArray[k].companyAreaId == that.data.cylinderInfo.companyAreaId) {
            that.setData({
              areaIndex: k
            })
          }
        }
        // 根据 cylinderNumber 设定气瓶初始检测项数据
        var b_data = {
          'beforeColor': that.data.cylinderInfo.beforeColor,
          'beforeAppearance': that.data.cylinderInfo.beforeAppearance,
          'beforeSafety': that.data.cylinderInfo.beforeSafety,
          'beforeRegularInspectionDate': that.data.cylinderInfo.beforeRegularInspectionDate,
          'beforeResidualPressure': that.data.cylinderInfo.beforeResidualPressure,
          'fillingIfNormal': that.data.cylinderInfo.fillingIfNormal,
          'afterPressure': that.data.cylinderInfo.afterPressure,
          'afterCheckLeak': that.data.cylinderInfo.afterCheckLeak,
          'afterAppearance': that.data.cylinderInfo.afterAppearance,
          'afterTemperature': that.data.cylinderInfo.afterTemperature,
          'ifPass': that.data.cylinderInfo.ifPass
        };
        (b_data.beforeColor == 0) ? (that.setData({ 'checkboxItems[0].checked': false })) : (that.setData({ 'checkboxItems[0].checked': true }));
        (b_data.beforeAppearance == 0) ? (that.setData({ 'checkboxItems[1].checked': false })) : (that.setData({ 'checkboxItems[1].checked': true }));
        (b_data.beforeSafety == 0) ? (that.setData({ 'checkboxItems[2].checked': false })) : (that.setData({ 'checkboxItems[2].checked': true }));
        (b_data.beforeRegularInspectionDate == 0) ? (that.setData({ 'checkboxItems[3].checked': false })) : (that.setData({ 'checkboxItems[3].checked': true }));
        (b_data.beforeResidualPressure == 0) ? (that.setData({ 'checkboxItems[4].checked': false })) : (that.setData({ 'checkboxItems[4].checked': true }));
        (b_data.fillingIfNormal == 0) ? (that.setData({ 'checkboxItems[5].checked': false })) : (that.setData({ 'checkboxItems[5].checked': true }));
        (b_data.afterPressure == 0) ? (that.setData({ 'checkboxItems[6].checked': false })) : (that.setData({ 'checkboxItems[6].checked': true }));
        (b_data.afterCheckLeak == 0) ? (that.setData({ 'checkboxItems[7].checked': false })) : (that.setData({ 'checkboxItems[7].checked': true }));
        (b_data.afterAppearance == 0) ? (that.setData({ 'checkboxItems[8].checked': false })) : (that.setData({ 'checkboxItems[8].checked': true }));
        (b_data.afterTemperature == 0) ? (that.setData({ 'checkboxItems[9].checked': false })) : (that.setData({ 'checkboxItems[9].checked': true }));
        (b_data.ifPass == 0) ? (that.setData({ 'checkboxPass[0].checked': false })) : (that.setData({ 'checkboxPass[0].checked': true }));
      }
    }
  },

  // 检测内容发生改变触发事件
  checkboxItemsChange: function (e) {
    var that = this;
    var changeArray = e.detail.value;

    // e.detail.value 为选中的数组
    var dic = { 'beforeColor': 1, 'beforeAppearance': 1, 'beforeSafety': 1, 'beforeRegularInspectionDate': 1, 'beforeResidualPressure': 1, 'fillingIfNormal': 1, 'afterPressure': 1, 'afterCheckLeak': 1, 'afterAppearance': 1, 'afterTemperature': 1 };
    for (let key in dic) {
      if (changeArray.includes(key)) {
        dic[key] = 1;
      } else {
        dic[key] = 0;
      }
    }
    var cylinderInfo = that.data.cylinderInfo;
    for (let key in dic) {
      cylinderInfo[key] = dic[key];
    }
    that.setData({
      cylinderInfo: cylinderInfo
    })
  },

  // 检测结果发生改变触发事件
  checkboxPassChange: function (e) {
    var that = this;
    // e.detail.value 为选中的数组
    if (e.detail.value.length > 0) {
      that.setData({
        'cylinderInfo.ifPass': 1
      })
    } else {
      that.setData({
        'cylinderInfo.ifPass': 0
      })
    }
  },

  // 普通选择器
  bindPickerChange: function (e) {
    var that = this;
    var companyAreaId = that.data.areaArray[e.detail.value].companyAreaId;
    var companyAreaName = that.data.areaArray[e.detail.value].companyAreaName;
    that.setData({
      areaIndex: e.detail.value,
      'cylinderInfo.companyAreaId': companyAreaId,
      'cylinderInfo.areaName': companyAreaName,
      companyAreaName: companyAreaName
    })
  },

  bindInputChange: function (e) {
    var that = this;
    that.setData({
      'cylinderInfo.remark': e.detail.value
    })
  },

  // 页面主要逻辑部分--开始

  // 初始化气瓶共用信息
  initData: function () {
    var that = this;
    that.setData({
      checkboxItems: that.data.init_checkboxItems,
      checkboxPass: that.data.init_checkboxPass
    })
  },

  submitForm: function() {
    var that = this;
    // 根据二维码编号查询所属集格编号
    var cylinderInfo = that.data.cylinderInfo;
    that.queryCylinderInfoByNumber(cylinderInfo.cylinderNumber);
  },

  updateData: function() {
    var that = this;
    var detectionMissionId = that.data.detectionMissionId;
    var fillList = that.data.fillList;
    var cylinderFillList = that.data.cylinderFillList;
    var cylinderInfo = that.data.cylinderInfo;
    if (that.data.cylinderNumberList.length == 0) { // 散瓶
      console.log("散瓶");
      for (let i = 0; i < cylinderFillList.length; i++) {
        if (cylinderFillList[i].cylinderNumber == cylinderInfo.cylinderNumber) {
          cylinderFillList[i] = cylinderInfo;
          that.setData({
            cylinderFillList: cylinderFillList
          })
        }
      }
    } else { // 集格
      console.log("集格");
      let cylinderNumberList = that.data.cylinderNumberList;
      for (let i = 0; i < cylinderNumberList.length; i++) {
        for (let j = 0; j < cylinderFillList.length; j++) {
          if (cylinderNumberList[i] == cylinderFillList[j].cylinderNumber) {
            cylinderFillList[j].beforeColor = cylinderInfo.beforeColor;
            cylinderFillList[j].beforeAppearance = cylinderInfo.beforeAppearance;
            cylinderFillList[j].beforeSafety = cylinderInfo.beforeSafety;
            cylinderFillList[j].beforeRegularInspectionDate = cylinderInfo.beforeRegularInspectionDate;
            cylinderFillList[j].beforeResidualPressure = cylinderInfo.beforeResidualPressure;
            cylinderFillList[j].fillingIfNormal = cylinderInfo.fillingIfNormal;
            cylinderFillList[j].afterPressure = cylinderInfo.afterPressure;
            cylinderFillList[j].afterCheckLeak = cylinderInfo.afterCheckLeak;
            cylinderFillList[j].afterAppearance = cylinderInfo.afterAppearance;
            cylinderFillList[j].afterTemperature = cylinderInfo.afterTemperature;
            cylinderFillList[j].ifPass = cylinderInfo.ifPass;
            cylinderFillList[j].remark = cylinderInfo.remark;
            cylinderFillList[j].companyAreaId = cylinderInfo.companyAreaId;
            cylinderFillList[j].areaName = cylinderInfo.areaName;
          }
        }
      }
      that.setData({
        cylinderFillList: cylinderFillList
      })
    }
    for (let x = 0; x < fillList.length; x++) {
      if (fillList[x][0] == detectionMissionId) {
        fillList[x][1] == cylinderFillList;
      }
    }
    wx.showToast({
      title: '修改成功'
    })
  },

  // 根据集格编号查询集格下绑定的气瓶二维码编号集合
  queryCylinderBySetId: function (setId) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    var setList = that.data.setList;
    wx.request({
      url: app.globalData.apiUrl + '/getCylinderBySetId',
      method: 'GET',
      data: {
        'setId': setId
      },
      header: {
        'qcmappversion': qcmappversion
      },
      success: (res) => {
        if (that.judge(res.data.data)) { // 集格下有绑定气瓶，集格计数
          let cylinderNumberList = [];
          if (res.data.data.length > 0) {
            for (let i = 0; i < res.data.data.length; i++) {
              cylinderNumberList.push(res.data.data[i].cylinderNumber);
            }
          }
          that.setData({
            cylinderNumberList: cylinderNumberList
          })
          that.updateData();
        }
      },
      fail: (e) => {
        wx.showToast({
          title: '查询集格接口访问失败',
          icon: 'none',
          mask: true,
          duration: 2500
        })
      }
    })
  },

  // 根据气瓶二维码编号查询所属集格编号
  queryCylinderInfoByNumber: function (cylinderNumber) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    
    wx.request({
      url: app.globalData.apiUrl + '/getCylinderByNumber',
      method: 'GET',
      data: {
        'cylinderNumber': cylinderNumber
      },
      header: {
        'qcmappversion': qcmappversion
      },
      success: (res) => {
        if (that.judge(res.data.data)) {
          let setId = res.data.data.setId;
          let setNumber = res.data.data.setNumber;
          if (that.judge(setId)) {
            that.setData({
              title: "集格编号：" + setId
            })
            that.queryCylinderBySetId(setId);
          } else {
            that.setData({
              title: "二维码编号：" + cylinderNumber,
              cylinderNumberList: []
            })
            that.updateData();
          }
        } else {
          // 未查询到气瓶信息
          wx.showToast({
            title: 'ID为 ' + cylinderNumber + ' 的气瓶信息缺失',
            icon: 'none',
            mask: true,
            duration: 2500
          })
        }
      },
      fail: (e) => {
        wx.showToast({
          title: '查询气瓶接口访问失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
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

  judge: function (x) {
    if ((x == "") || (x == null)) {
      return false;
    } else {
      return true;
    }
  },
  // 页面主要逻辑部分--结束

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }

})