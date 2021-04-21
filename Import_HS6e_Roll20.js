/*
=========================================================
Name		:	ImportHS6e
GitHub		:	https://github.com/eepjr24/ImportHS6e
Roll20 Contact	:	eepjr24
Version		:	.921
Last Update	:	4/21/2021
=========================================================
Updates:
Added non default movement routine
Fixed all movement additions to core tab movement block
Fixed talent and perk names (JSON mod)
various code cleanup
Added Rivalry and Susceptibility
Added power AP and END entries
Added normal skill level calculations
*/
var API_Meta = API_Meta || {};
API_Meta.ImportHS6e = { offset: Number.MAX_SAFE_INTEGER, lineCount: -1 };
{
    try { throw new Error(''); } catch (e) { API_Meta.ImportHS6e.offset = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - (13)); }
}

const ImportHS6e = (() => {

  let version = '0.921',
  lastUpdate  = 1619028220921,
  debug_log   = 0,                                                             // Turn on all debug settings
  logObjs     = 0,                                                             // Turn on object output to api log
  comp_log    = 0,                                                             // Turn on complications debug
  powr_log    = 0,                                                             // Turn on powers debug
  perk_log    = 0,                                                             // Turn on perks debug
  taln_log    = 0,                                                             // Turn on talents debug
  skil_log    = 0,                                                             // Turn on skills debug
  sklv_log    = 0,                                                             // Turn on skill levels debug
  stat_log    = 0,                                                             // Turn on characteristics debug
  resv_log    = 0,                                                             // Turn on reserves debug
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
      case "skilllevels":
        //if(sklv_rem) {} TODO add removal based on flag
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
        //if(resv_rem) {} TODO add removal based on flag
        alst[c].remove();                                                      // Remove them
        if (remv_log){logDebug(attr);}                                         // Debug removal
        break;
      case "moves":
        //if(move_rem) {} TODO add removal based on flag
        alst[c].remove();                                                      // Remove them
        if (remv_log){logDebug(attr);}                                         // Debug removal
        break;
      default:
        sendChat("i6e_API", "Unhandled repeating element removal: (" + attrtype[1] + ") " + attr);
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

  const createCharacteristics = (stlst, chid) => {
    for (const [key, value] of Object.entries(stlst)) {                        // Set the characteristics
      let chnm = key + '_base';
      createOrSetAttr(chnm, value.value, chid);
      if(/^(end|body|stun)/.test(chnm))                                        // Handle display values for body, end and stun.
      {
        chnm = key.toUpperCase();
        createOrSetAttr(chnm, {value}.value, chid);
      }
      if(!!skil_log){logDebug("Set " + chnm + " to " + value.value);}          // Log skill assignment
    }
  };

  const createFeatures = (hdj, chid) => {
    createOrSetAttr("height",      hdj.height,      chid);
	createOrSetAttr("weight",      hdj.weight,      chid);
	createOrSetAttr("hair",        hdj.hair,        chid);
	createOrSetAttr("eyes",        hdj.eye,         chid);
	createOrSetAttr("appearance",  hdj.appearance,  chid);
	createOrSetAttr("background",  hdj.background,  chid);
	createOrSetAttr("personality", hdj.personality, chid);
	createOrSetAttr("quotes",      hdj.quote,       chid);
	createOrSetAttr("tactics",     hdj.tactics,     chid);
	createOrSetAttr("campaign",    hdj.campUse,     chid);
  }

  const createSkills = (sklst, cid) => {                                       // Create all skills
// TODO make adds conditional based on input flags per attribute type (stats, powers etc)
// TODO look at familiarities and how they import / if they need changes.
    for (var h=0; h < sklst.length; h++)                                       // Loop through HD sheet skills.
    {
      if(sklst[h].type==="Skill Levels"){continue;}                            // Skill Levels are handled in their own routine
      let uuid = generateUUID().replace(/_/g, "Z"),                            // Generate a UUID for skill grouping
      rspre    = "repeating_skills_" + uuid + "_skill_",                       // Build the string prefix for skill names
      rsnm     = rspre + "name",                                               // Build the skill name value
      rshi     = rspre + "has_increase",                                       // Build the has increase name value
      rshr     = rspre + "has_roll",                                           // Build the has roll name value
      rsrs     = rspre + "roll_show",                                          // Build the roll show name value
      rsrt     = rspre + "roll_target",                                        // Build the roll target name value
      rsch     = rspre + "char",                                               // Build the skill characteristic name value
      rsin     = rspre + "increase",                                           // Build the skill increase name value
      rsrf     = rspre + "roll_formula",                                       // Build the roll formula name value
	  hs       = sklst[h],
      targ     = hs.roll,
      roll     = Number(targ.substring(0, Math.min(targ.length-1,2))),         // Convert the roll to integer
      sknm     = "",
      incr     = hs.level,
      noch     = (hs.char == "None" ? "" : hs.char);

      switch (hs.type)
      {
      case "Defense Maneuver":
        sknm = hs.name + hs.input;
        break;
      default:
        sknm = hs.name.trim();
        break;
      }

      // Create the skill entries.
      createOrSetAttr(rsnm, sknm,   cid);
      createOrSetAttr(rshr, !!roll, cid);
      createOrSetAttr(rshi, !!incr, cid);
      createOrSetAttr(rsin, incr,   cid);
      if(!!roll)
      {
        createOrSetAttr(rsrs, targ, cid);
        createOrSetAttr(rsrf, "&{template:hero6template} {{charname=@{character_name}}}  {{action=@{skill_name}}}  {{roll=[[3d6]]}}  {{target=" + roll + "}} {{base=9}} {{stat= " + roll-9 + "}} {{lvls=" + incr + "}}", cid);
        createOrSetAttr(rsrt, roll, cid);
      }
      if(!(/^(GENERAL)/.test(noch) || noch === undefined))
      {
        createOrSetAttr(rsch, noch, cid);
      }
    }
  };

// TODO Check with Roll20 users to see if I need to duplicate records where level >1 in HD
  const createSkillLevels = (sllst, cid) => {
    for (var h=0; h < sllst.length; h++)                                       // Loop through HD sheet skills.
    {
      if(sllst[h].type!=="Skill Levels"){continue;}                            // Skill Levels are handled in their own routine
      let uuid = generateUUID().replace(/_/g, "Z"),                            // Generate a UUID for skill grouping
      rspre    = "repeating_skilllevels_" + uuid,                              // Build the string prefix for skill names
      rsnm     = rspre + "_skill_level",                                       // Build the skill name value
      rshi     = rspre + "_radio_skill_level";                                 // Build the level name value

      createOrSetAttr(rsnm, sllst[h].name.trim(), cid);
      createOrSetAttr(rshi, 0, cid);
    }
  };

  const createMovement = (mlst, cid) => {
    if(!mlst){return;}                                                       // If movement list is not undefined
    let uuid = "";                                                           // UUID for complication grouping
    for (const [key, value] of Object.entries(mlst)) {                       // Set the movement values
      cmnm = key + '_combat';
      ncnm = key + '_noncombat';
      if(/^(leap)/.test(cmnm))                                               // Handle split for leap
      {
        createOrSetAttr('h' + cmnm, value.combat, cid);
        createOrSetAttr('h' + ncnm, value.noncombat, cid);
        createOrSetAttr('v' + cmnm, value.primary.combat.value/2 + "m", cid);
        createOrSetAttr('v' + ncnm, value.combat, cid);
        logDebug(cmnm);
      } else if (/^(run|swim)/.test(cmnm))                                   // Handle run, swim (always appear)
	  {
        createOrSetAttr(cmnm, value.combat, cid);
        createOrSetAttr(ncnm, value.noncombat, cid);
        logDebug(cmnm);
      } else                                                                 // Handle all other cases
      {
        switch (key)                                                         // Create the movement description based on the type
        {
        case "fly":
          cmnm = "Flight";
          if (move_log){logDebug(cmnm);}                                     // Debug movement
          break;
        case "swing":
          cmnm = "Swinging";
          if (move_log){logDebug(cmnm);}                                     // Debug movement
          break;
        case "teleport":
          cmnm = "Teleportation";
          if (move_log){logDebug(cmnm);}                                     // Debug movement
          break;
        case "tunnel":
          cmnm = "Tunneling";
          if (move_log){logDebug(cmnm);}                                     // Debug movement
          break;
        default:
          sendChat("i6e_API", "Unhandled repeating element movement: (" + key + ") " + value.combat);
          break;
	    }
        uuid = generateUUID().replace(/_/g, "Z");                            // Generate a UUID for complication grouping
        mvnm = "repeating_moves_" + uuid + "_spec_move_name";                // Build the movement repeating name
        mvcb = "repeating_moves_" + uuid + "_spec_move_combat";              // Build the combat repeating name
        mvnc = "repeating_moves_" + uuid + "_spec_move_noncombat";           // Build the noncombat repeating name
        createOrSetAttr(mvnm, cmnm, cid);
        createOrSetAttr(mvcb, value.combat, cid);
        createOrSetAttr(mvnc, value.noncombat, cid);
        logDebug(cmnm);
      }
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
      logDebug(hcs.name);
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
      createOrSetAttr(ccb,  0, cid);
      createOrSetAttr(rocv, 0, cid);
      createOrSetAttr(romv, 0, cid);
      createOrSetAttr(rdcv, 0, cid);
      createOrSetAttr(rdmv, 0, cid);
      createOrSetAttr(rdc,  0, cid);
      log(hcs.name + " Added");
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
      createOrSetAttr(pcb,  0, cid);
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
        ad4    = "",                                                           // Complication adder 4
        ad5    = "",                                                           // Complication adder 5
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
      if (hc.adders[4])
      {                                                                        // Populate 5 adders
        ad5 = hc.adders[4].input;
        ad4 = hc.adders[3].input;
        ad3 = hc.adders[2].input;
        ad2 = hc.adders[1].input;
        ad1 = hc.adders[0].input;
      } else if (hc.adders[3])
      {                                                                        // Populate first 4 adders
        ad4 = hc.adders[3].input;
        ad3 = hc.adders[2].input;
        ad2 = hc.adders[1].input;
        ad1 = hc.adders[0].input;
      } else if (hc.adders[2])
      {                                                                        // Populate first 3 adders
        ad3 = hc.adders[2].input;
        ad2 = hc.adders[1].input;
        ad1 = hc.adders[0].input;
      } else if (hc.adders[1])
      {                                                                        // Populate first 2 adders
        ad2 = hc.adders[1].input;
        ad1 = hc.adders[0].input;
      } else if (hc.adders[0])
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
      case "GENERICDISADVANTAGE":                                              // Custom - manually fill in
        compnm = "Populate Custom Complication Here";
        break;
      case "HUNTED":                                                           // Hunted
        compnm = "Hunted: " + hc.input + " (" + ad1 + ", " + ad2 + ", " + ad3 + ")";
        break;
      case "PHYSICALLIMITATION":                                               // Physical Complication
        compnm = "Phys Comp: " + hc.input + ", " + ad1 + ", " + ad2 + ", " + ad3;
          break;
      case "PSYCHOLOGICALLIMITATION":                                          // Psychological Complication
        compnm = "Psy Comp: " + hc.input + ", " + ad1 + ", " + ad2 + ", " + ad3;
        break;
      case "RIVALRY":                                                          // Negative Reputation
        compnm = "Rival: " + ad2 + " (" + ad1 + ", " + ad3 + ", " + ad4 + ", " + ad5;
        break;
      case "REPUTATION":                                                       // Negative Reputation
        compnm = "Neg Rep: " + hc.input + ", " + ad1 + ", " + ad2 + ", " + ad3;
        break;
      case "SOCIALLIMITATION":                                                 // Social Complication
        compnm = "Soc Comp: " + hc.input + ", " + ad1 + ", " + ad2 + ", " + ad3;
        break;
      case "SUSCEPTIBILITY":                                                   // Susceptiblity
        compnm = "Susc: " + hc.input + "(" + ad1 + " " + ad2 + ")";
        break;
// TODO Check the various combinations and combine cases if possible.
      case "UNLUCK":                                                           // Unluck
        compnm = name;
        break;
      case "VULNERABILITY":                                                    // Vulnerability
        compnm = "Vuln: " + hc.input + " - " + md1 + " (" + ad1 + ")";
        break;
      default:
        sendChat("i6e_API", "Unhandled complication type: " + hc.XMLID);
        break;
      }
// TODO make abbreviations optional
// TODO abbreviations for Rivalry
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
        rppe   = rppre + "_power_expand",
        rpbp   = rppre + "_pow_base_points",
        rpap   = rppre + "_pow_active_points",
        rpan   = rppre + "_pow_active_points_no_reduced_end",
        rprp   = rppre + "_pow_real_points",
        rprl   = rppre + "_power_real_cost",
        rpbd   = rppre + "_attack_base_dice",
        rpbs   = rppre + "_attack_base_dice_show",
        rpsd   = rppre + "_attack_str_dice",
        rpss   = rppre + "_attack_str_dice_show",
        rpse   = rppre + "_attack_str_for_end",
        rpmd   = rppre + "_attack_maneuver_dice_show",
        rpcd   = rppre + "_attack_csl_dice_show",
        rped   = rppre + "_attack_extra_dice",
        rpds   = rppre + "_attack_extra_dice_show"
        rpad   = rppre + "_attack_dice",
        rpas   = rppre + "_attack_dice_show",
        rppn   = rppre + "_pow_advantages_no_reduced_end",
        rppa   = rppre + "_pow_advantages",
        rppl   = rppre + "_pow_limitations",
        rpem   = rppre + "_end_multiplier",
        rpps   = rppre + "_power_end_source",
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
      sendChat("i6e_API", "Powers with charges not implemented yet: " + pwnm);
      return;
    } else if (pwtype === "unknown")
    {
      sendChat("i6e_API", "Power is an unknown type: " + pwnm);
//      return;
    }
    if (parseInt(pwjson.end) != parseInt(pwjson.end)) {end = 0;} else {end = pwjson.end}
    pwdesc = pwjson.desc;

    // Create the power entries.
    createOrSetAttr(rpnm, pwnm, cid);                                          // Assign the power name
    createOrSetAttr(rppow, pwdesc, cid);                                       // Assign the power descrption
    createOrSetAttr(rppf, "&{template:hero6template} {{charname=@{character_name}}} {{power=" + pwnm + "}}", cid);
    createOrSetAttr(rppf2, "&{template:hero6template} {{charname=@{character_name}}} {{power=" + pwnm + "}} {{description=" + pwdesc + "}}", cid);                                      // Assign the complication name
    createOrSetAttr(rpec, pwjson.end, cid);                                    //
    createOrSetAttr(rpea, end, cid);                                           //
    createOrSetAttr(rpes, zero, cid);                                          //
    createOrSetAttr(rprc, pwjson.end, cid);                                    //

    createOrSetAttr(rppe, zero, cid);                                    //
    createOrSetAttr(rpbp, pwjson.base, cid);                                    //
    createOrSetAttr(rpap, pwjson.active, cid);                                    //
    createOrSetAttr(rpan, pwjson.active, cid);                                    //
// Create function to calc real points by looping adders
    createOrSetAttr(rprp, pwjson.base, cid);                                    //
    createOrSetAttr(rprl, pwjson.base, cid);                                    //
    if (pwtype !== "attack")
    {
      createOrSetAttr(rpbd, "3d6+1", cid);                                    //
      createOrSetAttr(rpbs, "3d6+1", cid);                                    //
      createOrSetAttr(rpad, "3d6+1", cid);                                    //
      createOrSetAttr(rpas, "3d6+1", cid);                                    //
      createOrSetAttr(rpsd, " ", cid);                                    //
      createOrSetAttr(rpss, " ", cid);                                    //
      createOrSetAttr(rpmd, " ", cid);                                    //
      createOrSetAttr(rpcd, " ", cid);                                    //
      createOrSetAttr(rped, " ", cid);                                    //
      createOrSetAttr(rpds, " ", cid);                                    //
      createOrSetAttr(rpse, zero, cid);                                    //
      createOrSetAttr(rppn, zero, cid);                                    //
      createOrSetAttr(rppa, zero, cid);                                    //
      createOrSetAttr(rppl, zero, cid);                                    //
// Create Function to check for reduced End
      createOrSetAttr(rpem, "1x END", cid);                                    //
// Create Function to check for alternate END sources
      createOrSetAttr(rpps, "END", cid);                                    //
    }
// TODO implement roll for effect powers
// TODO implement roll dor attack and damage powers
  };

  const createPerks = (plst, cid) => {
    let pknm     = '';
    // Create all perks
    for (var p=0; p < plst.length; p++)                                        // Loop through HD sheet powers
    {
      UUID = generateUUID().replace(/_/g, "Z");                                // Generate a UUID for perk grouping
      pknm = "repeating_perks_" + UUID + "_perk_name";
      createOrSetAttr(pknm, plst[p].desc.trim(), cid);
    }
  };

  const createTalents = (tlst, cid) => {
    let objToSet = [],
        tlnm     = '';
    // Create all talents
    for (var t=0; t < tlst.length; t++)                                        // Loop through HD sheet powers
    {
      UUID = generateUUID().replace(/_/g, "Z");                                // Generate a UUID for perk grouping
      tlnm = "repeating_perks_" + UUID + "_perk_name";
      createOrSetAttr(tlnm, tlst[t].desc.trim(), cid);
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

///////////////////////////////////////////////////////////////////////////////// Begin processing API message
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
      sendChat("i6e_API", "Please select a token.");
      return;
    }

    let token     = getObj("graphic",selected[0]._id);                         // Get selected token
    let character = getObj("character",token.get("represents"));               // Get character linked to token

    if (character===undefined)                                                 // Token must have valid character assigned.
    {
      sendChat("i6e_API", "Token has no character assigned, please assign and retry.");
      return;
    }

///////////////////////////////////////////////////////////////////////////////// Begin parsing character sheet
    let chid             = character.id;                                       // Get character identifier
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
	    sendChat("i6e_API", "JSON too short to contain valid character data. Update character (not token) GM Notes.");
        return;
      }

      let hdJSON   = JSON.parse(dec_gmnotes),                                  // Parse the decoded JSON from GM Notes field.
          hdchlist = hdJSON.stats,                                             // Create array of all HD Characteristics.
          hdmvlist = hdJSON.movement,                                          // Create array of all HD Characteristics.
          hdsklist = hdJSON.skills,                                            // Create array of all HD Skills.
          hdsllist = hdJSON.skills     ,                                       // Create array of all HD Skill Levels.
          hdcmlist = hdJSON.disads,                                            // Create array of all HD Complications.
          hdpwlist = hdJSON.powers,                                            // Create array of all HD Powers.
          hdpklist = hdJSON.perks,                                             // Create array of all HD Perks.
          hdtllist = hdJSON.talents;                                           // Create array of all HD Talents.

//      characterName.set("name", hdJSON.name);                                  // Set the name

      // Create array of all attributes
      var attrlist = findObjs({type: 'attribute', characterid: chid});

      removeExistingAttributes(attrlist);
      logDebug("*** Existing skills and complications removed");
      createCharacteristics(hdJSON.stats, chid);
      logDebug("*** Stats Assigned");
      createFeatures(hdJSON, chid);
      logDebug("*** Features Assigned");
      createSkills(hdsklist, chid);
      logDebug("*** Skills Assigned");
      createMovement(hdmvlist, chid);
      logDebug("*** Movement Assigned");
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
