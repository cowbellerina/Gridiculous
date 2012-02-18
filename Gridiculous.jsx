/**
 * Gridiculous 1.0
 * 
 * Author: Jarkko Tuunanen
 * Date: Sat Feb 18 14:25 2012 +0200
 *
 * 
 * INSTALLATION
 *
 * 1. Move Gridiculous.jsx to Presets/Scripts/ directory inside your Photoshop directory.
 *    -> Example: /Applications/Adobe Photoshop CS5/Presets/Scripts/Gridiculous.jsx
 * 2. (Re)open Photoshop in order to make the script visible.
 * 
 * 
 * USAGE
 * 
 * In Photoshop, select File > Scripts > Gridiculous
 * 
 * You will be prompted for grid settings. If you have open document(s)
 * you have the option to insert the grid to the frontmost document at
 * x position of your liking.
 * 
 */
#target photoshop

// Grid settings.
var columns     = parseInt(prompt("Number of Columns", 12, "Column Count")),
    columnWidth = parseInt(prompt("Column width (px)", 60, "Column Width")),
    gutterWidth = parseInt(prompt("Gutter width (px)", 20, "Gutter Width"));

try {
    // Sanity checks.
    if(!columns || typeof columns !== 'number')
        throw 'Invalid Number of Columns';

    if(!columnWidth || typeof columnWidth !== 'number')
        throw 'Invalid Column Width';

    if(!gutterWidth || typeof gutterWidth !== 'number')
        throw 'Invalid Gutter Width';
       
    // Additional grid & document settings.
    var marginWidth = gutterWidth / 2,
        documentWidth = (columns * (columnWidth + gutterWidth)),
        x = 0,
        doc;

    // Check for open document(s).
    // Ask if the user wants to add the grid to the frontmost document.
    if(app.documents.length > 0 && confirm("Add grid to the frontmost document?", false, "Grid placing"))
    {
        // Set frontmost document as working document.
        doc = app.activeDocument;
        
        // Prompt for grid starting position.
        x = parseInt(prompt("Enter grid starting position (i.e. How many pixels from left you want the grid to start?)", 0, "Grid starting position"));
        
        // Sanity check.
        if(typeof x !== 'number')
            throw 'Invalid grid starting position';
    }
    else
    {
        // Create a new document.
        // Use total grid width as document width.
        doc = app.documents.add(documentWidth, 640);
    }
    
    // Store current ruler unit preference setting.
    var originalRulerUnits = app.preferences.rulerUnits;

    // Set ruler unit to pixels.
    app.preferences.rulerUnits = Units.PIXELS;    

    // Loop through grid.
    for(var i = 0; i < columns; i++)
    {
        // Column left side margin guide.
        doc.guides.add(Direction.VERTICAL, UnitValue(x, "px"));
        
        // Column left edge guide.
        doc.guides.add(Direction.VERTICAL, UnitValue(x + marginWidth, "px"));
        
        // Column right edge guide.
        doc.guides.add(Direction.VERTICAL, UnitValue(x + marginWidth + columnWidth, "px"));
        
        // Calculate values for the next round.
        x += gutterWidth + columnWidth;
    }

    // Last column right side margin guide.
    doc.guides.add(Direction.VERTICAL, UnitValue(x, "px"));

    // Restore original ruler unit preference setting.
    app.preferences.rulerunits = originalRulerUnits;
}
catch(e)
{
    alert(e);
}