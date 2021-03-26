// Korren9@gmail.com
//Version 0.9
//Initial Script for basic character attributes

var ImportHS6e = ImportHS6e || (function() {
  'use strict';

  var version = '0.91',
  lastUpdate  = 1615658854160,
  lastBody    = 0,
  debug_log   = 0,

  checkInstall = function() {                                                  // Display version information on startup.
    var updated = new Date(lastUpdate);
    log('[ ImportHS6e v'+version+', ' + updated.getFullYear() + "/" + (updated.getMonth()+1) + "/" + updated.getDate() + " ]");
  },

  showImportHelp = function(who){                                              // Show the help for the tool. Needs work.
    'use strict';
	if (who){ who = "/w " + who.split(" ", 1)[0] + " "; }
    sendChat('Hero System 6e Character Importer', who + ' ' );
  },

  logDebug = function(logval) {                                                // Conditional log function, logs if debug flag is found
    if(debug_log!=0) {log(logval);}
  },

  createOrSetAttr = function(obj_nm, attr_nm, val, cid) {                      // Set an individual attribute if it exists, otherwise create it.
    var objToSet = findObjs({type: 'attribute', characterid: cid, name: obj_nm})[0]
    if(objToSet===undefined)                                                   // If attribute does not exist, create otherwise set current value.
      {
        createObj('attribute', {name: attr_nm, current: val, characterid: cid});
      } else
      {
        objToSet.set("current", val);
      }
  },

  createSkill = function(skl_nm, uuid, cid, incr, targ, char, stat, base) {
    var rspre = "repeating_skills_" + uuid + "_skill_";                        // Build the string prefix for skill names
    var rsnm  = rspre + "name";                                                // Build the skill name value
    var rsrf  = rspre + "roll_formula";                                        // Build the roll formula name value
    var rshi  = rspre + "has_increase";                                        // Build the has increase name value
    var rshr  = rspre + "has_roll";                                            // Build the has roll name value
    var rsrs  = rspre + "roll_show";                                           // Build the roll show name value
    var rsrt  = rspre + "roll_target";                                         // Build the roll target name value
    var rsch  = rspre + "char";                                                // Build the skill characteristic name value
    var rsin  = rspre + "increase";                                            // Build the skill increase name value
    var roll  = Number(targ.substring(0, targ.length-1));                      // Convert the roll to integer
    var hsrl  = (roll > 0);
    var noch  = (char == "None" ? rsrs : char)
    // Create the skill entries.
    createObj('attribute', {name: rsnm, current: skl_nm, characterid: cid});
    createObj('attribute', {name: rsrf, current: "&{template:hero6template} {{charname=@{character_name}}}  {{action=@{skill_name}}}  {{roll=[[3d6]]}}  {{target=" + roll + "}} {{base=9}} {{stat= " + roll-9 + "}} {{lvls=" + incr + "}}", characterid: cid});
    createObj('attribute', {name: rshi, current: incr, characterid: cid});
    createObj('attribute', {name: rshr, current: hsrl, characterid: cid});
    createObj('attribute', {name: rsrs, current: targ, characterid: cid});
    createObj('attribute', {name: rsrt, current: roll, characterid: cid});
    createObj('attribute', {name: rsch, current: noch, characterid: cid});
    createObj('attribute', {name: rsin, current: targ.toString(), characterid: cid});
  },

  generateUUID = function()  {                                                 // Generate a UUID (original code by The Aaron)
    let a = 0;
    let b = [];

    let c = (new Date()).getTime() + 0;
    let f = 7;
    let e = new Array(8);
    let d = c === a;
    a = c;
    for (; 0 <= f; f--) {
      e[f] = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(c % 64);
      c = Math.floor(c / 64);
    }
    c = e.join("");
    if (d) {
      for (f = 11; 0 <= f && 63 === b[f]; f--) {
        b[f] = 0;
      }
      b[f]++;
    } else {
      for (f = 0; 12 > f; f++) {
        b[f] = Math.floor(64 * Math.random());
      }
    }
    for (f = 0; 12 > f; f++){
      c += "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(b[f]);
    }

    return c;
  },

  handleInput = function(msg) {                                                // Monitor the chat for commands, process sheet if import called
    'use strict'

	if (msg.type !== "api"){ return; }                                         // Ignore non API messages
    var args = msg.content.split(" ");                                         // Parse arguments
	args.splice(0, 1);                                                         // Remove !importHS6e
	if ((msg.content === "!importHS6e") ||
	    (msg.content.indexOf("!importHS6e ") === 0) ||
	    (msg.content === "!i6e") || (msg.content.indexOf("!i6e ") === 0))
	{
      while (args.length > 0)                                                  // Loop all attributes
      {
        switch (args[0])
        {
        case "--help":                                                         // Show help in Chat
          argv.splice(0, 1);
          return showImportHelp(who);
          break;
        case "--debug":                                                        // Log debug info to API Console
          args.splice(0, 1);
          debug_log = 1;
          break;
        case "--showobj":                                                      // Show current objects on API Console
          args.splice(0, 1);
          logObjs  = 1;
          break;
        default:
          args.splice(0, 1);
          return sendChat("Unknown argument value", who, "", "ImportHS6e" );
          break;
	    }
      }

      if (debug_log===1){log("Debug is ON");}else{log("Debug is OFF");}        // Display current Debug status.

      var selected = msg.selected;
      if (selected===undefined)                                                // Must have a token selected
      {
        sendChat("API", "Please select a character.");
        return;
      } else
      {
        logDebug(selected);
      };

      var token            = getObj("graphic",selected[0]._id);                // Get selected token
      var character        = getObj("character",token.get("represents"));      // Get character linked to token.
      var herodesignerData = [];
      var characterName    = findObjs({type: 'attribute', characterid: character.id, name: 'name'})[0];

      character.get("gmnotes", function(gmnotes) {                             // Begin processing the GM Notes section

        const decodeEditorText = (t, o) =>{                                    // Clean up notes and decode (code by The Aaron)
          let w = t;
          o = Object.assign({ separator: '\r\n', asArray: false },o);
          /* Token GM Notes */
          if(/^%3Cp%3E/.test(w)){
            w = unescape(w);
          }
          if(/^<p>/.test(w)){
            let lines = w.match(/<p>.*?<\/p>/g)
              .map( l => l.replace(/^<p>(.*?)<\/p>$/,'$1'));
            return o.asArray ? lines : lines.join(o.separator);
          }
          /* neither */
           return t;
        };

        var dec_gmnotes = decodeEditorText(gmnotes);

        // Clean JSON of extra junk the HTML adds.
        dec_gmnotes = dec_gmnotes.replace(/<[^>]*>/g, '');                     //   Remove <tags>
        dec_gmnotes = dec_gmnotes.replace(/&[^;]*;/g, '');                     //   Remove &nbsp;
        dec_gmnotes = dec_gmnotes.replace(/\},\s{1,}\]/g, '\}\]');             //   Remove extra comma
        //gmnotes = gmnotes.replace(/[^ -~]/g, '');                            //   Remove all outside printable ASCII range.
        //   Remove 1/2 symbol
        dec_gmnotes = dec_gmnotes.replace('Other Attacks:', 'Other Attacks - 1/2 ');

        logDebug(dec_gmnotes);
        var hdJSON      = JSON.parse(dec_gmnotes);                             // Parse the decoded JSON from GM Notres field.

// TO DO: Create array of attributes to loop through and assign.
// TO DO: fix function to only need 3 inputs
        createOrSetAttr("str_base", "str_base", hdJSON.stats.str.value, character.id);
        createOrSetAttr("dex_base", "dex_base", hdJSON.stats.dex.value, character.id);
        createOrSetAttr("con_base", "con_base", hdJSON.stats.con.value, character.id);
        createOrSetAttr("int_base", "int_base", hdJSON.stats.int.value, character.id);
        createOrSetAttr("ego_base", "ego_base", hdJSON.stats.ego.value, character.id);
        createOrSetAttr("pre_base", "pre_base", hdJSON.stats.pre.value, character.id);
        createOrSetAttr("ocv_base", "ocv_base", hdJSON.stats.ocv.value, character.id);
        createOrSetAttr("dcv_base", "dcv_base", hdJSON.stats.dcv.value, character.id);
        createOrSetAttr("omcv_base", "omcv_base", hdJSON.stats.omcv.value, character.id);
        createOrSetAttr("dmcv_base", "dmcv_base", hdJSON.stats.dmcv.value, character.id);
        createOrSetAttr("spd_base", "spd_base", hdJSON.stats.spd.value, character.id);
        createOrSetAttr("pd_base", "pd_base", hdJSON.stats.pd.value, character.id);
        createOrSetAttr("ed_base", "ed_base", hdJSON.stats.ed.value, character.id);
        createOrSetAttr("rec_base", "rec_base", hdJSON.stats.rec.value, character.id);
        createOrSetAttr("end_base", "end_base", hdJSON.stats.end.value, character.id);
        createOrSetAttr("body_base", "body_base", hdJSON.stats.body.value, character.id);
        createOrSetAttr("stun_base", "stun_base", hdJSON.stats.stun.value, character.id);
        createOrSetAttr("END", "END", hdJSON.stats.end.value, character.id);
        createOrSetAttr("BODY", "END", hdJSON.stats.body.value, character.id);
        createOrSetAttr("STUN", "STUN", hdJSON.stats.stun.value, character.id);
        logDebug("Stats Assigned");
        createOrSetAttr("run_combat", "run_combat", hdJSON.movement.run.combat, character.id);
        createOrSetAttr("run_noncombat", "run_noncombat", hdJSON.movement.run.noncombat, character.id);
        createOrSetAttr("swim_combat", "swim_combat", hdJSON.movement.swim.combat, character.id);
        createOrSetAttr("swim_noncombat", "swim_noncombat", hdJSON.movement.swim.noncombat, character.id);
        createOrSetAttr("hleap_combat", "hleap_combat", hdJSON.movement.leap.combat, character.id);
        createOrSetAttr("hleap_noncombat", "hleap_noncombat", hdJSON.movement.leap.noncombat, character.id);
        createOrSetAttr("vleap_combat", "vleap_combat", hdJSON.movement.leap.primary.combat.value/2 + "m", character.id);
        createOrSetAttr("vleap_noncombat", "vleap_noncombat", hdJSON.movement.leap.combat, character.id);
        logDebug("Movement Assigned");

// TODO Change the JSON to export the characters features.
//        createOrSetAttr("height", "height", hdJSON., character.id);
//        createOrSetAttr("weight", "weight", hdJSON., character.id);
//        createOrSetAttr("hair", "hair", hdJSON., character.id);
//        createOrSetAttr("eyes", "eyes", hdJSON., character.id);
//        createOrSetAttr("gender", "gender", hdJSON., character.id);
//        createOrSetAttr("age", "age", hdJSON., character.id);
//{"name":"height","current":"6'","max":"","_id":"-MWM-HpU35AeWvUoCARJ","_type":"attribute","_characterid":"-MWKbE-g9iyRtI8TN9_J"},
//{"name":"hair","current":"Black","max":"","_id":"-MWM-I_sBij-5HZTx9qb","_type":"attribute","_characterid":"-MWKbE-g9iyRtI8TN9_J"},
//{"name":"age","current":"22","max":"","_id":"-MWM-KSitu1BMklWl_Q1","_type":"attribute","_characterid":"-MWKbE-g9iyRtI8TN9_J"},
//{"name":"weight","current":"200","max":"","_id":"-MWM-LBbkWVEVoxsB3Hb","_type":"attribute","_characterid":"-MWKbE-g9iyRtI8TN9_J"},
//{"name":"eyes","current":"Brown","max":"","_id":"-MWM-MBB1Ix8iKBR8wKL","_type":"attribute","_characterid":"-MWKbE-g9iyRtI8TN9_J"},
//{"name":"gender","current":"Male","max":"","_id":"-MWM-O_ZCwYJ05LUkp-U","_type":"attribute","_characterid":"-MWKbE-g9iyRtI8TN9_J"},
//        logDebug("Features Assigned");

        var hdsklist = hdJSON.skills;                                          // Create array of all HD Skills.
        logDebug("HD Skill Count: " + hdsklist.length);
        // Create array of all attributes
        var cssklist = findObjs({type: 'attribute', characterid: character.id});
        for (var c=0; c < cssklist.length; c++)                                // Loop character sheet skill list and find repeating skill, skill names.
        {
          var csskil = cssklist[c].get("name");
          if (csskil.indexOf("repeating_skills") === 0 && csskil.indexOf("_skill_name") > 0)
          {
            logDebug("Found Skill: " + c + " " + csskil);
          } else
          {
            cssklist.splice(c,1);
            c--;
          }
        }

        logDebug("CS Skill Count: " + cssklist.length);

        var UUID   = '';
        var addflg = 1;
        for (var h=0; h < hdsklist.length; h++)                                // Loop through HD sheet skills.
        {
          log(hdsklist[h].name.trim());
          for (var c=0; c < cssklist.length; c++)                              // Loop through CS skills for each HD skill.
          {
            if (cssklist[c].get("name") == hdsklist[h].name.trim())            // Check to see if Skill exists in both HD and CS.
            {
              // TO DO: Write script to remove existing skills and pass to create function? If so, move out of this loop.
              // Notify player that skill exists and needs to be deleted.
	    	  sendChat("API", "Skill " + log(cssklist[c].name) + " exists, delete from character and rerun import to update.");
	    	  addflg = 0;
	    	  break;                                                           // Break out of character sheet skills loop if found.
	    	}
          }

          if (addflg == 1)                                                     // If the skill does not exist, add it.
          {
            UUID = generateUUID().replace(/_/g, "Z");                          // Generate a UUID for skill grouping
            // Create all entries needed for a skill
            createSkill(hdsklist[h].name.trim(), UUID, character.id, 0, hdsklist[h].roll, "None", 0, 0);
            // createSkill = function(skl_nm, uuid, cid, incr, targ, char, stat, base) {
          }
          addflg = 1;

        }
        logDebug("Skills Assigned");

// TODO
//        logDebug("Perks Assigned");
//        logDebug("Talents Assigned");
//        logDebug("Powers Assigned");
//        logDebug("Equipment Assigned");
//        logDebug("Complications Assigned");
//        logDebug("Rolls Assigned");
//        logDebug("Combat Levels Assigned");
//        logDebug("Lightning Reflexes Assigned");


// TO DO
// Repeating skills, powers, perks, etc.

      if (logObjs != 0){
        var allobjs = getAllObjs();
        log(allobjs);
      }

      //createObj('attribute', {name : "STR", current: hdJSON.str.value, characterid: character.id});

      });
    };
  },

  registerEventHandlers = function() {
    on('chat:message', handleInput);
  };

  return {
    CheckInstall: checkInstall,
    RegisterEventHandlers: registerEventHandlers
  };

}());

on('ready',function() {
	'use strict';

	ImportHS6e.CheckInstall();
	ImportHS6e.RegisterEventHandlers();
});

