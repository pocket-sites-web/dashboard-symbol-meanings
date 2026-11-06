// Our own dashboard symbol library. Manual icons are the makers' artwork and can't be copied, so every
// symbol here is drawn from scratch on a 64x64 grid in currentColor. The page sets the colour (red, amber,
// green, blue, white) from the manual entry, because the same shape can be amber on one make and red on another.

export type Severity = 'stop' | 'soon' | 'info';

export interface Symbol {
  id: string;
  name: string;
  /** Words that identify this light in manual labels, lower case. The first match in SYMBOLS order wins. */
  match: RegExp;
  severity: Severity;
  /** Our own generic explanation (manual wording is shown separately on model pages). */
  meaning: string;
  action: string;
  /** Amazon search for a product that helps with this light, if one genuinely does. */
  product?: { label: string; q: string };
  svg: string;
}

const S = (inner: string) => inner; // markup inside <svg viewBox="0 0 64 64">
const sw = 'fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';
const paren = `<path d="M13 12a28 28 0 0 0 0 40M51 12a28 28 0 0 1 0 40" ${sw}/>`;
const ring = `<circle cx="32" cy="32" r="15" ${sw}/>`;
const bang = (x = 32, y = 22, h = 13) => `<path d="M${x} ${y}v${h}" ${sw}/><circle cx="${x}" cy="${y + h + 6}" r="2.6" fill="currentColor"/>`;
const txt = (t: string, size = 15, y = 37.5) =>
  `<text x="32" y="${y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${size}" fill="currentColor">${t}</text>`;
// Car seen from behind, used by stability, lane and pre-collision symbols.
const carRear = (x = 32, y = 20, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-14 6l4-10h20l4 10" ${sw}/><rect x="-17" y="6" width="34" height="11" rx="3" ${sw}/><path d="M-14 17v5M14 17v5" ${sw}/></g>`;
// Oil can: body, filler cap, handle on the left, spout to the right.
const oilCan = `<path d="M14 32h24l14-8 4 2-14 14H14z" ${sw}/><path d="M14 33l-7-5v-4l7 3M22 32v-6h8v6M19 26h14" ${sw}/>`;
const carSide = `<path d="M8 40v-8l7-2 6-9h18l9 9 8 2v8z" ${sw}/><circle cx="19" cy="42" r="5" fill="currentColor"/><circle cx="46" cy="42" r="5" fill="currentColor"/>`;

export const SYMBOLS: Symbol[] = [
  {
    id: 'check-engine', name: 'Check engine light', severity: 'soon',
    match: /check engine|^((ev|hybrid) system )?malfunction indicator|engine (warning|management|check)|\bmil\b|service engine soon|emission/,
    meaning: 'The engine computer found a fault in the engine, fuel or emissions system. Steady means get it checked soon. Flashing means misfires that can damage the catalytic converter.',
    action: 'If it flashes, slow down and get the car checked straight away. If it is steady, check the fuel cap is tight, then have the code read. An OBD2 scanner reads it in a minute.',
    product: { label: 'OBD2 scanner', q: 'OBD2 scanner' },
    svg: S(`<path d="M10 26h5v-5h6v-4h16v4h6l4 5h4v-4h3v20h-3v-4h-4l-6 7H21l-4-5h-2v-6h-5z" ${sw}/><path d="M24 17v-4h10v4" ${sw}/>`),
  },
  {
    id: 'oil-pressure', name: 'Oil pressure warning light', severity: 'stop',
    match: /oil pressure|engine oil (warning|pressure)|low oil pressure/,
    meaning: 'Oil pressure has dropped too low to protect the engine. Running on like this can wreck the engine in minutes.',
    action: 'Pull over safely and turn the engine off. Check the oil level when the engine has cooled. If the level is fine and the light stays on, have it towed.',
    product: { label: 'engine oil', q: 'synthetic motor oil 5W-30' },
    svg: S(`${oilCan}<path d="M57 38c0 3-1.8 5-3.5 5S50 41 50 38s3.5-7 3.5-7 3.5 4 3.5 7z" fill="currentColor"/>`),
  },
  {
    id: 'oil-level', name: 'Low engine oil level light', severity: 'soon',
    match: /oil level|low (engine )?oil(?! pressure)|oil change|engine oil (change|replacement)/,
    meaning: 'The engine oil level is low, or an oil change is due, depending on the car.',
    action: 'Check the dipstick on level ground and top up with the oil grade in the manual. If it is the oil change reminder, book the service and reset it afterwards.',
    product: { label: 'engine oil', q: 'synthetic motor oil 5W-30' },
    svg: S(`<g transform="translate(0 -6)">${oilCan}</g><path d="M10 52c4-4 8 4 12 0s8 4 12 0 8 4 12 0" ${sw}/>`),
  },
  {
    id: 'battery', name: 'Battery / charging system light', severity: 'stop',
    match: /^(?!.*(cable|connect|plug|high voltage|key|fob|remote|discharge)).*(\bcharg(e|ing) (system )?(warning|light|indicator)|^charg(e|ing)|battery|alternator|12 ?v)/,
    meaning: 'The charging system is not keeping the battery charged. The car is running on battery power alone and will stop when it runs flat.',
    action: 'Turn off everything you can (A/C, heated seats, radio) and drive straight to a garage or home. Do not switch the engine off until you get there, as it may not restart.',
    product: { label: 'jump starter', q: 'portable car jump starter' },
    svg: S(`<rect x="8" y="18" width="48" height="32" rx="3" ${sw}/><path d="M16 18v-6h8v6M40 18v-6h8v6M15 34h10M20 29v10M39 34h10" ${sw}/>`),
  },
  {
    id: 'coolant-temp', name: 'Engine temperature warning light', severity: 'stop',
    match: /coolant|engine temp|overheat|high temp|water temp/,
    meaning: 'The engine is overheating, or the coolant is low. Driving on can warp the cylinder head.',
    action: 'Pull over and switch off. Do not open the radiator cap while hot. Once cool, check the coolant level and look for leaks.',
    product: { label: 'coolant', q: 'engine coolant antifreeze 50/50' },
    svg: S(`<path d="M32 8v28M32 16h9M32 23h9M32 30h9" ${sw}/><circle cx="32" cy="42" r="6" fill="currentColor"/><path d="M8 50c4-4 8 4 12 0M44 50c4-4 8 4 12 0M8 57c4-4 8 4 12 0s8 4 12 0 8 4 12 0 8 4 12 0" ${sw}/>`),
  },
  {
    id: 'brake', name: 'Brake system warning light', severity: 'stop',
    match: /^(?!.*(\babs\b|anti-lock)).*(brake (system )?warning|brake fluid|parking brake.*(and|&|\/) brake|^brake$|brake system|\bebd\b|brake force distribution)/,
    meaning: 'Either the parking brake is on, the brake fluid is low, or the brake system has a fault.',
    action: 'Check the parking brake is fully released. If the light stays on, the brakes may not work properly: stop and get help rather than driving on.',
    svg: S(`${paren}${ring}${bang(32, 23, 9)}`),
  },
  {
    id: 'parking-brake', name: 'Parking brake light', severity: 'info',
    match: /parking brake|electric parking|\bepb\b|\(p\)/,
    meaning: 'The parking brake is on. On some cars, flashing means the electric parking brake has a fault.',
    action: 'Release the parking brake before driving. If it flashes or will not release, see a dealer.',
    svg: S(`${paren}${ring}${txt('P', 18, 38.5)}`),
  },
  {
    id: 'brake-hold', name: 'Brake hold / auto hold light', severity: 'info',
    match: /brake hold|auto hold/,
    meaning: 'Brake hold is switched on or is holding the car at a stop so you can take your foot off the brake.',
    action: 'Nothing to do. Press the accelerator to drive off; the brakes release automatically.',
    svg: S(`${paren}${ring}${txt('A', 18, 38.5)}`),
  },
  {
    id: 'abs', name: 'ABS warning light', severity: 'soon',
    match: /\babs\b|anti-?lock/,
    meaning: 'The anti-lock brake system has a fault. Normal braking still works, but the wheels can lock in an emergency stop.',
    action: 'Drive carefully, leave extra stopping distance and have it checked soon. If the red brake light is also on, stop driving.',
    svg: S(`${paren}${ring}${txt('ABS', 11.5, 36)}`),
  },
  {
    id: 'brake-pad', name: 'Brake pad wear light', severity: 'soon',
    match: /brake pad|pad wear|brake lining/,
    meaning: 'The brake pads are worn down to the sensor and need replacing.',
    action: 'Book new brake pads soon. Driving on worn pads damages the discs.',
    svg: S(`${ring}<path d="M13 12a28 28 0 0 0 0 40M51 12a28 28 0 0 1 0 40" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="6 5"/>`),
  },
  {
    id: 'airbag', name: 'Airbag (SRS) warning light', severity: 'soon',
    match: /air ?bag|\bsrs\b|supplemental restraint/,
    meaning: 'The airbag system has a fault, so the airbags may not go off in a crash.',
    action: 'The car drives normally, but get it checked soon. Do not try to repair airbag parts yourself.',
    svg: S(`<circle cx="27" cy="11" r="5" fill="currentColor"/><path d="M27 20v14l10 0 6 14M27 34l-6 14M18 26l9 4" ${sw}/><circle cx="46" cy="24" r="9" fill="currentColor"/>`),
  },
  {
    id: 'seatbelt', name: 'Seat belt reminder light', severity: 'info',
    match: /seat ?belt|belt reminder/,
    meaning: 'A seat belt is not fastened, for the driver or a passenger.',
    action: 'Fasten all seat belts. If it stays on with everyone belted, a heavy bag on a seat can trigger it.',
    svg: S(`<circle cx="30" cy="11" r="6" fill="currentColor"/><path d="M28 22v18h14v14" ${sw}/><path d="M18 18l4 30h6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 24l18 14" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><rect x="38" y="35" width="8" height="7" rx="1.5" fill="currentColor"/>`),
  },
  {
    id: 'tpms', name: 'Tire pressure (TPMS) light', severity: 'soon',
    match: /tire pressure|tyre pressure|\btpms\b|low tire|flat tire/,
    meaning: 'One or more tires is well below the right pressure. Flashing for a minute then staying on means the TPMS itself has a fault.',
    action: 'Check all four tires with a gauge and inflate to the pressure on the driver\'s door sticker. The light goes out after a short drive.',
    product: { label: 'tire inflator', q: 'portable tire inflator' },
    svg: S(`<path d="M14 50c-5-6-7-14-5-22 2-8 8-15 10-18M50 50c5-6 7-14 5-22-2-8-8-15-10-18M10 50h44" ${sw}/><path d="M10 56l3-6M20 56l2-6M32 56v-6M44 56l-2-6M54 56l-3-6" ${sw}/>${bang(32, 18, 14)}`),
  },
  {
    id: 'master-warning', name: 'Master warning light (exclamation mark)', severity: 'soon',
    match: /master warning|general warning|warning message|exclamation|multi-?information/,
    meaning: 'A message about a problem is showing on the dashboard display. The triangle points you to it.',
    action: 'Read the message on the multi-information display. Red means stop safely; amber means get it checked.',
    svg: S(`<path d="M32 8 58 54H6z" ${sw}/>${bang(32, 24, 14)}`),
  },
  {
    id: 'stability', name: 'Stability / traction control light', severity: 'info',
    match: /\bvsc\b|\besc\b|\bvdc\b|stability|traction|slip indicator|skid|\btrac\b|\bdsc\b/,
    meaning: 'Flashing means the system is working right now to stop a skid. Steady means it has a fault or is switched off.',
    action: 'If it flashes, ease off and drive gently for the conditions. If it stays on, have the system checked.',
    svg: S(`${carRear(32, 18)}<path d="M14 48c4-4 8 4 4 8M26 48c4-4 8 4 4 8M40 48c-4-4-8 4-4 8M52 48c-4-4-8 4-4 8" ${sw}/>`),
  },
  {
    id: 'stability-off', name: 'Stability control OFF light', severity: 'info',
    match: /(vsc|esc|vdc|trac|traction|stability).{0,12}off|off.{0,6}(vsc|esc|trac)/,
    meaning: 'Stability or traction control has been switched off, usually with a button.',
    action: 'Turn it back on unless you are stuck in snow or mud. It normally turns on again with the next start.',
    svg: S(`${carRear(32, 14, 0.85)}<path d="M14 38c4-4 8 4 4 8M26 38c4-4 8 4 4 8M40 38c-4-4-8 4-4 8M52 38c-4-4-8 4-4 8" ${sw}/>${txt('OFF', 12.5, 61)}`),
  },
  {
    id: 'power-steering', name: 'Power steering warning light', severity: 'soon',
    match: /power steering|\beps\b|electric power steering|steering (system|assist|warning)/,
    meaning: 'Power steering has a fault. Steering still works but feels much heavier.',
    action: 'Drive carefully and have it checked. If it came on after a lot of parking manoeuvres, it can reset after the car cools down.',
    svg: S(`<circle cx="32" cy="32" r="20" ${sw}/><circle cx="32" cy="32" r="6" ${sw}/><path d="M14 30h12M38 30h12M32 38v13" ${sw}/><path d="M56 22v12" ${sw}/><circle cx="56" cy="40" r="2.6" fill="currentColor"/>`),
  },
  {
    id: 'low-fuel', name: 'Low fuel light', severity: 'soon',
    match: /fuel (level|low)|low fuel|fuel gauge|fuel reserve/,
    meaning: 'The fuel tank is nearly empty, usually with about 30 to 50 miles left.',
    action: 'Fill up at the next gas station. Running dry can damage the fuel pump.',
    svg: S(`<rect x="12" y="10" width="26" height="44" rx="3" ${sw}/><rect x="17" y="15" width="16" height="12" fill="currentColor"/><path d="M38 24h6l6 6v18a4 4 0 0 1-8 0V36h-4M8 54h34M50 30v-8l-5-5" ${sw}/>`),
  },
  {
    id: 'fuel-cap', name: 'Loose fuel cap light', severity: 'soon',
    match: /fuel (cap|filler)|gas cap|check fuel cap/,
    meaning: 'The fuel cap is loose or missing, so fuel vapour can escape.',
    action: 'Tighten the cap until it clicks. The light can take a few drives to clear.',
    svg: S(`<rect x="12" y="10" width="26" height="44" rx="3" ${sw}/><path d="M38 24h6l6 6v18a4 4 0 0 1-8 0V36h-4M8 54h34" ${sw}/><circle cx="25" cy="22" r="6" fill="currentColor"/>`),
  },
  {
    id: 'door-open', name: 'Door open light', severity: 'info',
    match: /door (open|ajar)|open door/,
    meaning: 'A door, or sometimes the hood or trunk, is not fully closed.',
    action: 'Stop and close every door firmly.',
    svg: S(`<path d="M20 8h24l4 6v36l-4 6H20l-4-6V14z" ${sw}/><path d="M16 26 4 32M48 26l12 6" ${sw}/>`),
  },
  {
    id: 'hood-open', name: 'Hood open light', severity: 'info',
    match: /hood (open|ajar)|bonnet/,
    meaning: 'The hood is not fully latched.',
    action: 'Stop and close the hood firmly. An unlatched hood can fly up at speed.',
    svg: S(`${carSide.replace('M8 40v-8l7-2', 'M8 40v-8l7-2')}<path d="M8 30 20 14" ${sw}/>`),
  },
  {
    id: 'trunk-open', name: 'Trunk / liftgate open light', severity: 'info',
    match: /trunk|liftgate|tailgate|back door|hatch/,
    meaning: 'The trunk, liftgate or back door is not fully closed.',
    action: 'Close it firmly. Exhaust fumes can get in if you drive with it open.',
    svg: S(`${carSide}<path d="M56 32 48 14" ${sw}/>`),
  },
  {
    id: 'high-beam', name: 'High beam indicator', severity: 'info',
    match: /high beam|main beam|headlight high/,
    meaning: 'The high beams are on.',
    action: 'Dip them for oncoming traffic and when following another car.',
    svg: S(`<path d="M30 14c14 0 22 8 22 18s-8 18-22 18z" ${sw}/><path d="M6 20h16M6 28h16M6 36h16M6 44h16" ${sw}/>`),
  },
  {
    id: 'auto-high-beam', name: 'Automatic high beam light', severity: 'info',
    match: /auto(matic)? high beam|\bahb\b|high beam assist|adaptive driving beam/,
    meaning: 'Automatic high beam is switched on and will switch between high and low beam by itself.',
    action: 'Nothing to do.',
    svg: S(`<path d="M30 14c14 0 22 8 22 18s-8 18-22 18z" ${sw}/><path d="M6 22h12M6 32h12M6 42h12" ${sw}/>${txt('A', 16, 38)}`),
  },
  {
    id: 'low-beam', name: 'Headlight / low beam indicator', severity: 'info',
    match: /headlight|low beam|dipped|tail ?light indicator|light(s)? on/,
    meaning: 'The headlights or parking lights are on.',
    action: 'Nothing to do.',
    svg: S(`<path d="M34 14c14 0 22 8 22 18s-8 18-22 18z" ${sw}/><path d="M6 22l20 4M6 32l20 4M6 42l20 4" ${sw}/>`),
  },
  {
    id: 'front-fog', name: 'Front fog light indicator', severity: 'info',
    match: /^(?!.*rear).*(front fog|fog light|fog lamp)/,
    meaning: 'The front fog lights are on.',
    action: 'Turn them off when visibility is good, as they can dazzle other drivers.',
    svg: S(`<path d="M34 14c14 0 22 8 22 18s-8 18-22 18z" ${sw}/><path d="M6 22l20 4M6 32l20 4M6 42l20 4" ${sw}/><path d="M18 12c-4 6-4 34 0 40" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>`),
  },
  {
    id: 'rear-fog', name: 'Rear fog light indicator', severity: 'info',
    match: /rear fog/,
    meaning: 'The rear fog light is on.',
    action: 'Turn it off when visibility is good: it looks like a brake light to drivers behind.',
    svg: S(`<path d="M30 14C16 14 8 22 8 32s8 18 22 18z" ${sw}/><path d="M38 32h20M38 22h20M38 42h20" ${sw}/><path d="M44 12c4 6 4 34 0 40" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" transform="translate(-10 0)"/>`),
  },
  {
    id: 'turn-signal', name: 'Turn signal indicator', severity: 'info',
    match: /turn signal|indicator light.*turn|hazard|direction indicator/,
    meaning: 'The turn signal or hazard lights are on. Flashing fast means a bulb is out.',
    action: 'If it flashes faster than usual, replace the blown bulb on that side.',
    svg: S(`<path d="M4 32 18 18v8h10v12H18v8zM60 32 46 18v8H36v12h10v8z" fill="currentColor"/>`),
  },
  {
    id: 'cruise', name: 'Cruise control indicator', severity: 'info',
    match: /cruise|radar cruise|\bacc\b|speed control/,
    meaning: 'Cruise control is on or set.',
    action: 'Nothing to do.',
    svg: S(`<path d="M10 44a22 22 0 1 1 44 0" ${sw}/><path d="M32 44 44 28" ${sw}/><circle cx="32" cy="44" r="4" fill="currentColor"/><path d="M16 30l3 2M48 30l-3 2M32 22v4" ${sw}/>`),
  },
  {
    id: 'lane', name: 'Lane departure / lane assist light', severity: 'info',
    match: /lane|\blda\b|\blta\b|\bldw\b|\blka\b|road departure/,
    meaning: 'Shows the state of the lane keeping system. Amber usually means it is unavailable or has a fault.',
    action: 'If amber, clean the windshield in front of the camera. If it stays amber, have it checked.',
    svg: S(`${carRear(32, 22, 0.9)}<path d="M10 56 18 10M54 56 46 10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 6"/>`),
  },
  {
    id: 'pre-collision', name: 'Pre-collision / forward collision light', severity: 'info',
    match: /pre-?collision|\bpcs\b|forward collision|collision warning|emergency braking|\bfca\b|\bfcw\b|forward safety|automatic braking|\brab\b|\bpksb\b|parking support brake|\baeb\b/,
    meaning: 'The collision warning or automatic emergency braking system is off or unavailable.',
    action: 'Clean the windshield and front grille sensor. If it stays on in clear weather, have it checked.',
    svg: S(`${carRear(22, 36, 0.8)}<path d="M38 16 46 8l2 10 10-2-6 8 8 6-10 2 2 10-8-6-6 8" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/>`),
  },
  {
    id: 'blind-spot', name: 'Blind spot monitor light', severity: 'info',
    match: /blind spot|\bbsm\b|\bbsd\b|\bbca\b|rear cross traffic|\brcta\b|\brcd\b/,
    meaning: 'The blind spot monitor is off or not available.',
    action: 'Clean the rear bumper corners where the sensors sit. If it stays on, have it checked.',
    svg: S(`${carRear(22, 22, 0.8)}${carRear(44, 40, 0.8)}<path d="M8 56l8-8" ${sw}/>`),
  },
  {
    id: 'key', name: 'Key / immobilizer light', severity: 'info',
    match: /\bkey\b|immobili[sz]er|security indicator|smart key|i-key|intelligent key|theft/,
    meaning: 'The car can\'t detect the key, the key battery is low, or the security system is armed.',
    action: 'Hold the key fob against the start button and start again. If it keeps happening, replace the key fob battery.',
    product: { label: 'key fob battery', q: 'CR2032 battery' },
    svg: S(`${carSide}<circle cx="31" cy="27" r="4" ${sw}/><path d="M35 27h9M41 27v4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`),
  },
  {
    id: 'washer-fluid', name: 'Low washer fluid light', severity: 'info',
    match: /washer/,
    meaning: 'The windshield washer fluid is low.',
    action: 'Top up the washer reservoir with screen wash.',
    product: { label: 'washer fluid', q: 'windshield washer fluid' },
    svg: S(`<path d="M8 16c16-6 32-6 48 0l-6 26c-12-4-24-4-36 0z" ${sw}/><path d="M32 52v-6M24 54l2-8M40 54l-2-8" ${sw}/><path d="M20 26c4 4 8 6 12 6M32 32c4 0 8-2 12-6" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="3 4"/>`),
  },
  {
    id: 'glow-plug', name: 'Glow plug light (diesel)', severity: 'info',
    match: /glow plug|preheat/,
    meaning: 'The diesel glow plugs are warming up. Flashing while driving means an engine fault.',
    action: 'Wait for it to go out before starting. If it flashes while driving, have it checked.',
    svg: S(`<path d="M8 26c0-6 4-8 8-8M56 26c0-6-4-8-8-8M8 26v12M56 26v12M8 38c0 6 4 8 8 8M56 38c0 6-4 8-8 8" ${sw}/><path d="M18 32c3-6 6 6 9 0s6 6 9 0 6 6 9 0" ${sw}/>`),
  },
  {
    id: 'four-wheel-drive', name: '4WD / AWD light', severity: 'info',
    match: /4wd|awd|4x4|four.wheel|all.wheel|4lo|diff(erential)? lock|center diff/,
    meaning: 'Shows which drive mode is selected, or warns of a fault in the 4WD/AWD system if amber.',
    action: 'If amber or flashing, the system has a fault or is overheating: drive gently and have it checked.',
    svg: S(txt('4WD', 18, 39)),
  },
  {
    id: 'maintenance', name: 'Maintenance required light', severity: 'info',
    match: /maint(enance)? req|service (due|required|reminder)|\bmaint\b|wrench|scheduled maintenance/,
    meaning: 'A scheduled service is due, based on time or mileage. It is a reminder, not a fault.',
    action: 'Book the service. The reminder is reset afterwards, either by the garage or by you (see the manual).',
    svg: S(`<path d="M44 8a12 12 0 0 0-14 16L10 44a5 5 0 0 0 8 8l20-20a12 12 0 0 0 16-14l-7 7-7-2-2-7z" ${sw}/>`),
  },
  {
    id: 'transmission', name: 'Transmission warning light', severity: 'soon',
    match: /transmission|\bat oil\b|\bcvt\b|gear ?box|shift/,
    meaning: 'The transmission is overheating or has a fault.',
    action: 'Pull over and let it cool with the engine idling. If the light stays on, have it checked before driving far.',
    svg: S(`<circle cx="30" cy="30" r="12" ${sw}/><path d="M30 10v6M30 44v6M10 30h6M44 30h6M16 16l4 4M40 40l4 4M16 44l4-4M40 20l4-4" ${sw}/><path d="M48 44v10" ${sw}/><circle cx="48" cy="58" r="2.5" fill="currentColor"/>`),
  },
  {
    id: 'eco', name: 'ECO mode indicator', severity: 'info',
    match: /\beco\b/,
    meaning: 'Eco driving mode is on, or you are driving economically.',
    action: 'Nothing to do.',
    svg: S(txt('ECO', 19, 39)),
  },
  {
    id: 'ready', name: 'READY indicator (hybrid)', severity: 'info',
    match: /\bready\b/,
    meaning: 'The hybrid system is on and the car can be driven, even if the engine is silent.',
    action: 'Nothing to do. Switch off fully before leaving the car.',
    svg: S(txt('READY', 14.5, 37.5)),
  },
  {
    id: 'ev-charge', name: 'Charging cable connected light', severity: 'info',
    match: /charg(ing)? (cable|connector|plug)|plug-?in|connected/,
    meaning: 'The charging cable is plugged in, so the car will not drive.',
    action: 'Unplug the charging cable before driving.',
    svg: S(`<path d="M20 8v12M34 8v12M14 20h26v12a13 13 0 0 1-26 0z" ${sw}/><path d="M27 45v11h18" ${sw}/>`),
  },
  {
    id: 'hybrid-system', name: 'Hybrid / EV system warning light', severity: 'stop',
    match: /hybrid system|ev system|electric (drive|motor) system|high voltage/,
    meaning: 'The hybrid or electric drive system has a fault.',
    action: 'Stop in a safe place and restart. If the light stays on, call the dealer and avoid driving far.',
    svg: S(`${carSide}${bang(32, 6, 8)}`),
  },
  {
    id: 'low-outside-temp', name: 'Low outside temperature (ice) light', severity: 'info',
    match: /outside temp|\bice warning|\bicy\b|frost|snowflake|freez/,
    meaning: 'The outside temperature is near freezing, so roads may be icy.',
    action: 'Drive carefully, especially on bridges and in shade.',
    svg: S(`<path d="M32 6v52M10 19l44 26M10 45l44-26M26 10l6 6 6-6M26 54l6-6 6 6" ${sw}/>`),
  },
  {
    id: 'parking-sensor', name: 'Parking sensor light', severity: 'info',
    match: /parking (sensor|assist|support)|clearance sonar|intuitive parking|\bpdw\b|sonar/,
    meaning: 'The parking sensors are on, switched off, or dirty.',
    action: 'If it warns of a fault, clean the bumper sensors.',
    svg: S(`${carRear(26, 30, 0.9)}<path d="M46 20c4 4 4 16 0 20M52 16c6 6 6 22 0 28" ${sw}/>`),
  },
  {
    id: 'hill-descent', name: 'Hill descent / downhill assist light', severity: 'info',
    match: /hill descent|downhill|crawl/,
    meaning: 'Hill descent control is on and will hold a slow speed going downhill.',
    action: 'Nothing to do. It flashes while it is braking.',
    svg: S(`<path d="M6 56 58 26" ${sw}/><g transform="rotate(-30 32 34)"><path d="M14 36v-6l5-1 4-7h14l7 7 6 1v6z" ${sw}/><circle cx="22" cy="38" r="4" fill="currentColor"/><circle cx="42" cy="38" r="4" fill="currentColor"/></g>`),
  },
  {
    id: 'dpf', name: 'Diesel particulate filter light', severity: 'soon',
    match: /particulate|\bdpf\b|exhaust filter|\bgpf\b/,
    meaning: 'The exhaust soot filter is getting full and needs to clean itself.',
    action: 'Drive at steady highway speed for 15 to 20 minutes to let it regenerate. If it stays on, see a garage.',
    svg: S(`<rect x="10" y="18" width="44" height="28" rx="6" ${sw}/><circle cx="22" cy="32" r="2.5" fill="currentColor"/><circle cx="32" cy="28" r="2.5" fill="currentColor"/><circle cx="42" cy="34" r="2.5" fill="currentColor"/><circle cx="28" cy="38" r="2.5" fill="currentColor"/>`),
  },
  {
    id: 'adblue', name: 'DEF / AdBlue light', severity: 'soon',
    match: /\bdef\b|diesel exhaust fluid|adblue|urea/,
    meaning: 'The diesel exhaust fluid (DEF) tank is low, or the system has a fault. When it runs out the car may not restart.',
    action: 'Top up with diesel exhaust fluid soon.',
    product: { label: 'diesel exhaust fluid', q: 'diesel exhaust fluid' },
    svg: S(`<path d="M8 22h18l6 6h24M8 22v20h18l6-6h24" ${sw}/><path d="M46 46c0 4-3 7-6 7s-6-3-6-7 6-10 6-10 6 6 6 10z" fill="currentColor"/>`),
  },
  {
    id: 'driver-attention', name: 'Driver attention / take a break light', severity: 'info',
    match: /attention|drowsi|fatigue|take a break|coffee/,
    meaning: 'The car thinks you are getting tired, from your steering pattern.',
    action: 'Take a break at the next safe place.',
    svg: S(`<path d="M12 26h32v12a14 14 0 0 1-14 14h-4a14 14 0 0 1-14-14z" ${sw}/><path d="M44 30h4a6 6 0 0 1 0 12h-6M22 8c-3 4 3 8 0 12M32 8c-3 4 3 8 0 12" ${sw}/>`),
  },
];

export const byId = new Map(SYMBOLS.map((s) => [s.id, s]));

// Most manuals show colour only in the icon, so when the export has no colour we use the usual one
// for that light and say so on the page.
const USUAL: Record<string, Colour> = {
  'high-beam': 'blue', 'auto-high-beam': 'green', 'master-warning': 'amber', 'low-outside-temp': 'amber',
  'stability': 'amber', 'stability-off': 'amber', 'key': 'amber', 'parking-brake': 'red', 'lane': 'amber',
  'pre-collision': 'amber', 'blind-spot': 'amber', 'maintenance': 'amber', 'washer-fluid': 'amber', 'glow-plug': 'amber',
  'door-open': 'red', 'hood-open': 'red', 'trunk-open': 'red', 'rear-fog': 'amber', 'four-wheel-drive': 'green',
  'ev-charge': 'amber', 'parking-sensor': 'amber', 'driver-attention': 'amber',
};
export const usualColour = (s: Symbol | null): Colour =>
  s ? USUAL[s.id] ?? (s.severity === 'stop' ? 'red' : s.severity === 'soon' ? 'amber' : 'green') : 'amber';

/** Best symbol for a manual label, or null when nothing fits (shown with a plain generic icon). */
export function matchSymbol(label: string): Symbol | null {
  const l = label.toLowerCase();
  // "OFF" variants first, so "VSC OFF" doesn't become the plain stability light.
  const off = byId.get('stability-off')!;
  if (off.match.test(l)) return off;
  return SYMBOLS.find((s) => s.id !== 'stability-off' && s.match.test(l)) ?? null;
}

export type Colour = 'red' | 'amber' | 'green' | 'blue' | 'white';
export const COLOURS: Record<Colour, { hex: string; name: string; means: string }> = {
  red: { hex: '#E5322D', name: 'Red', means: 'Stop safely and check now' },
  amber: { hex: '#F5A300', name: 'Amber', means: 'Get it checked soon' },
  green: { hex: '#27B04B', name: 'Green', means: 'A system is on' },
  blue: { hex: '#2F7BF2', name: 'Blue', means: 'High beams on' },
  white: { hex: '#E8EEF2', name: 'White', means: 'Information' },
};
export const SEVERITY: Record<Severity, string> = { stop: 'Stop safely', soon: 'Check soon', info: 'Information' };

export function iconSvg(id: string | null, colour: Colour, size = 48, title?: string): string {
  const s = id ? byId.get(id) : null;
  const inner = s?.svg ?? `<circle cx="32" cy="32" r="22" ${sw}/>${bang(32, 21, 14)}`;
  return `<svg class="sym" viewBox="0 0 64 64" width="${size}" height="${size}" style="color:${COLOURS[colour].hex}" ${title ? `role="img" aria-label="${title.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"'}>${inner}</svg>`;
}
