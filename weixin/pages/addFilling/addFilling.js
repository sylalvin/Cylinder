var util = require("../../utils/util.js")
var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    qcmappversion: '1.0.0',
    scanFlag: true,
    disabled: false,
    opacity: 0.9,
    scan_number: 0,
    scan_bulk: 0,
    scan_set: 0,
    scan_sum: 0,
    cylinderList: [],
    setList: [],
    setCylinderList: [],
    allCylinderList: [],
    gasMediumName: "",
    submitData: {
      unitId: 1,
      employeeId: 0,
      pureness: 1,
      team: "",
      beginDate: "",
      productionBatch: "",
      companyAreaId: 0,
      cylinderIdList: "",
      remark: "",
      creator: ""
    },
    purenessItems: ["普", "2N", "3N", "4N", "5N", "6N", "4.5N"],
    purenessIndex: 0,
    areaItems: [],
    areaValues: [],
    areaIndex: 0,
    duration: 2000,
    display: 'none' // 自定义toast的mask
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.data.qcmappversion = app.globalData.qcmappversion;
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

    var promise = new Promise((resolve, reject) => {
      wx.request({
        url: app.globalData.apiUrl + '/getCompanyProjectByCompanyId',
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded",
          "qcmappversion": app.globalData.qcmappversion
        },
        data: { unitId: 1 },
        success: res => {
          resolve(res.data.data);
        },
        fail: function (res) {
          // fail调用接口失败
          reject({ error: '网络错误', code: 0 });
        },
        complete: function (res) {
          // complete
        }
      });
    });
    promise.then(res => {
      if (res.length > 0) {
        for (var i = 0; i < res.length; i++) {
          if (res[i].projectName == "充装") {
            wx.request({
              url: app.globalData.apiUrl + '/getCompanyProjectAreaByCompanyProjectId',
              method: "POST",
              header: {
                "Content-Type": "application/x-www-form-urlencoded",
                "qcmappversion": app.globalData.qcmappversion
              },
              data: { unitId: 1, companyProjectId: res[i].id, projectId: res[i].projectId },
              success: res2 => {
                var returnData = res2.data.data;
                let areaItems = [];
                let areaValues = [];
                if (returnData.length > 0) {
                  for (var j = 0; j < returnData.length; j++) {
                    areaItems.push(returnData[j].companyAreaName);
                    areaValues.push(returnData[j].companyAreaId);
                  }
                  that.setData({
                    "areaItems": areaItems,
                    "areaValues": areaValues,
                    "submitData.companyAreaId": areaValues[0]
                  })

                }
              }
            });
          }
        }
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var that = this;
    that.mtoast = this.selectComponent("#mtoast");
    var creator = wx.getStorageSync('pj_employee_name');
    var employeeId = wx.getStorageSync('pj_employee_id');
    that.setData({
      'submitData.creator': creator,
      'submitData.employeeId': employeeId
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;
    // 执行删除后的初始化气瓶数据
    var setList = app.globalData.fillSetList;
    var cylinderList = app.globalData.fillCylinderList;
    var setCylinderList = app.globalData.fillSetCylinderList;
    var allCylinderList = app.globalData.fillAllCylinderList;
    that.setData({
      setList: setList,
      cylinderList: cylinderList,
      setCylinderList: setCylinderList,
      allCylinderList: allCylinderList
    })
    if (allCylinderList.length == 0) {
      that.setData({
        gasMediumName: ""
      })
    }
    that.countData();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    var that = this;
    // 设置全局变量
    that.setGlobal();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  setBeginTime: function (e) {
    let day = new Date();
    var now_hour, now_minute, now_second;
    if (day.getHours() < 10) {
      now_hour = "0" + day.getHours();
    } else {
      now_hour = day.getHours();
    }
    if (day.getMinutes() < 10) {
      now_minute = "0" + day.getMinutes();
    } else {
      now_minute = day.getMinutes();
    }
    if (day.getSeconds() < 10) {
      now_second = "0" + day.getSeconds();
    } else {
      now_second = day.getSeconds();
    }
    this.setData({
      "submitData.beginDate": now_hour + ":" + now_minute + ":" + now_second
    });
  },

  onChangeProductionBatch: function (e) {
    this.setData({
      "submitData.productionBatch": e.detail.value
    });
  },

  viewCylinder: function (e) {
    var that = this;
    var allCylinderList = that.data.allCylinderList;
    if (allCylinderList.length == 0) {
      that.errorModalNoStart("您还没有添加气瓶信息", "温馨提示");
      return false;
    }
    wx.navigateTo({
      url: '/pages/fillingDelete/fillingDelete'
    })
  },

  onChangePureness: function (e) {
    var value = Number(e.detail.value);
    this.setData({
      "purenessIndex": value,
      "submitData.pureness": value + 1
    })

  },

  onChangeArea: function (e) {
    var areaValues = this.data.areaValues;

    this.setData({
      "areaIndex": e.detail.value,
      "submitData.companyAreaId": areaValues[e.detail.value]
    })
  },

  onChangeRemark: function (e) {
    this.setData({
      "submitData.remark": e.detail.value
    });
  },

  // 页面主要逻辑部分--开始
  // 扫码添加
  start: function() {
    var that = this;
    if (that.data.scanFlag) {
      that.addCylinder();
    }
  },

  addCylinder: function () {
    var that = this;
    that.setData({
      scanFlag: true
    })
    wx.scanCode({
      success: (res) => {
        // 此处判断散瓶、集格
        if (res.result.indexOf("/set/code/") != -1) {
          // 集格
          var setCode = res.result.indexOf("/set/code/");
          setCode = res.result.substring(setCode + 10);
          that.queryCylinderBySetId(Number(setCode));
        } else if (res.result.indexOf("0001") != -1) {
          // 散瓶
          var setId = null;
          var cylinderCode = res.result;
          var cylinderList = that.data.cylinderList;
          var cylinderNumber = cylinderCode.substring(cylinderCode.length - 11);
          if (cylinderNumber.length != 11) {
            that.errorModal("该气瓶码长度不正确");
          } else {
            if (cylinderList.includes(cylinderNumber)) {
              that.errorModal("该气瓶(" + cylinderNumber + ")已扫描");
            } else {
              // 查询气瓶信息
              that.queryCylinderInfoByNumber(setId, cylinderNumber);
            }
          }
        } else {
          that.errorModal("该码不符合规范");
        }
      },
      fail: (e) => {
        // 退出扫码动作或调取扫码动作失败
        that.setData({
          scanFlag: false,
          display: 'none'
        })
      }
    })
  },

  // 根据集格编号查询集格下绑定的气瓶
  queryCylinderBySetId: function (setId) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    var setList = that.data.setList;
    wx.request({
      url: app.globalData.apiUrl + '/getSetCylinderBySetId',
      method: 'GET',
      data: {
        'setId': setId
      },
      header: {
        'qcmappversion': qcmappversion
      },
      success: (res) => {
        if(res.data.code != 200) {
          that.errorModal("ID为 " + setId + " 的集格信息缺失");
          return;
        }
        if ((res.data.data != null) && (res.data.data.cylinderList.length > 0)) { // 集格下有绑定气瓶
          let data = res.data.data;
          var lastFillTime = data.cylinderList[0].lastFillTime;
          var difftimes = 4 * 60 * 60 * 1000;
          if ((lastFillTime == null) || ((lastFillTime != null) && (util.diff(lastFillTime, new Date()) > difftimes))) {
            if (setList.includes(setId)) {
              that.errorModal("该集格(" + data.setNumber + ")已扫描");
            } else {
              if(util.checkEmpty(data.regularInspectionDate)) {
                let regularInspectionDate = data.regularInspectionDate.substring(0, 7); // 集格下检日期
                regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
                let effect = util.compareDate(regularInspectionDate);
                if(!effect) {
                  that.errorModal("集格：" + data.setNumber + "的过期日期为" + regularInspectionDate + "。该集格已过期，请先检验再使用！");
                } else {
                  let errorHeaderString = "";
                  let errorString = "";
                  for (let i = 0; i < data.cylinderList.length; i++) {
                    let regularInspectionDate = "";
                    if(util.checkEmpty(data.cylinderList[i].regularInspectionDate)) {
                      regularInspectionDate = data.cylinderList[i].regularInspectionDate.substring(0, 7);
                      regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
                      if(!util.compareDate(regularInspectionDate)) {
                        errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "-" + data.cylinderList[i].gasMediumName + "\r\n";
                      }
                    } else {
                      regularInspectionDate = "无";
                      errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "-" + data.cylinderList[i].gasMediumName + "\r\n";
                    }
                    // 判断是否是第一次扫描或者是不是同种介质
                    if (that.data.gasMediumName == "") {
                      that.setData({
                        gasMediumName: data.cylinderList[i].gasMediumName
                      })
                    } else {
                      if (data.cylinderList[i].gasMediumName != that.data.gasMediumName) {
                        var hasExist = errorString.indexOf(data.cylinderList[i].cylinderNumber);
                        if(hasExist != -1) {
                          errorHeaderString = "气瓶介质存在异常\r\n";
                          errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "-" + data.cylinderList[i].gasMediumName + "\r\n";
                        }
                      }
                    }
                  }
                  if (errorString != "") {
                    console.log(errorHeaderString, errorString);
                    that.errorModal(errorHeaderString + data.setNumber + "中的过期气瓶：" + "\r\n" + errorString);
                  } else {
                    that.successShowMyToast("集格：" + data.setNumber + " \r\n绑定气瓶数量：" + data.cylinderList.length + " \r\n集格过期日期：" + regularInspectionDate);
                    setList.push(setId);
                    that.setData({
                      setList: setList
                    })
                    that.countData();
                    for (let i = 0; i < data.cylinderList.length; i++) {
                      let cylinderNumber = data.cylinderList[i].cylinderNumber;
                      that.queryCylinderInfoByNumber(setId, cylinderNumber);
                    }
                  }
                }
              } else {
                let errorHeaderString = "";
                let errorString = "";
                for (let i = 0; i < data.cylinderList.length; i++) {
                  let regularInspectionDate = "";
                  if(util.checkEmpty(data.cylinderList[i].regularInspectionDate)) {
                    regularInspectionDate = data.cylinderList[i].regularInspectionDate.substring(0, 7);
                    regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
                    if(!util.compareDate(regularInspectionDate)) {
                      errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "-" + data.cylinderList[i].gasMediumName + "\r\n";
                    }
                  } else {
                    regularInspectionDate = "无";
                    errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "-" + data.cylinderList[i].gasMediumName + "\r\n";
                  }
                  // 判断是否是第一次扫描或者是不是同种介质
                  if (that.data.gasMediumName == "") {
                    that.setData({
                      gasMediumName: data.cylinderList[i].gasMediumName
                    })
                  } else {
                    if (data.cylinderList[i].gasMediumName != that.data.gasMediumName) {
                      var hasExist = errorString.indexOf(data.cylinderList[i].cylinderNumber);
                      if(hasExist != -1) {
                        errorHeaderString = "气瓶介质存在异常\r\n";
                        errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "-" + data.cylinderList[i].gasMediumName + "\r\n";
                      }
                    }
                  }
                }
                if (errorString != "") {
                  console.log(errorHeaderString, errorString);
                  that.errorModal(errorHeaderString + data.setNumber + "中的过期气瓶：" + "\r\n" + errorString);
                } else {
                  that.successShowMyToast("集格：" + data.setNumber + " \r\n绑定气瓶数量：" + data.cylinderList.length + " \r\n集格过期日期：尚无记录");
                  setList.push(setId);
                  that.setData({
                    setList: setList
                  })
                  that.countData();
                  for (let i = 0; i < data.cylinderList.length; i++) {
                    let cylinderNumber = data.cylinderList[i].cylinderNumber;
                    that.queryCylinderInfoByNumber(setId, cylinderNumber);
                  }
                }
              }
            }
          } else {
            // 4小时内充装过该集格
            that.errorModal("集格" + data.setNumber + "4小时内已充装");
          }
        } else {
          that.errorModal("集格：" + res.data.setNumber + "未绑定气瓶");
        }
      },
      fail: (e) => {
        that.errorModal("查询集格接口访问失败");
      }
    })
  },

  // 根据气瓶二维码编号查询气瓶信息
  queryCylinderInfoByNumber: function (setId, cylinderNumber, setNumber = null) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    if (setId == null) {
      let cylinderList = that.data.cylinderList;
      let allCylinderList = that.data.allCylinderList;
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
          console.log("222" + JSON.stringify(res));
          if ((res.data.data != "") && (res.data.data != null)) {
            var lastFillTime = res.data.data.lastFillTime;
            var difftimes = 4 * 60 * 60 * 1000;
            if ((lastFillTime == null) || ((lastFillTime != null) && (util.diff(lastFillTime, new Date()) > difftimes))) {
              if (util.checkEmpty(res.data.data.setId)) {
                let setList = that.data.setList;
                if (setList.includes(res.data.data.setId)) {
                  that.errorModal("该集格(" + res.data.data.setNumber + ")已扫描");
                } else {
                  that.queryCylinderBySetId(res.data.data.setId);
                }
              } else {
                let cylinderId = res.data.data.id;
                let unitId = res.data.data.unitId;
                let cylinderCode = res.data.data.cylinderCode; // 气瓶码
                let cylinderTypeName = res.data.data.cylinderTypeName; // 气瓶类型名称
                let gasMediumName = res.data.data.gasMediumName; // 气瓶介质名称
                let regularInspectionDate = ""; // 气瓶下检日期
                if(!util.checkEmpty(res.data.data.regularInspectionDate)) {
                  regularInspectionDate = "2020-01";
                } else {
                  regularInspectionDate = res.data.data.regularInspectionDate.substring(0, 7);
                  regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
                }
                let cylinderScrapDate = res.data.data.cylinderScrapDate.substring(0, 7); // 气瓶过期日期
                let cylinderManufacturingDate = res.data.data.cylinderManufacturingDate.substring(0, 7); // 气瓶生产日期
                let volume = res.data.data.volume; // 气瓶容积
                let nominalTestPressure = res.data.data.nominalTestPressure; // 气瓶压力
                let weight = res.data.data.weight; // 气瓶重量
                let lastFillTime = res.data.data.lastFillTime; // 气瓶最后充装时间
                let lastFillPureness = that.data.purenessItems[res.data.data.lastFillPureness - 1]; // 气瓶最后充装纯度
                let wallThickness = res.data.data.wallThickness; // 气瓶壁厚
                // 判断是否是第一次扫描或者是不是同种介质
                if (that.data.gasMediumName == "") {
                  that.setData({
                    gasMediumName: gasMediumName
                  })
                }
                if (gasMediumName == that.data.gasMediumName) {
                  let effect = util.compareDate(regularInspectionDate);
                  if(!effect) {
                    that.errorModal("气瓶：" + cylinderNumber + "的过期日期为" + regularInspectionDate + "。该气瓶已过期，请先检验再使用！");
                  } else {
                    cylinderList.push(cylinderNumber);
                    allCylinderList.push({ setId, cylinderNumber, cylinderId, unitId, cylinderCode, cylinderTypeName, gasMediumName, regularInspectionDate, cylinderScrapDate, cylinderManufacturingDate, volume, nominalTestPressure, weight, lastFillTime, lastFillPureness, wallThickness });
                    that.setData({
                      cylinderList: cylinderList,
                      allCylinderList: allCylinderList
                    })
                    that.countData();
                    that.successShowMyToast("二维码：" + cylinderNumber + " \r\n介质：" + gasMediumName + " \r\n过期日期：" + regularInspectionDate + " \r\n最后充装时间：" + lastFillTime + " \r\n最后充装纯度：" + lastFillPureness)
                  }
                } else {
                  that.errorModal("该气瓶介质为：" + gasMediumName + "，应该录入介质为 ' + that.data.gasMediumName + '的气瓶数据");
                }
              }
            } else {
              // 4小时内充装过该气瓶
              that.errorModal('ID为 ' + cylinderNumber + ' 的气瓶4小时内已充装');
            }
          } else {
            // 未查询到气瓶信息
            that.errorModal('ID为 ' + cylinderNumber + ' 的气瓶信息缺失');
          }
        },
        fail: (e) => {
          that.errorModal('查询气瓶接口访问失败');
        }
      })
    } else {
      let setCylinderList = that.data.setCylinderList;
      let allCylinderList = that.data.allCylinderList;
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
          console.log("111" + JSON.stringify(res));
          if ((res.data.data != "") && (res.data.data != null)) {
            let cylinderId = res.data.data.id;
            let unitId = res.data.data.unitId;
            let cylinderCode = res.data.data.cylinderCode; // 气瓶码
            let cylinderTypeName = res.data.data.cylinderTypeName; // 气瓶类型名称
            let gasMediumName = res.data.data.gasMediumName; // 气瓶介质名称
            let regularInspectionDate = ""; // 气瓶下检日期
            if(!util.checkEmpty(res.data.data.regularInspectionDate)) {
              regularInspectionDate = "2020-01";
            } else {
              regularInspectionDate = res.data.data.regularInspectionDate.substring(0, 7);
              regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
            }
            let cylinderScrapDate = res.data.data.cylinderScrapDate.substring(0, 7); // 气瓶过期日期

            let cylinderManufacturingDate = res.data.data.cylinderManufacturingDate.substring(0, 7); // 气瓶生产日期
            let volume = res.data.data.volume; // 气瓶容积
            let nominalTestPressure = res.data.data.nominalTestPressure; // 气瓶压力
            let weight = res.data.data.weight; // 气瓶重量
            let lastFillTime = res.data.data.lastFillTime; // 气瓶最后充装时间
            let lastFillPureness = that.data.purenessItems[res.data.data.lastFillPureness - 1]; // 气瓶最后充装纯度
            let wallThickness = res.data.data.wallThickness; // 气瓶壁厚
            setCylinderList.push({ setId, cylinderNumber, cylinderId, unitId, cylinderCode, cylinderTypeName, gasMediumName, regularInspectionDate, cylinderScrapDate, cylinderManufacturingDate, volume, nominalTestPressure, weight, lastFillTime, wallThickness });
            allCylinderList.push({ setId, cylinderNumber, cylinderId, unitId, cylinderCode, cylinderTypeName, gasMediumName, regularInspectionDate, cylinderScrapDate, cylinderManufacturingDate, volume, nominalTestPressure, weight, lastFillTime, lastFillPureness, wallThickness });
            that.setData({
              setCylinderList: setCylinderList,
              allCylinderList: allCylinderList
            })
            that.countData();
          } else {
            // 未查询到气瓶信息
            that.errorModal('ID为 ' + cylinderNumber + ' 的气瓶信息缺失');
          }
        },
        fail: (e) => {
          that.errorModal('查询气瓶接口访问失败');
        }
      })
    }
  },

  // 计算扫码次数、气瓶、集格、总数数量
  countData: function () {
    var that = this;
    that.setData({
      scan_number: that.data.setList.length + that.data.cylinderList.length,
      scan_bulk: that.data.cylinderList.length,
      scan_set: that.data.setList.length,
      scan_sum: that.data.allCylinderList.length
    })
  },

  // 设置全局变量
  setGlobal: function () {
    var that = this;
    app.globalData.fillCylinderList = that.data.cylinderList;
    app.globalData.fillSetCylinderList = that.data.setCylinderList;
    app.globalData.fillSetList = that.data.setList;
    app.globalData.fillAllCylinderList = that.data.allCylinderList;
  },

  // 清空全局变量
  clearData: function () {
    var that = this;
    app.globalData.fillCylinderList = [];
    app.globalData.fillSetCylinderList = [];
    app.globalData.fillSetList = [];
    app.globalData.fillAllCylinderList = [];
    that.setData({
      cylinderList: app.globalData.fillCylinderList,
      setCylinderList: app.globalData.fillSetCylinderList,
      setList: app.globalData.fillSetList,
      allCylinderList: app.globalData.fillAllCylinderList
    })
    that.countData();
  },

  // 提交
  onSubmitMission: function () {
    var that = this;
    let allCylinderList = that.data.allCylinderList;
    if (that.data.disabled == true) {
      that.errorModalNoStart("禁止重复提交", "温馨提示");
      return false;
    }
    if (allCylinderList.length == 0) {
      that.errorModalNoStart("您还未录入数据", "温馨提示");
      return false;
    }
    if (!that.judge(that.data.submitData.beginDate)) {
      that.errorModalNoStart("请添加开始时间");
      return false;
    }
    wx.showModal({
      title: '确认信息',
      content: "提交前请保证信息无误，确认提交？",
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '正在提交',
            mask: true
          })
          // let setList = that.data.setList;
          // let cylinderList = that.data.cylinderList;
          // let setCylinderList = that.data.setCylinderList;
          // let allCylinderList = that.data.allCylinderList;
          let cylinderIdList = [];
          for (let i = allCylinderList.length - 1; i >= 0; i--) {
            let temp = allCylinderList[i];
            // 拼接气瓶信息
            cylinderIdList.push(temp.cylinderId);
          }
          cylinderIdList = cylinderIdList.join(',');

          var beginDate = new Date().getFullYear() + "-" + ((new Date().getMonth() + 1) < 10 ? "0" + (new Date().getMonth() + 1) : (new Date().getMonth() + 1)) + "-" + ((new Date().getDate() < 10) ? ("0" + new Date().getDate()) : (new Date().getDate())) + " " + that.data.submitData.beginDate;

          that.setData({
            'submitData.cylinderIdList': cylinderIdList
          })

          var data = that.data.submitData;
          data.beginDate = beginDate;
          wx.request({
            url: app.globalData.apiUrl + '/addDetection',
            method: 'POST',
            data: data,
            header: {
              'qcmappversion': app.globalData.qcmappversion,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            success: (res) => {
              wx.hideLoading();
              if (res.data.msg == "成功") {
                that.clearData();
                that.setData({
                  disabled: true,
                  opacity: 0.3
                })
                wx.showToast({
                  title: '添加成功',
                  duration: 2000
                })
                wx.navigateTo({
                  url: '/pages/filling/filling'
                })
              } else {
                that.errorModalNoStart(res.data.msg);
              }
            },
            fail: (e) => {
              that.errorModalNoStart("添加收发接口访问失败,5秒后再次请求");
              setTimeout(function () {
                that.onSubmitMission();
              }, 5000)
            }
          })
        } else if (res.cancel) {
          console.log('删除取消');
        }
      }
    })
  },

  // 日期补零
  addZero: function(x) {
    if(x < 10) {
      return '0' + x;
    } else {
      return '' + x;
    }
  },

  // 判断是否为空或null
  judge: function (x) {
    if ((x == "") || (x == null)) {
      return false;
    } else {
      return true;
    }
  },

  // 正常弹窗提示
  successShowToastNoStart: function(successMsg) {
    var that = this;
    wx.showToast({
      title: successMsg,
      icon: 'none',
      duration: that.data.duration,
      mask: true
    })
  },

  successShowToast: function(successMsg) {
    var that = this;
    wx.showToast({
      title: successMsg,
      icon: 'none',
      duration: that.data.duration,
      mask: true
    })
    setTimeout(that.start, that.data.duration);
  },

  // 自定义toast
  successShowMyToast: function(successMsg) {
    var that = this;
    that.setData({
      display: 'block'
    })
    that.mtoast.showToast(successMsg, that.data.duration);
    setTimeout(that.start, that.data.duration);
  },

  // 异常弹窗提示
  errorModalNoStart: function(errorMsg, title = "错误提醒", confirmText = "关闭", confirmColor = "#576B95") {
    var that = this;
    wx.showModal({
      title: title,
      content: errorMsg,
      showCancel: false,
      confirmText: confirmText,
      confirmColor: confirmColor,
      success (res) {
        if (res.confirm) {
          console.log("");
        }
      }
    })
  },

  errorModal: function(errorMsg, title = "错误提醒", confirmText = "关闭", confirmColor = "#576B95") {
    var that = this;
    wx.showModal({
      title: title,
      content: errorMsg,
      showCancel: false,
      confirmText: confirmText,
      confirmColor: confirmColor,
      success (res) {
        if (res.confirm) {
          that.start();
        }
      }
    })
  }
})