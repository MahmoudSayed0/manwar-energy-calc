-- 0002_seed_appliances.sql
-- 25 appliances. Wattages = conservative starting estimates (must be verified against real spec sheets before production).

insert into appliances (slug, name_ar, name_en, category, inductive, icon, sort_order, notes_ar, notes_en) values
  ('fridge',          'تلاجة',       'Fridge',          'kitchen',  true,  'refrigerator',     10, null, null),
  ('split-ac',        'تكييف سبليت', 'Split AC',        'cooling',  true,  'air-vent',         20, 'استهلاك مرتفع. حدد القدرة بدقة.', 'High draw. Choose size carefully.'),
  ('led-bulb',        'لمبة LED',    'LED bulb',        'lighting', false, 'lightbulb',        30, null, null),
  ('old-bulb',        'لمبة قديمة',  'Old bulb',        'lighting', false, 'lightbulb-off',    35, null, null),
  ('tv',              'تلفزيون',     'TV',              'media',    false, 'tv',               40, null, null),
  ('router',          'راوتر',       'WiFi router',     'media',    false, 'router',           50, null, null),
  ('phone-charger',   'شاحن موبايل', 'Phone charger',   'media',    false, 'smartphone',       60, null, null),
  ('laptop',          'لاب توب',     'Laptop',          'media',    false, 'laptop',           70, null, null),
  ('desktop-pc',      'كمبيوتر',     'Desktop PC',      'media',    false, 'monitor',          75, null, null),
  ('washing-machine', 'غسالة',       'Washing machine', 'laundry',  true,  'washing-machine',  80, null, null),
  ('washer-heater',   'غسالة بسخان', 'Washer w/ heater','laundry',  true,  'washing-machine',  85, 'استهلاكها كبير على البطارية.', 'Heavy battery drain.'),
  ('water-heater',    'سخان كهربا',  'Water heater',    'kitchen',  false, 'flame',            90, 'تشغيل السخان على البطارية مكلف.', 'Running this on battery is rarely cost-effective.'),
  ('microwave',       'ميكروويف',    'Microwave',       'kitchen',  false, 'microwave',       100, null, null),
  ('iron',            'مكواة',       'Electric iron',   'other',    false, 'shirt',           110, null, null),
  ('hair-dryer',      'سشوار',       'Hair dryer',      'other',    false, 'wind',            120, null, null),
  ('ceiling-fan',     'مروحة سقف',   'Ceiling fan',     'cooling',  true,  'fan',             130, null, null),
  ('desk-fan',        'مروحة مكتب',  'Desk fan',        'cooling',  true,  'fan',             140, null, null),
  ('vacuum',          'مكنسة كهربا', 'Vacuum cleaner',  'other',    true,  'vacuum',          150, null, null),
  ('coffee-machine',  'ماكينة قهوة', 'Coffee machine',  'kitchen',  false, 'coffee',          160, null, null),
  ('toaster',         'محمصة',       'Toaster',         'kitchen',  false, 'sandwich',        170, null, null),
  ('blender',         'خلاط',        'Blender',         'kitchen',  true,  'blend',           180, null, null),
  ('game-console',    'بلايستيشن',   'Game console',    'media',    false, 'gamepad-2',       190, null, null),
  ('printer',         'طابعة',       'Printer',         'media',    false, 'printer',         200, null, null),
  ('cctv',            'كاميرات مراقبة','CCTV / NVR',    'other',    false, 'video',           210, null, null),
  ('intercom',        'انتركوم',     'Doorbell / intercom','other', false, 'bell',            220, null, null);

-- Variants
with a as (select id, slug from appliances)
insert into appliance_variants (appliance_id, variant_label_ar, variant_label_en, running_watts, surge_watts, sort_order)
select a.id, v.label_ar, v.label_en, v.run_w, v.surge_w, v.sort
from a join (values
  ('fridge',          'صغيرة',  'Small',         100,  600, 10),
  ('fridge',          'وسط',    'Medium',        150,  900, 20),
  ('fridge',          'كبيرة',  'Large',         250, 1200, 30),
  ('split-ac',        '1 حصان',   '1 HP',         750, 2250, 10),
  ('split-ac',        '1.5 حصان', '1.5 HP',      1100, 3300, 20),
  ('split-ac',        '2 حصان',   '2 HP',        1500, 4500, 30),
  ('split-ac',        '3 حصان',   '3 HP',        2200, 6600, 40),
  ('led-bulb',        '9 وات',  '9W',              9,    9, 10),
  ('led-bulb',        '15 وات', '15W',            15,   15, 20),
  ('old-bulb',        '60 وات', '60W',            60,   60, 10),
  ('old-bulb',        '100 وات','100W',          100,  100, 20),
  ('tv',              '32 بوصة','32"',            60,   60, 10),
  ('tv',              '43 بوصة','43"',            80,   80, 20),
  ('tv',              '55 بوصة','55"',           110,  110, 30),
  ('tv',              '65 بوصة','65"',           150,  150, 40),
  ('router',          '—', '—',                  10,   10, 10),
  ('phone-charger',   '—', '—',                  10,   10, 10),
  ('laptop',          '—', '—',                  80,   80, 10),
  ('desktop-pc',      '—', '—',                 250,  350, 10),
  ('washing-machine', 'صغيرة','Small',          500, 1500, 10),
  ('washing-machine', 'كبيرة','Large',          800, 2400, 20),
  ('washer-heater',   '—', '—',                2000, 2400, 10),
  ('water-heater',    'صغير', 'Small',          1500, 1500, 10),
  ('water-heater',    'كبير', 'Large',          3000, 3000, 20),
  ('microwave',       '—', '—',                1200, 1500, 10),
  ('iron',            '—', '—',                1200, 1200, 10),
  ('hair-dryer',      '—', '—',                1800, 1800, 10),
  ('ceiling-fan',     '—', '—',                  75,  150, 10),
  ('desk-fan',        '—', '—',                  50,  100, 10),
  ('vacuum',          '—', '—',                1400, 2000, 10),
  ('coffee-machine',  '—', '—',                1000, 1000, 10),
  ('toaster',         '—', '—',                 800,  800, 10),
  ('blender',         '—', '—',                 400,  600, 10),
  ('game-console',    '—', '—',                 150,  150, 10),
  ('printer',         'الخمول','Idle',            50,   50, 10),
  ('printer',         'طباعة','Printing',        600,  600, 20),
  ('cctv',            '—', '—',                  30,   30, 10),
  ('intercom',        '—', '—',                   5,    5, 10)
) as v(slug, label_ar, label_en, run_w, surge_w, sort) on a.slug = v.slug;

-- Initial pricing row (April 2026, conservative)
insert into pricing (inverter_egp_per_kw_min, inverter_egp_per_kw_max, battery_egp_per_wh_min, battery_egp_per_wh_max)
values (4500, 7500, 12.00, 18.00);

-- A few placeholder shops so the result page isn't empty during dev.
-- Replace with real verified shops before production.
insert into shops (name, governorate, area, whatsapp_number, maps_url, facebook_url, specialty_tags, is_active, verified_at) values
  ('Cairo Solar Center',    'Cairo',  'Nasr City',     '201000000001', 'https://maps.google.com/?q=Nasr+City+Cairo',     'https://facebook.com/placeholder1', '{inverter,battery,installation}', true, now()),
  ('Heliopolis Energy',     'Cairo',  'Heliopolis',    '201000000002', 'https://maps.google.com/?q=Heliopolis+Cairo',    'https://facebook.com/placeholder2', '{inverter,battery}',              true, now()),
  ('Giza Power Solutions',  'Giza',   'Mohandessin',   '201000000003', 'https://maps.google.com/?q=Mohandessin+Giza',   null,                                '{solar,inverter,battery}',         true, now());
