/*
=========================================================
Name			:	ImportHS6e
GitHub			:	https://github.com/eepjr24/ImportHS6e
Roll20 Contact	:	eepjr24
Version			:	.912
Last Update		:	4/7/2021
=========================================================
*/
var API_Meta = API_Meta || {};
API_Meta.ImportHS6e = { offset: Number.MAX_SAFE_INTEGER, lineCount: -1 };
{
    try { throw new Error(''); } catch (e) { API_Meta.ImportHS6e.offset = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - (13)); }
}

const ImportHS6e = (() => {

  let version = '0.912',
  lastUpdate  = 1617318109912,
  lastBody    = 0,
  debug_log   = 0,
  logObjs     = 0;

  const checkInstall= () => {                                                       // Display version information on startup.
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

  const createOrSetAttr = (obj_nm, attr_nm, val, cid) => {                     // Set an individual attribute if it exists, otherwise create it.
    var objToSet = findObjs({type: 'attribute', characterid: cid, name: obj_nm})[0]
    if(objToSet===undefined)                                                   // If attribute does not exist, create otherwise set current value.
      {
        createObj('attribute', {name: attr_nm, current: val, characterid: cid});
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
      // TODO: Build complications
      compnm = "Dep: " + desc + ", " + ad1 + " / " + ad3 + ", " + ad2;
      break;
    case "DEPENDENTNPC":                                                       // Dependent NPC
      // TODO: Build complications
      compnm = "DNPC: " + desc + ", " + ad1 + ", " + ad2 + ", " + ad3;
      break;
    case "DISTINCTIVEFEATURES":                                                // Distinctive Features
      // TODO: Build complications
      compnm = "DF: " + desc + ", " + ad1 + ", " + ad2 + ", " + ad3;
      break;
    case "ENRAGED":                                                            // Enraged
      // TODO: Build complications
      compnm = "Enraged: " + desc + ", " + ad2 + ", " + ad3 + ", " + ad1 ;
      break;
    case "HUNTED":                                                             // Hunted
      // TODO: Build complications
      compnm = "Hunted: " + desc + ", " + ad1 + ", " + ad2 + ", " + ad3;
      break;
    case "REPUTATION":                                                         // Negative Reputation
      // TODO: Build complications
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
    createObj('attribute', {name: rcnm, current: compnm, characterid: cid});   // Assign the complication cost
    return;
  };

  const createSimplePower = (type, pwnm, desc, ap, end, uuid, cid) => {
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

    let rppre = "repeating_powers_" + uuid,                                    // Build the string prefix for powers
        rpnm  = rppre + "_power_name",                                         // Build the power name value
        rppf  = rppre + "_use_power_formula",                                  // Build the power formula
        rppf2 = rppre + "_use_power2_formula",                                 // Build the 2nd power formula
        rpec  = rppre + "_power_end_cost",                                     // Build the power end cost
        rpea  = rppre + "_power_end_ap_cost",                                  // Build the power ap end cost
        rpes  = rppre + "_power_end_str_cost",                                 // Build the power str end cost
        rprc  = rppre + "_power_remaining_charges",                            // Build the power remaining charges / end
        zero  = 0;
    // Create the power entries.
    createObj('attribute', {name: rpnm, current: pwnm, characterid: cid});
    createObj('attribute', {name: rppf, current: "&{template:hero6template} {{charname=@{character_name}}} {{power=" + pwnm + "}} ", characterid: cid});
    createObj('attribute', {name: rppf2, current: "&{template:hero6template} {{charname=@{character_name}}} {{power=" + pwnm + "}} {{description=" + desc + "}}", characterid: cid});
    createObj('attribute', {name: rpec, current: end, characterid: cid});
    createObj('attribute', {name: rpea, current: parseInt(end), characterid: cid});
    createObj('attribute', {name: rpes, current: zero, characterid: cid});
    createObj('attribute', {name: rprc, current: end, characterid: cid});


    return;
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

      let hdJSON  = JSON.parse(dec_gmnotes);                                   // Parse the decoded JSON from GM Notres field.

// TO DO: Create array of attributes to loop through and assign.
// TO DO: Fix function to only need 3 inputs
// TO DO: Add other movement types, need HD examples
      createOrSetAttr("str_base", "str_base", hdJSON.stats.str.value, chid);
      createOrSetAttr("dex_base", "dex_base", hdJSON.stats.dex.value, chid);
      createOrSetAttr("con_base", "con_base", hdJSON.stats.con.value, chid);
      createOrSetAttr("int_base", "int_base", hdJSON.stats.int.value, chid);
      createOrSetAttr("ego_base", "ego_base", hdJSON.stats.ego.value, chid);
      createOrSetAttr("pre_base", "pre_base", hdJSON.stats.pre.value, chid);
      createOrSetAttr("ocv_base", "ocv_base", hdJSON.stats.ocv.value, chid);
      createOrSetAttr("dcv_base", "dcv_base", hdJSON.stats.dcv.value, chid);
      createOrSetAttr("omcv_base", "omcv_base", hdJSON.stats.omcv.value, chid);
      createOrSetAttr("dmcv_base", "dmcv_base", hdJSON.stats.dmcv.value, chid);
      createOrSetAttr("spd_base", "spd_base", hdJSON.stats.spd.value, chid);
      createOrSetAttr("pd_base", "pd_base", hdJSON.stats.pd.value, chid);
      createOrSetAttr("ed_base", "ed_base", hdJSON.stats.ed.value, chid);
      createOrSetAttr("rec_base", "rec_base", hdJSON.stats.rec.value, chid);
      createOrSetAttr("end_base", "end_base", hdJSON.stats.end.value, chid);
      createOrSetAttr("body_base", "body_base", hdJSON.stats.body.value, chid);
      createOrSetAttr("stun_base", "stun_base", hdJSON.stats.stun.value, chid);
      createOrSetAttr("END", "END", hdJSON.stats.end.value, chid);
      createOrSetAttr("BODY", "END", hdJSON.stats.body.value, chid);
      createOrSetAttr("STUN", "STUN", hdJSON.stats.stun.value, chid);
      logDebug("Stats Assigned");

      createOrSetAttr("run_combat", "run_combat", hdJSON.movement.run.combat, chid);
      createOrSetAttr("run_noncombat", "run_noncombat", hdJSON.movement.run.noncombat, chid);
      createOrSetAttr("swim_combat", "swim_combat", hdJSON.movement.swim.combat, chid);
      createOrSetAttr("swim_noncombat", "swim_noncombat", hdJSON.movement.swim.noncombat, chid);
      createOrSetAttr("hleap_combat", "hleap_combat", hdJSON.movement.leap.combat, chid);
      createOrSetAttr("hleap_noncombat", "hleap_noncombat", hdJSON.movement.leap.noncombat, chid);
      createOrSetAttr("vleap_combat", "vleap_combat", hdJSON.movement.leap.primary.combat.value/2 + "m", chid);
      createOrSetAttr("vleap_noncombat", "vleap_noncombat", hdJSON.movement.leap.combat, chid);
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
//        logDebug("Features Assigned");

      var hdsklist = hdJSON.skills;                                            // Create array of all HD Skills.
      var hdcmlist = hdJSON.disads;                                            // Create array of all HD Complications.
      var hdpwlist = hdJSON.powers;                                            // Create array of all HD Complications.
      logDebug("HD Skill Count: " + hdsklist.length);

// TODO: Rename cssklist generically for all removals csrplist?
      // Create array of all attributes
      var cssklist = findObjs({type: 'attribute', characterid: chid});

// TODO  make removal conditional based on input flags per type of attribute
      for (var c=0; c < cssklist.length; c++)                                  // Loop character sheet atribute list
      {
        var csskil = cssklist[c].get("name");                                  // Get attribute name
        if (/^(repeating_)(skills|complications|powers)/.test(csskil))         // Find repeating skills, complications and powers
        {
          cssklist[c].remove();                                                // Remove them
        }
      }
      logDebug("Existing skills and complications removed");

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
//        logDebug("Perks Assigned");
//        logDebug("Talents Assigned");
//        logDebug("Equipment Assigned");
//        logDebug("Rolls Assigned");
//        logDebug("Combat Levels Assigned");
//        logDebug("Lightning Reflexes Assigned");

      // Create all powers
      for (var h=0; h < hdpwlist.length; h++)                                  // Loop through HD sheet powers
      {
        let pwtype = '',
            pwname = '',
            pwdesc = '',
            hclas  = hdpwlist[h].class,
            UUID   = generateUUID().replace(/_/g, "Z");                        // Generate a UUID for power grouping

        logDebug(hclas);

        if (hclas.attack)              {pwtype = "attack";}                    // Determine power type
        else if (hclas.mental)         {pwtype = "mental";}
        else if (hclas.adjustment)     {pwtype = "adjustment";}
        else if (hclas.bodyaffecting)  {pwtype = "bodyaffecting";}
        else if (hclas.sensory)        {pwtype = "sensory";}
        else if (hclas.move)           {pwtype = "move";}
        else if (hclas.defense)        {pwtype = "defense";}
        else if (hclas.compound)       {pwtype = "compound";}
        else if (hclas.senseaffecting) {pwtype = "senseaffecting";}
        else if (hclas.special)        {pwtype = "special";}
        else {pwtype = "unknown";}

        if (hdpwlist[h].name.trim() === "No Name Supplied")
        {
          pwname = hdpwlist[h].type.trim()
		} else
		{
          pwname = hdpwlist[h].name.trim()
		}
        logDebug(pwtype);
        logDebug(pwname);
        logDebug(pwdesc);
        logDebug(hdpwlist[h].active);
        logDebug(hdpwlist[h].end);
        logDebug(UUID);
        logDebug(chid);

        // Create all entries needed for a power
        if (isNaN(hdpwlist[h].end))
        // Power has charges
        {
          // TODO implement powers with charges
          sendChat("API", "Powers with charges not implemented yet: " + pwname);
		} else if (pwtype === "attack")
		// Power is an attack
		{
          // TODO implement attack powers
          sendChat("API", "Attack powers not implemented yet: " + pwname);
		} else if (pwtype === "unknown")
		// Power is unknown type
		{
          sendChat("API", "Power is an unknown type: " + pwname);
		} else
		{
          createSimplePower(pwtype, pwname, pwdesc, hdpwlist[h].active, hdpwlist[h].end, UUID, chid);
		}
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
