// ==========================================
// 設定區 — 修改密碼請改此處
// ==========================================
const APP_PASSWORD = 'rbtc1234';

// ==========================================
// 狀態
// ==========================================
const st = { gender: 'male', activity: 0, dairy: true };

// ==========================================
// 密碼
// ==========================================
function checkPassword() {
  const val = document.getElementById('pwd-input').value;
  if (val === APP_PASSWORD) {
    sessionStorage.setItem('rbtc_diet_auth', '1');
    document.getElementById('lock-screen').hidden = true;
    document.getElementById('app').hidden = false;
    showCat('grain');
  } else {
    document.getElementById('pwd-err').hidden = false;
    document.getElementById('pwd-input').value = '';
    document.getElementById('pwd-input').focus();
  }
}

document.getElementById('pwd-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPassword();
});

if (sessionStorage.getItem('rbtc_diet_auth') === '1') {
  document.getElementById('lock-screen').hidden = true;
  document.getElementById('app').hidden = false;
  setTimeout(() => showCat('grain'), 0);
}

// ==========================================
// 性別 / 活動量 / 乳製品
// ==========================================
function setGender(g) {
  st.gender = g;
  document.getElementById('btn-male').classList.toggle('active', g === 'male');
  document.getElementById('btn-female').classList.toggle('active', g === 'female');
}

function setActivity(i) {
  st.activity = i;
  document.querySelectorAll('.act-btn').forEach((b, j) => b.classList.toggle('active', i === j));
}

function setDairy(v) {
  st.dairy = v;
  document.getElementById('btn-dairy-y').classList.toggle('active', v);
  document.getElementById('btn-dairy-n').classList.toggle('active', !v);
}

// ==========================================
// 計算邏輯
// ==========================================
const ACTIVITY = [1.30, 1.38, 1.55, 1.73];

// 每份營養素（源自 Tina 營養師試算表）
const P = {
  dairy_low:   { p: 8,    f: 4,     c: 12,   k: 120   },
  prot_mid:    { p: 7.24, f: 5.175, c: 0,    k: 77.6  },
  grain_bowl:  { p: 8.7,  f: 0,     c: 65.2, k: 304.1 },
  veg:         { p: 1,    f: 0,     c: 5,    k: 25    },
  fruit:       { p: 0,    f: 0,     c: 15,   k: 60    },
  oil:         { p: 0,    f: 4.5,   c: 0,    k: 40.4  },
};

function calcBMR(gender, w, h, a) {
  // Revised Harris-Benedict (1984)
  return gender === 'male'
    ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
    : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a;
}

function runCalc() {
  const w = parseFloat(document.getElementById('inp-weight').value);
  const h = parseFloat(document.getElementById('inp-height').value);
  const a = parseInt(document.getElementById('inp-age').value);

  if (!w || !h || !a)            { alert('請填寫體重、身高與年齡'); return; }
  if (w < 30 || w > 200)         { alert('體重請填 30–200 kg'); return; }
  if (h < 120 || h > 230)        { alert('身高請填 120–230 cm'); return; }
  if (a < 10 || a > 100)         { alert('年齡請填 10–100 歲'); return; }

  const bmr        = calcBMR(st.gender, w, h, a);
  const tdee       = Math.round(bmr * ACTIVITY[st.activity]);
  const target     = Math.round(tdee * 0.84);   // ~16% 熱量赤字

  const tP = target * 0.20 / 4;   // 蛋白質目標 (g)
  const tF = target * 0.30 / 9;   // 脂肪目標 (g)
  const tC = target * 0.50 / 4;   // 碳水目標 (g)

  const dairyN = st.dairy ? 1 : 0;
  const vegN   = 3;
  const fruitN = 1;

  // 固定食物的 P/F/C
  const fxP = vegN * P.veg.p + fruitN * P.fruit.p + dairyN * P.dairy_low.p;
  const fxF = vegN * P.veg.f + fruitN * P.fruit.f + dairyN * P.dairy_low.f;
  const fxC = vegN * P.veg.c + fruitN * P.fruit.c + dairyN * P.dairy_low.c;
  const fxK = vegN * P.veg.k + fruitN * P.fruit.k + dairyN * P.dairy_low.k;

  // 全榖（碗） — 依剩餘碳水分配
  const grain = Math.max(1, Math.min(8, Math.round((tC - fxC) / P.grain_bowl.c)));
  const gK    = grain * P.grain_bowl.k;
  const gP    = grain * P.grain_bowl.p;

  // 豆魚蛋肉（中脂） — 依剩餘蛋白質分配，使用 floor
  const prot  = Math.max(2, Math.min(20, Math.floor((tP - fxP - gP) / P.prot_mid.p)));
  const prF   = prot * P.prot_mid.f;
  const prK   = prot * P.prot_mid.k;

  // 油脂 — 依剩餘脂肪分配
  const oil   = Math.max(0, Math.min(10, Math.round((tF - fxF - prF) / P.oil.f)));
  const oK    = oil * P.oil.k;

  // 總計
  const totP = fxP + gP + prot * P.prot_mid.p;
  const totF = fxF + prF + oil * P.oil.f;
  const totC = fxC + grain * P.grain_bowl.c;
  const totK = Math.round(fxK + gK + prK + oK);

  const pPct = Math.round(totP * 4 / totK * 100);
  const fPct = Math.round(totF * 9 / totK * 100);
  const cPct = Math.round(totC * 4 / totK * 100);

  // 更新 UI
  document.getElementById('res-tdee').textContent   = tdee;
  document.getElementById('res-target').textContent = target;

  const dRow = document.getElementById('row-dairy');
  dRow.style.display = st.dairy ? 'flex' : 'none';
  document.getElementById('val-dairy').textContent   = '1 份';
  document.getElementById('val-protein').textContent = prot + ' 份';
  document.getElementById('val-grain').textContent   = grain + ' 碗';
  document.getElementById('val-veg').textContent     = vegN + ' 份';
  document.getElementById('val-fruit').textContent   = fruitN + ' 份';
  document.getElementById('val-oil').textContent     = oil + ' 份';

  document.getElementById('res-p').textContent    = Math.round(totP);
  document.getElementById('res-f').textContent    = Math.round(totF);
  document.getElementById('res-c').textContent    = Math.round(totC);
  document.getElementById('res-ppct').textContent = pPct + '%';
  document.getElementById('res-fpct').textContent = fPct + '%';
  document.getElementById('res-cpct').textContent = cPct + '%';
  document.getElementById('res-kcal').textContent = totK;

  document.getElementById('bar-p').style.width = pPct + '%';
  document.getElementById('bar-f').style.width = fPct + '%';
  document.getElementById('bar-c').style.width = cPct + '%';

  const results = document.getElementById('results');
  results.hidden = false;
  setTimeout(() => results.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

// ==========================================
// 分頁切換
// ==========================================
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('nav-' + tab).classList.add('active');
}

function gotoExchange(cat) {
  switchTab('exchange');
  showCat(cat);
}

// ==========================================
// 飲食代換表資料
// ==========================================
const EXCHANGE = {
  grain: {
    name: '全榖雜糧類',
    emoji: '🌾',
    serving: '1 份 = 蛋白質 2g ／碳水 15g ／熱量 70 大卡',
    tip: '💡 優先選擇糙米、燕麥、地瓜等全穀根莖類，膳食纖維豐富、升糖指數較低。精製澱粉（白飯、白麵）可酌量搭配。',
    items: [
      { s: '米飯類' },
      { n: '白飯',          a: '¼ 碗',      w: '50g' },
      { n: '糙米飯',        a: '¼ 碗',      w: '50g',  t: '★ 優先推薦' },
      { n: '稀飯（粥）',    a: '½ 碗',      w: '125g' },
      { s: '麵食類' },
      { n: '麵條（熟）',    a: '½ 碗',      w: '60g' },
      { n: '冬粉（乾）',    a: '¼ 把',      w: '20g' },
      { n: '米粉（乾）',    a: '¼ 束',      w: '20g' },
      { n: '白吐司',        a: '½ 片',      w: '25g' },
      { n: '全麥吐司',      a: '½ 片',      w: '25g',  t: '★ 優先推薦' },
      { n: '饅頭',          a: '⅓ 個',     w: '30g' },
      { n: '蘇打餅乾',      a: '3 片',      w: '20g' },
      { s: '根莖類' },
      { n: '地瓜（熟）',    a: '½ 個小型',  w: '55g',  t: '★ 優先推薦' },
      { n: '芋頭（熟）',    a: '約 2 塊',   w: '55g' },
      { n: '南瓜（熟）',    a: '約 3 塊',   w: '85g',  t: '★ 優先推薦' },
      { n: '玉米',          a: '⅔ 根',     w: '130g' },
      { s: '其他' },
      { n: '燕麥片（乾）',  a: '3 湯匙',    w: '20g',  t: '★ 優先推薦' },
      { n: '薏仁（乾）',    a: '2 湯匙',    w: '20g' },
      { n: '紅豆／綠豆（乾）', a: '2 湯匙', w: '20g' },
    ]
  },
  'protein-low': {
    name: '豆魚蛋肉類 — 低脂',
    emoji: '🐟',
    serving: '1 份 = 蛋白質 7g ／脂肪 3g ／熱量 55 大卡',
    tip: '💡 低脂蛋白質首選。魚類（白肉魚）、海鮮、去皮雞胸、豆製品皆屬此類，熱量最低，減重期間多加利用。',
    items: [
      { s: '豆製品' },
      { n: '黃豆',           a: '2 湯匙',   w: '20g',  t: '高纖' },
      { n: '毛豆',           a: '½ 碗',     w: '50g',  t: '★ 方便推薦' },
      { n: '嫩豆腐',         a: '⅓ 塊',    w: '140g', t: '★ 優先推薦' },
      { n: '板豆腐',         a: '¼ 塊',     w: '80g' },
      { n: '豆乾（小方）',   a: '1 片',     w: '40g' },
      { n: '無糖豆漿',       a: '1 杯',     w: '190ml',t: '★ 方便' },
      { s: '海鮮' },
      { n: '虱目魚',         a: '1 小片',   w: '35g' },
      { n: '鯛魚',           a: '1 小片',   w: '35g' },
      { n: '草魚',           a: '1 小片',   w: '35g' },
      { n: '花枝',           a: '約 3 塊',  w: '60g' },
      { n: '蝦仁',           a: '約 6 隻',  w: '50g' },
      { n: '文蛤',           a: '約 7 個',  w: '60g' },
      { n: '牡蠣',           a: '約 5 個',  w: '65g' },
      { s: '禽畜肉' },
      { n: '雞胸肉（去皮）', a: '30g',      w: '30g',  t: '★ 優先推薦' },
      { n: '豬里肌（瘦）',   a: '35g',      w: '35g' },
      { n: '牛腱',           a: '35g',      w: '35g' },
      { n: '雞蛋白',         a: '2 個',     w: '—' },
    ]
  },
  'protein-mid': {
    name: '豆魚蛋肉類 — 中脂',
    emoji: '🥩',
    serving: '1 份 = 蛋白質 7g ／脂肪 5g ／熱量 75 大卡',
    tip: '💡 計算結果預設使用中脂。雞蛋、鮭魚、鯖魚屬此類，含 Omega-3 脂肪酸，對心血管健康有益。',
    items: [
      { n: '雞蛋',           a: '1 個',     w: '55g',  t: '★ 方便首選' },
      { n: '鮭魚',           a: '1 小片',   w: '35g',  t: '★ 富含 Omega-3' },
      { n: '鯖魚',           a: '1 小片',   w: '35g',  t: '★ 富含 Omega-3' },
      { n: '秋刀魚',         a: '⅓ 條',    w: '35g' },
      { n: '虱目魚肚',       a: '1 小片',   w: '35g' },
      { n: '豬小排',         a: '35g',      w: '35g' },
      { n: '豬腱子肉',       a: '45g',      w: '45g' },
      { n: '雞翅（去皮）',   a: '1 隻',     w: '40g' },
      { n: '魚丸（不包餡）', a: '3–4 個',   w: '50g' },
    ]
  },
  'protein-high': {
    name: '豆魚蛋肉類 — 高脂',
    emoji: '🍖',
    serving: '1 份 = 蛋白質 7g ／脂肪 10g ／熱量 120 大卡',
    tip: '⚠️ 脂肪含量高，建議減少攝取。加工肉品（香腸、熱狗、培根）還含有大量鈉，應盡量避免。',
    items: [
      { n: '豬五花',   a: '35g',  w: '35g' },
      { n: '梅花肉',   a: '35g',  w: '35g' },
      { n: '豬蹄膀',   a: '40g',  w: '40g' },
      { n: '雞腿（含皮）', a: '40g', w: '40g' },
      { n: '香腸',     a: '1 條', w: '40g' },
      { n: '熱狗',     a: '1 根', w: '50g' },
      { n: '培根',     a: '2 片', w: '40g' },
      { n: '豬肉鬆',   a: '1.5 湯匙', w: '25g' },
    ]
  },
  dairy: {
    name: '乳品類',
    emoji: '🥛',
    serving: '低脂 1 份 = 蛋白質 8g ／脂肪 4g ／碳水 12g ／熱量 120 大卡',
    tip: '💡 建議選低脂。乳品富含鈣質與優質蛋白，每日一份有助骨骼健康。不耐乳糖者可選無糖優格或低乳糖產品。',
    items: [
      { s: '低脂（建議選擇）' },
      { n: '低脂牛奶',       a: '1 杯',    w: '240ml', t: '★ 推薦' },
      { n: '低脂奶粉',       a: '3 平匙',  w: '25g' },
      { n: '低脂起司',       a: '2 片',    w: '45g' },
      { n: '低脂優格（無糖）', a: '¾ 杯', w: '210g',  t: '★ 推薦' },
      { s: '全脂（熱量較高）' },
      { n: '全脂牛奶',       a: '1 杯',    w: '240ml', t: '150 大卡' },
      { n: '全脂奶粉',       a: '4 平匙',  w: '30g' },
    ]
  },
  vegetable: {
    name: '蔬菜類',
    emoji: '🥦',
    serving: '1 份 = 蛋白質 1g ／碳水 5g ／熱量 25 大卡（生重約 100g）',
    tip: '💡 每日至少 3 份（約 1.5 碗熟菜）。深色蔬菜（深綠色、橘紅色）富含葉酸、鐵、維生素，優先選擇。烹調少油、少鹽最佳。',
    items: [
      { s: '深色葉菜（★ 優先）' },
      { n: '菠菜',   a: '1 碗生', w: '100g', t: '高鐵、葉酸' },
      { n: '地瓜葉', a: '1 碗生', w: '100g', t: '★ 高纖、高鐵' },
      { n: '空心菜', a: '1 碗生', w: '100g' },
      { n: '芥藍',   a: '1 碗生', w: '100g', t: '高鈣' },
      { n: '青花菜', a: '5–6 朵', w: '100g', t: '★ 維生素 C、葉酸' },
      { n: '花椰菜', a: '5–6 朵', w: '100g' },
      { s: '瓜果蔬菜' },
      { n: '大番茄',   a: '1 個中型', w: '100g', t: '茄紅素' },
      { n: '小黃瓜',   a: '1 根',    w: '100g' },
      { n: '苦瓜',     a: '½ 個',    w: '100g' },
      { n: '絲瓜',     a: '1 碗',    w: '100g' },
      { n: '茄子',     a: '½ 根',    w: '100g' },
      { n: '彩椒',     a: '½ 個',    w: '100g', t: '★ 高維生素 C' },
      { s: '其他常見蔬菜' },
      { n: '高麗菜', a: '½ 碗熟', w: '50g' },
      { n: '洋蔥',   a: '½ 個',   w: '100g' },
      { n: '蘆筍',   a: '5–6 根', w: '100g' },
      { n: '秋葵',   a: '5–6 根', w: '100g' },
      { n: '香菇',   a: '4–5 個', w: '100g', t: '低熱量、高纖' },
    ]
  },
  fruit: {
    name: '水果類',
    emoji: '🍎',
    serving: '1 份 = 碳水 15g ／熱量 60 大卡',
    tip: '💡 建議吃全果，不喝果汁（纖維流失、升糖快）。水果含天然糖分，每日以 1–2 份為宜，熱帶水果（芒果、荔枝）糖分較高需注意份量。',
    items: [
      { n: '蘋果',   a: '½ 個中型', w: '130g', t: '★ 高纖' },
      { n: '橘子',   a: '1 個',     w: '190g' },
      { n: '柳丁',   a: '1 個中型', w: '170g', t: '高維生素 C' },
      { n: '香蕉',   a: '½ 根',     w: '70g',  t: '糖分較高' },
      { n: '芭樂',   a: '1 個小型', w: '155g', t: '★ 低升糖、高纖' },
      { n: '西瓜',   a: '1 大塊',   w: '320g' },
      { n: '葡萄',   a: '13 粒',    w: '85g' },
      { n: '草莓',   a: '10 粒',    w: '160g', t: '★ 低熱量' },
      { n: '奇異果', a: '1.25 個',  w: '125g', t: '★ 高維生素 C' },
      { n: '水蜜桃', a: '1 個中型', w: '145g' },
      { n: '鳳梨',   a: '⅒ 個',   w: '130g' },
      { n: '芒果',   a: '¼ 個',    w: '150g', t: '糖分高' },
      { n: '藍莓',   a: '½ 碗',    w: '100g', t: '★ 高抗氧化' },
      { n: '木瓜',   a: '⅙ 個',   w: '150g' },
      { n: '聖女番茄', a: '23 粒', w: '175g', t: '★ 低熱量' },
    ]
  },
  oil: {
    name: '油脂與堅果種子類',
    emoji: '🫙',
    serving: '1 份 = 脂肪 5g ／熱量 45 大卡',
    tip: '💡 優先選橄欖油、苦茶油等單元不飽和脂肪。堅果富含好的脂肪與礦物質，但熱量密度高，每日 1–2 份為宜。避免奶油、豬油等飽和脂肪。',
    items: [
      { s: '植物油' },
      { n: '橄欖油',   a: '1 茶匙', w: '5g',  t: '★ 優先推薦' },
      { n: '苦茶油',   a: '1 茶匙', w: '5g',  t: '★ 優先推薦' },
      { n: '葵花油',   a: '1 茶匙', w: '5g' },
      { n: '麻油',     a: '1 茶匙', w: '5g' },
      { s: '堅果種子' },
      { n: '花生',     a: '10 粒',    w: '13g' },
      { n: '腰果',     a: '5 粒',     w: '10g' },
      { n: '杏仁果',   a: '5 粒',     w: '7g',  t: '富含維生素 E' },
      { n: '核桃',     a: '2 粒',     w: '10g', t: '★ 富含 Omega-3' },
      { n: '芝麻',     a: '2 茶匙',   w: '10g', t: '高鈣、高鐵' },
      { n: '南瓜子',   a: '1 湯匙',   w: '10g' },
      { n: '亞麻仁籽', a: '1 湯匙',   w: '10g', t: '★ 富含 Omega-3' },
      { s: '其他' },
      { n: '酪梨',   a: '⅛ 個中型', w: '40g', t: '★ 優質脂肪' },
      { n: '花生醬', a: '1.5 茶匙',  w: '8g' },
      { n: '沙拉醬', a: '2 茶匙',    w: '10g' },
    ]
  }
};

// ==========================================
// 代換表 UI
// ==========================================
function showCat(cat) {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  const d = EXCHANGE[cat];
  if (!d) return;

  document.getElementById('cat-info').innerHTML =
    `<strong>${d.emoji} ${d.name}</strong><br>${d.serving}<br><br>${d.tip}`;

  document.getElementById('food-list').innerHTML = d.items.map(item => {
    if (item.s) {
      return `<div class="sect-header">${item.s}</div>`;
    }
    return `
      <div class="food-item">
        <div class="food-name">
          ${item.n}
          ${item.t ? `<span class="food-tag">${item.t}</span>` : ''}
        </div>
        <div class="food-right">
          <div class="food-amount">${item.a}</div>
          ${item.w && item.w !== '—' ? `<div class="food-weight">${item.w}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}
