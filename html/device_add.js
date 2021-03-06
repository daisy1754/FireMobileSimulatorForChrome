/* ***** BEGIN LICENSE BLOCK Version: GPL 3.0 ***** 
 * FireMobileFimulator is a Chrome Extension that simulate web browsers of 
 * japanese mobile phones.
 * Copyright (C) 2012  Takahiro Horikawa <horikawa.takahiro@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * ***** END LICENSE BLOCK ***** */

var firemobilesimulator;
if (!firemobilesimulator)
  firemobilesimulator = {};

Ext.onReady(function () {

  // from i18n.js
  localizePage();
  
  Ext.Ajax.timeout = 600000;
  Ext.BLANK_IMAGE_URL = 'ext/resources/images/default/s.gif';

  var q = new Ext.ToolTip({
    autoWidth : true,
    autoHeight : true,
    closable : true,
    showDelay : 50,
    dismissDelay : 0,
    target : 'qrcode',
    title : '端末登録ウィザードQRコード',
    html : '<img src="http://ke-tai.org//blog/wp-content/uploads/2007/12/wizard_qr.png" alt="" alt="">'
  });

  var ex1_hide = Ext.get('explanation1_hide');
  var ex1_show = Ext.get('explanation1_show');
  ex1_show.setStyle('display','none');
  ex1_hide.on('click', function() {
    ex1_show.setStyle('display','block');
    ex1_hide.setStyle('display','none');
  });
  ex1_show.on('click', function() {
    ex1_show.setStyle('display','none');
    ex1_hide.setStyle('display','block');
  });
  var ex2_hide = Ext.get('explanation2_hide');
  var ex2_show = Ext.get('explanation2_show');
  ex2_show.setStyle('display','none');
  ex2_hide.on('click', function() {
    ex2_show.setStyle('display','block');
    ex2_hide.setStyle('display','none');
  });
  ex2_show.on('click', function() {
    ex2_show.setStyle('display','none');
    ex2_hide.setStyle('display','block');
  });

  var filePath = devicedbUrl;
  var ds = new Ext.data.Store({
    proxy : new Ext.data.HttpProxy({
      url : filePath
    }),
    reader : new Ext.data.XmlReader({
        id : 'Id',
        record : 'Device'
      }, [{
          name : 'name',
          mapping : 'DeviceName'
        }, {
          name : 'code',
          mapping : 'DeviceShortName'
        }, {
          name : 'carrier',
          mapping : 'Carrier'
        }, {
          name : 'type1',
          mapping : 'Type1'
        }, {
          name : 'release-date',
          mapping : 'ReleaseDate'
      }]
    )
  });
  var sm = new Ext.grid.CheckboxSelectionModel({
    singleSelect : false
  });
  sm.on('beforerowselect', function(sm, index, keepExisting, record) {
    return !fms.core.isRegistered(record.id);
  });

  var tf = new Ext.form.TextField({id : 'tf-cmp'});
  var filteredCarrier;
  var filterButtonHandler = function(button, state) {
    console.log("filter carrier:"+button.text+"\n");
    if (state) { //press
      filteredCarrier = button.text;
    } else { //depress
      filteredCarrier = null;
    }
    is.searchNow();
  };

  var addButton = new Ext.Toolbar.Button({
    id   : "add-button2",
    menuAlign : "r",
    text : '選択した端末を追加2',
    handler : function() {
      firemobilesimulator.addDevice();
      fms.core.refreshRegisteredDevices();
      grid.getView().refresh();
    }
  });
  var grid = new Ext.grid.GridPanel({
    id : 'grid-device-cmp',
    store : ds,
    colModel : new Ext.grid.ColumnModel(
      [sm, {
        header : translate("device_label"),
        width : 160,
        sortable : true,
        dataIndex : 'name'
      }, {
        header : translate("device_code"),
        width : 160,
        sortable : true,
        dataIndex : 'code'
      }, {
        header : translate("carrier"),
        width : 80,
        sortable : true,
        dataIndex : 'carrier'
      }, {
        header : translate("device_type"),
        width : 80,
        sortable : true,
        dataIndex : 'type1'
      }, {
        header : translate("release_date"),
        width : 80,
        sortable : true,
        dataIndex : 'release-date'
      }]
    ),
    renderTo : 'grid-device',
    height : 380,
    width : 600,
    stripeRows : true,
    title : translate("device_list_title"),
    frame : true,
    sm : sm,
    viewConfig : {
      forceFit : true
    },
    loadMask : {
      msg : "Loading..."
    },
    tbar : [{
      text : 'docomo',
      //minWidth : 50,
      enableToggle : true,
      allowDepress : true,
      toggleGroup  : 'carrierButton',
      toggleHandler: filterButtonHandler
    }, {
      xtype : 'tbspacer'
    }, {
      text : 'au',
      //minWidth : 50,
      enableToggle : true,
      allowDepress : true,
      toggleGroup  : 'carrierButton',
      toggleHandler: filterButtonHandler
    }, {
      xtype : 'tbspacer'
    }, {
      text : 'SoftBank',
      //minWidth : 50,
      enableToggle : true,
      allowDepress : true,
      toggleGroup  : 'carrierButton',
      toggleHandler: filterButtonHandler
    }, {
      xtype : 'tbspacer'
    }, translate("search_by_device_label"),
    tf, {
      xtype : 'tbspacer'
    }, {
      //id   : "add-button",
      menuAlign : "r",
      text : translate("add_selected_device"),
      handler : function() {
        firemobilesimulator.addDevice();
        fms.core.refreshRegisteredDevices();
        grid.getView().refresh();
      },
      cls : "add-button"
    }],
    floating : false
  });
  grid.getView().getRowClass = function(record, index) {
    if (fms.core.isRegistered(record.id)) {
      return 'registered-row';
    }
    return;
  };
  var getInput = function() {
    return Ext.getCmp('tf-cmp').getValue();
  };
  var search = function(input) {
    if (!input) {
      if (filteredCarrier) {
        ds.filter('carrier', filteredCarrier);
      } else if (ds.isFiltered()) {
        ds.clearFilter();
      }
    } else if (input) {
      ds.filterBy(function(record, id) {
        var name = record.get('name');
        var carrier = record.get('carrier');
        if ((!filteredCarrier || carrier == filteredCarrier) && name.toUpperCase().indexOf(input.toUpperCase()) != -1) {
          return true;
        }
        return false;
      });
    } else {
      ds.filter('name', input, true, false);
    }
  };
  var is = new IncrementalSearch(getInput, search);
  ds.on('load',function() { is.checkLoop(); });
  ds.load();
});

firemobilesimulator.addDevice = function() {
  var idArray = new Array();
  var sm = Ext.getCmp('grid-device-cmp').getSelectionModel();
  var records = sm.getSelections();
  if (records.length <= 0) {
    Ext.Msg.alert(translate("error"), translate("device_not_selected_message"));
    return;
  } else if (records.length > 30) {
    Ext.Msg.alert(translate("error"), translate("devices_are_too_much_message"));
    return;
  }
  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    idArray.push(record.id);
  }
  var filePath = devicedbUrl + "?result=large&id=" + idArray.join(",");
  var devices = fms.core.parseDeviceListXML(filePath);
  var result = fms.core.LoadDevices(devices, false);
  if (result) {
    Ext.Msg.show({
      title : translate("register_completed_title"),
      msg : translate("register_completed")
    });
  }
  sm.clearSelections();
};

function IncrementalSearch() {
  this.initialize.apply(this, arguments);
};
IncrementalSearch.prototype = {
  initialize : function(getInputFunc, searchFunc) {
    this.getInput = getInputFunc;
    this.search = searchFunc;
  },
  delay : 100,
  interval : 500,
  checkLoop : function() {
    var input = this.getInput();
    if (!this.oldInput || input != this.oldInput) {
      this.oldInput = input;
      if (this.delay == 0) {
        this.search(input);
      } else {
        if (this.startSearchTimer)
          clearTimeout(this.startSearchTimer);
        this.startSearchTimer = setTimeout(this._bind(this.search,
                input), this.delay);
      }
    }
    if (this.checkLoopTimer)
      clearTimeout(this.checkLoopTimer);
    this.checkLoopTimer = setTimeout(this._bind(this.checkLoop),
        this.interval);
  },
  searchNow : function() {
    var input = this.getInput();
    this.search(input);
  },
  // Utils
  _bind : function(func) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);
    return function() {
      func.apply(self, args);
    };
  }
};
