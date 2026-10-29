// BRANDLE — pure offline puzzle engine. MIT-licensed application code.
export const MAX_GUESSES = 6;
export const WORD_LENGTH = 5;
export const START_DAY = Date.UTC(2026, 9, 29) / 86400000;
export const ANSWERS = [...new Set(`acorn adore agile amber angel apple arise aroma atlas await beach beams berry blend bliss bloom blush brave brisk brook brush candy cedar charm chase cheer chime claim clear climb cloud clove coast coral cover crane crisp crown crush daisy dance depth dream dress drift eager eagle earth ember entry epoch event fable faith feast fence ferns fiber field fiery flame flare flora flour flute focus forge fresh front fruit gamer giant glade glass gleam glide globe glory glove grace grain grand grape grass green grove guide happy heart heron honey house humor ideal ivory jelly jolly judge juice knack knock laser laugh layer leafy learn lemon light lilac linen lodge lotus lover lucky lunar magic maple marsh mauve metal mirth misty mocha mossy motif movie music never night noble oasis olive orbit other otter paint peach pearl piano pilot pixel plant plume poise poppy pride prism prize queen quiet rally raven reach ready ridge river robin roost roses royal saint sandy satin scale scarf scene scope shade shady shape shine shore shout sight skies skill skirt slate sleep smile smoke snack snowy solar sound south space spice spike spore sport spout sprig squad stair stare steam steep still stone storm story sugar sunny sweet swift swing table tango tears tease teeth tempo thank theme thorn three tiger toast tonic torch trace trail train treat trend tribe trick truly tulip twirl ultra under unity upper urban vapor vivid voice waltz waves whale wheat whirl white whole windy wings witch woman world worth yearn young zesty`.split(/\s+/).filter(w=>/^[a-z]{5}$/.test(w)))].sort();
export function utcDay(date=new Date()) { return Math.floor(date.getTime()/86400000); }
export function dayKey(date=new Date()) { return date.toISOString().slice(0,10); }
export function puzzleNumber(date=new Date()) { return utcDay(date)-START_DAY+1; }
export function dailyAnswer(date=new Date(), pool=ANSWERS) {
  if (!pool.length) throw new Error('Empty answer pool');
  const n = utcDay(date) - START_DAY;
  const hash = Math.imul((n + 4103) ^ 0x45d9f3b, 0x27d4eb2d) >>> 0;
  return pool[hash % pool.length].toUpperCase();
}
export function evaluateGuess(answer, guess) {
  answer=answer.toUpperCase(); guess=guess.toUpperCase();
  if(!/^[A-Z]{5}$/.test(answer)||!/^[A-Z]{5}$/.test(guess)) throw new Error('Requires five letters');
  const result=Array(5).fill('absent');
  const remaining={};
  for(let i=0;i<5;i++){
    if(guess[i]===answer[i]) result[i]='correct';
    else remaining[answer[i]]=(remaining[answer[i]]||0)+1;
  }
  for(let i=0;i<5;i++){
    if(result[i]!=='correct' && remaining[guess[i]]>0){
      result[i]='present'; remaining[guess[i]]--;
    }
  }
  return result;
}
export function keyboardHints(guesses, answer) {
  const ranks={absent:1,present:2,correct:3}, hints={};
  for(const word of guesses){
    evaluateGuess(answer,word).forEach((status,i)=>{
      const letter=word[i].toUpperCase();
      if((ranks[status]||0)>(ranks[hints[letter]]||0)) hints[letter]=status;
    });
  }
  return hints;
}
export function isValidWord(word, dictionary){return /^[A-Z]{5}$/.test(word) && dictionary.has(word.toLowerCase());}
export function randomAnswer(pool=ANSWERS, history=[], getRandom) {
  const available=pool.filter(w=>!history.includes(w));
  const candidates=available.length?available:pool;
  const rand=getRandom ?? (()=> {
    if(typeof crypto!=='undefined' && crypto.getRandomValues){
      const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;
    }
    return Math.random();
  });
  return candidates[Math.floor(Math.max(0,Math.min(0.999999,rand()))*candidates.length)].toUpperCase();
}
export function safeParse(raw, fallback) {try { const v=JSON.parse(raw);return v??fallback; } catch{return fallback;}}
export function validateSavedGame(value, answer, dictionary) {
  if(!value||!Array.isArray(value.guesses)||value.guesses.length>MAX_GUESSES||typeof value.input!=='string')return null;
  const guesses=value.guesses;
  if(!guesses.every(g=>/^[A-Z]{5}$/.test(g)&&dictionary.has(g.toLowerCase())))return null;
  if(!/^[A-Z]{0,5}$/.test(value.input))return null;
  if(guesses.some((g,i)=>g===answer && i<guesses.length-1))return null;
  const finished=guesses.includes(answer)||guesses.length===MAX_GUESSES;
  return {guesses,input:finished?'':value.input,finished,won:guesses.includes(answer)};
}
export function shareGrid(guesses,answer,number) {
  const grid=guesses.map(w=>evaluateGuess(answer,w).map(v=>({correct:'🟩',present:'🟦',absent:'⬛'})[v]).join('')).join('\n');
  const win=guesses.includes(answer);
  return `BRANDLE #${number} ${win?guesses.length:'X'}/6\n\n${grid}`;
}
