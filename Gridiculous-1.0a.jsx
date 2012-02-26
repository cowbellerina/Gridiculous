/**
 * Gridiculous 1.0a
 * 
 * Author: Jarkko Tuunanen
 * Date: Sun Feb 26 23:02 2012 +0200
 * 
 */
#target photoshop

var gridiculous = (function() {
  
  var version = "1.0a";
  
  var columnCount = 12,
      columnWidth = 60,
      gutterWidth = 20,
      gridStartPosition = 0,
      doc = null;
  
  // Utility functions.
  function gridWidth() { return (parseInt(columnCount) * (parseInt(columnWidth) + parseInt(gutterWidth))); }
  function marginWidth() { return Math.floor((gutterWidth / 2)); }
  function isPositiveNumber(num) { return (!isNaN(num) && num > 0 ? true : false); }
  function roundToNearest(num, acc) { return (acc < 0 ? Math.round(num*acc)/acc : Math.round(num/acc)*acc); }  
  
  //
  // Settings Dialog Module
  //
  var settingsDialog = function(){
  
    // Builds a dummy modal window with necessary labels and fields.
    function buildSettingsDialog() {
      // Create dialog window.
      var dialog = new Window('dialog', 'Gridiculous');
                 
      // Grid settings panel.
      dialog.settingsPanel = dialog.add('panel', undefined, 'Grid Settings');
      dialog.settingsPanel.alignChildren = 'right';
      dialog.settingsPanel.columnCount = dialog.settingsPanel.add('group'); // Column Count group.
      dialog.settingsPanel.columnWidth = dialog.settingsPanel.add('group'); // Column Width group.
      dialog.settingsPanel.gutterWidth = dialog.settingsPanel.add('group'); // Gutter Width group.
      
      // Column Count.
      dialog.settingsPanel.columnCount.label = dialog.settingsPanel.columnCount.add('statictext', undefined, 'Number of Columns');
      dialog.settingsPanel.columnCount.input = dialog.settingsPanel.columnCount.add('edittext', undefined, columnCount);
      dialog.settingsPanel.columnCount.input.preferredSize = [40, 20];
      
      // Column Width.
      dialog.settingsPanel.columnWidth.label = dialog.settingsPanel.columnWidth.add('statictext', undefined, 'Column Width (px)');
      dialog.settingsPanel.columnWidth.input = dialog.settingsPanel.columnWidth.add('edittext', undefined, columnWidth);
      dialog.settingsPanel.columnWidth.input.preferredSize = [40, 20];
      
      // Gutter Width.
      dialog.settingsPanel.gutterWidth.label = dialog.settingsPanel.gutterWidth.add('statictext', undefined, 'Gutter Width (px)');
      dialog.settingsPanel.gutterWidth.input = dialog.settingsPanel.gutterWidth.add('edittext', undefined, gutterWidth);
      dialog.settingsPanel.gutterWidth.input.preferredSize = [40, 20];
      
      // Total Width field.
      dialog.settingsPanel.totalWidthField = dialog.settingsPanel.add('statictext', undefined, gridWidth());
      dialog.settingsPanel.totalWidthField.preferredSize = [40, 20];
      
      // Additional settings panel.
      dialog.additionalSettingsPanel = dialog.add('panel', undefined, 'Additional settings (optional)');
      dialog.additionalSettingsPanel.availableDocumentsLabel = dialog.additionalSettingsPanel.add('statictext', undefined, 'Select a document in which to insert the grid into. Select none if you wish to create a new document.', {multiline: true});
      
      // Available documents Listbox.
      dialog.additionalSettingsPanel.availableDocuments = dialog.additionalSettingsPanel.add('listbox', [0, 0, 200, 80], 'documentSelection');
      // Check for open documents.
      if(app.documents.length) {
        // Populate list with open documents.
        for(var i = 0; i <  app.documents.length; i++)
          dialog.additionalSettingsPanel.availableDocuments.add('item', app.documents[i].name);
      }
  
      // Grid start position group.
      dialog.additionalSettingsPanel.startPosition = dialog.additionalSettingsPanel.add('group');
      dialog.additionalSettingsPanel.startPosition.label = dialog.additionalSettingsPanel.startPosition.add('statictext', undefined, 'Grid start position (X coord.)');
      dialog.additionalSettingsPanel.startPosition.input = dialog.additionalSettingsPanel.startPosition.add('edittext', undefined, 0);
      dialog.additionalSettingsPanel.startPosition.input.preferredSize = [40, 20];
      dialog.additionalSettingsPanel.startPosition.input.enabled = false;
      
      // OK & Cancel button toolbar.
      dialog.toolbar = dialog.add('group');
      dialog.toolbar.btnCancel = dialog.toolbar.add('button', undefined, 'Cancel', {name: 'btnCancel'});
      dialog.toolbar.btnCreate = dialog.toolbar.add('button', undefined, 'Create', {name: 'btnCreate'});        

      return dialog;
    }
    
    // Modal window event bindings.
    function initializeSettingsDialog(dialog) {
      // Button toolbar button event handling.
      var tb = dialog.toolbar;
      tb.btnCancel.onClick = function(){ dialog.close(2); }
      tb.btnCreate.onClick = function(){ dialog.close(1); }
      
      // Settings panel input event handling.
      var sp = dialog.settingsPanel,
          totalWidthField = dialog.settingsPanel.totalWidthField;

      sp.columnCount.input.onChange = function() {
        columnCount = this.text = (isPositiveNumber(this.text) ? parseInt(this.text) : 0);
        totalWidthField.text = gridWidth();
      };
      sp.columnWidth.input.onChange = function() {
        columnWidth = this.text = (isPositiveNumber(this.text) ? parseInt(this.text) : 0);
        totalWidthField.text = gridWidth();
      };
      sp.gutterWidth.input.onChange = function() {
        // Only accept positive integers that are divisible by 2. Fallback to zero.
        gutterWidth = this.text = (isPositiveNumber(this.text) ? ((this.text %2 === 0) ? parseInt(this.text) : roundToNearest(this.text, 2)) : 0);
        totalWidthField.text = gridWidth();
      };
  
      // Additional settings panel event handling.
      var ds = dialog.additionalSettingsPanel;
           
      // Grid start position button.
      ds.startPosition.input.onChange = function() {
        gridStartPosition = this.text = (isPositiveNumber(this.text) ? parseInt(this.text) : 0);
      }
      
      if(app.documents.length) {       
        ds.availableDocuments.onChange = function() {
          if(this.selection) {
            // Make selected document as working document.
            doc = app.activeDocument = app.documents[this.selection.index];
              
            // Enable Grid start position button.
            ds.startPosition.input.enabled = true;
          }
          else {
            // Reset selected document setting.                
            doc = null;
              
            // Reset Grid start position value.
            gridStartPosition = 0;

            // Disable Grid start position button.
            ds.startPosition.input.enabled = false;  
          }
        }
      }
            
      return dialog;
    }
    
    // Init
    function create() {
      // Build dialog window.
      var dlg = buildSettingsDialog();
            
      // Initialize controls.
      dlg = initializeSettingsDialog(dlg);
            
      return dlg;
    }
    
    return {
      create: create
    }
  }();


  //
  // Grid Maker module
  //
  var grid = function(){
    
    function create() {
      var cc = columnCount,
          cw = columnWidth,
          gw = gutterWidth,
          mw = marginWidth(),
          dw = gridWidth(),
          x = gridStartPosition,
          d = doc || app.documents.add(dw, 640, 72, 'Grid-' + cc + '-' + cw + '-' + gw);          
      
      // Loop through grid.
      for(var i = 0; i < cc; i++) {
        // Column left side margin guide.
        d.guides.add(Direction.VERTICAL, UnitValue(x, "px"));
        
        // Column left edge guide.
        d.guides.add(Direction.VERTICAL, UnitValue(x + mw, "px"));
        
        // Column right edge guide.
        d.guides.add(Direction.VERTICAL, UnitValue(x + mw + cw, "px"));
        
        // Calculate values for the next round.
        x += gw + cw;
      }
      
      // Last column right side margin guide.
      d.guides.add(Direction.VERTICAL, UnitValue(x, "px"));
    }
    
    function init() {
      // Store original ruler unit setting.
      var originalRulerUnits = app.preferences.rulerUnits;
      
      // Set ruler unit to pixels.
      app.preferences.rulerUnits = Units.PIXELS;
      
      // Create grid.
      create();
      
      // Restore original ruler unit setting.
      app.preferences.rulerunits = originalRulerUnits;
    }
    
    return {
      init: init
    }
  }();

  
  //
  // Main init
  //
  function init(){
    try {
      // Check current version of Photoshop.
      // The Guides object was not accessible through the Photoshop API until CS5.
      // Stop execution immediately if older version.
      if(app.version < "12")
        throw 'Unfortunately Gridiculous does not work in your current version of Photoshop (' + app.version + ') since Guides were not introduced to the Photoshop API until CS5 (version 12).';

      // Everything OK. Create and show dialog.
      var sd = settingsDialog.create();
      var ret = sd.show();
      
      // User pressed OK.
      if(ret == 1) {
        // Make grid.
        grid.init();
      }
    }
    catch(e)
    {
      alert(e);
    }

    return true;
  }
  
  return {
    version: version,
    init: init
  }
})();

// Initialize Gridiculous.
gridiculous.init();