/*
=========================================================
Name		:	ImportHS6e
GitHub		:	https://github.com/eepjr24/ImportHS6e
Roll20 Contact	:	eepjr24
Version		:	.914
Last Update	:	4/12/2021
=========================================================
*/
var API_Meta = API_Meta || {};
API_Meta.ImportHS6e = { offset: Number.MAX_SAFE_INTEGER, lineCount: -1 };
{
    try { throw new Error(''); } catch (e) { API_Meta.ImportHS6e.offset = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - (13)); }
}

const ImportHS6e = (() => {

  let version = '0.914',
  lastUpdate  = 1618232645914,
  lastBody    = 0,
  debug_log   = 0,
  logObjs     = 0;

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
      var attr = alst[c].get("name");                                          // Get attribute name
      if (/^(repeating_)(skills|complications|powers|perks)/.test(attr))       // Find repeating skills, complications and powers
      {
        if (alst[c]!==undefined) {alst[c].remove()};                           // Remove them
      }
    }
    logDebug("Existing skills and complications removed");
  };

  const createOrSetAttr = (atnm, val, cid) => {                                // Set an individual attribute if it exists, otherwise create it.
    var objToSet = findObjs({type: 'attribute', characterid: cid, name: atnm})[0]
    if(objToSet===undefined)                                                   // If attribute does not exist, create otherwise set current value.
      {
        createObj('attribute', {name: atnm, current: val, characterid: cid});
      } else
      {
        objToSet.set("current", val);
      }
  };

  const createSkill = (skl_nm, uuid, cid, incr, targ, char, stat, base) => {
    let rspre = "repeating_skills_" + uuid + "_skill_",                        // Build the string prefix for skill names
        rsnm  = rspre + "name",                                                // Build the skill name value
        rsrf  = rspre + "roll_formula",                                        // Build the roll formula name value
        rshi  = rspre + "has_increase",                                        // Build the has increase name value
        rshr  = rspre + "has_roll",                                            // Build the has roll name value
        rsrs  = rspre + "roll_show",                                           // Build the roll show name value
        rsrt  = rspre + "roll_target",                                         // Build the roll target name value
        rsch  = rspre + "char",                                                // Build the skill characteristic name value
        rsin  = rspre + "increase",                                            // Build the skill increase name value
        roll  = Number(targ.substring(0, targ.length-1)),                      // Convert the roll to integer
        hsrl  = (roll > 0),
        noch  = (char == "None" ? rsrs : char);
    // Create the skill entries.
    createObj('attribute', {name: rsnm, current: skl_nm, characterid: cid});
    createObj('attribute', {name: rsrf, current: "&{template:hero6template} {{charname=@{character_name}}}  {{action=@{skill_name}}}  {{roll=[[3d6]]}}  {{target=" + roll + "}} {{base=9}} {{stat= " + roll-9 + "}} {{lvls=" + incr + "}}", characterid: cid});
    createObj('attribute', {name: rshi, current: incr, characterid: cid});
    createObj('attribute', {name: rshr, current: hsrl, characterid: cid});
    createObj('attribute', {name: rsrs, current: targ, characterid: cid});
    createObj('attribute', {name: rsrt, current: roll, characterid: cid});
    createObj('attribute', {name: rsch, current: noch, characterid: cid});
    createObj('attribute', {name: rsin, current: targ.toString(), characterid: cid});
  };

  const createComplication = (type, ap, name, desc, ad1, ad2, ad3, uuid, cid) => {
    let rcnm = "repeating_complications_" + uuid + "_complication",            // Build the complication name
    rcap     = rcnm + "_cost",                                                 // Build the complication cost
    compnm   = "";

    createObj('attribute', {name: rcap, current: ap, characterid: cid});       // Assign the complication cost
    switch (type)                                                              // Create the complication description based on the type
    {
    case "ACCIDENTALCHANGE":                                                   // Accidental Change
      compnm = "Acc Chg: " + desc + ", " + ad1 + ", " + ad2;
      break;
    case "DEPENDENCE":                                                         // Dependence
      compnm = "Dep: " + desc + ", " + ad1 + " / " + ad3 + ", " + ad2;
      break;
    case "DEPENDENTNPC":                                                       // Dependent NPC
      compnm = "DNPC: " + desc + ", " + ad1 + ", " + ad2 + ", " + ad3;
      break;
    case "DISTINCTIVEFEATURES":                                                // Distinctive Features
      compnm = "DF: " + desc + ", " + ad1 + ", " + ad2 + ", " + ad3;
      break;
    case "ENRAGED":                                                            // Enraged
      compnm = "Enraged: " + desc + ", " + ad2 + ", " + ad3 + ", " + ad1 ;
      break;
    case "HUNTED":                                                             // Hunted
      compnm = "Hunted: " + desc + ", " + ad1 + ", " + ad2 + ", " + ad3;
      break;
    case "PHYSICALLIMITATION":                                                 // Physical Complication
      compnm = "Phys Comp: " + desc + ", " + ad1 + ", " + ad2 + ", " + ad3;
      break;
    case "PSYCHOLOGICALLIMITATION":                                            // Psychological Complication
      compnm = "Psy Comp: " + desc + ", " + ad1 + ", " + ad2 + ", " + ad3;
      break;
    case "SOCIALLIMITATION":                                                   // Social Complication
      compnm = "Soc Comp: " + desc + ", " + ad1 + ", " + ad2 + ", " + ad3;
      break;
    case "REPUTATION":                                                         // Negative Reputation
      compnm = "Neg Rep: " + desc + ", " + ad1 + ", " + ad2 + ", " + ad3;
      break;
    case "UNLUCK":                                                             // Unluck
      // TODO: Build complications
      compnm = name;
      break;
    default:
      return sendChat("API", "Unhandled complication type: " + type);
      break;
    }
    compnm = compnm.replace(/[,\s]+$/g, '')                                    // Trim trailing comma and space as needed
                   .replace('Uncommon', 'Unc')                                 // Abbreviate Uncommon
                   .replace('Common', 'Com')                                   // Abbreviate Common
                   .replace('Very Common', 'VC')                               // Abbreviate Very Common
                   .replace('As Powerful', 'AsPow')                            // Abbreviate As Powerful
                   .replace('More Powerful', 'MoPow')                          // Abbreviate More Powerful
                   .replace('Less Powerful', 'LessPow')                        // Abbreviate Less Powerful
                   .replace('Strong', 'Str')                                   // Abbreviate Strong
                   .replace('Total', 'Tot')                                    // Abbreviate Total
                   .replace('Frequently', 'Freq')                              // Abbreviate Frequent
                   .replace('Infrequently', 'Infreq')                          // Abbreviate Infrequent
                   .replace('Moderate', 'Mod')                                 // Abbreviate Moderate
                   .replace('Major', 'Maj')                                    // Abbreviate Major
                   .replace('Slightly', 'Slight')                              // Abbreviate Slightly
    createObj('attribute', {name: rcnm, current: compnm, characterid: cid});   // Assign the complication cost
    return;
  };

  const createSimplePower = (pwjson, uuid, cid) => {
/*
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_power_name","current":"Blast Gauntlet","max":"","_id":"-MXhlz3DIliBttlOoThs","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_use_power_formula","current":"&{template:hero6template} {{charname=@{character_name}}} {{power=Blast Gauntlet}}  {{base=7}} {{ocv=7}} {{attack=[[3d6]]}} {{damage=[[10d6]]}} {{type=STUN}} {{count=BODY}}","max":"","_id":"-MXhlz5Icl8SXtShrL13","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_use_power2_formula","current":"&{template:hero6template} {{charname=@{character_name}}} {{power=Blast Gauntlet}}  {{base=7}} {{ocv=7}} {{attack=[[3d6]]}} {{damage=[[10d6]]}} {{type=STUN}} {{count=BODY}}{{description=10d6 ED Magic Blast, 1/2 END (+.5), OIF (-.5)}}","max":"","_id":"-MXhlz5KtwSAH4eJkPxQ","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_power_end_cost","current":"3","max":"","_id":"-MXhlz5QhRLTWb_I0_UG","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_power_end_ap_cost","current":3,"max":"","_id":"-MXhlz5SKQ0q32cxzV3P","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_power_end_str_cost","current":0,"max":"","_id":"-MXhlz5UeIVQhWxGnv94","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_power_remaining_charges","current":"3","max":"","_id":"-MXhlz5X_DESWxcv9aiM","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_power","current":"10d6 ED Magic Blast, 1/2 END (+.5), OIF (-.5)","max":"","_id":"-MXhm1X8vDF9W4rzHDrI","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_power_expand","current":"0","max":"","_id":"-MXhm1tltZCYQJu3EdjW","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_pow_base_points","current":"50","max":"","_id":"-MXhm5HpnoXe_C8fzGLB","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_pow_active_points","current":75,"max":"","_id":"-MXhm5Jife_oadjzYzHb","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_pow_active_points_no_reduced_end","current":62,"max":"","_id":"-MXhm5JkxHOR_kKtxgAK","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_pow_advantages_no_reduced_end","current":0.25,"max":"","_id":"-MXhm5JliWaf2RJTtv-C","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_pow_real_points","current":50,"max":"","_id":"-MXhm5JnFxFoTE0xbhHQ","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_power_real_cost","current":50,"max":"","_id":"-MXhm5JpsfSHcN6lILBE","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_base_dice","current":"10d6","max":"","_id":"-MXhm5Ju7V3W4mfYjISF","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_base_dice_show","current":"10d6","max":"","_id":"-MXhm5JvAE5lRfL49GB8","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_str_dice","current":" ","max":"","_id":"-MXhm5JxsuEy1jYJMSBm","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_str_dice_show","current":" ","max":"","_id":"-MXhm5K00lJj1CxEBxoM","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_str_for_end","current":0,"max":"","_id":"-MXhm5K2qqqE39STc4mZ","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_maneuver_dice_show","current":" ","max":"","_id":"-MXhm5K5jFM-VRuJch-k","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_csl_dice_show","current":" ","max":"","_id":"-MXhm5K9iCTPIRrz9dV9","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_extra_dice","current":" ","max":"","_id":"-MXhm5KBp2MKjrdczzCb","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_extra_dice_show","current":" ","max":"","_id":"-MXhm5KFnk7gGtQj9sJo","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_dice","current":"10d6","max":"","_id":"-MXhm5KGduG_wUQ7dDpt","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_dice_show","current":"10d6","max":"","_id":"-MXhm5KISmKHCqxjPTKU","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_pow_advantages","current":".5","max":"","_id":"-MXhm9UORZJ3QoSTShFA","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_pow_limitations","current":".5","max":"","_id":"-MXhm9nnL4dPH9OAYkXF","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_end_multiplier","current":"½ END","max":"","_id":"-MXhmNZmnJKZbyDQG3T_","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_power_end_fixed","current":"0","max":"","_id":"-MXhmOBjZVKvJx6bIdUB","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_power_end_source","current":"END","max":"","_id":"-MXhmPuJAoX0kYWm6v4X","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_pow_attack","current":"1","max":"","_id":"-MXhmWeBo7084Yl4GsL8","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_wizard","current":"","max":"","_id":"-MXhm_MrmZw-W7Rzzgsb","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_die_cost","current":"5","max":"","_id":"-MXhm_OjnBv7-ycZrwdI","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_type","current":"STUN & BODY","max":"","_id":"-MXhm_Ol-eTzAIXgKlol","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_killing","current":0,"max":"","_id":"-MXhm_OmvL3qJWLOcz5d","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_cv","current":"OCV","max":"","_id":"-MXhm_OocMH7lVCLl3mw","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_uses_str","current":0,"max":"","_id":"-MXhm_OqTTBKqP7mJ72V","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhluZfmICeVLgVIyiV_attack_hit_location","current":"0","max":"","_id":"-MXhm_Or94AYuUhKDt9w","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
*/
/* Simple Flight power
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_power_name","current":"Airlimnoso's Cloak","max":"","_id":"-MXhpFL2y5dDHpu_Cfld","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_use_power_formula","current":"&{template:hero6template} {{charname=@{character_name}}} {{power=Airlimnoso's Cloak}} ","max":"","_id":"-MXhpFQj6_G4xmFXJ32g","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_use_power2_formula","current":"&{template:hero6template} {{charname=@{character_name}}} {{power=Airlimnoso's Cloak}} {{description=10\" Flight}}","max":"","_id":"-MXhpFQnQKPoSYhfN7SX","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_power_end_cost","current":"2","max":"","_id":"-MXhpFR3EzBReLMr_b_1","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_power_end_ap_cost","current":2,"max":"","_id":"-MXhpFR5z7O6TSv0CoQ-","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_power_end_str_cost","current":0,"max":"","_id":"-MXhpFR7x8pX7wWwxdlJ","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_power_remaining_charges","current":"2","max":"","_id":"-MXhpFR93TtsZkIyDHDQ","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
---
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_power_expand","current":"0","max":"","_id":"-MXhq6Ldz56roBgWTl_h","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_power","current":"10\" Flight","max":"","_id":"-MXhqHG9lDRij2iNr-Oo","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_pow_base_points","current":"20","max":"","_id":"-MXhqHi9aNFQQtK8fmRI","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_pow_active_points","current":20,"max":"","_id":"-MXhqHk7Kp3EIy6rKmXF","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_pow_active_points_no_reduced_end","current":20,"max":"","_id":"-MXhqHk8dP43x9pW-mFM","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_pow_advantages_no_reduced_end","current":0,"max":"","_id":"-MXhqHkAwgxThZCQF7Ru","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_pow_real_points","current":13,"max":"","_id":"-MXhqHkBvtsKYKOjkaZq","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_power_real_cost","current":13,"max":"","_id":"-MXhqHkDy7wH0o0KfM3t","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_attack_base_dice","current":"6d6+1d3","max":"","_id":"-MXhqHkL7rrCKC0pnsQZ","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_attack_base_dice_show","current":"6½d6","max":"","_id":"-MXhqHkNH-C6VOKnBq6v","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_attack_str_dice","current":" ","max":"","_id":"-MXhqHkQacbwxgShnyP7","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_attack_str_dice_show","current":" ","max":"","_id":"-MXhqHkSUPhx302_2xz6","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_attack_str_for_end","current":0,"max":"","_id":"-MXhqHkVEgPIJQavAocs","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_attack_maneuver_dice_show","current":" ","max":"","_id":"-MXhqHkYqW_PaYOvQBjG","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_attack_csl_dice_show","current":" ","max":"","_id":"-MXhqHk_fHGIwfovi3lk","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_attack_extra_dice","current":" ","max":"","_id":"-MXhqHkbGAJv8ouBz-f6","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_attack_extra_dice_show","current":" ","max":"","_id":"-MXhqHkdlNhkSdiHjzBG","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_attack_dice","current":"6d6+1d3","max":"","_id":"-MXhqHkeDmVBUIEXHHa6","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_attack_dice_show","current":"6½d6","max":"","_id":"-MXhqHkgF8U3js1NQTRZ","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_pow_advantages","current":"0","max":"","_id":"-MXhqINaU1ec-W2OStH_","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_pow_limitations","current":".5","max":"","_id":"-MXhqIqE7P3640x_ZYRj","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_end_multiplier","current":"1x END","max":"","_id":"-MXhqKxKb7nHg7g2VCWR","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
{"name":"repeating_powers_-MXhp0oWrMUibUdW4fNL_power_end_source","current":"END","max":"","_id":"-MXhqMW17NSYXBIMcvVr","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},

*/
/*
	{"name":"Wings","uid":1616806253481,"type":"Flight","damage":"10m","range":"","input":"","level":"10","end":"2","active":"20","base":"20","XMLID":"FLIGHT","strMod":false,"class":{"attack":false,"mental":false,"adjustment":false,"bodyaffecting":false,"sensory":false,"move":true,"defense":false,"compound":false,"senseaffecting":false,"special":false},"modifiers":[],"adders":[{"name":"No Name Supplied","uid":1616806271452,"type":"x2 Noncombat","damage":"10m","range":"","input":"","level":"1"},{"name":"No Name Supplied","uid":1616806272285,"type":"Position Shift","damage":"10m","range":"","input":"","level":"0"}]},
	{"name":"Ropes","uid":1616806282849,"type":"Swinging","damage":"10m","range":"","input":"","level":"10","end":"1","active":"5","base":"5","XMLID":"SWINGING","strMod":false,"class":{"attack":false,"mental":false,"adjustment":false,"bodyaffecting":false,"sensory":false,"move":true,"defense":false,"compound":false,"senseaffecting":false,"special":false},"modifiers":[],"adders":[]},
	{"name":"Teleport Belt","uid":1616806296535,"type":"Teleportation","damage":"14m","range":"","input":"","level":"14","end":"1","active":"14","base":"14","XMLID":"TELEPORTATION","strMod":false,"class":{"attack":false,"mental":false,"adjustment":false,"bodyaffecting":false,"sensory":false,"move":true,"defense":false,"compound":false,"senseaffecting":false,"special":false},"modifiers":[{"value":"-¼","name":"","uid":1616806329089,"type":"Focus","damage":"14m","range":"","input":"IIF","level":"0"}],"adders":[]},
	{"name":"Digging Claws","uid":1616806347677,"type":"Tunneling","damage":"7m through 7 PD material","range":"","input":"","level":"7","end":"3","active":"31","base":"31","XMLID":"TUNNELING","strMod":false,"class":{"attack":false,"mental":false,"adjustment":false,"bodyaffecting":false,"sensory":false,"move":true,"defense":false,"compound":false,"senseaffecting":false,"special":false},"modifiers":[],"adders":[{"name":"No Name Supplied","uid":1616806376726,"type":"+6 PD","damage":"7m through 7 PD material","range":"","input":"","level":"6"},{"name":"No Name Supplied","uid":1616806383452,"type":"Fill In","damage":"7m through 7 PD material","range":"","input":"","level":"0"}]},
	{"name":"No Name Supplied","uid":1616806568459,"type":"Hand-To-Hand Attack","damage":"3d6","range":"","input":"","level":"3","end":"1","active":"15","base":"15","XMLID":"HANDTOHANDATTACK","strMod":false,"class":{"attack":true,"mental":false,"adjustment":false,"bodyaffecting":false,"sensory":false,"move":false,"defense":false,"compound":false,"senseaffecting":false,"special":false},"modifiers":[{"value":"-¼","name":"","uid":1616806587092,"type":"Hand-To-Hand Attack","damage":"3d6","range":"","input":"","level":"0"}],"adders":[]},
	{"name":"No Name Supplied","uid":1616806581324,"type":"Leaping","damage":"","range":"","input":"","level":"12","end":"1","active":"6","base":"6","XMLID":"LEAPING","strMod":false,"class":{"attack":false,"mental":false,"adjustment":false,"bodyaffecting":false,"sensory":false,"move":true,"defense":false,"compound":false,"senseaffecting":false,"special":false},"modifiers":[],"adders":[]},
	{"name":"No Name Supplied","uid":1616806603052,"type":"Knockback Resistance","damage":"-4m","range":"","input":"","level":"4","end":"0","active":"4","base":"4","XMLID":"KBRESISTANCE","strMod":false,"class":{"attack":false,"mental":false,"adjustment":false,"bodyaffecting":false,"sensory":false,"move":false,"defense":true,"compound":false,"senseaffecting":false,"special":true},"modifiers":[],"adders":[]}],
*/
    let pwtype = '',
        pwnm   = '',
        pwdesc = '',
        hclas  = pwjson.class,
        rppre = "repeating_powers_" + uuid,                                    // Build the string prefix for powers
        rpnm  = rppre + "_power_name",                                         // Build the power name value
        rppf  = rppre + "_use_power_formula",                                  // Build the power formula
        rppf2 = rppre + "_use_power2_formula",                                 // Build the 2nd power formula
        rpec  = rppre + "_power_end_cost",                                     // Build the power end cost
        rpea  = rppre + "_power_end_ap_cost",                                  // Build the power ap end cost
        rpes  = rppre + "_power_end_str_cost",                                 // Build the power str end cost
        rprc  = rppre + "_power_remaining_charges",                            // Build the power remaining charges / end
        zero  = 0;

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
      sendChat("API", "Attack powers not implemented yet: " + pwnm);
      return;
    } else if (pwtype === "unknown")
    {
      sendChat("API", "Power is an unknown type: " + pwnm);
      return;
    }

    pwdesc = pwjson.damage + " " + pwjson.type;
//    logDebug(pwdesc);
//    logDebug(pwjson.active);
//    logDebug(pwjson.end);
//    logDebug(uuid);
//    logDebug(cid);

    // Create the power entries.
    createObj('attribute', {name: rpnm, current: pwnm, characterid: cid});
    createObj('attribute', {name: rppf, current: "&{template:hero6template} {{charname=@{character_name}}} {{power=" + pwnm + "}} ", characterid: cid});
//                                     "current":"&{template:hero6template} {{charname=@{character_name}}} {{power=Memory Theft O}}  {{ocv=6}} {{attack=[[3d6]]}} {{damage=[[15d6]]}} {{type=Effect}}","max":"","_id":"-MY0uNetuKuCmrT3SpgR","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
    createObj('attribute', {name: rppf2, current: "&{template:hero6template} {{charname=@{character_name}}} {{power=" + pwnm + "}} {{description=" + pwdesc + "}}", characterid: cid});
//                                      "current":"&{template:hero6template} {{charname=@{character_name}}} {{power=Memory Theft O}}  {{ocv=6}} {{attack=[[3d6]]}} {{damage=[[15d6]]}} {{type=Effect}}{{description=This is the power Memory Theft}}","max":"","_id":"-MY0uNetuKuCmrT3SpgS","_type":"attribute","_characterid":"-MWz3VK0kiR8kkFcJ1V7"},
    createObj('attribute', {name: rpec, current: pwjson.end, characterid: cid});
    createObj('attribute', {name: rpea, current: parseInt(pwjson.end), characterid: cid});
    createObj('attribute', {name: rpes, current: zero, characterid: cid});
    createObj('attribute', {name: rprc, current: pwjson.end, characterid: cid});

    return;
  };

  const createPerks = (plst, cid) => {
    let objToSet = [],
        pknm     = '';
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
      if(/^(?!Lightning R).*$/.test(tlst[t].name))                             // Exclude Lightning Reflexes (handled separately)
      {
        UUID = generateUUID().replace(/_/g, "Z");                              // Generate a UUID for perk grouping
        tlnm = "repeating_perks_" + UUID + "_perk_name";
        createOrSetAttr(tlnm, tlst[t].name.trim(), cid);
      }
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
    if (msg.type !== "api" && /^!(ImportHS6e|i6e)(\s|$)/.test(msg.content)) {  // Ignore messages not intended for this script
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

    character.get("gmnotes", function(gmnotes) {                             // Begin processing the GM Notes section

      let dec_gmnotes = decodeEditorText(gmnotes);

      // Clean JSON of extra junk the HTML adds.
      dec_gmnotes = dec_gmnotes.replace(/<[^>]*>/g, '')                        //   Remove <tags>
                               .replace(/&[^;]*;/g, '')                        //   Remove &nbsp;
                               .replace(/\},\s{1,}\]/g, '\}\]');               //   Remove extra comma

      let hdJSON   = JSON.parse(dec_gmnotes),                                  // Parse the decoded JSON from GM Notes field.
          hdchlist = hdJSON.stats,                                             // Create array of all HD Characteristics.
          hdmvlist = hdJSON.movement,                                          // Create array of all HD Characteristics.
          hdsklist = hdJSON.skills,                                            // Create array of all HD Skills.
          hdcmlist = hdJSON.disads,                                            // Create array of all HD Complications.
          hdpwlist = hdJSON.powers,                                            // Create array of all HD Powers.
          hdpklist = hdJSON.perks,                                             // Create array of all HD Perks.
          hdtllist = hdJSON.talents;                                           // Create array of all HD Talents.

      for (var s=0; s < hdchlist.length; s++)                                  // Loop through HD sheet characteristics.
      {
		chnm = hdchlist[s].shortname + '_base';
        createOrSetAttr(chnm, hdchlist[s].value, chid);
        if(/^(end|body|stun)/.test(hdchlist[s].shortname))                     // Handle display values for body, end and stun.
        {
          chnm = hdchlist[s].shortname.toUpperCase();
          createOrSetAttr(chnm, tlst[t].name.trim(), chid);
        }
      }

      logDebug("Stats Assigned");

// TODO: Add other movement types, need HD examples
// TODO: Fix JSON structure for movement and stats
//      for (var m=0; m < hdmvlist.length; m++)                                  // Loop through HD sheet movement.
//      {
//		mvnm = hdchlist[s].shortname + '_base';
//        createOrSetAttr(chnm, hdchlist[s].value, chid);
//        if(/^(end|body|stun)/.test(hdchlist[s].shortname))                     // Handle display values for body, end and stun.
//        {
//          chnm = hdchlist[s].shortname.toUpperCase();
//          createOrSetAttr(chnm, tlst[t].name.trim(), chid);
//        }
//      }

      createOrSetAttr("run_combat", hdJSON.movement.run.combat, chid);
      createOrSetAttr("run_noncombat", hdJSON.movement.run.noncombat, chid);
      createOrSetAttr("swim_combat", hdJSON.movement.swim.combat, chid);
      createOrSetAttr("swim_noncombat", hdJSON.movement.swim.noncombat, chid);
      createOrSetAttr("hleap_combat", hdJSON.movement.leap.combat, chid);
      createOrSetAttr("hleap_noncombat", hdJSON.movement.leap.noncombat, chid);
      createOrSetAttr("vleap_combat", hdJSON.movement.leap.primary.combat.value/2 + "m", chid);
      createOrSetAttr("vleap_noncombat", hdJSON.movement.leap.combat, chid);
      logDebug("Movement Assigned");

// TO DO Change the JSON template to export the characters features. Check bio, etc. as well
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
      createOrSetAttr("name", hdJSON.name, character.id);

//        logDebug("Features Assigned");

      // Create array of all attributes
      var attrlist = findObjs({type: 'attribute', characterid: chid});
      removeExistingAttributes(attrlist);

      var UUID = '';
      // Create all skills
      for (var h=0; h < hdsklist.length; h++)                                  // Loop through HD sheet skills.
      {
        UUID = generateUUID().replace(/_/g, "Z");                              // Generate a UUID for skill grouping
        // TO DO: Tweak characteristics to read correctly. Need good HD example.
        // Create all entries needed for a skill
        createSkill(hdsklist[h].name.trim(), UUID, chid, 0, hdsklist[h].roll, "None", 0, 0);
      }
      logDebug("Skills Assigned");

      // Create all complications
      for (var h=0; h < hdcmlist.length; h++)                                  // Loop through HD sheet skills.
      {
		var hc = hdcmlist[h];                                                  // Get complication JSON attribute
        UUID = generateUUID().replace(/_/g, "Z");                              // Generate a UUID for complication grouping
        if (hc.adders[2]!==undefined)
        {                                                                      // Call with 3 adders
          createComplication(hc.XMLID, hc.active, hc.name.trim(), hc.input.trim(), hc.adders[0].input, hc.adders[1].input, hc.adders[2].input, UUID, chid);
		} else if (hc.adders[1]!==undefined)
		{                                                                      // Call with 2 adders
          createComplication(hc.XMLID, hc.active, hc.name.trim(), hc.input.trim(), hc.adders[0].input, hc.adders[1].input, "", UUID, chid);
		} else if (hc.adders[0]!==undefined)
		{                                                                      // Call with 1 adder
          createComplication(hc.XMLID, hc.active, hc.name.trim(), hc.input.trim(), hc.adders[0].input, "", "", UUID, chid);
		} else
		{                                                                      // Call with no adders
          createComplication(hc.XMLID, hc.active, hc.name.trim(), hc.input.trim(), "", "", "", UUID, chid);
		}
      }
      logDebug("Complications Assigned");

// TODO
//        logDebug("Equipment Assigned");
//        logDebug("Rolls Assigned");
//        logDebug("Combat Levels Assigned");
//        logDebug("Lightning Reflexes Assigned");

      createPerks(hdpklist, chid);
      logDebug("Perks Assigned");
      createTalents(hdtllist, chid);
      logDebug("Talents Assigned");

      // Create all powers
      for (var h=0; h < hdpwlist.length; h++)                                  // Loop through HD sheet powers
      {
        UUID   = generateUUID().replace(/_/g, "Z");                            // Generate a UUID for power grouping
//        createSimplePower(hdpwlist[h], UUID, chid);
      }

      logDebug("Powers Assigned");

      if (logObjs != 0){
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
