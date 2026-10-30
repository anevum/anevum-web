// Public, portable calendar validation. No identity, transport, or persistence concerns.
export class CalendarError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const FIELDS = ['title','details','location','all_day','start_date','end_date','starts_at','ends_at','time_zone','status'];
const DEFAULTS = {title:'',details:'',location:'',all_day:0,start_date:'',end_date:'',starts_at:'',ends_at:'',time_zone:'UTC',status:'confirmed'};
const textField = (value, max, label) => {
  if (typeof value !== 'string' || value.length > max) throw new CalendarError(label+' must be text of at most '+max+' characters.');
  return value.trim();
};
export function calendarDate(value, label = 'Date') {
  if (typeof value !== 'string' || !DATE.test(value)) throw new CalendarError(label+' must be a valid YYYY-MM-DD date.');
  const parsed = new Date(value+'T12:00:00.000Z');
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10) !== value) throw new CalendarError(label+' is not a valid calendar date.');
  return value;
}
export function calendarWindow(from, to) {
  calendarDate(from,'Range start'); calendarDate(to,'Range end');
  const start = Date.parse(from+'T00:00:00.000Z'), end = Date.parse(to+'T00:00:00.000Z');
  const days = (end-start)/86400000;
  if (days < 1 || days > 63) throw new CalendarError('Choose a date range from 1 to 63 days.');
  // The bounding UTC window covers all civil time zones, including UTC+14/-12.
  return {from,to,utcStart:new Date(start-48*3600000).toISOString(),utcEnd:new Date(end+48*3600000).toISOString()};
}
function instant(value,label) {
  if (typeof value !== 'string' || !INSTANT.test(value)) throw new CalendarError(label+' must be a UTC timestamp ending in Z.');
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime()) || timestamp.toISOString().slice(0,19) !== value.slice(0,19)) throw new CalendarError(label+' is invalid.');
  return timestamp.toISOString();
}
export function validateCalendarEvent(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new CalendarError('Provide an event object.');
  const allowed = new Set([...FIELDS,'id','revision']);
  if (Object.keys(raw).some(key => !allowed.has(key))) throw new CalendarError('An unsupported event field was supplied.');
  const item = {...DEFAULTS,...raw};
  item.title = textField(item.title,160,'Title');
  if (!item.title) throw new CalendarError('Enter an event title.');
  item.details = textField(item.details,4000,'Details');
  item.location = textField(item.location,240,'Location');
  if (![true,false,0,1].includes(item.all_day)) throw new CalendarError('Choose an all-day or timed event.');
  item.all_day = Number(item.all_day);
  item.time_zone = textField(item.time_zone,64,'Time zone');
  if (!item.time_zone || !/^[A-Za-z0-9_+\/-]+$/.test(item.time_zone)) throw new CalendarError('Choose a valid IANA time zone.');
  try { new Intl.DateTimeFormat('en-US',{timeZone:item.time_zone}).format(0); }
  catch { throw new CalendarError('The selected time zone is not recognized.'); }
  if (!['confirmed','cancelled'].includes(item.status)) throw new CalendarError('Choose a valid event status.');
  if (item.all_day) {
    item.start_date = calendarDate(item.start_date,'Start date');
    item.end_date = calendarDate(item.end_date,'End date');
    const span=(Date.parse(item.end_date+'T00:00:00Z')-Date.parse(item.start_date+'T00:00:00Z'))/86400000;
    if (span < 1 || span > 366) throw new CalendarError('An all-day event must last from 1 to 366 days.');
    item.starts_at=''; item.ends_at='';
  } else {
    item.starts_at=instant(item.starts_at,'Start time');
    item.ends_at=instant(item.ends_at,'End time');
    const span=Date.parse(item.ends_at)-Date.parse(item.starts_at);
    if (span < 60000 || span > 366*86400000) throw new CalendarError('An appointment must last at least 1 minute and no more than 366 days.');
    item.start_date=''; item.end_date='';
  }
  if (item.id !== undefined && (typeof item.id !== 'string' || !UUID.test(item.id))) throw new CalendarError('The event ID is invalid.');
  if (item.revision !== undefined && (!Number.isSafeInteger(item.revision) || item.revision < 1)) throw new CalendarError('The event revision is invalid.');
  return item;
}
export function editableCalendarFields(row) {
  return Object.fromEntries(FIELDS.map(key=>[key,row[key]]));
}
