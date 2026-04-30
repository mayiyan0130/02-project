import math
import os
import random
import statistics
import json

ROUTES = {
    'lanyinxuguo': {
        'label': '兰因絮果',
        'points': (48, 51),
        'prestige': (2500, 2500),
        'favor': (40, 60),
        'trueHeart': (20, 50),
        'stress': 30,
        'route_bias': 10,
        'comp_base': 215,
        'fixed': None,
    },
    'fushengrumeng': {
        'label': '浮生如梦',
        'points': (48, 54),
        'prestige': (50, 900),
        'favor': (0, 40),
        'trueHeart': (0, 60),
        'stress': 0,
        'route_bias': 0,
        'comp_base': 200,
        'fixed': None,
    },
    'yingluoyeting': {
        'label': '影落掖庭',
        'points': (54, 54),
        'prestige': (0, 0),
        'favor': (0, 30),
        'trueHeart': (0, 40),
        'stress': 30,
        'route_bias': -8,
        'comp_base': 188,
        'fixed': None,
    },
    'chenyuansucuo': {
        'label': '尘缘夙错',
        'points': (0, 0),
        'prestige': (1000, 1500),
        'favor': (20, 60),
        'trueHeart': (-20, 20),
        'stress': 40,
        'route_bias': 4,
        'comp_base': 208,
        'fixed': {
            'health': 6,
            'fortune': 3,
            'intrigue': 6.99,
            'appearance': 8.99,
            'temperament': 8,
            'medicine': 5,
            'politics': 4,
            'talent': 6,
        },
    },
}

ALLOC_KEYS = ['health', 'fortune', 'intrigue', 'appearance', 'temperament', 'medicine', 'politics', 'other']
ACTION_KEYS = ['book', 'garden', 'temple', 'train_intrigue', 'train_medicine', 'plot']
DEFAULT_STATS = {
    'health': 2,
    'fortune': 2,
    'intrigue': 2,
    'appearance': 2,
    'temperament': 2,
    'medicine': 0,
    'politics': 0,
    'talent': 0,
}
ROUTE_TARGET_PRESTIGE = {
    'lanyinxuguo': 2600,
    'fushengrumeng': 1400,
    'yingluoyeting': 1700,
    'chenyuansucuo': 1800,
}
RANK_TABLE = [
    ('官女子', 0, 15),
    ('更衣', 30, 20),
    ('答应', 60, 25),
    ('选侍', 100, 30),
    ('御女', 150, 35),
    ('常在', 200, 40),
    ('才人', 250, 45),
    ('美人', 350, 50),
    ('贵人', 450, 55),
    ('嫔', 600, 60),
    ('容华', 750, 65),
    ('婕妤', 900, 70),
    ('贵嫔', 1100, 80),
    ('九嫔', 1300, 100),
    ('妃', 1500, 120),
    ('德淑贤妃', 1800, 150),
    ('贵妃', 2100, 180),
    ('皇贵妃', 2400, 190),
    ('皇后', 2500, 200),
]
COLD_THRESHOLD = -50
COLD_MONTHS_REQUIRED = 2
ROUTE_FAVOR_BONUS = {key: 0 for key in ROUTES}
ROUTE_FAVOR_BONUS['yingluoyeting'] = 8
ROUTE_PRESTIGE_BONUS = {key: 0 for key in ROUTES}
ROUTE_START_PITY = {key: 0 for key in ROUTES}
ROUTE_SUPPORT_STIPEND = {
    'lanyinxuguo': 65,
    'fushengrumeng': 40,
    'yingluoyeting': 55,
    'chenyuansucuo': 50,
}
ROUTE_BASE_SUPPORT = {
    'lanyinxuguo': 0.20,
    'fushengrumeng': 0.40,
    'yingluoyeting': 0.05,
    'chenyuansucuo': 0.10,
}
FAMILY_PROFILES = {
    'merchant': {
        'kind': 'merchant',
        'office_level': 0,
        'monthly_bonus': 0,
        'natural_mod': -3,
        'court_loyalty': 25,
        'demotable': False,
        'start_silver': 800,
    },
    'sixth': {
        'kind': 'official',
        'office_level': 1,
        'monthly_bonus': 2,
        'natural_mod': 0,
        'court_loyalty': 35,
        'demotable': True,
    },
    'fourth': {
        'kind': 'official',
        'office_level': 2,
        'monthly_bonus': 4,
        'natural_mod': 1,
        'court_loyalty': 45,
        'demotable': True,
    },
    'second': {
        'kind': 'official',
        'office_level': 3,
        'monthly_bonus': 6,
        'natural_mod': 2,
        'court_loyalty': 55,
        'demotable': True,
    },
    'first': {
        'kind': 'official',
        'office_level': 4,
        'monthly_bonus': 8,
        'natural_mod': 2,
        'court_loyalty': 65,
        'demotable': True,
    },
    'duke': {
        'kind': 'duke',
        'office_level': 5,
        'monthly_bonus': 10,
        'natural_mod': 3,
        'court_loyalty': 75,
        'demotable': True,
    },
    'sinner': {
        'kind': 'sinner',
        'office_level': 0,
        'monthly_bonus': 0,
        'natural_mod': -5,
        'court_loyalty': 15,
        'demotable': False,
    },
    'foreign_princess': {
        'kind': 'foreign',
        'office_level': 4,
        'monthly_bonus': 6,
        'natural_mod': 1,
        'court_loyalty': 50,
        'demotable': False,
    },
}
ROUTE_RISK_FLOOR = {
    'lanyinxuguo': 0.46,
    'fushengrumeng': 0.48,
    'yingluoyeting': 0.50,
    'chenyuansucuo': 0.46,
}
ROUTE_PLOT_BONUS = {
    'lanyinxuguo': 0.22,
    'fushengrumeng': 0.22,
    'yingluoyeting': 0.20,
    'chenyuansucuo': 0.24,
}
ROUTE_PLOT_TARGET = {
    'lanyinxuguo': (8, 12),
    'fushengrumeng': (9, 13),
    'yingluoyeting': (10, 14),
    'chenyuansucuo': (8, 12),
}
NPC_COUNT = 10
SIM_MONTHS = 36
TRAIN_SEEDS = [11, 23, 37]
VALID_SEEDS = [101 + i * 13 for i in range(8)]
DIM = 16
POP = 24
GENS = 18
CACHE = {}


def clamp(v, lo, hi):
    return lo if v < lo else hi if v > hi else v


def bucket_weight(favor):
    if favor <= 0:
        return 0
    if favor <= 20:
        return 10
    if favor <= 40:
        return 20
    if favor <= 60:
        return 35
    if favor <= 80:
        return 50
    return 65


def decode(theta):
    alloc_raw = [max(1e-6, x) for x in theta[:8]]
    total = sum(alloc_raw)
    alloc = {k: v / total for k, v in zip(ALLOC_KEYS, alloc_raw)}
    actions = {k: theta[8 + i] for i, k in enumerate(ACTION_KEYS)}
    risk = theta[14]
    ambition = theta[15]
    return alloc, actions, risk, ambition


def allocate_points(points_total, alloc, base_stats):
    floats = {k: points_total * alloc[k] for k in ALLOC_KEYS}
    ints = {k: int(math.floor(v)) for k, v in floats.items()}
    remaining = points_total - sum(ints.values())
    if remaining > 0:
        fracs = sorted(((floats[k] - ints[k], k) for k in ALLOC_KEYS), reverse=True)
        for _, key in fracs[:remaining]:
            ints[key] += 1
    stats = dict(base_stats)
    for key in ['health', 'fortune', 'intrigue', 'appearance', 'temperament', 'medicine', 'politics']:
        stats[key] = stats.get(key, 0) + ints[key]
    return stats


def scaled_stats(route_id, theta, rng):
    route = ROUTES[route_id]
    if route['fixed'] is not None:
        raw = dict(route['fixed'])
        politics_cap = 40 if route_id in ('lanyinxuguo', 'chenyuansucuo') else 20
        return {
            'health': raw['health'] * 65,
            'fortune': clamp(int(round(raw['fortune'] * 12)), -99, 100),
            'intrigue': int(round(raw['intrigue'] * 100)),
            'appearance': int(round(raw['appearance'] * 100)),
            'temperament': int(round(raw['temperament'] * 100)),
            'medicine': min(50, int(round(raw['medicine'] * 10))),
            'politics': min(politics_cap, int(round(raw['politics'] * 10))),
            'talent': int(round(raw.get('talent', 0) * 10)),
        }
    points_total = rng.randint(*route['points'])
    alloc, _, _, _ = decode(theta)
    stats = allocate_points(points_total, alloc, DEFAULT_STATS)
    politics_cap = 40 if route_id in ('lanyinxuguo', 'chenyuansucuo') else 20
    return {
        'health': stats['health'] * 55,
        'fortune': clamp(int(round(stats['fortune'] * 5)), -99, 100),
        'intrigue': int(round(stats['intrigue'] * 100)),
        'appearance': int(round(stats['appearance'] * 100)),
        'temperament': int(round(stats['temperament'] * 100)),
        'medicine': min(50, int(round(stats['medicine'] * 10))),
        'politics': min(politics_cap, int(round(stats['politics'] * 10))),
        'talent': int(round(stats.get('talent', 0) * 10)),
    }


def monthly_prestige_delta(favor, had_night, family_natural_mod=0):
    if favor < 20:
        delta = -15
    elif favor < 40:
        delta = -5
    elif favor < 60:
        delta = 5
    elif favor < 80:
        delta = 10
    else:
        delta = 15
    if favor < 40 and not had_night:
        delta -= 5
    return delta + family_natural_mod


def target_rank_idx(prestige):
    idx = 0
    for i, (_name, threshold, _wage) in enumerate(RANK_TABLE):
        if prestige >= threshold:
            idx = i
        else:
            break
    return idx


def rank_name(rank_idx):
    return RANK_TABLE[rank_idx][0]


def rank_wage(rank_idx):
    return RANK_TABLE[rank_idx][2]


def spend_silver(state, amount, bucket):
    amount = max(0.0, float(amount))
    if amount <= 0:
        return 0.0
    paid = min(state['silver'], amount)
    state['silver'] -= paid
    state['silver_spent'] += paid
    state[bucket] += paid
    return paid


def monthly_admin_cost(rank_idx, favor):
    wage = rank_wage(rank_idx)
    base = math.floor(wage * 0.2)
    if favor >= 61:
        base += math.floor(wage * 0.1)
    return base


def child_monthly_cost(child):
    return 20 if child['age_months'] < 36 else 35


def child_ceremony_cost(age_months):
    if age_months == 1:
        return 180
    if age_months == 12:
        return 260
    if age_months == 24:
        return 320
    return 0


def pick_family_profile(route_id, rng):
    if route_id == 'lanyinxuguo':
        return dict(FAMILY_PROFILES['duke'])
    if route_id == 'yingluoyeting':
        return dict(FAMILY_PROFILES['sinner'])
    if route_id == 'chenyuansucuo':
        return dict(FAMILY_PROFILES['foreign_princess'])
    family_key = rng.choice(['merchant', 'sixth', 'fourth', 'first'])
    return dict(FAMILY_PROFILES[family_key])


def family_demote_penalty(level):
    return {1: 50, 2: 90, 3: 130, 4: 180, 5: 240}.get(level, 0)


def family_monthly_bonus_for_level(level):
    return {0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 10}.get(level, 0)


def route_scrutiny_rate(route_id, state):
    rate = 0.045 + max(0.0, state['plot_attempts'] - 1) * 0.009 + max(0.0, 40 - state['favor']) / 220.0
    if state['favor'] >= 70:
        rate += 0.012
    if state['favor'] >= 85:
        rate += 0.018
    if state['favor'] >= 95:
        rate += 0.012
    if state['trueHeart'] >= 60:
        rate += 0.010
    if state['trueHeart'] >= 80:
        rate += 0.015
    if state['rank_idx'] >= target_rank_idx(900):
        rate += 0.010
    if state['rank_idx'] >= target_rank_idx(1500):
        rate += 0.020
    if state['rank_idx'] >= target_rank_idx(2400):
        rate += 0.035
    if state['support_factor'] >= 1.0:
        rate += 0.010
    if route_id == 'lanyinxuguo':
        rate += 0.055
    elif route_id == 'fushengrumeng':
        rate += 0.035
    elif route_id == 'yingluoyeting':
        rate += 0.030
    elif route_id == 'chenyuansucuo':
        rate += 0.040
    return clamp(rate, 0.06, 0.32)


def route_scrutiny_shift(route_id, state):
    shift = 0.0
    if state['favor'] >= 70:
        shift += 4
    if state['favor'] >= 85:
        shift += 6
    if state['trueHeart'] >= 60:
        shift += 3
    if state['trueHeart'] >= 80:
        shift += 5
    if state['rank_idx'] >= target_rank_idx(1500):
        shift += 5
    if state['rank_idx'] >= target_rank_idx(2400):
        shift += 10
    if route_id == 'lanyinxuguo':
        shift += 12
    elif route_id == 'fushengrumeng':
        shift += 7
    elif route_id == 'yingluoyeting':
        shift += 6
    elif route_id == 'chenyuansucuo':
        shift += 10
    return shift


def framer_known_rate(route_id, state):
    rate = 0.42 + state['politics'] / 280.0 + state['intrigue'] / 3200.0
    if state['rank_idx'] >= target_rank_idx(2400):
        rate -= 0.05
    if route_id == 'lanyinxuguo':
        rate -= 0.12
    elif route_id == 'fushengrumeng':
        rate -= 0.04
    elif route_id == 'chenyuansucuo':
        rate -= 0.08
    elif route_id == 'yingluoyeting':
        rate += 0.04
    return clamp(rate, 0.30, 0.85)


def register_child(state):
    child = {
        'age_months': 0,
        'public_father': state['preg_public_father'] or 'emperor',
        'bio_father': state['preg_bio_father'] or 'emperor',
        'secret': bool(state['preg_secret']),
    }
    state['children'].append(child)
    if child['secret']:
        state['secret_births'] += 1


def reset_pregnancy_flags(state):
    state['preg_public_father'] = None
    state['preg_bio_father'] = None
    state['preg_secret'] = False


def court_support_gain(politics, spend):
    if politics < 20:
        return 0.0
    if politics < 40:
        return {180: 2.0, 320: 4.0}.get(spend, 0.0)
    if politics < 60:
        return {180: 3.0, 320: 5.0, 500: 8.0}.get(spend, 0.0)
    return {180: 3.0, 320: 6.0, 500: 10.0}.get(spend, 0.0)


def family_scheme_gain(spend, politics):
    if spend == 120:
        return 12.0, 0.04, 0.6 if politics >= 20 else 0.0
    return 0.0, 0.0, 0.0


def initial_rank_idx(route_id, prestige):
    if route_id == 'lanyinxuguo':
        return target_rank_idx(2500)
    if route_id == 'yingluoyeting':
        return target_rank_idx(0)
    if route_id == 'chenyuansucuo':
        return max(target_rank_idx(prestige), target_rank_idx(1100))
    return target_rank_idx(prestige)


def mood_sleep_rate(mood):
    if mood <= -50:
        return 50
    if mood <= 0:
        return 35
    if mood <= 20:
        return 25
    if mood <= 50:
        return 15
    if mood <= 70:
        return 10
    return 5


def maybe_trigger_cold(state, event=False):
    state['cold_triggers'] += 1
    if event:
        state['event_cold'] += 1
    else:
        state['natural_cold'] += 1
    state['score'] -= 220
    state['prestige'] = max(100, state['prestige'] + 120)
    state['favor'] = max(0, state['favor'] - 12)
    state['trueHeart'] -= 5
    state['cold_lock_xun'] = max(state['cold_lock_xun'], 3)
    state['neg_months'] = 0


def simulate_route(route_id, theta, seed):
    rng = random.Random(seed)
    route = ROUTES[route_id]
    _, actions, risk, ambition = decode(theta)
    risk = max(risk, ROUTE_RISK_FLOOR[route_id])
    stats = scaled_stats(route_id, theta, rng)
    family = pick_family_profile(route_id, rng)
    start_prestige = rng.randint(*route['prestige']) if route['prestige'][0] != route['prestige'][1] else route['prestige'][0]
    start_prestige += ROUTE_PRESTIGE_BONUS.get(route_id, 0)
    start_silver = {
        'lanyinxuguo': 1000,
        'fushengrumeng': rng.randint(300, 800),
        'yingluoyeting': 50,
        'chenyuansucuo': 1000,
    }[route_id]
    if route_id == 'fushengrumeng' and 'start_silver' in family:
        start_silver = family['start_silver']
    current_rank_idx = initial_rank_idx(route_id, start_prestige)
    state = {
        'prestige': float(start_prestige),
        'favor': float(clamp(rng.randint(*route['favor']) + ROUTE_FAVOR_BONUS.get(route_id, 0), -100, 100)),
        'trueHeart': float(rng.randint(*route['trueHeart'])),
        'silver': float(start_silver),
        'rank_idx': current_rank_idx,
        'support_factor': ROUTE_BASE_SUPPORT[route_id],
        'mood': 35.0,
        'stress': float(route['stress']),
        'health': float(stats['health']),
        'fortune': float(stats['fortune']),
        'intrigue': float(stats['intrigue']),
        'appearance': float(stats['appearance']),
        'temperament': float(stats['temperament']),
        'medicine': float(stats['medicine']),
        'politics': float(stats['politics']),
        'talent': float(stats['talent']),
        'pity': float(ROUTE_START_PITY.get(route_id, 0)),
        'prev_interest': 20.0,
        'ambition_value': float(45 + ambition * 35 + (8 if route_id in ('lanyinxuguo', 'chenyuansucuo') else 0)),
        'pregnant': False,
        'preg_xun': 0,
        'fertility_cd': 0,
        'permanent_infertility': False,
        'births': 0,
        'secret_births': 0,
        'children': [],
        'preg_public_father': None,
        'preg_bio_father': None,
        'preg_secret': False,
        'court_support': 0.0,
        'plot_attempts': 0,
        'plot_successes': 0,
        'lover_events': 0,
        'affair_pregnancies': 0,
        'cold_triggers': 0,
        'event_cold': 0,
        'natural_cold': 0,
        'cold_lock_xun': 0,
        'neg_months': 0,
        'silver_spent': 0.0,
        'admin_spent': 0.0,
        'court_spent': 0.0,
        'family_spent': 0.0,
        'child_spent': 0.0,
        'gift_spent': 0.0,
        'case_spent': 0.0,
        'event_spent': 0.0,
        'case_interventions': 0,
        'score': 0.0,
        'family_kind': family['kind'],
        'family_office_level': family['office_level'],
        'family_office_start': family['office_level'],
        'family_monthly_bonus': family['monthly_bonus'],
        'family_natural_mod': family['natural_mod'],
        'family_demotable': family['demotable'],
        'family_relief_bonus': 0.0,
        'family_lobby_bonus': 0.0,
        'court_loyalty': float(family['court_loyalty']),
        'tiger_tally': False,
        'power_investment': 0.0,
        'npc_plot_hits': 0,
    }
    target_prestige = ROUTE_TARGET_PRESTIGE[route_id] + ambition * 350
    start_intrigue = state['intrigue']
    start_appearance = state['appearance']
    start_temperament = state['temperament']
    start_medicine = state['medicine']
    start_politics = state['politics']
    start_fortune = state['fortune']
    for _month in range(SIM_MONTHS):
        month_had_night = False
        month_plotted = False
        for _xun in range(3):
            if state['pregnant']:
                state['preg_xun'] += 1
                state['prestige'] += 10
            state['stress'] = clamp(state['stress'] + rng.uniform(-2, 3), 0, 100)
            night_bonus = 0
            if state['cold_lock_xun'] > 0:
                state['cold_lock_xun'] -= 1
                state['fortune'] = clamp(state['fortune'] + 1, -99, 100)
                state['intrigue'] += 4
                state['medicine'] += 0.5
                state['court_support'] = max(0.0, state['court_support'] - 0.6)
                state['score'] += 1
                continue

            low_favor = max(0.0, (50 - state['favor']) / 50)
            low_fortune = max(0.0, (35 - state['fortune']) / 35)
            intrigue_gap = max(0.0, (700 - state['intrigue']) / 700)
            medicine_gap = max(0.0, (70 - state['medicine']) / 70)
            prestige_gap = max(0.0, (target_prestige - state['prestige']) / max(500.0, target_prestige))
            plot_gap = max(0.0, (6 - state['plot_attempts']) / 6)
            silver_ready = min(1.0, state['silver'] / 250.0)
            can_plot = (not state['pregnant']) and (not month_plotted)
            scores = {
                'book': actions['book'] + 0.55 * low_favor + 0.18 * max(0.0, (60 - state['trueHeart']) / 60) + 0.18 * ambition + 0.10 * max(0.0, (60 - state['politics']) / 60),
                'garden': actions['garden'] + 0.45 * low_favor + 0.18 * max(0.0, (800 - state['appearance']) / 800) + 0.10 * max(0.0, 0.8 - state['support_factor']),
                'temple': actions['temple'] + 0.72 * low_fortune + 0.15 * low_favor + 0.08 * max(0.0, 120 - state['silver']) / 120,
                'train_intrigue': actions['train_intrigue'] + 0.55 * intrigue_gap + 0.10 * ambition,
                'train_medicine': actions['train_medicine'] + 0.55 * medicine_gap + 0.08 * risk,
                'plot': (actions['plot'] + ROUTE_PLOT_BONUS[route_id] + 0.55 * risk + 0.45 * prestige_gap + 0.22 * plot_gap + 0.12 * silver_ready + 0.08 * max(state['medicine'] / 100, state['intrigue'] / 1000)) if can_plot else -9.0,
            }
            for key in scores:
                scores[key] += rng.uniform(-0.05, 0.05)
            action = max(scores.items(), key=lambda kv: kv[1])[0]
            if action == 'book':
                access_rate = clamp(0.20 + max(0, state['favor']) / 180 + max(0, state['trueHeart']) / 240 + (0.12 if state['prestige'] >= 1000 else 0), 0.20, 0.85)
                if state['rank_idx'] < target_rank_idx(1500) and state['silver'] >= 10:
                    spend_silver(state, 10, 'court_spent')
                    access_rate = clamp(access_rate + 0.25, 0.20, 0.95)
                if rng.random() < access_rate:
                    night_bonus += 15
                    state['politics'] = clamp(state['politics'] + rng.uniform(1.0, 3.0), 0, 100)
                    state['trueHeart'] = clamp(state['trueHeart'] + 0.4, -100, 100)
                    state['support_factor'] = clamp(state['support_factor'] + 0.03, 0.0, 2.0)
                    if state['politics'] >= 20 and _month >= 6:
                        network_gain = 1.5 + state['politics'] / 18 + max(0, state['favor'] - 50) / 30
                        if route_id in ('lanyinxuguo', 'chenyuansucuo'):
                            network_gain *= 1.15
                        state['court_support'] += network_gain
                        state['court_loyalty'] = clamp(state['court_loyalty'] + network_gain * 0.35, 0, 100)
                        state['prestige'] += network_gain * 2.3
                        state['score'] += network_gain * 3.0
                else:
                    state['politics'] = clamp(state['politics'] + 0.5, 0, 100)
            elif action == 'garden':
                night_bonus += 10
                state['appearance'] = clamp(state['appearance'] + 5, 0, 1000)
                state['temperament'] = clamp(state['temperament'] + 5, 0, 1000)
                state['support_factor'] = clamp(state['support_factor'] + 0.05, 0.0, 2.0)
            elif action == 'temple':
                night_bonus += 10
                if not state['permanent_infertility']:
                    state['fortune'] = clamp(state['fortune'] + 3, -99, 100)
                state['mood'] = clamp(state['mood'] + 1, -100, 100)
            elif action == 'train_intrigue':
                state['intrigue'] = clamp(state['intrigue'] + 15, 0, 1000)
            elif action == 'train_medicine':
                state['medicine'] = clamp(state['medicine'] + 2.0, 0, 100)
            elif action == 'plot':
                month_plotted = True
                state['plot_attempts'] += 1
                poison_pref = state['medicine'] >= state['intrigue'] / 10 + 10 or (risk > 0.72 and rng.random() < 0.45)
                severity_roll = rng.random() + risk * 0.35 + (0.10 if route_id == 'yingluoyeting' and state['prestige'] < 500 else 0)
                if severity_roll < 0.45:
                    sev = 'light'
                elif severity_roll < 0.9:
                    sev = 'mid'
                else:
                    sev = 'heavy'
                event_mod = {'light': 0, 'mid': 5, 'heavy': 10}[sev]
                hide_mod = {'light': 5, 'mid': 10, 'heavy': 15}[sev]
                base_pen = {'light': 150, 'mid': 350, 'heavy': 750}[sev]
                target_intrigue = clamp(rng.gauss(480 + route['comp_base'] * 0.3, 120), 150, 1000)
                target_favor = clamp(rng.gauss(42, 16), 5, 100)
                target_medicine = clamp(rng.gauss(45, 15), 0, 100)
                if poison_pref:
                    attack = state['medicine']
                    defense = target_intrigue / 10 + target_favor / 20 + target_medicine / 4
                    fortune_cost = 10
                    success_gain = {'light': 70, 'mid': 125, 'heavy': 190}[sev]
                    poison_cost = {
                        'light': 70 if state['medicine'] >= 50 else 150,
                        'mid': 100 if state['medicine'] >= 60 else 250,
                        'heavy': 200 if state['medicine'] >= 70 else 500,
                    }[sev]
                else:
                    attack = state['intrigue'] / 10
                    defense = target_intrigue / 10 + target_favor / 20
                    fortune_cost = 5
                    success_gain = {'light': 50, 'mid': 105, 'heavy': 150}[sev]
                    poison_cost = 0
                if state['silver'] < poison_cost:
                    poison_pref = False
                    attack = state['intrigue'] / 10
                    defense = target_intrigue / 10 + target_favor / 20
                    fortune_cost = 5
                    success_gain = {'light': 50, 'mid': 105, 'heavy': 150}[sev]
                    poison_cost = 0
                spend_silver(state, poison_cost, 'case_spent')
                state['fortune'] = -99 if state['permanent_infertility'] else clamp(state['fortune'] - fortune_cost, -99, 100)
                act_rate = clamp((50 + attack - defense - event_mod) / 100.0, 0.10, 0.90)
                hide_rate = clamp((50 + state['intrigue'] / 12 - target_intrigue / 15 + state['favor'] / 8 - hide_mod) / 100.0, 0.05, 0.85)
                success = rng.random() < act_rate
                hidden = rng.random() < hide_rate
                state['score'] += 28
                if success:
                    state['plot_successes'] += 1
                    state['prestige'] += success_gain
                    state['score'] += success_gain * 0.22
                    state['silver'] += 10 if sev == 'light' and not poison_pref else 0
                state['support_factor'] = clamp(state['support_factor'] - 0.04, 0.0, 2.0)
                if not hidden:
                    init_guilt = {'light': 20, 'mid': 40, 'heavy': 65}[sev] + (100 - hide_rate * 100) / 2 + max(0, target_favor - 20) / 2 - state['favor'] / 5
                    growth = {'light': 24, 'mid': 42, 'heavy': 60}[sev]
                    bribe_steps = 0
                    if state['prestige'] > 300 and 70 <= init_guilt <= 120 and state['silver'] >= 20:
                        needed_steps = max(0, math.ceil((init_guilt + growth - 95) / 5))
                        bribe_steps = min(int(state['silver'] // 20), needed_steps)
                    bribe = bribe_steps * 5
                    spend_silver(state, bribe_steps * 20, 'case_spent')
                    final_guilt = init_guilt + growth - bribe
                    if final_guilt >= 100:
                        reduction = state['favor'] * 1.2 + 0.06 * (state['appearance'] + state['temperament'])
                        reduction = min(reduction, base_pen * 0.7)
                        add = target_favor * 0.7
                        penalty = max(0, base_pen - reduction + add)
                        state['prestige'] -= penalty
                        state['favor'] = max(-20, state['favor'] - {'light': 2, 'mid': 5, 'heavy': 8}[sev])
                        state['mood'] = clamp(state['mood'] - {'light': 2, 'mid': 4, 'heavy': 8}[sev], -100, 100)
                        if state['prestige'] < 0:
                            maybe_trigger_cold(state, event=True)

            npc_plot_rate = route_scrutiny_rate(route_id, state)
            if state['cold_lock_xun'] == 0 and rng.random() < npc_plot_rate:
                state['npc_plot_hits'] += 1
                sev_roll = rng.random() + npc_plot_rate
                if sev_roll < 0.55:
                    npc_sev = 'light'
                elif sev_roll < 0.95:
                    npc_sev = 'mid'
                else:
                    npc_sev = 'heavy'
                scrutiny_shift = route_scrutiny_shift(route_id, state)
                player_susp = {
                    'light': 62,
                    'mid': 78,
                    'heavy': 92,
                }[npc_sev] - state['favor'] / 6 - max(0, state['trueHeart']) / 10 - state['appearance'] / 120 + scrutiny_shift
                known_framer = rng.random() < framer_known_rate(route_id, state)
                framer_susp = {
                    'light': 52,
                    'mid': 60,
                    'heavy': 68,
                }[npc_sev] + state['intrigue'] / 75 + state['politics'] / 5 + state['support_factor'] * 10
                if route_id == 'lanyinxuguo' or state['rank_idx'] >= target_rank_idx(2400):
                    framer_susp -= 8
                if route_id == 'chenyuansucuo':
                    framer_susp -= 4
                if not known_framer:
                    framer_susp = 0
                player_susp = clamp(player_susp, 25, 120)
                framer_susp = clamp(framer_susp, 0, 120)
                while state['silver'] >= 20:
                    if known_framer and framer_susp >= 100:
                        break
                    if player_susp < 65 and (not known_framer or framer_susp < 80):
                        break
                    spend_silver(state, 20, 'case_spent')
                    state['case_interventions'] += 1
                    if known_framer and (framer_susp >= 85 or (state['intrigue'] >= 600 and framer_susp >= 70 and player_susp < 95)):
                        framer_susp += 5
                    else:
                        player_susp = max(0, player_susp - 5)
                if known_framer and framer_susp >= 100:
                    state['prestige'] += {'light': 18, 'mid': 30, 'heavy': 45}[npc_sev]
                    state['favor'] = clamp(state['favor'] + {'light': 1, 'mid': 2, 'heavy': 3}[npc_sev], -20, 100)
                    state['score'] += {'light': 18, 'mid': 28, 'heavy': 38}[npc_sev]
                elif player_susp >= 100:
                    penalty = {'light': 90, 'mid': 180, 'heavy': 320}[npc_sev]
                    state['prestige'] -= penalty
                    state['favor'] = clamp(state['favor'] - {'light': 2, 'mid': 4, 'heavy': 7}[npc_sev], -20, 100)
                    state['score'] -= {'light': 25, 'mid': 45, 'heavy': 75}[npc_sev]
                    if state['prestige'] < 0:
                        maybe_trigger_cold(state, event=True)
                elif player_susp >= 80:
                    partial_penalty = {'light': 40, 'mid': 90, 'heavy': 160}[npc_sev]
                    state['prestige'] -= partial_penalty
                    state['favor'] = clamp(state['favor'] - {'light': 1, 'mid': 2, 'heavy': 3}[npc_sev], -20, 100)
                    state['score'] -= {'light': 10, 'mid': 18, 'heavy': 28}[npc_sev]

            if state['pregnant'] and state['preg_xun'] >= 24:
                if state['health'] > 400:
                    register_child(state)
                    state['births'] += 1
                    state['score'] += 140
                    state['favor'] = clamp(state['favor'] + 4, -20, 100)
                    state['trueHeart'] = clamp(state['trueHeart'] + 3, -100, 100)
                    state['prestige'] += 40
                elif state['health'] > 200:
                    if rng.random() < 0.05:
                        state['health'] = max(0, state['health'] - 60)
                        state['score'] -= 25
                    else:
                        if rng.random() < 0.30:
                            state['health'] = max(0, state['health'] - 50)
                        register_child(state)
                        state['births'] += 1
                        state['score'] += 130
                        state['favor'] = clamp(state['favor'] + 4, -20, 100)
                        state['trueHeart'] = clamp(state['trueHeart'] + 3, -100, 100)
                        state['prestige'] += 35
                else:
                    if rng.random() < 0.10:
                        state['health'] = max(0, state['health'] - 60)
                        state['appearance'] = max(0, state['appearance'] - 120)
                        state['temperament'] = max(0, state['temperament'] - 120)
                        state['score'] -= 40
                    else:
                        if rng.random() < 0.50:
                            state['health'] = max(0, state['health'] - 50)
                            state['appearance'] = max(0, state['appearance'] - 120)
                        register_child(state)
                        state['births'] += 1
                        state['score'] += 120
                        state['favor'] = clamp(state['favor'] + 3, -20, 100)
                        state['trueHeart'] = clamp(state['trueHeart'] + 2, -100, 100)
                        state['prestige'] += 30
                state['pregnant'] = False
                state['preg_xun'] = 0
                state['fertility_cd'] = 9
                reset_pregnancy_flags(state)

            sleep_rate = mood_sleep_rate(state['mood'])
            if state['favor'] <= 0:
                state['pity'] = min(100, state['pity'] + 2)
            elif rng.random() >= sleep_rate / 100.0:
                base_weight = bucket_weight(state['favor']) + night_bonus + (15 if state['trueHeart'] >= 55 else 0) + route['route_bias']
                competition = clamp(route['comp_base'] + (NPC_COUNT - 6) * 14 + max(0, 35 - state['favor']) * 0.7 - state['prestige'] / 180 + rng.uniform(-18, 18), 90, 360)
                base_prob = (base_weight / max(1.0, base_weight + competition)) * (100 - sleep_rate)
                final_prob = min(100 - sleep_rate, base_prob + state['pity'])
                if rng.random() < final_prob / 100.0:
                    month_had_night = True
                    state['pity'] = 0
                    if state['pregnant']:
                        state['mood'] = clamp(state['mood'] + 3, -100, 100)
                        state['favor'] = clamp(state['favor'] + 2, -20, 100)
                        state['trueHeart'] = clamp(state['trueHeart'] + 2, -100, 100)
                    else:
                        base_interest = max(state['prev_interest'] / 2.0, 70 if state['favor'] >= 81 else 60 if state['favor'] >= 61 else 20)
                        best_gain = max(
                            (state['appearance'] - 600) / 12,
                            (state['temperament'] - 600) / 15,
                            (state['talent'] - 50) / 2,
                            (state['intrigue'] - 500) / 35,
                        )
                        interest = clamp(base_interest + best_gain + rng.gauss(0, 7), 20, 100)
                        state['prev_interest'] = interest
                        if interest < 40:
                            state['mood'] = clamp(state['mood'] - 3, -100, 100)
                            state['favor'] = clamp(state['favor'] - 2, -20, 100)
                            state['trueHeart'] = clamp(state['trueHeart'] - 1, -100, 100)
                        elif interest < 70:
                            state['mood'] = clamp(state['mood'] + 3, -100, 100)
                            state['favor'] = clamp(state['favor'] + 2, -20, 100)
                            state['trueHeart'] = clamp(state['trueHeart'] + 1, -100, 100)
                        elif interest < 90:
                            state['mood'] = clamp(state['mood'] + 5, -100, 100)
                            state['favor'] = clamp(state['favor'] + 4, -20, 100)
                            state['trueHeart'] = clamp(state['trueHeart'] + 2, -100, 100)
                        elif interest < 100:
                            state['mood'] = clamp(state['mood'] + 7, -100, 100)
                            state['favor'] = clamp(state['favor'] + 6, -20, 100)
                            state['trueHeart'] = clamp(state['trueHeart'] + 4, -100, 100)
                        else:
                            state['mood'] = clamp(state['mood'] + 10, -100, 100)
                            state['favor'] = clamp(state['favor'] + 8, -20, 100)
                            state['trueHeart'] = clamp(state['trueHeart'] + 6, -100, 100)
                            state['prestige'] += 10
                            state['score'] += 8
                        if state['fertility_cd'] <= 0 and (not state['permanent_infertility']) and (not state['pregnant']):
                            preg_prob = max(0, state['fortune'])
                            if rng.random() < preg_prob / 100.0:
                                state['pregnant'] = True
                                state['preg_xun'] = 0
                                state['preg_public_father'] = 'emperor'
                                state['preg_bio_father'] = 'emperor'
                                state['preg_secret'] = False
                                state['score'] += 20
                else:
                    state['pity'] = min(100, state['pity'] + 2)
            else:
                state['pity'] = min(100, state['pity'] + 2)

        state['prestige'] += monthly_prestige_delta(state['favor'], month_had_night, state['family_natural_mod'])
        state['prestige'] += state['family_monthly_bonus']
        if not month_plotted and not state['permanent_infertility']:
            state['fortune'] = clamp(state['fortune'] + 5, -99, 100)
        if state['favor'] > 60:
            state['score'] += 10
        target_idx = target_rank_idx(state['prestige'])
        if target_idx > state['rank_idx']:
            state['rank_idx'] = min(target_idx, state['rank_idx'] + 2)
        elif target_idx < state['rank_idx']:
            state['rank_idx'] = max(target_idx, state['rank_idx'] - 2)
        stipend = rank_wage(state['rank_idx'])
        if state['cold_lock_xun'] > 0:
            stipend = 0
        elif state['rank_idx'] < target_rank_idx(1500) and state['favor'] <= 0:
            stipend *= 0.5
        elif state['rank_idx'] < target_rank_idx(1500) and state['favor'] < 20:
            stipend *= 0.7
        if state['favor'] >= 61:
            stipend *= 1.2
        lover_gift = 0.0
        if state['support_factor'] > 0:
            lover_units = min(2.0, state['support_factor'])
            lover_gift = 0.25 * ROUTE_SUPPORT_STIPEND[route_id] * lover_units
        state['silver'] += stipend + lover_gift

        admin_due = monthly_admin_cost(state['rank_idx'], state['favor'])
        paid_admin = spend_silver(state, admin_due, 'admin_spent')
        if paid_admin < admin_due:
            shortage = admin_due - paid_admin
            state['prestige'] -= shortage * 0.8
            state['favor'] = clamp(state['favor'] - 2, -20, 100)
            state['score'] -= 10 + shortage * 0.2

        child_due = 0.0
        for child in state['children']:
            child['age_months'] += 1
            child_due += child_monthly_cost(child)
            ceremony_cost = child_ceremony_cost(child['age_months'])
            if ceremony_cost:
                child_due += ceremony_cost
        if child_due > 0:
            paid_child = spend_silver(state, child_due, 'child_spent')
            if paid_child < child_due:
                shortage_ratio = (child_due - paid_child) / max(1.0, child_due)
                state['prestige'] -= 22 * shortage_ratio * max(1, len(state['children']))
                state['favor'] = clamp(state['favor'] - 2 * shortage_ratio, -20, 100)
                state['score'] -= 18 * shortage_ratio
            else:
                state['score'] += len(state['children']) * 3

        if state['children'] and state['silver'] >= 60 and rng.random() < 0.45:
            nurture_cost = 60
            if state['silver'] >= 260 and (len(state['children']) >= 2 or state['support_factor'] < 0.8):
                nurture_cost = 260
            elif state['silver'] >= 120:
                nurture_cost = 120
            spend_silver(state, nurture_cost, 'child_spent')
            state['score'] += {60: 8, 120: 14, 260: 24}[nurture_cost]
            state['support_factor'] = clamp(state['support_factor'] + {60: 0.02, 120: 0.04, 260: 0.06}[nurture_cost], 0.0, 2.0)
            state['trueHeart'] = clamp(state['trueHeart'] + {60: 0.2, 120: 0.5, 260: 0.8}[nurture_cost], -100, 100)

        if state['silver'] >= 60:
            gift_cost = 0
            if state['favor'] < 35:
                if state['silver'] >= 260 and (_month > 8 or state['support_factor'] < 0.5):
                    gift_cost = 260
                elif state['silver'] >= 150:
                    gift_cost = 150
                else:
                    gift_cost = 80
            elif state['favor'] < 55 or state['support_factor'] < 0.75 or state['trueHeart'] < 15:
                gift_cost = 120 if state['silver'] >= 120 else 60
            if gift_cost:
                spend_silver(state, gift_cost, 'gift_spent')
                favor_gain = {60: 1.5, 80: 2.5, 120: 3.5, 150: 4.5, 260: 6.5}[gift_cost]
                state['favor'] = clamp(state['favor'] + favor_gain, -20, 100)
                state['support_factor'] = clamp(state['support_factor'] + {60: 0.02, 80: 0.03, 120: 0.04, 150: 0.05, 260: 0.08}[gift_cost], 0.0, 2.0)
                state['score'] += {60: 5, 80: 8, 120: 11, 150: 14, 260: 22}[gift_cost]

        if state['politics'] >= 20 and state['silver'] >= 180:
            support_goal = 8 + _month * 0.8 + (4 if route_id in ('lanyinxuguo', 'chenyuansucuo') else 0) + len(state['children']) * 1.2
            support_gap = support_goal - state['court_support']
            if support_gap > 1.0 or (_month > 8 and rng.random() < 0.25):
                if state['politics'] >= 40 and state['silver'] >= 500 and support_gap > 5:
                    court_cost = 500
                elif state['silver'] >= 320 and support_gap > 2.5:
                    court_cost = 320
                else:
                    court_cost = 180
                spend_silver(state, court_cost, 'court_spent')
                gain = court_support_gain(state['politics'], court_cost)
                state['court_support'] += gain
                state['court_loyalty'] = clamp(state['court_loyalty'] + gain * 2.0, 0, 100)
                state['family_lobby_bonus'] += gain * 1.5
                state['prestige'] += gain * 2.4
                state['score'] += gain * 8

        if ((_month + 1) % 3 == 0) and state['silver'] >= 120:
            family_need = max(0.0, (target_prestige - state['prestige']) / max(600.0, target_prestige))
            office_pressure = 0.0
            if _month >= 6:
                office_pressure = max(0.0, state['plot_attempts'] - 2) * 0.4 + max(0.0, 45 - state['favor']) / 40
            if family_need > 0.02 or state['politics'] >= 20 or office_pressure > 0.5:
                family_cost = 120
                spend_silver(state, family_cost, 'family_spent')
                prestige_gain, support_gain, court_gain = family_scheme_gain(family_cost, state['politics'])
                state['prestige'] += prestige_gain
                state['support_factor'] = clamp(state['support_factor'] + support_gain, 0.0, 2.0)
                state['court_support'] += court_gain
                state['family_relief_bonus'] = 10
                state['score'] += prestige_gain * 0.6 + court_gain * 4

        if state['cold_lock_xun'] == 0 and state['silver'] >= 20 and rng.random() < 0.55:
            if state['silver'] >= 80 and (risk > 0.62 or state['support_factor'] > 1.0):
                case_cost = 80
            elif state['silver'] >= 40:
                case_cost = 40
            else:
                case_cost = 20
            effect = {20: 5, 40: 10, 80: 20}[case_cost]
            if state['politics'] < 20 and state['intrigue'] < 500:
                effect = math.floor(effect * 0.7)
            spend_silver(state, case_cost, 'case_spent')
            state['case_interventions'] += 1
            if state['support_factor'] >= 0.9 and rng.random() < 0.55:
                state['support_factor'] = clamp(state['support_factor'] + effect / 220.0, 0.0, 2.0)
                state['score'] += 6 + effect * 0.65
                state['favor'] = clamp(state['favor'] + 1, -20, 100)
            else:
                state['prestige'] += effect * 0.7
                state['score'] += 5 + effect * 0.55
                if rng.random() < 0.25:
                    state['stress'] = clamp(state['stress'] + 3, 0, 100)

        if ((_month + 1) % 6 == 0) and (state['rank_idx'] >= target_rank_idx(1300) or state['politics'] >= 20 or state['children']):
            if state['rank_idx'] >= target_rank_idx(2400) or len(state['children']) >= 3:
                event_cost = 650
            elif state['rank_idx'] >= target_rank_idx(1800) or len(state['children']) >= 1:
                event_cost = 420
            else:
                event_cost = 260
            paid_event = spend_silver(state, event_cost, 'event_spent')
            if paid_event < event_cost:
                shortage = event_cost - paid_event
                state['prestige'] -= max(25, shortage * 0.18)
                state['favor'] = clamp(state['favor'] - 3, -20, 100)
                state['score'] -= 20 + shortage * 0.08
            else:
                state['prestige'] += event_cost * 0.05
                state['score'] += event_cost * 0.04
                if state['politics'] >= 20:
                    state['court_support'] += event_cost / 260.0
                    state['court_loyalty'] = clamp(state['court_loyalty'] + event_cost / 180.0, 0, 100)

        if ((_month + 1) % 12 == 0) and (route_id == 'lanyinxuguo' or state['rank_idx'] >= target_rank_idx(2400) or state['rank_idx'] >= target_rank_idx(1800)):
            paid_festival = spend_silver(state, 260, 'event_spent')
            if paid_festival >= 260:
                state['stress'] = max(0.0, state['stress'] - 10)
                state['ambition_value'] = clamp(state['ambition_value'] + 6, 0, 100)
                state['prestige'] += 20
                state['score'] += 24
            else:
                state['stress'] = clamp(state['stress'] + 8, 0, 100)
                state['prestige'] -= 35
                state['score'] -= 18

        if ((_month + 1) % 3 == 0):
            if _month >= 6:
                enemy_pressure = max(0.0, state['plot_attempts'] - 2) * 3.0 + max(0.0, 45 - state['favor']) / 4.0 + state['event_cold'] * 8.0
                safety = 22 + state['politics'] * 0.25 + state['court_loyalty'] * 0.45 + state['family_relief_bonus'] + state['family_lobby_bonus'] - enemy_pressure
                if state['family_demotable'] and state['family_office_level'] > 0:
                    demote_chance = clamp(45 - safety, 0, 70)
                    if rng.random() < demote_chance / 100.0:
                        old_level = state['family_office_level']
                        state['family_office_level'] = max(0, old_level - 1)
                        state['family_monthly_bonus'] = family_monthly_bonus_for_level(state['family_office_level'])
                        state['prestige'] -= family_demote_penalty(old_level)
                        state['court_loyalty'] = clamp(state['court_loyalty'] - 12, 0, 100)
                        state['score'] -= 55
                if state['family_office_level'] < state['family_office_start'] and state['politics'] >= 20:
                    recover_chance = clamp(safety - 38, 0, 65)
                    if rng.random() < recover_chance / 100.0:
                        state['family_office_level'] += 1
                        state['family_monthly_bonus'] = family_monthly_bonus_for_level(state['family_office_level'])
                        state['prestige'] += 60
                        state['court_loyalty'] = clamp(state['court_loyalty'] + 8, 0, 100)
                        state['score'] += 45
                if state['family_kind'] == 'sinner' and state['family_office_level'] == 0 and state['politics'] >= 20:
                    restore_chance = clamp((state['court_loyalty'] - 50) + state['family_relief_bonus'] + state['family_lobby_bonus'] - enemy_pressure, 0, 55)
                    if rng.random() < restore_chance / 100.0:
                        state['family_office_level'] = 1
                        state['family_monthly_bonus'] = family_monthly_bonus_for_level(1)
                        state['family_demotable'] = True
                        state['prestige'] += 80
                        state['court_loyalty'] = clamp(state['court_loyalty'] + 10, 0, 100)
                        state['score'] += 65
            state['family_relief_bonus'] = 0.0
            state['family_lobby_bonus'] = 0.0

        if _month >= 24 and ambition >= 0.75 and state['politics'] >= 60 and state['silver'] >= 2000 and (route_id in ('lanyinxuguo', 'chenyuansucuo') or state['rank_idx'] >= target_rank_idx(1800)):
            power_cost = 2000
            if state['silver'] >= 6000 and state['court_loyalty'] >= 55:
                power_cost = 6000
            elif state['silver'] >= 4000 and state['court_loyalty'] >= 40:
                power_cost = 4000
            paid_power = spend_silver(state, power_cost, 'event_spent')
            if paid_power >= power_cost:
                state['tiger_tally'] = True if power_cost >= 4000 or rng.random() < 0.60 else state['tiger_tally']
                state['power_investment'] = max(state['power_investment'], power_cost)
                if power_cost == 2000:
                    state['court_loyalty'] = clamp(state['court_loyalty'] + 8, 0, 100)
                    state['ambition_value'] = clamp(state['ambition_value'] + 6, 0, 100)
                    state['score'] += 45
                elif power_cost == 4000:
                    state['court_loyalty'] = clamp(state['court_loyalty'] + 12, 0, 100)
                    state['ambition_value'] = clamp(state['ambition_value'] + 10, 0, 100)
                    state['score'] += 85
                else:
                    state['court_loyalty'] = clamp(state['court_loyalty'] + 20, 0, 100)
                    state['politics'] = clamp(state['politics'] + 15, 0, 100)
                    state['trueHeart'] = clamp(state['trueHeart'] + 20, -100, 100)
                    state['ambition_value'] = clamp(state['ambition_value'] + 15, 0, 100)
                    state['score'] += 135

        state['support_factor'] = clamp(state['support_factor'] + (0.02 if month_had_night else -0.01), 0.0, 2.0)
        if state['politics'] >= 20 and state['court_support'] > 0:
            support_tick = min(12, state['court_support'] * 0.20)
            state['prestige'] += support_tick
            state['score'] += support_tick * 1.6
        state['court_loyalty'] = clamp(state['court_loyalty'] - (1 if month_plotted else 0), 0, 100)
        if state['support_factor'] >= 0.8 and state['cold_lock_xun'] == 0:
            affair_rate = clamp(0.10 + state['support_factor'] * 0.10, 0.10, 0.40)
            if rng.random() < affair_rate:
                state['lover_events'] += 1
                state['score'] += 42
                state['stress'] = max(0.0, state['stress'] - 4)
                state['silver'] += 30
                if state['politics'] >= 20:
                    state['court_support'] += 1.5
                if state['fertility_cd'] <= 0 and (not state['permanent_infertility']) and (not state['pregnant']):
                    preg_prob = max(0, state['fortune']) * 0.35
                    if rng.random() < preg_prob / 100.0:
                        state['pregnant'] = True
                        state['preg_xun'] = 0
                        state['preg_public_father'] = 'emperor'
                        state['preg_bio_father'] = 'lover'
                        state['preg_secret'] = True
                        state['affair_pregnancies'] += 1
                        state['score'] += 25
        state['score'] += max(-20, min(50, (state['prestige'] - start_prestige) * 0.01))
        if state['fertility_cd'] > 0:
            state['fertility_cd'] -= 3
        state['mood'] = clamp(state['mood'] + (8 if state['mood'] < 0 else 3), -100, 100)
        if state['prestige'] < COLD_THRESHOLD:
            state['neg_months'] += 1
        else:
            state['neg_months'] = 0
        if state['neg_months'] >= COLD_MONTHS_REQUIRED:
            maybe_trigger_cold(state, event=False)
        state['score'] += 5

    final_rank_step = state['rank_idx']
    start_rank_step = current_rank_idx
    rank_gain = final_rank_step - start_rank_step
    route_bonus = 0
    if route_id == 'yingluoyeting' and state['prestige'] >= 1500:
        route_bonus += 120
    if route_id == 'lanyinxuguo' and state['prestige'] >= 2200 and state['cold_triggers'] == 0:
        route_bonus += 110
    if route_id == 'chenyuansucuo' and state['favor'] >= 55 and state['trueHeart'] > 0:
        route_bonus += 90
    final_score = (
        state['score']
        + (state['prestige'] - start_prestige) * 0.32
        + state['favor'] * 2.0
        + max(0.0, state['trueHeart']) * 1.4
        + state['births'] * 120
        + state['secret_births'] * 65
        + state['court_support'] * (14 if route_id in ('lanyinxuguo', 'chenyuansucuo') else 10)
        + state['court_loyalty'] * 10
        + state['politics'] * (6 if route_id in ('lanyinxuguo', 'chenyuansucuo') else 4)
        + state['ambition_value'] * 2.4
        + min(8, state['plot_attempts']) * 55
        + state['plot_successes'] * 30
        + min(1500, state['silver']) * 0.08
        + min(7000, state['silver_spent']) * 0.06
        + max(0.0, state['intrigue'] - start_intrigue) * 0.9
        + max(0.0, state['appearance'] - start_appearance) * 0.7
        + max(0.0, state['temperament'] - start_temperament) * 0.6
        + max(0.0, state['medicine'] - start_medicine) * 7
        + max(0.0, state['politics'] - start_politics) * 9
        + max(0.0, state['fortune'] - start_fortune) * 5
        + state['lover_events'] * 45
        + state['case_interventions'] * 18
        + (final_rank_step - start_rank_step) * 95
        + (140 if state['tiger_tally'] else 0)
        + min(state['power_investment'], 6000) * 0.03
        + route_bonus
        - state['cold_triggers'] * 120
        - state['event_cold'] * 60
    )
    if state['cold_triggers'] == 0:
        final_score -= 120
    plot_min, plot_max = ROUTE_PLOT_TARGET[route_id]
    if state['plot_attempts'] < plot_min:
        final_score -= (plot_min - state['plot_attempts']) * 180
    if state['plot_attempts'] > plot_max:
        final_score -= (state['plot_attempts'] - plot_max) * 45
    return {
        'score': final_score,
        'cold': state['cold_triggers'],
        'event_cold': state['event_cold'],
        'natural_cold': state['natural_cold'],
        'favor': state['favor'],
        'prestige': state['prestige'],
        'trueHeart': state['trueHeart'],
        'births': state['births'],
        'silver': state['silver'],
        'silver_spent': state['silver_spent'],
        'admin_spent': state['admin_spent'],
        'court_spent': state['court_spent'],
        'family_spent': state['family_spent'],
        'child_spent': state['child_spent'],
        'gift_spent': state['gift_spent'],
        'case_spent': state['case_spent'],
        'event_spent': state['event_spent'],
        'plots': state['plot_attempts'],
        'rank_gain': rank_gain,
        'lover_events': state['lover_events'],
        'secret_births': state['secret_births'],
        'case_interventions': state['case_interventions'],
        'court_loyalty': state['court_loyalty'],
        'family_office_level': state['family_office_level'],
        'ambition_value': state['ambition_value'],
        'tiger_tally': 1 if state['tiger_tally'] else 0,
        'power_investment': state['power_investment'],
    }


def evaluate(theta, seeds=tuple(TRAIN_SEEDS)):
    key = tuple(round(x, 6) for x in theta) + tuple(seeds)
    if key in CACHE:
        return CACHE[key]
    route_scores = {}
    cold_counts = {}
    event_cold_counts = {}
    for route_id in ROUTES:
        scores = []
        colds = []
        event_colds = []
        for seed in seeds:
            out = simulate_route(route_id, theta, hash((route_id, seed)) & 0xffffffff)
            scores.append(out['score'])
            colds.append(out['cold'])
            event_colds.append(out['event_cold'])
        route_scores[route_id] = statistics.mean(scores)
        cold_counts[route_id] = statistics.mean(colds)
        event_cold_counts[route_id] = statistics.mean(event_colds)
    mean_score = statistics.mean(route_scores.values())
    route_std = statistics.pstdev(route_scores.values())
    mean_cold = statistics.mean(cold_counts.values())
    worst_route = min(route_scores.values())
    fitness = mean_score - 0.32 * route_std - 20 * mean_cold + 0.08 * worst_route
    result = {
        'fitness': fitness,
        'mean_score': mean_score,
        'route_std': route_std,
        'mean_cold': mean_cold,
        'worst_route': worst_route,
        'route_scores': route_scores,
        'cold_counts': cold_counts,
        'event_cold_counts': event_cold_counts,
    }
    CACHE[key] = result
    return result


def rand_theta(rng):
    return [rng.random() for _ in range(DIM)]


def mutate_theta(parent, rng, sigma=0.12, rate=0.25):
    child = parent[:]
    for i in range(DIM):
        if rng.random() < rate:
            child[i] = clamp(child[i] + rng.gauss(0, sigma), 0.0, 1.0)
    return child


def tournament(pop, fits, rng, k=3):
    ids = [rng.randrange(len(pop)) for _ in range(k)]
    return pop[max(ids, key=lambda i: fits[i])]


def run_ga(run_seed):
    rng = random.Random(run_seed)
    pop = [rand_theta(rng) for _ in range(POP)]
    res = [evaluate(tuple(ind)) for ind in pop]
    fits = [r['fitness'] for r in res]
    evals = POP
    best_idx = max(range(POP), key=lambda i: fits[i])
    best = pop[best_idx][:]
    best_res = res[best_idx]
    for _ in range(GENS):
        ranked = sorted(range(POP), key=lambda i: fits[i], reverse=True)
        new_pop = [pop[ranked[0]][:], pop[ranked[1]][:]]
        while len(new_pop) < POP:
            p1 = tournament(pop, fits, rng)
            p2 = tournament(pop, fits, rng)
            alpha = rng.random()
            c1 = [clamp(alpha * a + (1 - alpha) * b, 0.0, 1.0) for a, b in zip(p1, p2)]
            c2 = [clamp((1 - alpha) * a + alpha * b, 0.0, 1.0) for a, b in zip(p1, p2)]
            new_pop.extend([mutate_theta(c1, rng), mutate_theta(c2, rng)])
        pop = new_pop[:POP]
        res = [evaluate(tuple(ind)) for ind in pop]
        fits = [r['fitness'] for r in res]
        evals += POP
        idx = max(range(POP), key=lambda i: fits[i])
        if fits[idx] > best_res['fitness']:
            best = pop[idx][:]
            best_res = res[idx]
    return {'algorithm': 'GA', 'best': best, 'best_res': best_res, 'evals': evals}


def run_de(run_seed):
    rng = random.Random(run_seed)
    pop = [rand_theta(rng) for _ in range(POP)]
    res = [evaluate(tuple(ind)) for ind in pop]
    fits = [r['fitness'] for r in res]
    evals = POP
    for _ in range(GENS):
        for i in range(POP):
            idxs = list(range(POP))
            idxs.remove(i)
            a, b, c = rng.sample(idxs, 3)
            mutant = [clamp(pop[a][j] + 0.72 * (pop[b][j] - pop[c][j]), 0.0, 1.0) for j in range(DIM)]
            trial = pop[i][:]
            jrand = rng.randrange(DIM)
            for j in range(DIM):
                if rng.random() < 0.88 or j == jrand:
                    trial[j] = mutant[j]
            result = evaluate(tuple(trial))
            evals += 1
            if result['fitness'] >= fits[i]:
                pop[i] = trial
                res[i] = result
                fits[i] = result['fitness']
    idx = max(range(POP), key=lambda i: fits[i])
    return {'algorithm': 'DE', 'best': pop[idx][:], 'best_res': res[idx], 'evals': evals}


def run_eda(run_seed):
    rng = random.Random(run_seed)
    pop = [rand_theta(rng) for _ in range(POP)]
    res = [evaluate(tuple(ind)) for ind in pop]
    fits = [r['fitness'] for r in res]
    evals = POP
    for _ in range(GENS):
        ranked = sorted(range(POP), key=lambda i: fits[i], reverse=True)
        elites = [pop[i] for i in ranked[:6]]
        means = [statistics.mean(ind[j] for ind in elites) for j in range(DIM)]
        stds = []
        for j in range(DIM):
            vals = [ind[j] for ind in elites]
            stds.append(max(0.06, statistics.pstdev(vals)))
        new_pop = [pop[ranked[0]][:], pop[ranked[1]][:]]
        while len(new_pop) < POP:
            cand = [clamp(rng.gauss(means[j], stds[j] * 0.9), 0.0, 1.0) for j in range(DIM)]
            new_pop.append(cand)
        pop = new_pop[:POP]
        res = [evaluate(tuple(ind)) for ind in pop]
        fits = [r['fitness'] for r in res]
        evals += POP
    idx = max(range(POP), key=lambda i: fits[i])
    return {'algorithm': 'EDA', 'best': pop[idx][:], 'best_res': res[idx], 'evals': evals}


def run_ccea(run_seed):
    rng = random.Random(run_seed)
    groups = [list(range(0, 8)), list(range(8, 14)), list(range(14, 16))]
    subpops = [[[rng.random() for _ in group] for _ in range(8)] for group in groups]
    collaborator = [0.5] * DIM
    subfits = []
    evals = 0
    for group_index, group in enumerate(groups):
        fits = []
        for indiv in subpops[group_index]:
            full = collaborator[:]
            for local_idx, dim in enumerate(group):
                full[dim] = indiv[local_idx]
            result = evaluate(tuple(full))
            fits.append(result)
            evals += 1
        subfits.append(fits)
        best_local = max(range(len(fits)), key=lambda i: fits[i]['fitness'])
        for local_idx, dim in enumerate(group):
            collaborator[dim] = subpops[group_index][best_local][local_idx]
    for _ in range(GENS):
        for group_index, group in enumerate(groups):
            pop = subpops[group_index]
            fits = subfits[group_index]
            fitvals = [r['fitness'] for r in fits]
            for i in range(len(pop)):
                idxs = list(range(len(pop)))
                idxs.remove(i)
                a, b, c = rng.sample(idxs, 3)
                mutant = [clamp(pop[a][j] + 0.70 * (pop[b][j] - pop[c][j]), 0.0, 1.0) for j in range(len(group))]
                trial = pop[i][:]
                jrand = rng.randrange(len(group))
                for j in range(len(group)):
                    if rng.random() < 0.90 or j == jrand:
                        trial[j] = mutant[j]
                full = collaborator[:]
                for local_idx, dim in enumerate(group):
                    full[dim] = trial[local_idx]
                result = evaluate(tuple(full))
                evals += 1
                if result['fitness'] >= fitvals[i]:
                    pop[i] = trial
                    fits[i] = result
                    fitvals[i] = result['fitness']
            best_local = max(range(len(fits)), key=lambda i: fits[i]['fitness'])
            for local_idx, dim in enumerate(group):
                collaborator[dim] = pop[best_local][local_idx]
            subpops[group_index] = pop
            subfits[group_index] = fits
    best_full = collaborator[:]
    best_res = evaluate(tuple(best_full))
    return {'algorithm': 'CCEA', 'best': best_full, 'best_res': best_res, 'evals': evals + 1}


def evaluate_single(route_id, theta, seeds):
    scores = []
    colds = []
    event_colds = []
    for seed in seeds:
        out = simulate_route(route_id, theta, hash((route_id, seed, 999)) & 0xffffffff)
        scores.append(out['score'])
        colds.append(out['cold'])
        event_colds.append(out['event_cold'])
    mean_score = statistics.mean(scores)
    mean_cold = statistics.mean(colds)
    mean_event_cold = statistics.mean(event_colds)
    return {'fitness': mean_score - 22 * mean_cold - 10 * mean_event_cold, 'mean_score': mean_score, 'mean_cold': mean_cold}


def summarize_route(route_id, theta, seeds):
    outputs = [simulate_route(route_id, theta, hash((route_id, seed, 999)) & 0xffffffff) for seed in seeds]
    keys = [
        'score',
        'cold',
        'event_cold',
        'natural_cold',
        'favor',
        'prestige',
        'trueHeart',
        'births',
        'secret_births',
        'silver',
        'silver_spent',
        'admin_spent',
        'court_spent',
        'family_spent',
        'child_spent',
        'gift_spent',
        'case_spent',
        'event_spent',
        'plots',
        'rank_gain',
        'lover_events',
        'case_interventions',
        'court_loyalty',
        'family_office_level',
        'ambition_value',
        'tiger_tally',
        'power_investment',
    ]
    return {key: statistics.mean(out[key] for out in outputs) for key in keys}


def run_de_single(route_id, run_seed):
    rng = random.Random(run_seed)
    pop = [rand_theta(rng) for _ in range(POP)]
    res = [evaluate_single(route_id, tuple(ind), TRAIN_SEEDS) for ind in pop]
    fits = [r['fitness'] for r in res]
    for _ in range(GENS):
        for i in range(POP):
            idxs = list(range(POP))
            idxs.remove(i)
            a, b, c = rng.sample(idxs, 3)
            mutant = [clamp(pop[a][j] + 0.72 * (pop[b][j] - pop[c][j]), 0.0, 1.0) for j in range(DIM)]
            trial = pop[i][:]
            jrand = rng.randrange(DIM)
            for j in range(DIM):
                if rng.random() < 0.88 or j == jrand:
                    trial[j] = mutant[j]
            result = evaluate_single(route_id, tuple(trial), TRAIN_SEEDS)
            if result['fitness'] >= fits[i]:
                pop[i] = trial
                res[i] = result
                fits[i] = result['fitness']
    idx = max(range(POP), key=lambda i: fits[i])
    best = pop[idx]
    valid = evaluate_single(route_id, tuple(best), VALID_SEEDS)
    return best, valid


def main():
    algs = {'GA': run_ga, 'DE': run_de, 'CCEA': run_ccea, 'EDA': run_eda}
    summary = {}
    for name, func in algs.items():
        runs = []
        for run_seed in [1001, 2002, 3003, 4004]:
            out = func(run_seed)
            best = out['best']
            valid = evaluate(tuple(best), tuple(VALID_SEEDS))
            runs.append({
                'fitness': out['best_res']['fitness'],
                'train_mean': out['best_res']['mean_score'],
                'valid_mean': valid['mean_score'],
                'valid_worst': valid['worst_route'],
                'valid_cold': valid['mean_cold'],
                'route_scores': valid['route_scores'],
                'route_cold': valid['cold_counts'],
                'theta': best,
            })
        best_run = max(runs, key=lambda r: r['valid_mean'] - 40 * r['valid_cold'] + 0.08 * r['valid_worst'])
        summary[name] = {
            'avg_valid_mean': statistics.mean(r['valid_mean'] for r in runs),
            'avg_valid_worst': statistics.mean(r['valid_worst'] for r in runs),
            'avg_valid_cold': statistics.mean(r['valid_cold'] for r in runs),
            'best': best_run,
        }

    winner = max(summary.items(), key=lambda kv: kv[1]['avg_valid_mean'] - 22 * kv[1]['avg_valid_cold'] + 0.10 * kv[1]['avg_valid_worst'])[0]
    per_route = {}
    for route_id in ROUTES:
        best_overall = None
        for run_seed in [111, 222, 333]:
            theta, valid = run_de_single(route_id, run_seed)
            score = valid['mean_score'] - 22 * valid['mean_cold']
            if best_overall is None or score > best_overall['score']:
                best_overall = {'theta': theta, 'valid': valid, 'score': score}
        alloc, actions, risk, ambition = decode(best_overall['theta'])
        detailed = summarize_route(route_id, best_overall['theta'], VALID_SEEDS)
        per_route[route_id] = {
            'alloc': sorted(((k, round(v * 100, 1)) for k, v in alloc.items() if k != 'other'), key=lambda x: x[1], reverse=True),
            'actions': sorted(((k, round(v, 3)) for k, v in actions.items()), key=lambda x: x[1], reverse=True),
            'risk': round(risk, 3),
            'ambition': round(ambition, 3),
            'valid': best_overall['valid'],
            'details': detailed,
        }

    result = {'summary': summary, 'winner': winner, 'per_route': per_route}
    output = r'C:\02-project\tmp_algorithm_compare_result.json'
    with open(output, 'w', encoding='utf-8') as file:
        json.dump(result, file, ensure_ascii=False, indent=2)
    print(output)
    print(json.dumps({
        'winner': winner,
        'overview': {
            key: {
                'avg_valid_mean': round(value['avg_valid_mean'], 2),
                'avg_valid_worst': round(value['avg_valid_worst'], 2),
                'avg_valid_cold': round(value['avg_valid_cold'], 2),
            }
            for key, value in summary.items()
        },
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
