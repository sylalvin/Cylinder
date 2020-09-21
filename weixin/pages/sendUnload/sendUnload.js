var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    qcmappversion: '1.0.0',
    getOrderData: false,
    disabled: false,
    opacity: 0.9,
    scanFlag: true,
    scan_number: 0,
    scan_bulk: 0,
    scan_set: 0,
    scan_sum: 0,
    cylinderList: [],
    setList: [],
    setCylinderList: [],
    allCylinderList: [],
    cylinderId: 0,
    detection: 1,
    empty: 0,
    orderData: {
      actionType: 2,
      creator: "",
      carId: 0,
      supercargoId: 0,
      driverId: 0,
      warehouseId: 0,
      customerId: 0,
      destinationType: 0,
      waybillNumber: "",
      unitId: 1,
      cylinderNum: 0,
      lat: '',
      lng: '',
      cylinderRecordList: []
    },
    bottleType: [
      { name: '满瓶', value: '0', checked: 'true' },
      { name: '空瓶', value: '1' }
    ],
    inputValue: "",
    forTransNumberList: [],
    animationData: {},
    duration: 2000,
    display: 'none', // 自定义toast的mask
    purenessArray: ["普", "2N", "3N", "4N", "5N", "6N", "4.5N"]
  },

  onShow: function () {
    var that = this;
    // 执行删除后的初始化气瓶数据
    var setList = app.globalData.sendSetList;
    var cylinderList = app.globalData.sendCylinderList;
    var setCylinderList = app.globalData.sendSetCylinderList;
    var allCylinderList = app.globalData.sendAllCylinderList;
    that.setData({
      setList: setList,
      cylinderList: cylinderList,
      setCylinderList: setCylinderList,
      allCylinderList: allCylinderList
    })
    that.countData();
  },

  onHide: function () {
    var that = this;
    // 设置回厂验空全局变量
    that.setGlobal();
  },

  /**
   * 生命周期函数--监听页面加载
   * 获取版本号、流转区域
   */
  onLoad: function (options) {
    var that = this;
    if (!util.checkLogin()) {
      wx.showToast({
        title: '您还未登录,请先登录',
        icon: 'none',
        mask: true,
        duration: 2000
      })
      setTimeout(function () {
        wx.switchTab({
          url: '/pages/index/index',
        })
      }, 2000)
      return;
    }
    // 获取版本号
    wx.request({
      url: app.globalData.apiUrl + '/version',
      method: 'POST',
      success: (res) => {
        if ((res.data.data != "") && (res.data.data != null)) {
          that.setData({
            qcmappversion: res.data.data
          })
        } else {
          that.errorModalNoStart("版本号不存在");
        }
      },
      fail: (e) => {
        that.errorModalNoStart("获取版本号接口访问失败");
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   * 初始化数据
   */
  onReady: function () {
    var that = this;
    that.mtoast = that.selectComponent("#mtoast");
    wx.getStorage({
      key: 'pj_employee_name',
      success: (res) => {
        that.setData({
          'orderData.creator': res.data
        })
      },
    })
  },

  // 气瓶满空
  radioChange: function (e) {
    var that = this;
    that.setData({
      empty: e.detail.value
    })
  },

  // 模糊查询运单号item
  bindInputChange: function (e) {
    var that = this;
    if (e.detail.value.length > 4) {
      wx.request({
        url: "https://wx.feifanqishi.net/index.php",
        method: 'GET',
        data: {
          'action': 'searchTransOrderNumber',
          'number': e.detail.value
        },
        header: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        success: (res) => {
          if (that.judge(res.data.data)) {
            let forTransNumberList = [];
            for (let k = 0; k < res.data.data.length; k++) {
              forTransNumberList.push(res.data.data[k]);
            }
            that.setData({
              forTransNumberList: forTransNumberList
            })
            that.showAnimation();
          } else {
            that.setData({
              forTransNumberList: []
            })
          }
        },
        fail: (e) => {
          that.errorModalNoStart("查询运单号列表接口访问失败");
        }
      })
    } else {
      that.setData({
        forTransNumberList: []
      })
    }
  },

  onSelectItem: function (e) {
    var that = this;
    let forTransNumberList = that.data.forTransNumberList;
    let index = e.currentTarget.dataset.setIndex;
    let transId = forTransNumberList[index];
    that.queryTransInfo(transId);
    that.setData({
      forTransNumberList: []
    })
  },

  // 动画
  showAnimation: function () {
    var that = this;
    var animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'ease'
    });
    animation.opacity(1).step();
    that.setData({
      animationData: animation.export()
    })
  },

  // 根据运单号查询erp中运单信息
  queryTransInfo: function(transId) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    that.setData({
      'orderData.waybillNumber': transId,
      inputValue: transId
    })
    if (transId != "") {
      wx.request({
        url: "https://wx.feifanqishi.net/index.php",
        method: 'GET',
        data: {
          'action': 'searchTransByOrderNo',
          'number': transId
        },
        success: (res) => {
          if ((res.data.data != "") && (res.data.data != null)) {
            that.setData({
              getOrderData: true
            })
            // 拼接判断司机和押运员
            let driverName = '';
            let surpercargoName = '';
            let driverNameArray = res.data.data.driverName.split(',');
            let surpercargoNameArray = res.data.data.surpercargo.split(',');
            let dsArray = driverNameArray.concat(surpercargoNameArray);
            for(let i = 0; i < dsArray.length; i++) {
              if(dsArray[i] == "") {
                dsArray.splice(i, 1);
                i--;
              }
            }
            if (dsArray.length == 1) {
              driverName = dsArray[0];
            } else if (dsArray.length > 1) {
              driverName = dsArray[0];
              surpercargoName = dsArray[dsArray.length - 1];
            }
            // 客户id或仓库id
            if (that.judge(res.data.data.customerName)) {
              that.setData({
                'orderData.destinationType': 1
              })
              wx.request({
                url: app.globalData.apiUrl + '/getCustomerByName',
                method: 'POST',
                data: {
                  'name': res.data.data.customerName,
                  'unitId': 1
                },
                header: {
                  'qcmappversion': qcmappversion,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                success: (res) => {
                  if (that.judge(res.data.data)) {
                    that.setData({
                      'orderData.customerId': res.data.data[0].id ? res.data.data[0].id : 0,
                      'orderData.warehouseId': 0
                    })
                  }
                },
                fail: (e) => {
                  that.errorModalNoStart("查询客户信息接口访问失败");
                }
              })
            } else if (that.judge(res.data.data.warehouseName)) {
              that.setData({
                'orderData.destinationType': 2
              })
              wx.request({
                url: app.globalData.apiUrl + '/getWarehouseByName',
                method: 'POST',
                data: {
                  'name': res.data.data.warehouseName,
                  'unitId': 1
                },
                header: {
                  'qcmappversion': qcmappversion,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                success: (res) => {
                  if (that.judge(res.data.data)) {
                    that.setData({
                      'orderData.warehouseId': res.data.data[0].id ? res.data.data[0].id : 0,
                      'orderData.customerId': 0
                    })
                  }
                },
                fail: (e) => {
                  that.errorModalNoStart("查询仓库信息接口访问失败");
                }
              })
            } else {
              that.setData({
                'orderData.destinationType': 0,
                'orderData.warehouseId': 0,
                'orderData.customerId': 0
              })
            }

            // 车辆id
            if (that.judge(res.data.data.carNumber)) {
              wx.request({
                url: app.globalData.apiUrl + '/getCarByCarNumber',
                method: 'POST',
                data: {
                  'carNumber': res.data.data.carNumber,
                  'unitId': 1
                },
                header: {
                  'qcmappversion': qcmappversion,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                success: (res) => {
                  if (that.judge(res.data.data)) {
                    that.setData({
                      'orderData.carId': res.data.data[0].id ? res.data.data[0].id : 0
                    })
                  }
                },
                fail: (e) => {
                  that.errorModalNoStart("查询车辆信息接口访问失败");
                }
              })
            } else {
              that.setData({
                'orderData.carId': 0
              })
            }

            // 司机id
            if (that.judge(driverName)) {
              wx.request({
                url: app.globalData.apiUrl + '/getEmployeeByName',
                method: 'POST',
                data: {
                  'name': driverName,
                  'unitId': 1
                },
                header: {
                  'qcmappversion': qcmappversion,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                success: (res) => {
                  if (that.judge(res.data.data)) {
                    that.setData({
                      'orderData.driverId': res.data.data[0].id ? res.data.data[0].id : 0
                    })
                  }
                },
                fail: (e) => {
                  that.errorModalNoStart("查询司机信息接口访问失败");
                }
              })
            } else {
              that.setData({
                'orderData.driverId': 0
              })
            }

            // 押运员id
            if (that.judge(surpercargoName)) {
              wx.request({
                url: app.globalData.apiUrl + '/getEmployeeByName',
                method: 'POST',
                data: {
                  'name': surpercargoName,
                  'unitId': 1
                },
                header: {
                  'qcmappversion': qcmappversion,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                success: (res) => {
                  if (that.judge(res.data.data)) {
                    that.setData({
                      'orderData.supercargoId': res.data.data[0].id ? res.data.data[0].id : 0
                    })
                  }
                },
                fail: (e) => {
                  that.errorModalNoStart("查询押运员信息接口访问失败");
                }
              })
            } else {
              that.setData({
                'orderData.supercargoId': 0
              })
            }

          } else {
            that.setData({
              getOrderData: false
            })
          }
        },
        fail: (e) => {
          that.errorModalNoStart("获取订单信息接口访问失败");
        }
      })
    }
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
                let errorString = "";
                for (let i = 0; i < data.cylinderList.length; i++) {
                  let regularInspectionDate = "";
                  if(util.checkEmpty(data.cylinderList[i].regularInspectionDate)) {
                    regularInspectionDate = data.cylinderList[i].regularInspectionDate.substring(0, 7);
                    regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
                    if(!util.compareDate(regularInspectionDate)) {
                      errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "\r\n";
                    }
                  } else {
                    regularInspectionDate = "无";
                    errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "\r\n";
                  }
                }
                if (errorString != "") {
                  that.errorModal(data.setNumber + "中的过期气瓶：" + "\r\n" + errorString);
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
              let errorString = "";
              for (let i = 0; i < data.cylinderList.length; i++) {
                let regularInspectionDate = "";
                if(util.checkEmpty(data.cylinderList[i].regularInspectionDate)) {
                  regularInspectionDate = data.cylinderList[i].regularInspectionDate.substring(0, 7);
                  regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
                  if(!util.compareDate(regularInspectionDate)) {
                    errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "\r\n";
                  }
                } else {
                  regularInspectionDate = "无";
                  errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "\r\n";
                }
              }
              if (errorString != "") {
                that.errorModal(data.setNumber + "中的过期气瓶：" + "\r\n" + errorString);
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
          that.errorModal("集格：" + data.setNumber + "未绑定气瓶");
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
          if ((res.data.data != "") && (res.data.data != null)) {
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
              let lastFillPureness = that.data.purenessArray[res.data.data.lastFillPureness - 1]; // 气瓶最后充装纯度
              let wallThickness = res.data.data.wallThickness; // 气瓶壁厚
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
            let lastFillPureness = that.data.purenessArray[res.data.data.lastFillPureness - 1]; // 气瓶最后充装纯度
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
    app.globalData.sendCylinderList = that.data.cylinderList;
    app.globalData.sendSetCylinderList = that.data.setCylinderList;
    app.globalData.sendSetList = that.data.setList;
    app.globalData.sendAllCylinderList = that.data.allCylinderList;
  },

  // 清空收发全局变量
  clearData: function () {
    var that = this;
    app.globalData.sendCylinderList = [];
    app.globalData.sendSetCylinderList = [];
    app.globalData.sendSetList = [];
    app.globalData.sendAllCylinderList = [];
    that.setData({
      cylinderList: app.globalData.sendCylinderList,
      setCylinderList: app.globalData.sendSetCylinderList,
      setList: app.globalData.sendSetList,
      allCylinderList: app.globalData.sendAllCylinderList
    })
    that.countData();
  },

  // 提交
  submitForm: function () {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    // 增加气瓶位置信息
    wx.getLocation({
      success: function (res) {
        that.setData({
          'orderData.lat': String(res.latitude),
          'orderData.lng': String(res.longitude)
        })
      }
    })
    wx.showModal({
      title: '确认信息',
      content: "提交前请保证信息无误，确认提交？",
      success(res) {
        if (res.confirm) {
          if(that.data.getOrderData) {
            let setList = that.data.setList;
            let cylinderList = that.data.cylinderList;
            let setCylinderList = that.data.setCylinderList;
            let allCylinderList = that.data.allCylinderList;
            let cylinderRecordList = that.data.orderData.cylinderRecordList;
            let cylinderNum = allCylinderList.length;
            that.setData({
              'orderData.cylinderNum': cylinderNum
            })
            if (allCylinderList.length > 0) {
              for (let i = allCylinderList.length - 1; i >= 0; i--) {
                let temp = allCylinderList[i];
                // 拼接气瓶信息
                let jsonData = {};
                jsonData.cylinderId = temp.cylinderId;
                jsonData.detection = that.data.detection;
                jsonData.empty = that.data.empty;
                cylinderRecordList.push(jsonData);
              }
              that.setData({
                'orderData.cylinderRecordList': JSON.stringify(cylinderRecordList)
              })
              if ((that.judge(that.data.orderData.creator)) && (that.judge(that.data.orderData.waybillNumber))) {
                var data = that.data.orderData;
                wx.request({
                  url: app.globalData.apiUrl + '/addTransmitReceiveRecord',
                  method: 'POST',
                  data: data,
                  header: {
                    'qcmappversion': qcmappversion,
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  success: (res) => {
                    if (res.data.msg == "成功") {
                      that.clearData();
                      that.setData({
                        disabled: true,
                        opacity: 0.3
                      })
                      that.successShowToastNoStart("添加成功");
                    } else {
                      that.errorModalNoStart("添加失败,请再次提交");
                    }
                  },
                  fail: (e) => {
                    that.errorModalNoStart("添加收发接口访问失败,5秒后再次请求");
                    setTimeout(function () {
                      that.submitForm();
                    }, 5000)
                  }
                })
              } else {
                that.errorModalNoStart("创建人或运单号不能为空");
                return;
              }
            } else {
              that.errorModalNoStart("您还未录入数据");
            }
          } else {
            that.errorModalNoStart("未获取到运单信息，请核对运单号");
          }
        } else if (res.cancel) {
          
        }
      }
    })
  },

  // 扫描发货单号
  scanInvoice: function () {
    var that = this;
    wx.scanCode({
      success: (res) => {
        // 此处判断是否为散瓶、集格
        if (res.result.indexOf("/set/code/") == -1) {
          if ((res.result.indexOf("0001") == -1) && (res.result.length != 11)) {
            that.setData({
              inputValue: res.result
            })
            that.queryTransInfo(res.result);
          } else {
            that.errorModalNoStart("二维码格式不正确");
          }
        } else {
          that.errorModalNoStart("二维码格式不正确");
        }
      },
      fail: (e) => {
        that.errorModalNoStart("扫描失败");
      }
    })
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
  },

  // 判断是否为空或null
  judge: function (x) {
    if ((x == "") || (x == null)) {
      return false;
    } else {
      return true;
    }
  },

  // 日期补零
  addZero: function(x) {
    if(x < 10) {
      return '0' + x;
    } else {
      return '' + x;
    }
  },
  // 页面主要逻辑部分--结束

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }

})