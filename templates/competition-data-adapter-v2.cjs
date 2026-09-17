/* DATA ONLY starter: rename source fields here; never produce HTML, CSS or DOM. */
'use strict';
module.exports=function normalizeCompetition(source){
 // For an already-normalized source, this adapter is an identity mapping.
 // Map source fixtures to {id,date,time,stage,round,home,away,score:{home,away,sets:[{home,away}]}}.
 // Keep unknown scores null. Supply explicit rules/structure/theme/hero and verified roster snapshots.
 // Bracket advancement uses nextMatchId, not a display-order guess.
 return JSON.parse(JSON.stringify(source));
};
