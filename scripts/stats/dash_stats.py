"""Statistics for dashboardsymbolmeanings.com/statistics/ (NHTSA parts; our own light data is computed at build time).

Usage: python3 scripts/stats/dash_stats.py RECALLS_TXT NHTSA_COMPLAINTS_DIR
  RECALLS_TXT: FLAT_RCL_POST_2010.txt from https://static.nhtsa.gov/odi/ffdd/rcl/FLAT_RCL_POST_2010.zip
  NHTSA_COMPLAINTS_DIR: unzipped COMPLAINTS_RECEIVED_*.txt from https://static.nhtsa.gov/odi/ffdd/cmpl/
Writes src/data/stats/*.json and public/data/*.csv.
"""
import sys, os, json, csv, glob
import pandas as pd
UPPER = {"Bmw": "BMW", "Gmc": "GMC", "Mini": "MINI"}
def nice(x): return " ".join(UPPER.get(w, w) for w in x.title().split())

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'src', 'data', 'stats'); os.makedirs(OUT, exist_ok=True)
PUB = os.path.join(ROOT, 'public', 'data'); os.makedirs(PUB, exist_ok=True)
RCL, CMPL = sys.argv[1], sys.argv[2]
def dump(name, obj):
    with open(os.path.join(OUT, name), 'w') as f: json.dump(obj, f, indent=1)
def has(s, p): return s.str.contains(p, regex=True)

# Individual warning lights, searched in complaint and recall text (upper case). "Brake light" alone means the
# rear stop lamps, so only "brake warning/system light" counts as the brake warning light.
LIGHTS = {
    'Check engine light': r'CHECK ENGINE|ENGINE (?:WARNING )?LIGHT|SERVICE ENGINE|MALFUNCTION INDICATOR|\bMIL\b|\bCEL\b',
    'ABS light': r'\bABS\b[^.]{0,25}LIGHT|ANTI-?LOCK[^.]{0,25}LIGHT',
    'Airbag light': r'(?:AIR ?BAG|\bSRS\b)[^.]{0,25}LIGHT',
    'Tire pressure (TPMS) light': r'\bTPMS\b|TIRE PRESSURE[^.]{0,25}LIGHT',
    'Traction or stability control light': r'(?:TRACTION|STABILITY|\bESC\b|\bVSC\b|\bESP\b)[^.]{0,25}LIGHT',
    'Battery or charging light': r'(?:BATTERY|CHARGING)[^.]{0,20}LIGHT',
    'Power steering light': r'(?:POWER STEERING|\bEPS\b)[^.]{0,25}(?:LIGHT|WARNING)',
    'Brake warning light': r'BRAKE (?:SYSTEM )?WARNING LIGHT|BRAKE SYSTEM LIGHT',
    'Oil pressure or oil light': r'OIL[^.]{0,20}LIGHT',
    'Transmission light': r'TRANSMISSION[^.]{0,20}(?:WARNING )?LIGHT',
    'Engine temperature light': r'(?:TEMPERATURE|COOLANT|OVERHEAT)[^.]{0,25}LIGHT',
}
GENERIC = r'WARNING LIGHT|WARNING LAMP|WARNING MESSAGE|WARNING INDICATOR|INDICATOR LIGHT|DASH(?:BOARD)? (?:WARNING )?LIGHTS? (?:CAME|COME|WENT|TURNED|LIT|ILLUMINAT)|TELLTALE'
ANY = '|'.join([GENERIC] + list(LIGHTS.values()))

# ---------- 1. Complaints ----------
names = ['CMPLID', 'ODINO', 'MFR_NAME', 'MAKETXT', 'MODELTXT', 'YEARTXT', 'CRASH', 'FAILDATE', 'FIRE', 'INJURED', 'DEATHS', 'COMPDESC', 'CITY', 'STATE', 'VIN', 'DATEA', 'LDATE', 'MILES', 'OCCURENCES', 'CDESCR', 'CMPL_TYPE'] + [f'f{i}' for i in range(22, 52)]
parts = [pd.read_csv(fp, sep='\t', header=None, names=names, usecols=['ODINO', 'MAKETXT', 'MODELTXT', 'YEARTXT', 'CRASH', 'LDATE', 'CDESCR', 'f46'], quoting=csv.QUOTE_NONE, encoding='latin-1', dtype=str, on_bad_lines='skip') for fp in sorted(glob.glob(os.path.join(CMPL, 'COMPLAINTS_RECEIVED_*.txt')))]
c = pd.concat(parts, ignore_index=True); c = c[c['f46'] == 'V']
c = c.groupby('ODINO').agg(make=('MAKETXT', 'first'), model=('MODELTXT', 'first'), year=('YEARTXT', 'first'), ld=('LDATE', 'first'), crash=('CRASH', 'first'), txt=('CDESCR', 'first')).reset_index()
c['make'] = c['make'].replace({'MERCEDES BENZ': 'MERCEDES-BENZ'})
c['yr'] = c['ld'].str[:4]; c = c[c['yr'].between('2015', '2025')].copy(); c['txt'] = c['txt'].fillna('').str.upper()
t = c['txt']
anyl = has(t, ANY)
per = {k: has(t, p) for k, p in LIGHTS.items()}
cel = per['Check engine light']
stall = has(t, r'STALL|LOSS OF (?:MOTIVE |DRIVE |ENGINE )?POWER|LOST (?:ALL )?POWER|SHUT (?:OFF|DOWN)|LIMP MODE|REDUCED POWER')
multi = has(t, r'ALL (?:THE |OF THE )?(?:WARNING |DASH(?:BOARD)? )?LIGHTS (?:CAME|WENT|LIT|TURNED|ILLUMINAT|CAME ON|FLASH)|MULTIPLE (?:WARNING|DASH)|SEVERAL (?:WARNING|DASH)|CHRISTMAS TREE|LIT UP LIKE|NUMEROUS WARNING|VARIOUS WARNING')
nowarn = has(t, r'NO (?:WARNING|CHECK ENGINE|INDICATOR) LIGHTS?\b|NO WARNING LIGHTS? (?:CAME|WENT|ILLUMINAT|WERE ON|WAS ON)|WITHOUT (?:ANY |A )?WARNING LIGHTS?\b|NO WARNING (?:MESSAGES?|LAMPS?|INDICATORS?)\b|NO LIGHTS? (?:CAME )?ON THE DASH')
cc = {'years': [2015, 2025], 'total': int(len(c)), 'warning': int(anyl.sum()), 'warning_pct': round(100 * anyl.mean(), 1),
      'warning_stall': int((anyl & stall).sum()), 'warning_stall_pct': round(100 * (anyl & stall).sum() / anyl.sum(), 1),
      'multi': int(multi.sum()), 'no_warning': int(nowarn.sum()),
      'cel': int(cel.sum()), 'cel_flash': int((cel & has(t, r'FLASH|BLINK')).sum()),
      'crash_pct_warning': round(100 * (c.loc[anyl, 'crash'] == 'Y').mean(), 1), 'crash_pct_all': round(100 * (c['crash'] == 'Y').mean(), 1)}
cc['lights'] = sorted([{'light': k, 'n': int(v.sum())} for k, v in per.items()], key=lambda x: -x['n'])
cc['by_year'] = {y: {'total': int(len(g)), 'warning': int(anyl[g.index].sum())} for y, g in c.groupby('yr')}
top = c[anyl].groupby(['year', 'make', 'model']).size().sort_values(ascending=False).head(12)
cc['top_model_years'] = [{'model': f'{y} {nice(a)} {nice(b)}', 'n': int(v)} for (y, a, b), v in top.items()]
topc = c[cel].groupby(['year', 'make', 'model']).size().sort_values(ascending=False).head(10)
cc['top_cel_model_years'] = [{'model': f'{y} {nice(a)} {nice(b)}', 'n': int(v)} for (y, a, b), v in topc.items()]
mk = c.groupby('make').size(); mw = c[anyl].groupby('make').size()
tb = pd.DataFrame({'all': mk, 'w': mw}).fillna(0); tb = tb[tb['all'] >= 3000]; tb['pct'] = 100 * tb['w'] / tb['all']
cc['by_make'] = [{'make': nice(m), 'complaints': int(v['all']), 'warning': int(v['w']), 'pct': round(v['pct'], 1)} for m, v in tb.sort_values('pct', ascending=False).iterrows()]
cc['cel_stall'] = int((cel & stall).sum())
cc['cel_by_year'] = {y: int(cel[g.index].sum()) for y, g in c.groupby('yr')}
mc = c[cel].groupby('make').size(); tb2 = pd.DataFrame({'all': mk, 'w': mc}).fillna(0); tb2 = tb2[tb2['all'] >= 3000]; tb2['pct'] = 100 * tb2['w'] / tb2['all']
cc['cel_by_make'] = [{'make': nice(m), 'complaints': int(v['all']), 'cel': int(v['w']), 'pct': round(v['pct'], 1)} for m, v in tb2.sort_values('pct', ascending=False).iterrows()]
dump('light-complaints.json', cc)
with open(os.path.join(PUB, 'check-engine-light-complaints-by-make.csv'), 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['make', 'nhtsa_vehicle_complaints_2015_2025', 'complaints_mentioning_check_engine_light', 'pct'])
    for x in cc['cel_by_make']: w.writerow([x['make'], x['complaints'], x['cel'], x['pct']])
with open(os.path.join(PUB, 'warning-light-complaints-by-make.csv'), 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['make', 'nhtsa_vehicle_complaints_2015_2025', 'complaints_mentioning_warning_light', 'pct'])
    for x in cc['by_make']: w.writerow([x['make'], x['complaints'], x['warning'], x['pct']])

# ---------- 2. Recalls ----------
cols = ['RECORD_ID', 'CAMPNO', 'MAKETXT', 'MODELTXT', 'YEARTXT', 'MFGCAMPNO', 'COMPNAME', 'MFGNAME', 'BGMAN', 'ENDMAN', 'RCLTYPECD', 'POTAFF', 'ODATE', 'INFLUENCED_BY', 'MFGTXT', 'RCDATE', 'DATEA', 'RPNO', 'FMVSS', 'DESC_DEFECT', 'CONEQUENCE_DEFECT', 'CORRECTIVE_ACTION', 'NOTES', 'RCL_CMPT_ID', 'MFR_COMP_NAME', 'MFR_COMP_DESC', 'MFR_COMP_PTNO', 'DO_NOT_DRIVE', 'PARK_OUTSIDE']
r = pd.read_csv(RCL, sep='\t', header=None, names=cols, quoting=csv.QUOTE_NONE, encoding='latin-1', dtype=str, on_bad_lines='skip')
r = r[r['RCLTYPECD'] == 'V'].copy()
r['MFGNAME'] = r['MFGNAME'].fillna('').str.strip().str.rstrip('.').str.strip().str.replace(', LLC', ' LLC', regex=False)
r['pot'] = pd.to_numeric(r['POTAFF'], errors='coerce'); r['yr'] = r['RCDATE'].str[:4]
camp = r.groupby('CAMPNO').agg(yr=('yr', 'first'), pot=('pot', 'max'), mfr=('MFGNAME', 'first'), desc=('DESC_DEFECT', 'first'), cons=('CONEQUENCE_DEFECT', 'first'),
                               fmvss=('FMVSS', lambda s: ' '.join(s.dropna())), comps=('COMPNAME', lambda s: ' | '.join(s.dropna())))
camp = camp[camp['yr'].between('2010', '2025')]
rt = (camp['desc'].fillna('') + ' ' + camp['cons'].fillna('')).str.upper()
lamp = has(rt, r'WARNING LIGHT|WARNING LAMP|TELLTALE|TELL-TALE|INDICATOR LIGHT|INDICATOR LAMP|MALFUNCTION INDICATOR|WARNING INDICATOR|INSTRUMENT (?:PANEL|CLUSTER)')
fail = has(rt, r'(?:MAY|WILL|COULD|DOES|DO|DID|WOULD) NOT (?:ILLUMINATE|DISPLAY|COME ON|TURN ON|ACTIVATE|WORK|FUNCTION|OPERATE)|FAIL(?:S|URE)? TO (?:ILLUMINATE|DISPLAY)|INOPERATIVE|BLANK|GO DARK|RESET|REBOOT')
f101 = camp['fmvss'].str.contains(r'\b101\b', regex=True)
cluster = has(rt, r'INSTRUMENT (?:PANEL|CLUSTER)')
rc = {'years': [2010, 2025], 'campaigns': int(len(camp)), 'lamp': int(lamp.sum()), 'lamp_pct': round(100 * lamp.mean(), 1),
      'lamp_vehicles': int(camp.loc[lamp, 'pot'].sum()), 'lamp_fail': int((lamp & fail).sum()), 'lamp_fail_vehicles': int(camp.loc[lamp & fail, 'pot'].sum()),
      'fmvss101': int(f101.sum()), 'fmvss101_vehicles': int(camp.loc[f101, 'pot'].sum()), 'cluster': int(cluster.sum()), 'cluster_vehicles': int(camp.loc[cluster, 'pot'].sum())}
first5 = camp['yr'].between('2010', '2014'); last5 = camp['yr'].between('2021', '2025')
rc['lamp_2010_2014'] = int((lamp & first5).sum()); rc['lamp_2021_2025'] = int((lamp & last5).sum())
rc['by_year'] = {y: {'campaigns': int(len(g)), 'lamp': int(lamp[g.index].sum()), 'lamp_vehicles': int(camp.loc[g.index[lamp[g.index]], 'pot'].sum())} for y, g in camp.groupby('yr')}
lt = rt[lamp]
rc['lights'] = sorted([{'light': k, 'n': int(has(lt, p).sum())} for k, p in LIGHTS.items()], key=lambda x: -x['n'])
mf = camp[lamp].groupby('mfr').agg(n=('pot', 'size'), veh=('pot', 'sum')).sort_values('n', ascending=False).head(12)
rc['by_mfr'] = [{'mfr': k, 'campaigns': int(v['n']), 'vehicles': int(v['veh'])} for k, v in mf.iterrows()]
dump('light-recalls.json', rc)
with open(os.path.join(PUB, 'warning-light-recalls-by-year.csv'), 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['year_recall_filed', 'all_vehicle_recall_campaigns', 'warning_light_or_cluster_campaigns', 'vehicles_potentially_affected'])
    for y, v in rc['by_year'].items(): w.writerow([y, v['campaigns'], v['lamp'], v['lamp_vehicles']])
print('ok', cc['warning'], rc['lamp'])
