/*
=========================================================
Name		:	ImportHS6e
GitHub		:	https://github.com/eepjr24/ImportHS6e
Roll20 Contact	:	eepjr24
Version		:	.920
Last Update	:	4/18/2021
=========================================================
Updates:
Improved skills assignment
Added CSL
Added PSL
*/
var API_Meta = API_Meta || {};
API_Meta.ImportHS6e = { offset: Number.MAX_SAFE_INTEGER, lineCount: -1 };
{
    try { throw new Error(''); } catch (e) { API_Meta.ImportHS6e.offset = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - (13)); }
}

const ImportHS6e = (() => {

  let version = '0.920',
  lastUpdate  = 1618788436920,
  debug_log   = 0,                                                             // Turn on all debug settings
  logObjs     = 0,                                                             // Turn on object output to api log
  comp_log    = 0,                                                             // Turn on complications debug
  powr_log    = 0,                                                             // Turn on powers debug
  perk_log    = 0,                                                             // Turn on perks debug
  taln_log    = 0,                                                             // Turn on talents debug
  skil_log    = 0,                                                             // Turn on skills debug
  stat_log    = 0,                                                             // Turn on characteristics debug
  remv_log    = 0,                                                             // Turn on removal debug
  move_log    = 0;                                                             // Turn on movement debug

  const checkInstall= () => {                                                  // Display version information on startup.
    var updated = new Date(lastUpdate);
    log('\u0EC2\u2118 [ImportHS6e v'+version+', ' + updated.getFullYear() + "/" + (updated.getMonth()+1) + "/" + updated.getDate() + "]");
  };

  const showImportHelp = (who) => {                                            // Show the help for the tool. Needs work.
	if (who){ who = "/w " + who.split(" ", 1)[0] + " "; }
    sendChat('Hero System 6e Character Importer', who + ' ' );
  };

  const logDebug = (logval) => {                                               // Conditional log function, logs if debug flag is found
    if(debug_log!=0) {log(logval);}
  };

// TODO  make removal conditional based on input flags per type of attribute
  const removeExistingAttributes = (alst) => {                                 // Remove existing attributes from roll20 character sheet
    for (var c=0; c < alst.length; c++)                                        // Loop character sheet atribute list
    {
      let attr = alst[c].get("name"),                                          // Get attribute name
      attrtype = attr.split("_");
      if (!(/^repeating_/.test(attr))){continue;}                              // Only remove repeating elements
      switch (attrtype[1])                                                     // Create the complication description based on the type
      {
      case "complications":
        //if(comp_rem) {} TODO add removal based on flag
        alst[c].remove();                                                      // Remove them
        if (remv_log){logDebug(attr);}                                         // Debug removal
        break;
      case "combatskills":
        //if(cskl_rem) {} TODO add removal based on flag
        alst[c].remove();                                                      // Remove them
        if (remv_log){logDebug(attr);}                                         // Debug removal
        break;
      case "penaltyskills":
        //if(pskl_rem) {} TODO add removal based on flag
        alst[c].remove();                                                      // Remove them
        if (remv_log){logDebug(attr);}                                         // Debug removal
        break;
      case "perks":
        //if(perk_rem) {} TODO add removal based on flag
        alst[c].remove();                                                      // Remove them
        if (remv_log){logDebug(attr);}                                         // Debug removal
        break;
      case "powers":
        //if(powr_rem) {} TODO add removal based on flag
        alst[c].remove();                                                      // Remove them
        if (remv_log){logDebug(attr);}                                         // Debug removal
        break;
      case "skills":
        //if(skil_rem) {} TODO add removal based on flag
        alst[c].remove();                                                      // Remove them
        if (remv_log){logDebug(attr);}                                         // Debug removal
        break;
      case "talents":
        //if(taln_rem) {} TODO add removal based on flag
        alst[c].remove();                                                      // Remove them
        if (remv_log){logDebug(attr);}                                         // Debug removal
        break;
      case "reserves":
        //if(taln_rem) {} TODO add removal based on flag
        alst[c].remove();                                                      // Remove them
        if (remv_log){logDebug(attr);}                                         // Debug removal
        break;
      default:
        sendChat("API", "Unhandled repeating element removal: (" + attrtype[1] + ") " + attr);
        break;
      }
    }
  };

  const createOrSetAttr = (atnm, val, cid) => {                                // Set an individual attribute if it exists, otherwise create it.
    var objToSet = findObjs({type: 'attribute', characterid: cid, name: atnm})[0]
    if(objToSet===undefined)                                                   // If attribute does not exist, create otherwise set current value.
      {
        createObj('attribute', {name: atnm, current: val, characterid: cid});
      } else
      {
        objToSet.set('current', val);
      }
  };

  const createSkill = (skl_nm, uuid, cid, incr, targ, chnm, stat, base) => {
    let rspre = "repeating_skills_" + uuid + "_skill_",                        // Build the string prefix for skill names
        rsnm  = rspre + "name",                                                // Build the skill name value
        rshi  = rspre + "has_increase",                                        // Build the has increase name value
        rshr  = rspre + "has_roll",                                            // Build the has roll name value
        rsrs  = rspre + "roll_show",                                           // Build the roll show name value
        rsrt  = rspre + "roll_target",                                         // Build the roll target name value
        rsch  = rspre + "char",                                                // Build the skill characteristic name value
        rsin  = rspre + "increase",                                            // Build the skill increase name value
        rsrf  = rspre + "roll_formula",                                        // Build the roll formula name value
        roll  = Number(targ.substring(0, Math.min(targ.length-1,2))),          // Convert the roll to integer
        noch  = (chnm == "None" ? "" : chnm);
    // Create the skill entries.
    createOrSetAttr(rsnm, skl_nm, cid);
    createOrSetAttr(rshr, !!roll, cid);
    createOrSetAttr(rshi, !!incr, cid);
    createOrSetAttr(rsin, incr, cid);
    if(!!roll)
    {
	  createOrSetAttr(rsrs, targ, cid);
	  createOrSetAttr(rsrf, "&{template:hero6template} {{charname=@{character_name}}}  {{action=@{skill_name}}}  {{roll=[[3d6]]}}  {{target=" + roll + "}} {{base=9}} {{stat= " + roll-9 + "}} {{lvls=" + incr + "}}", cid);
	  createOrSetAttr(rsrt, roll, cid);
	}
    if(!(/^(GENERAL)/.test(chnm) || chnm === undefined))
    {
      createOrSetAttr(rsch, noch, cid);
    }
  };

// TODO implement skill levels, need HD examples
  const createSkillLevels = (sllist, cid) => {
    if(!!sllist)                                                               // If Skill Levels is not undefined
    {
//{"name":"repeating_skilllevels_-MYaEXJkPrmJn2CWBxJL_radio_skill_level","current":"1","max":"","_id":"-MYaEY52AYDipJTOKyDE","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
//{"name":"repeating_skilllevels_-MYaEXJkPrmJn2CWBxJL_skill_level","current":"+1 All STR based skills","max":"","_id":"-MYaEnUr9G3xEEtJANKh","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},

    } else
    {
	  return;
    }
  };

  const createCombatLevels = (cllst, cid) => {
    let ccb  = "",
        rocv = "",
        romv = "",
        rdcv = "",
        rdmv = "",
        rdc  = "",
        clnm = "";

    // Create all combat skill levels
    for (var cl=0; cl < cllst.length; cl++)                                  // Loop through combat skill levels
    {
      let hcs = cllst[cl];                                                   // Get combat skill level JSON attribute
      if(!(/^(Combat Skill Levels)/.test(hcs.name))){continue;}              // Only process Combat Skill Levels

      uuid   = generateUUID().replace(/_/g, "Z");                            // Generate a UUID for complication grouping
      clnm   = "repeating_combatskills_" + uuid + "_csl_name";               // Build the combat level repeating name
      ccb    = "repeating_combatskills_" + uuid + "_csl_checkbox";
      rocv   = "repeating_combatskills_" + uuid + "_radio_csl_ocv";
      romv   = "repeating_combatskills_" + uuid + "_radio_csl_omcv";
      rdcv   = "repeating_combatskills_" + uuid + "_radio_csl_dcv";
      rdmv   = "repeating_combatskills_" + uuid + "_radio_csl_dmcv";
      rdc    = "repeating_combatskills_" + uuid + "_radio_csl_dc";
      createOrSetAttr(clnm, hcs.text, cid);
      createOrSetAttr(ccb, 0, cid);
      createOrSetAttr(rocv, 0, cid);
      createOrSetAttr(romv, 0, cid);
      createOrSetAttr(rdcv, 0, cid);
      createOrSetAttr(rdmv, 0, cid);
      createOrSetAttr(rdc, 0, cid);
    }
  };

  const createPenaltyLevels = (plst, cid) => {
    let pcb  = "",
        rocv = "",
        rmod = "",
        rdcv = "",
        psnm = "";

    for (var p=0; p < plst.length; p++)                                        // Loop through Skills
    {
      let hps = plst[p];                                                       // Get skill JSON attribute
      if(!(/^(Penalty Skill Levels)/.test(hps.name))){continue;}               // Only process Penalty Skill Levels
      logDebug(hps.text);
      uuid   = generateUUID().replace(/_/g, "Z");                              // Generate a UUID for penalty skill grouping
      psnm   = "repeating_penaltyskills_" + uuid + "_psl_name";                // Build the penalty skill repeating name
      pcb    = "repeating_penaltyskills_" + uuid + "_psl_checkbox";
      rocv   = "repeating_penaltyskills_" + uuid + "_radio_psl_";
      rdcv   = "repeating_penaltyskills_" + uuid + "_radio_psl_";
      rmod   = "repeating_penaltyskills_" + uuid + "_radio_psl_";
      createOrSetAttr(psnm, hps.text, cid);
      createOrSetAttr(pcb, 0, cid);
// TODO Use OptionID to set appropriate flags for ocv, dcv, rmod Example:SINGLEDCV
      createOrSetAttr(rocv, 0, cid);
      createOrSetAttr(rmod, 0, cid);
      createOrSetAttr(rdcv, (/^(SINGLEDCV)/.test(hps.optionID)), cid);
    }
  };

  const createComplications = (clst, cid) => {
    let rcap   = "",                                                           // Complication cost name
        rcnm   = "",                                                           // Complication name
        compnm = "",                                                           // Complication description
        ad1    = "",                                                           // Complication adder 1
        ad2    = "",                                                           // Complication adder 2
        ad3    = "",                                                           // Complication adder 3
        md1    = "",                                                           // Complication modifier 1
        md2    = "",                                                           // Complication modifier 2
        md3    = "",                                                           // Complication modifier 3
        uuid   = "";

    // Create all complications
    for (var c=0; c < clst.length; c++)                                        // Loop through complications
    {
      var hc = clst[c];                                                        // Get complication JSON attribute
      uuid   = generateUUID().replace(/_/g, "Z");                              // Generate a UUID for complication grouping
      rcnm   = "repeating_complications_" + uuid + "_complication";            // Build the complication repeating name
      rcap   = rcnm + "_cost";
      if (hc.adders[2]!==undefined)
      {                                                                        // Populate all 3 adders
        ad3 = hc.adders[2].input;
        ad2 = hc.adders[1].input;
        ad1 = hc.adders[0].input;
      } else if (hc.adders[1]!==undefined)
      {                                                                        // Populate first 2 adders
        ad2 = hc.adders[1].input;
        ad1 = hc.adders[0].input;
      } else if (hc.adders[0]!==undefined)
      {                                                                        // Populate 1st adder
        ad1 = hc.adders[0].input;
      }

      if (hc.modifiers[2]!==undefined)
      {                                                                        // Populate 3 modifiers
        md3 = hc.modifiers[2].input;
        md2 = hc.modifiers[1].input;
        md1 = hc.modifiers[0].input;
      } else if (hc.modifiers[1]!==undefined)
      {                                                                        // Populate 2 modifiers
        md2 = hc.modifiers[1].input;
        md1 = hc.modifiers[0].input;
      } else if (hc.modifiers[0]!==undefined)
      {                                                                        // Populate 1 modifier
        md1 = hc.modifiers[0].input;
      }

      switch (hc.XMLID)                                                        // Create the complication description based on the type
      {
      case "ACCIDENTALCHANGE":                                                 // Accidental Change
        compnm = "Acc Chg: " + hc.input + ", " + ad1 + ", " + ad2;
        break;
      case "DEPENDENCE":                                                       // Dependence
        compnm = "Dep: " + hc.input + ", " + ad1 + " / " + ad3 + ", " + ad2;
        break;
      case "DEPENDENTNPC":                                                     // Dependent NPC
        compnm = "DNPC: " + hc.input + ", " + ad1 + ", " + ad2 + ", " + ad3;
        break;
      case "DISTINCTIVEFEATURES":                                              // Distinctive Features
        compnm = "DF: " + hc.input + ", " + ad1 + ", " + ad2 + ", " + ad3;
        break;
      case "ENRAGED":                                                          // Enraged
        compnm = "Enraged: " + hc.input + ", " + ad2 + ", " + ad3 + ", " + ad1 ;
        break;
      case "HUNTED":                                                           // Hunted
        compnm = "Hunted: " + hc.input + ", " + ad1 + ", " + ad2 + ", " + ad3;
        break;
      case "PHYSICALLIMITATION":                                               // Physical Complication
        compnm = "Phys Comp: " + hc.input + ", " + ad1 + ", " + ad2 + ", " + ad3;
          break;
      case "PSYCHOLOGICALLIMITATION":                                          // Psychological Complication
        compnm = "Psy Comp: " + hc.input + ", " + ad1 + ", " + ad2 + ", " + ad3;
        break;
      case "SOCIALLIMITATION":                                                 // Social Complication
        compnm = "Soc Comp: " + hc.input + ", " + ad1 + ", " + ad2 + ", " + ad3;
        break;
// TODO Add susceptibility (need HD examples)
// TODO Check the various combinations and combine if possible.
      case "REPUTATION":                                                       // Negative Reputation
        compnm = "Neg Rep: " + hc.input + ", " + ad1 + ", " + ad2 + ", " + ad3;
        break;
      case "UNLUCK":                                                           // Unluck
        compnm = name;
        break;
      case "VULNERABILITY":                                                    // Vulnerability to substance
        compnm = "Vuln: " + hc.input + " - " + md1 + " (" + ad1 + ")";
        break;
      default:
        return sendChat("API", "Unhandled complication type: " + hc.XMLID);
        break;
      }
// TODO make abbreviations optional
      compnm = compnm.replace(/[,\s]+$/g, '')                                  // Trim trailing comma and space as needed
                     .replace('Uncommon', 'Unc')                               // Abbreviate Uncommon
                     .replace('Common', 'Com')                                 // Abbreviate Common
                     .replace('Very Common', 'VC')                             // Abbreviate Very Common
                     .replace('As Powerful', 'AsPow')                          // Abbreviate As Powerful
                     .replace('More Powerful', 'MoPow')                        // Abbreviate More Powerful
                     .replace('Less Powerful', 'LessPow')                      // Abbreviate Less Powerful
                     .replace('Strong', 'Str')                                 // Abbreviate Strong
                     .replace('Total', 'Tot')                                  // Abbreviate Total
                     .replace('Frequently', 'Freq')                            // Abbreviate Frequent
                     .replace('Infrequently', 'Infreq')                        // Abbreviate Infrequent
                     .replace('Moderate', 'Mod')                               // Abbreviate Moderate
                     .replace('Major', 'Maj')                                  // Abbreviate Major
                     .replace('Slightly', 'Slight')                            // Abbreviate Slightly
      createOrSetAttr(rcap, hc.active, cid);                                   // Assign the complication cost
      createOrSetAttr(rcnm, compnm, cid);                                      // Assign the complication name
    }
  };

  const createSimplePower = (pwjson, uuid, cid) => {
    let pwtype = '',
        pwnm   = '',
        pwdesc = '',
        end    = 0,
        hclas  = pwjson.class,
        rppre  = "repeating_powers_" + uuid,                                   // Build the string prefix for power labels
        rppow  = rppre + "_power",
        rpnm   = rppre + "_power_name",                                        // Build the power name label
        rppf   = rppre + "_use_power_formula",                                 // Build the power formula label
        rppf2  = rppre + "_use_power2_formula",                                // Build the 2nd power formula label
        rpec   = rppre + "_power_end_cost",                                    // Build the power end cost label
        rpea   = rppre + "_power_end_ap_cost",                                 // Build the power ap end cost label
        rpes   = rppre + "_power_end_str_cost",                                // Build the power str end cost label
        rprc   = rppre + "_power_remaining_charges",                           // Build the power remaining charges / end label
        zero   = 0;

    if (hclas.attack)              {pwtype = "attack";}                        // Determine power type
    else if (hclas.mental)         {pwtype = "mental";}
    else if (hclas.adjustment)     {pwtype = "adjustment";}
    else if (hclas.bodyaffecting)  {pwtype = "bodyaffecting";}
    else if (hclas.sensory)        {pwtype = "sensory";}
    else if (hclas.move)           {pwtype = "move";}
    else if (hclas.defense)        {pwtype = "defense";}
    else if (hclas.compound)       {pwtype = "compound";}
    else if (hclas.senseaffecting) {pwtype = "senseaffecting";}
    else if (hclas.special)        {pwtype = "special";}
    else                           {pwtype = "unknown";}

    if (pwjson.name.trim() === "No Name Supplied")
    {
      pwnm = pwjson.type.trim();
    } else
	{
      pwnm = pwjson.name.trim();
	}

    if (isNaN(pwjson.end))
    {
// TODO implement powers with charges
      sendChat("API", "Powers with charges not implemented yet: " + pwnm);
      return;
    } else if (pwtype === "attack")
    {
    // TODO implement attack powers
//      sendChat("API", "Attack powers not implemented yet: " + pwnm);
//      return;
    } else if (pwtype === "unknown")
    {
      sendChat("API", "Power is an unknown type: " + pwnm);
//      return;
    }
    if (parseInt(pwjson.end) != parseInt(pwjson.end)) {end = 0;} else {end = pwjson.end}
    pwdesc = pwjson.desc;
    logDebug(pwdesc);
    // Create the power entries.
    createObj('attribute', {name: rpnm, current: pwnm, characterid: cid});
    createObj('attribute', {name: rppow, current: pwdesc, characterid: cid});
    createObj('attribute', {name: rppf, current: "&{template:hero6template} {{charname=@{character_name}}} {{power=" + pwnm + "}} ", characterid: cid});
    createObj('attribute', {name: rppf2, current: "&{template:hero6template} {{charname=@{character_name}}} {{power=" + pwnm + "}} {{description=" + pwdesc + "}}", characterid: cid});
    createObj('attribute', {name: rpec, current: pwjson.end, characterid: cid});
    createObj('attribute', {name: rpea, current: end, characterid: cid});
    createObj('attribute', {name: rpes, current: zero, characterid: cid});
    createObj('attribute', {name: rprc, current: pwjson.end, characterid: cid});
// TODO implement full power stack addition
    return;
  };

  const createPerks = (plst, cid) => {
    let pknm     = '';
    // Create all perks
    for (var p=0; p < plst.length; p++)                                        // Loop through HD sheet powers
    {
      UUID = generateUUID().replace(/_/g, "Z");                                // Generate a UUID for perk grouping
      pknm = "repeating_perks_" + UUID + "_perk_name";
      createOrSetAttr(pknm, plst[p].name.trim(), cid);
    }
  };

  const createTalents = (tlst, cid) => {
    let objToSet = [],
        tlnm     = '';
    // Create all talents
    for (var t=0; t < tlst.length; t++)                                        // Loop through HD sheet powers
    {
      if(/^(Lightning R).*$/.test(tlst[t].name)){continue;}                    // Exclude Lightning Reflexes (handled separately)
      UUID = generateUUID().replace(/_/g, "Z");                                // Generate a UUID for perk grouping
      tlnm = "repeating_perks_" + UUID + "_perk_name";
      createOrSetAttr(tlnm, tlst[t].name.trim(), cid);
    }
  };

  const generateUUID = () => {                                                 // Generate a UUID (original code by The Aaron)
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
  };

  const decodeEditorText = (t, o) =>{                                          // Clean up notes and decode (code by The Aaron)
    let w = t;
    o = Object.assign({ separator: '\r\n', asArray: false },o);
    // Token GM Notes
    if(/^%3Cp%3E/.test(w)){
      w = unescape(w);
    }
     if(/^<p>/.test(w)){
     let lines = w.match(/<p>.*?<\/p>/g)
        .map( l => l.replace(/^<p>(.*?)<\/p>$/,'$1'));
      return o.asArray ? lines : lines.join(o.separator);
    }
    // neither
    return t;
  };

  const handleInput = (msg) => {                                               // Monitor the chat for commands, process sheet if import called
    if (!(msg.type === "api" &&
        /^!(ImportHS6e|i6e)(\s|$)/.test(msg.content))) {                       // Ignore messages not intended for this script
	  return;
    }

    let args = msg.content.split(" ");                                         // Parse arguments
    args.splice(0, 1);                                                         // Remove !importHS6e
    while (args.length > 0) {                                                  // Loop all attributes
      switch (args[0])
      {
      case "--help":                                                           // Show help in Chat
        argv.splice(0, 1);
        //return showImportHelp(who);
        break;
      case "--debug":                                                          // Log debug info to API Console
        args.splice(0, 1);
        debug_log = 1;
        break;
      case "--statdebug":                                                      // Log debug info to API Console
        args.splice(0, 1);
        stat_log = 1;
        break;
      case "--movedebug":                                                      // Log debug info to API Console
        args.splice(0, 1);
        move_log = 1;
        break;
      case "--powrdebug":                                                      // Log debug info to API Console
        args.splice(0, 1);
        powr_log = 1;
        break;
      case "--compdebug":                                                      // Log debug info to API Console
        args.splice(0, 1);
        comp_log = 1;
        break;
      case "--perkdebug":                                                      // Log debug info to API Console
        args.splice(0, 1);
        perk_log = 1;
        break;
      case "--talndebug":                                                      // Log debug info to API Console
        args.splice(0, 1);
        taln_log = 1;
        break;
      case "--skildebug":                                                      // Log debug info to API Console
        args.splice(0, 1);
        skil_log = 1;
        break;
      case "--showobj":                                                        // Show current objects on API Console
        args.splice(0, 1);
        logObjs  = 1;
        break;
      default:
        args.splice(0, 1);
        //return sendChat("Unknown argument value", who, "", "ImportHS6e" );
        return;
        break;
      }
    }

    if (debug_log===1){log("Debug is ON");}else{log("Debug is OFF");}          // Display current Debug status.

    var selected = msg.selected;
    if (selected===undefined)                                                  // Must have a token selected
    {
      sendChat("API", "Please select a token.");
      return;
    }

    let token     = getObj("graphic",selected[0]._id);                         // Get selected token
    let character = getObj("character",token.get("represents"));               // Get character linked to token

    if (character===undefined)                                                 // Token must have valid character assigned.
    {
      sendChat("API", "Token has no character assigned, please assign and retry.");
      return;
    }

    let chid             = character.id;                                              // Get character identifier
    let herodesignerData = [];
    let characterName    = findObjs({type: 'attribute', characterid: chid, name: 'name'})[0];

    character.get("gmnotes", function(gmnotes) {                               // Begin processing the GM Notes section

      let dec_gmnotes = decodeEditorText(gmnotes);

      // Clean JSON of extra junk the HTML adds.
      dec_gmnotes = dec_gmnotes.replace(/<[^>]*>/g, '')                        //   Remove <tags>
                               .replace(/&[^;]*;/g, '')                        //   Remove &nbsp;
                               .replace(/\},\s{1,}\]/g, '\}\]');               //   Remove extra comma

      if(gmnotes.length <= 5000)
      {
	    sendChat("API", "JSON too short to contain valid character data. Update character (not token) GM Notes.");
        return;
      }

      let hdJSON   = JSON.parse(dec_gmnotes),                                  // Parse the decoded JSON from GM Notes field.
          hdchlist = hdJSON.stats,                                             // Create array of all HD Characteristics.
          hdmvlist = hdJSON.movement,                                          // Create array of all HD Characteristics.
          hdsklist = hdJSON.skills,                                            // Create array of all HD Skills.
          hdsllist = hdJSON.skilllevels,                                       // Create array of all HD Skill Levels.
          hdcmlist = hdJSON.disads,                                            // Create array of all HD Complications.
          hdpwlist = hdJSON.powers,                                            // Create array of all HD Powers.
          hdpklist = hdJSON.perks,                                             // Create array of all HD Perks.
          hdtllist = hdJSON.talents;                                           // Create array of all HD Talents.

//      characterName.set("name", hdJSON.name);                                  // Set the name

// TODO  make adds conditional based on input flags per attribute type (stats, powers etc)

      for (const [key, value] of Object.entries(hdJSON.stats)) {               // Set the characteristics
		chnm = key + '_base';
        createOrSetAttr(chnm, value.value, chid);
        if(/^(end|body|stun)/.test(chnm))                                      // Handle display values for body, end and stun.
        {
          chnm = key.toUpperCase();
          createOrSetAttr(chnm, {value}.value, chid);
        }
        if(skil_log===1){logDebug("Set " + chnm + " to " + value.value);}
      }
      logDebug("*** Stats Assigned");

// TODO check all different movement skills for entries here and in powers
      for (const [key, value] of Object.entries(hdJSON.movement)) {            // Set the movement values
		cmnm = key + '_combat';
		ncnm = key + '_noncombat';
		logDebug(cmnm);
        if(/^(leap)/.test(cmnm))                                               // Handle display values for body, end and stun.
        {
          createOrSetAttr('h' + cmnm, value.combat, chid);
          createOrSetAttr('h' + ncnm, value.noncombat, chid);
          createOrSetAttr('v' + cmnm, value.primary.combat.value/2 + "m", chid);
          createOrSetAttr('v' + ncnm, value.combat, chid);
        } else
	    {
          createOrSetAttr(cmnm, value.combat, chid);
          createOrSetAttr(ncnm, value.noncombat, chid);
        }
      }
      logDebug("*** Movement Assigned");
/*
      createOrSetAttr("run_combat", hdJSON.movement.run.combat, chid);
      createOrSetAttr("run_noncombat", hdJSON.movement.run.noncombat, chid);
      createOrSetAttr("swim_combat", hdJSON.movement.swim.combat, chid);
      createOrSetAttr("swim_noncombat", hdJSON.movement.swim.noncombat, chid);
      createOrSetAttr("hleap_combat", hdJSON.movement.leap.combat, chid);
      createOrSetAttr("hleap_noncombat", hdJSON.movement.leap.noncombat, chid);
      createOrSetAttr("vleap_combat", hdJSON.movement.leap.primary.combat.value/2 + "m", chid);
      createOrSetAttr("vleap_noncombat", hdJSON.movement.leap.combat, chid);
*/
      createOrSetAttr("height", hdJSON.height, chid);
      createOrSetAttr("weight", hdJSON.weight, chid);
      createOrSetAttr("hair", hdJSON.hair, chid);
      createOrSetAttr("eyes", hdJSON.eye, chid);
      createOrSetAttr("appearance", hdJSON.appearance, chid);
      createOrSetAttr("background", hdJSON.background, chid);
      createOrSetAttr("personality", hdJSON.personality, chid);
      createOrSetAttr("quotes", hdJSON.quote, chid);
      createOrSetAttr("tactics", hdJSON.tactics, chid);
      createOrSetAttr("campaign", hdJSON.campUse, chid);

      logDebug("*** Features Assigned");

      // Create array of all attributes
      var attrlist = findObjs({type: 'attribute', characterid: chid});
      removeExistingAttributes(attrlist);
      logDebug("Existing skills and complications removed");

      var UUID = '';
      // Create all skills
      for (var h=0; h < hdsklist.length; h++)                                  // Loop through HD sheet skills.
      {
        UUID = generateUUID().replace(/_/g, "Z");                              // Generate a UUID for skill grouping
        // TO DO: Tweak characteristics to read correctly. Need good HD example.
        // Create all entries needed for a skill
        createSkill(hdsklist[h].name.trim(), UUID, chid, hdsklist[h].level, hdsklist[h].roll, hdsklist[h].char, 0, 0);
      }
      logDebug("*** Skills Assigned");

      createSkillLevels(hdsllist, chid);
      logDebug("*** Skill Levels Assigned");
      createCombatLevels(hdsklist, chid);
      logDebug("*** Combat Levels Assigned");
      createPenaltyLevels(hdsklist, chid);
      logDebug("*** Penalty Levels Assigned");
      createComplications(hdcmlist, chid);
      logDebug("*** Complications Assigned");
      createPerks(hdpklist, chid);
      logDebug("*** Perks Assigned");
      createTalents(hdtllist, chid);
      logDebug("*** Talents Assigned");

      // Create all powers
      for (var h=0; h < hdpwlist.length; h++)                                  // Loop through HD sheet powers
      {
        UUID   = generateUUID().replace(/_/g, "Z");                            // Generate a UUID for power grouping
        createSimplePower(hdpwlist[h], UUID, chid);
      }

      logDebug("*** Powers Assigned");
// TODO
//        logDebug("Equipment Assigned");
//        logDebug("Rolls Assigned");
//        logDebug("Lightning Reflexes Assigned");

      if (logObjs != 0){                                                       // Output character for debug purposes
        let allobjs = getAllObjs();
        log(allobjs);
      }

    });
  };

  const registerEventHandlers = () => {
    on('chat:message', handleInput);
    return;
  };

  on('ready',function() {
    checkInstall();
    registerEventHandlers();
  });

  return;
})();
{ try { throw new Error(''); } catch (e) { API_Meta.ImportHS6e.lineCount = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - API_Meta.ImportHS6e.offset); } }
