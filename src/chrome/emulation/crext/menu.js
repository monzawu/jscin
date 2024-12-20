// Copyright 2013 Google Inc. All Rights Reserved.
/**
 * @fileoverview Implementation of IME menu for page-action.
 * @author hungte@google.com (Hung-Te Lin)
 */

import { AddLogger } from "../../jscin/logger.js";
const {log, debug, info, warn, error, assert, trace, logger} = AddLogger("crext/menu");

import { IpcIme } from "./ipc.js";

export class ImeMenu extends IpcIme {
  constructor(panel='imePanel') {
    super(panel);

    this.initialize();
  }

  async initialize() {
    await super.initialize();

    // It is possible to do chrome.runtime.openOptionsPage() in the menu, but
    // for now we let the content script do it (implies broadcast to the
    // background page).
    this.forwardEventToContent('MenuItemActivated');

    // MenuPopup is a special event only implemented by crext, and will be
    // provided by croscin inside content.js.
    this.forwardEventToContent("MenuPopup");
    this.onMenuPopup.dispatch();
  }
}

// register in the global name space.
globalThis.menu = new ImeMenu();
globalThis.logger = logger;
