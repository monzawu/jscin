// Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Options page for Chrome OS CIN.
 * @author zork@google.com (Zach Kuznia)
 */

var table_loading = {};

// this is dirty hack
//var bgPage = chrome.extension.getBackgroundPage();
//var jscin = bgPage.jscin;
//var instance = bgPage.croscin.instance;

var jscin = {};
var instance = {};
console.log("jscin default empty 4");
/*
const port = chrome.runtime.connect({name: "keep-alive"});
console.log("options: port=", port);
port.postMessage({data: 'test'});
*/
chrome.runtime.sendMessage({"action": "ping"}, (response) => {
  console.log("options: get response");
  jscin = response.jscin;
  //instance = response.croscin;
  console.log("options: check ", jscin.IMKEY_DELAY);
});

instance.prefGetSupportNonChromeOS = function () {
  return true;
}
instance.prefGetDefaultEnabled = function() {
  return true;
}
instance.prefGetQuickPunctuations = function() {
  return true;
}
instance.prefGetRelatedText = function() {
  return false;
}
instance.getDefaultModule = function() {
  return 'GenInp2';
}
instance.getAvailableModules = function() {
  return ['GenInp', 'GenInp2'];
}


_ = chrome.i18n.getMessage;

function SetElementsText() {
  for (var i = 0; i < arguments.length; i++) {
    $("." + arguments[i]).text(_(arguments[i]));
  }
}

var BuiltinIMs = JSON.parse(
    LoadExtensionResource("tables/builtin.json"));

function init() {
  SetElementsText("optionCaption", "optionInputMethodTables",
      "optionHowToEnableTables", "optionEnabledTables", "optionAvailableTables",
      "optionAddTables", "optionAddUrl", "optionAddFile", "optionAddDrive",
      "optionTableDetailNameHeader", "optionTableDetailSourceHeader",
      "optionTableDetailTypeHeader", "optionQueryKeystrokes",
      "optionSaveToDrive", "optionSettingChoices",
      "optionGeneral", "optionSupportNonChromeOS",
      "optionAlertChangeSupportNonChromeOS",
      "optionDefaultEnabledNonCros",
      "optionRelatedText", "optionPunctuations",
      "optionSelectDefaultInputModule", "optionSandbox",
      "optionDebug", "optionDebugMessage");


  $('#available_im_list').sortable({
    revert: true,
    connectWith: ".sortable",
    helper: 'clone'
  }).disableSelection();

  $('#enabled_im_list').sortable({
    revert: true,
    connectWith: ".sortable",
    cancel: "li:only-child",
    helper: 'clone',
    update: function (event, ui) {
      var new_list = [];
      $('#enabled_im_list li').each(function(index) {
        new_list.push($(this).attr('id').replace(/^ime_/, ''));
      });
      updateEnabledList(new_list);
      notifyConfigChanged();
    }
  }).disableSelection();
  $("#accordion").accordion({heightStyle: "content"});

  loadCinTables();

  // TODO(hungte) we should autodetect again after source is specified.
  var select = $("#add_table_setting");
  var setting_options = JSON.parse(LoadExtensionResource("options/builtin_options.json"));
  select.empty();
  for (var i in setting_options) {
    var setting = setting_options[i];
    var option = $("<option>", {"id": "option" + i});
    option.text(setting.ename + ' ' + setting.cname);
    if ("default" in setting && setting["default"]) {
      option.attr("selected", "selected");
    }
    select.append(option);
  }

  $("#add_table_dialog").attr("title", _("optionAddTable"));

  $("#add_table_dialog").dialog({
    autoOpen: false,
    width: 800,
    modal: true,
  });

  $(".optionAddUrl").button().click(function(event) {
    setAddTableStatus("");
    $("#file_div").hide();
    $("#url_div").show();
    $("#doc_div").hide();
    $("#save_to_drive_input").show();
    $("#add_table_dialog").dialog('option', 'buttons', [
      {
        text: _("optionAddTable"),
        click: function() {
          var url = document.getElementById("cin_table_url_input").value;
          addTableUrl(url);
          $(this).dialog("close");
        }
      },
      {
        text: _("optionCancel"),
        click: function() {
          $(this).dialog("close");
        }
      }
    ]).dialog("open");
  });

  $(".optionAddFile").button().click(function(event) {
    setAddTableStatus("");
    $("#file_div").show();
    $("#url_div").hide();
    $("#doc_div").hide();
    $("#save_to_drive_input").show();
    $("#add_table_dialog").dialog('option', 'buttons', [
      {
        text: _("optionAddTable"),
        click: function() {
          var files = document.getElementById("cin_table_file_input").files;
          addTabFile(files);
          $(this).dialog("close");
        }
      },
      {
        text: _("optionCancel"),
        click: function() {
          $(this).dialog("close");
        }
      }
    ]).dialog("open");
  });

  $(".optionAddDrive").button().click(function(event) {
    setAddTableStatus("");
    $("#url_div").hide();
    $("#file_div").hide();
    $("#doc_div").show();
    setDocStatus("");
    $("#save_to_drive").prop('checked', false);
    $("#save_to_drive_input").hide();
    bgPage.oauth.authorize(function() {
      $('#doc_list').empty();
      getDocumentList("");
    });
    // #add_table_dialog will be open after the docs are ready
    // in drive.js: renderDocList()
  });

  $('#save_to_drive').change(function() {
    if ($('#save_to_drive').is(':checked')) {
      $('#auth_status').text("(Uncheck if you refuse to authenticate.)");
      bgPage.oauth.authorize(function() {
        $('#auth_status').text('(Successfully authenticated.)');
      });
    }
  });

  $('#checkSupportNonChromeOS').prop(
      "checked", instance.prefGetSupportNonChromeOS()).
      click(function() {
    instance.prefSetSupportNonChromeOS($(this).prop("checked"));
    $('#checkDefaultEnabledNonCros').prop('disabled',
      !$(this).prop("checked"));
    var buttons = {};
    buttons[_("optionOK")] = function () {
      $(this).dialog("close");
    };
    $('#dialog_alert_change_support_non_chromeos').dialog({
      title: _("optionAlert"),
      modal: true,
      buttons: buttons});
  });
  $('#checkDefaultEnabledNonCros').prop(
      "disabled", !instance.prefGetSupportNonChromeOS()).prop(
      "checked", instance.prefGetDefaultEnabled()).
      click(function() {
        instance.prefSetDefaultEnabled($(this).prop("checked"));
      });
  $('#checkPunctuations').prop(
      "checked", instance.prefGetQuickPunctuations()).
      click(function() {
    instance.prefSetQuickPunctuations($(this).prop("checked"));
  });
  $('#checkRelatedText').prop(
      "checked", instance.prefGetRelatedText()).
      click(function() {
    instance.prefSetRelatedText($(this).prop("checked"));
  });


  // To set default check state of checkboxes, do call button("refresh").
  $('#checkDebugMessage').prop("checked", instance.debug).
      click(function() {
    instance.setDebugMode($(this).prop("checked"));
  });
  var module_form = $('#formSelectModule');
  var def_module = instance.getDefaultModule();
  module_form.empty();
  var im_modules = instance.getAvailableModules();
  im_modules.forEach(function (name) {
    if (name.indexOf("Gen") != 0)
      return;
    module_form.append(
        $('<input type=radio class=radio name=moduleRadio/>').attr("id", name).
        click(function () {
          instance.setDefaultModule(name);
          alert(_("optionReloadExtensionOrRestart"));
        }));
    module_form.append($('<label/>').attr("for", name).text(name));
  });
  $('#' + def_module).prop("checked", true);
  $('#formSelectModule').buttonset();
  $('#start_dumb_ime').button();
  $('#start_test_area').button();
}

function LoadExtensionResource(url) {
  var rsrc = chrome.runtime.getURL(url);
  var xhr = new XMLHttpRequest();
  console.log("LoadExtensionResource:", url);
  xhr.open("GET", rsrc, false);
  xhr.send();
  if (xhr.readyState != 4 || xhr.status != 200) {
    console.log("LoadExtensionResource: failed to fetch:", url);
    return null;
  }
  return xhr.responseText;
}

function removeFileExtension(filename) {
  var dotPos = filename.indexOf('.');
  if(dotPos >= 0) {
    filename = filename.slice(0, dotPos);
  }
  return filename;
}

function addTableUrl(url) {
  if (url.replace(/^\s+|s+$/g, "") == "") {
    setAddTableStatus("URL is empty", true);
    return;
  }

  // Convert github blobs to raw format.
  url = url.replace(RegExp('^[^:]*://github.com/([^/]*)/([^/]*)/blob/'),
                    'https://raw.github.com/$1/$2/');

  if (table_loading[url]) {
    setAddTableStatus("Table is loading", false);
  } else {
    table_loading[url] = true;

    setAddTableStatus("Loading...", false);
    var xhr = new XMLHttpRequest();
    var showProgress = function(evt) {
      if (evt.lengthComputable && evt.total > 0) {
        var percentComplete = evt.loaded / evt.total;
        // TODO(hungte) Complete the progress bar stuff.
        // $('#progressbar').progressbar({value: percentComplete});
      } else {
        // $('#progressbar').progressbar({value: false});
      }
    };
    xhr.addEventListener("progress", showProgress, false);
    xhr.onload = function(e) {
      try {
        var ename = url;
        var slashPos = ename.lastIndexOf('/');
        if(slashPos >= 0) {
          ename = ename.slice(slashPos + 1, ename.length);
        }
        ename = removeFileExtension(ename);
        addTable('%ename ' + ename + '\n' + parseGtab(e.currentTarget.response));
      } catch (error) {
        console.log(error);
        console.log('addTabFile: Cannot be parsed as gtab. Try cin instead.')
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("progress", showProgress, false);
        xhr.onreadystatechange = function () {
          if (this.readyState == 4) {
            if (this.status == 200) {
              addTable(this.responseText, url);
            } else {
              // Update the UI
              setAddTableStatus("Could not read url.  Server returned " +
                                this.status, true);
            }
            delete table_loading[url];
          }
        }
        xhr.open("GET", url, true);
        xhr.send(null);
      }
    }
    xhr.open("GET", url, true);
    xhr.responseType = 'arraybuffer';
    xhr.send(null);
  }
}

function addTabFile(files) {
  for (var i = 0, file; file = files[i]; i++) {
    var reader = new FileReader();

    reader.onload = function(file) {
      return function(e) {
        var ename = removeFileExtension(file.name);
        try {
          addTable('%ename ' + ename + '\n' + parseGtab(e.target.result));
        } catch (error) {
          if(error.name != 'URIError') {
            throw error;
          }
          console.log('addTabFile: Cannot be parsed as gtab. Try cin instead.');
          var reader = new FileReader();
          reader.onload = function(event) {
            addTable(event.target.result);
          }
          reader.readAsText(file);
        }
      };
    } (file);

    reader.readAsArrayBuffer(file);
  }
}

function addTableDrive(docs) {
  if(docs.length == 0) {
    return;
  }
  var doc;
  for (var i = 0; doc = docs[i]; ++i) {
    if ($('#radio' + i).is(':checked')) {
      break;
    }
  }
  addTableUrl(doc.entry.content.src + '&format=txt');
}

function addTable(content, url) {
  // Parse the entry
  var result = parseCin(content);
  var name;
  if (result[0]) {
    var data = result[1];
    name = data.metadata.ename;
    var metadata = jscin.getTableMetadatas()[name];
    if (metadata) {
      if (!confirm("Do you wish to overwrite " + data.metadata.ename + "?")) {
        setAddTableStatus("Table not added", true);
        return;
      } else {
        $('#ime_' + name).remove();
      }
    }
    // install_input_method will parse raw content again...
    result = jscin.install_input_method(name, content,
        { setting: getSettingOption(data), url: url });
  }
  // Update the UI
  if (result[0]) {
    // We must reload metadata, since it may be modified in
    // jscin.install_input_method.
    var metadata = jscin.getTableMetadatas()[name];
    addCinTableToList(name, metadata, '#enabled_im_list', true);
    setAddTableStatus("Table added successfully", false);
    instance.prefInsertEnabledInputMethod(name);
    notifyConfigChanged();
    if ($('#save_to_drive').is(':checked')) {
      SaveToDrive(metadata.ename, content);
    }
  } else {
    var msg = result[1];
    setAddTableStatus("Could not parse cin file. " + msg, true);
  }
}

function setAddTableStatus(status, error) {
  var status_field = document.getElementById("add_table_status");
  status_field.innerText = status;
  if (error) {
    status_field.className = "status_error";
  } else {
    status_field.className = "status_ok";
  }
}

function getSettingOption(data) {
  var setting_options = JSON.parse(
      LoadExtensionResource("options/builtin_options.json"));
  var setting = setting_options[
      document.getElementById("add_table_setting").selectedIndex];
  if (setting.auto_detect) {
    var matched = undefined;
    var from_table = undefined;
    setting_options.forEach(function (opt) {
      if (opt.from_table)
        from_table = opt;
      if (!opt.detect || matched)
        return;

      for (var key in opt.detect) {
        if (!data.data.chardef[key] ||
            data.data.chardef[key].indexOf(opt.detect[key]) < 0)
          return;
      }
      console.log("matched:", opt);
      matched = opt;
    });
    var result = matched || from_table || setting;
    // Make a record so we can re-parse its setting next time.
    result.by_auto_detect = true;
    return result;
  }
  return setting;
}

function addCinTableToList(name, metadata, list_id, do_insert) {
  var ename = metadata.ename;
  var cname = metadata.cname;
  var module = metadata.module;
  var url = metadata.url || '';
  // TODO(hungte) ename or name?
  var builtin = metadata.builtin && (metadata.ename in BuiltinIMs)
  var setting = metadata.setting;
  // TODO(hungte) encodeURIComponent()?
  var id = 'ime_' + name;
  var icon= '<span class="ui-icon ui-icon-arrowthick-2-n-s">';
  var kExternalModule = 'CrExtInp';
  var isRemote = (kExternalModule == module);

  var display_name = cname + ' (' + ename + ')';
  var builtin_desc = builtin ? ' [' + _("optionBuiltin") + ']' : "";

  var item = $('<li class="ui-state-default"></li>').attr('id', id).text(
               display_name + builtin_desc);
  if (do_insert)
    $(list_id).prepend(item);
  else
    $(list_id).append(item);

  var setting_display_name = (
      setting ? (setting.cname || "") + " (" + (setting.ename || "") + ")" +
                (setting.by_auto_detect ? " " + _("optionTypeAuto") : ""):
      _("optionBuiltin"));

  // TODO(hungte) Show details and dialog to edit this table.
  $('#' + id).prepend(icon).click(
      function() {
        $('.optionTableDetailName').text(display_name);
        $('.optionTableDetailSource').text(builtin ? _("optionBuiltin") : url);
        $('.optionTableDetailType').text(setting_display_name);
        $('#query_keystrokes').prop('checked', jscin.getCrossQuery() == name);
        $('#query_keystrokes').prop('disabled', isRemote);

        var buttons = [{
          text: ' OK ',
          click: function () {
            if($('#query_keystrokes').is(':checked')) {
              jscin.setCrossQuery(name);
            } else {
              if(jscin.getCrossQuery() == name) {
                jscin.setCrossQuery('');
              }
            }
            $(this).dialog("close");
          } }];

        if (!builtin) {
          // TODO(hungte) We should not allow removing active IME.
          buttons.push( { text: _('optionRemove'),
            click: function () {
              if (confirm(_("optionAreYouSure"))) {
                removeCinTable(name);
                $('#' + id).remove();
                notifyConfigChanged();
              }
              $(this).dialog("close");

            } });
        }

        if (!builtin && !isRemote) {
          if (url) {
            buttons.push({
              text: _('optionReload'),
              click: function() {
                console.log(metadata);
                if (confirm(_("optionAreYouSure"))) {
                  addTableUrl(url, metadata.setting);
                  notifyConfigChanged();
                }
                $(this).dialog("close");
              }});
          }

          if (jscin.has_input_method_rawdata(name)) {
            var raw_content = jscin.get_input_method_rawdata(name);
            buttons.push( { text: _('optionBackupToDrive'),
            click: function () {
              if (confirm(_("optionAreYouSure"))) {
                SaveToDrive(metadata.ename, raw_content);
              }
              $(this).dialog("close");
            } });
          }
        }
        $('#table_detail_dialog').dialog({
          title: _("optionTableDetail"),
          minWidth: 600,
          buttons: buttons,
          modal: true
        });
      });
}

function loadCinTables() {
  /*
  var metadatas = jscin.getTableMetadatas();
  var tables = getEnabledList();
  tables.forEach(function (name) {
    addCinTableToList(name, metadatas[name], '#enabled_im_list');
  });
  for (var name in metadatas) {
    if (tables.indexOf(name) < 0) {
      addCinTableToList(name, metadatas[name], '#available_im_list');
    }
  }
  */
}

function removeCinTable(name) {
  console.log('removeCinTable:', name);
  if(jscin.getCrossQuery() == name) {
    jscin.setCrossQuery('');
  }
  instance.prefRemoveEnabledInputMethod(name);
  jscin.deleteTable(name);
}

function notifyConfigChanged() {
  instance.notifyConfigChanged();
  instance.ActivateInputMethod(instance.pref.im_default);
}

function getEnabledList() {
  return instance.pref.im_enabled_list;
}

function updateEnabledList(enabled) {
  instance.prefSetEnabledList(enabled);
}

$(init);
