// ==========================================
// 設定區 — 修改密碼請改此處
// ==========================================
const APP_PASSWORD = 'rbtc66370279';

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
    const remember = document.getElementById('pwd-remember').checked;
    if (remember) {
      localStorage.setItem('rbtc_diet_auth', '1');
    } else {
      sessionStorage.setItem('rbtc_diet_auth', '1');
    }
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

if (localStorage.getItem('rbtc_diet_auth') === '1' || sessionStorage.getItem('rbtc_diet_auth') === '1') {
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
    tip: '💡 優先選糙米、燕麥、地瓜等全穀根莖類，膳食纖維豐富、升糖較低。精製澱粉可酌量搭配。熟重通常比生重多（米飯膨脹），計算時注意生熟差異。',
    items: [
      { s: '米飯類' },
      { n: '白飯',          a: '¼ 碗',      w: '生 20g → 熟 40g' },
      { n: '糙米飯',        a: '¼ 碗',      w: '生 20g → 熟 40g',  t: '★ 優先推薦' },
      { n: '五穀飯',        a: '¼ 碗',      w: '生 20g → 熟 40g',  t: '★ 高纖' },
      { n: '紫米飯',        a: '¼ 碗',      w: '生 20g → 熟 40g' },
      { n: '白粥',          a: '½ 碗',      w: '熟 125g' },
      { s: '麵食類' },
      { n: '麵條（熟）',    a: '½ 碗',      w: '60g' },
      { n: '烏龍麵（熟）',  a: '½ 碗',      w: '60g' },
      { n: '義大利麵（熟）',a: '½ 碗',      w: '生 20g → 熟 50g' },
      { n: '冬粉（乾）',    a: '半把',      w: '乾 15g → 熟 77g',  t: '煮後膨脹很多' },
      { n: '米粉（乾）',    a: '½ 束',      w: '乾 20g → 熟 70g' },
      { n: '粄條（熟）',    a: '½ 碗',      w: '生 50g → 熟 65g' },
      { s: '麵包類' },
      { n: '吐司',          a: '½ 片厚 / ¾ 片薄', w: '25g' },
      { n: '全麥吐司',      a: '½ 片',      w: '25g',  t: '★ 優先推薦' },
      { n: '饅頭',          a: '⅓ 個',     w: '30g' },
      { n: '餐包',          a: '1 個小',    w: '25g' },
      { n: '蘇打餅乾',      a: '3 片',      w: '20g' },
      { n: '蛋餅皮',        a: '1 張',      w: '30g' },
      { n: '蘿蔔糕',        a: '1 塊',      w: '生 50g → 熟 50g' },
      { s: '根莖類' },
      { n: '地瓜',          a: '⅓ 碗',     w: '生 55g → 熟 57g',  t: '★ 優先推薦' },
      { n: '馬鈴薯',        a: '½ 個中型',  w: '90g' },
      { n: '芋頭',          a: '¼ 碗',      w: '55g' },
      { n: '南瓜',          a: '½ 碗',      w: '生 85g → 熟 85g',  t: '★ 優先推薦' },
      { n: '山藥',          a: '½ 碗',      w: '80g' },
      { n: '玉米',          a: '⅔ 根',     w: '85g' },
      { n: '菱角',          a: '8 粒',      w: '45g' },
      { n: '栗子',          a: '7–8 粒',    w: '25g' },
      { s: '豆類＆其他' },
      { n: '燕麥片（乾）',  a: '2 湯匙',    w: '20g',  t: '★ 優先推薦' },
      { n: '即食燕麥（熟）',a: '½ 碗',      w: '熟 100g' },
      { n: '薏仁（乾）',    a: '2 湯匙',    w: '乾 20g → 熟 80g' },
      { n: '紅豆（乾）',    a: '1 湯匙',    w: '乾 25g → 熟 45g' },
      { n: '綠豆（乾）',    a: '2 湯匙',    w: '乾 25g → 熟 60g' },
      { n: '蓮子（乾）',    a: '32 粒',     w: '25g' },
      { n: '皇帝豆（熟）',  a: '½ 碗',      w: '生 50g → 熟 65g' },
      { n: '蒟蒻',          a: '自由',      w: '—',  t: '幾乎零熱量，不計份數' },
      { s: '加工品（含澱粉）' },
      { n: '甜不辣',        a: '4 條（6cm）', w: '生 70g → 熟 64g',  t: '= 1C + 1P' },
    ]
  },
  'protein-low': {
    name: '豆魚蛋肉類 — 低脂',
    emoji: '🐟',
    serving: '1 份 = 蛋白質 7g ／脂肪 3g ／熱量 55 大卡',
    tip: '💡 低脂首選！魚類、海鮮、去皮雞胸、豆製品皆屬此類，熱量最低。減脂期間優先選用。注意：豆腐的脂肪分類依加工方式不同。',
    items: [
      { s: '豆製品' },
      { n: '嫩豆腐',         a: '½ 盒',     w: '140g', t: '★ 優先推薦' },
      { n: '板豆腐',         a: '1 塊（5×5×2.5cm）', w: '80g' },
      { n: '豆干',           a: '1⅓ 塊',   w: '35g' },
      { n: '豆皮（濕）',     a: '1 片',     w: '15g' },
      { n: '毛豆',           a: '¼ 碗（生）→ ½ 碗（熟）',    w: '生 50g → 熟 50g',  t: '★ 方便推薦' },
      { n: '無糖豆漿',       a: '1 杯',     w: '190ml',t: '★ 方便' },
      { s: '魚類' },
      { n: '鯛魚',           a: '1 小片',   w: '生 35g → 熟 30g',  t: '★ 優先推薦' },
      { n: '比目魚（鰈魚）', a: '1 小片',   w: '生 50g → 熟 40g',  t: '煮後縮水多' },
      { n: '鱸魚',           a: '1 小片',   w: '35g' },
      { n: '吳郭魚',         a: '1 小片',   w: '35g' },
      { n: '白帶魚',         a: '1 小片',   w: '35g' },
      { s: '海鮮' },
      { n: '花枝',           a: '¼ 碗',     w: '生 60g → 熟 50g' },
      { n: '小卷（熟）',     a: '3 隻',     w: '生 35g → 熟 37g' },
      { n: '蝦仁',           a: '15 隻（2 湯匙）',   w: '生 50g → 熟 40g' },
      { n: '文蛤（帶殼）',   a: '2 碗',     w: '殼 370g → 肉 30g', t: '去殼後很少' },
      { n: '牡蠣',           a: '約 10 顆', w: '生 65g → 熟 32g' },
      { n: '干貝',           a: '2 個',     w: '25g' },
      { n: '小魚干',         a: '1 湯匙',   w: '10g' },
      { n: '蝦米',           a: '1 湯匙',   w: '生 15g → 熟 18g',  t: '鈉含量高' },
      { n: '蝦皮',           a: '¼ 碗',     w: '生 20g → 熟 34g',  t: '鈉含量高' },
      { s: '禽畜肉' },
      { n: '雞胸肉（去皮）', a: '1 片 4×5×1cm', w: '30g',  t: '★ 優先推薦' },
      { n: '雞里肌',         a: '30g',      w: '30g',  t: '★ 優先推薦' },
      { n: '雞蛋白',         a: '1.5 顆蛋的蛋白', w: '60g' },
      { n: '豬里肌（瘦）',   a: '35g',      w: '35g' },
      { n: '牛腱',           a: '35g',      w: '35g' },
    ]
  },
  'protein-mid': {
    name: '豆魚蛋肉類 — 中脂',
    emoji: '🥩',
    serving: '1 份 = 蛋白質 7g ／脂肪 5g ／熱量 75 大卡',
    tip: '💡 計算結果預設使用中脂。雞蛋是最方便的蛋白質來源。鮭魚含 Omega-3，建議每週至少吃 2 次。炒蛋 = 1P + 1O（因加油）。',
    items: [
      { s: '蛋類' },
      { n: '雞蛋',           a: '1 個',     w: '生 55g → 熟 60g',  t: '★ 方便首選' },
      { n: '炒蛋',           a: '½ 碗',     w: '55g',  t: '= 1P + 1O（含油）' },
      { s: '魚類' },
      { n: '鮭魚',           a: '1 小片',   w: '生 35g → 熟 34g',  t: '★ 富含 Omega-3' },
      { n: '鯖魚',           a: '1 小片',   w: '35g',  t: '★ 富含 Omega-3' },
      { n: '秋刀魚',         a: '⅓ 條',    w: '35g' },
      { n: '虱目魚肚',       a: '1 小片',   w: '35g' },
      { n: '鮪魚（罐頭）',   a: '½ 罐',     w: '35g' },
      { s: '豆製品' },
      { n: '傳統豆腐',       a: '½ 塊',     w: '80g' },
      { n: '油豆腐',         a: '1 小塊',   w: '55g' },
      { s: '禽畜肉' },
      { n: '雞腿（去皮）',   a: '40g',      w: '40g' },
      { n: '雞翅',           a: '1 小隻',   w: '生 40g → 熟 38g' },
      { n: '豬大里肌',       a: '1/3 掌（5×4×1cm）', w: '生 35g → 熟 30g' },
      { n: '豬肩胛肉片',     a: '火鍋肉片 2 片', w: '35g' },
      { n: '鴨肉',           a: '35g',      w: '35g' },
      { n: '羊肉（瘦）',     a: '35g',      w: '35g' },
      { s: '加工品' },
      { n: '虱目魚丸（不包肉）', a: '3 顆', w: '生 55g → 熟 57g',  t: '加了澱粉，蛋白質偏低' },
      { n: '花枝丸',         a: '2 個',     w: '50g' },
    ]
  },
  'protein-high': {
    name: '豆魚蛋肉類 — 高脂',
    emoji: '🍖',
    serving: '1 份 = 蛋白質 7g ／脂肪 10g ／熱量 120 大卡',
    tip: '⚠️ 脂肪含量高，建議減少。香腸、熱狗是一級致癌物，應盡量避免。百頁豆腐加工過程加了大量沙拉油，別被「豆腐」的名字騙了！',
    items: [
      { s: '豆製品' },
      { n: '百頁豆腐',     a: '½ 碗',    w: '生 70g → 熟 73g',  t: '⚠ 加了大量沙拉油' },
      { n: '臭豆腐（炸）', a: '½ 塊',     w: '—',    t: '⚠ 油炸吸油' },
      { s: '禽畜肉' },
      { n: '豬五花',       a: '35g',      w: '35g' },
      { n: '梅花肉',       a: '35g',      w: '35g' },
      { n: '豬蹄膀',       a: '40g',      w: '40g' },
      { n: '雞腿（含皮）', a: '40g',      w: '40g' },
      { n: '牛小排',       a: '35g',      w: '35g' },
      { n: '牛腩',         a: '35g',      w: '35g' },
      { n: '羊小排',       a: '35g',      w: '35g' },
      { s: '加工肉品（⚠ 一級致癌物）' },
      { n: '香腸',         a: '¼ 根',     w: '生 40g → 熟 50g',  t: '⚠ 一級致癌物' },
      { n: '熱狗',         a: '半根',     w: '生 50g → 熟 50g',  t: '⚠ 一級致癌物' },
      { n: '培根',         a: '2 片',     w: '40g' },
      { n: '豬肉鬆',       a: '3 湯匙',   w: '20g',  t: '含糖' },
      { n: '貢丸',         a: '2 個',     w: '50g' },
      { s: '其他' },
      { n: '皮蛋',         a: '1 個',     w: '55g' },
      { n: '鹹蛋',         a: '1 個',     w: '55g',  t: '高鈉' },
    ]
  },
  dairy: {
    name: '乳品類',
    emoji: '🥛',
    serving: '低脂 1 份 = 蛋白質 8g ／脂肪 4g ／碳水 12g ／熱量 120 大卡',
    tip: '💡 建議選低脂。乳品富含鈣質與蛋白質。優酪乳要選「無糖」（看配料，不是看標示）。外食的話，早餐店鮮奶茶不是真「奶」，是奶精（油）！',
    items: [
      { s: '低脂（建議選擇）' },
      { n: '低脂牛奶',         a: '1 杯',    w: '240ml', t: '★ 推薦' },
      { n: '低脂奶粉',         a: '2 湯匙',  w: '25g' },
      { n: '低脂起司',         a: '2 片',    w: '45g' },
      { n: '優格（無糖）',     a: '¾ 碗',   w: '210g',  t: '★ 推薦，益生菌發酵' },
      { n: '優酪乳（無糖）',   a: '1 杯',   w: '240cc', t: '看配料確認無糖' },
      { s: '脫脂' },
      { n: '脫脂牛奶',         a: '1 杯',    w: '240ml', t: '80 大卡' },
      { n: '脫脂奶粉',         a: '2.5 匙',  w: '20g' },
      { s: '全脂（熱量較高）' },
      { n: '全脂牛奶',         a: '1 杯',    w: '240ml', t: '150 大卡' },
      { n: '全脂奶粉',         a: '4 匙',    w: '30g' },
      { n: '全脂起司',         a: '2 片',    w: '45g',   t: '150 大卡' },
      { s: '乳糖不耐替代' },
      { n: '低乳糖牛奶',       a: '1 杯',    w: '240ml' },
      { n: '希臘優格（無糖）', a: '½ 杯',   w: '100g',  t: '★ 高蛋白' },
    ]
  },
  vegetable: {
    name: '蔬菜類',
    emoji: '🥦',
    serving: '1 份 = 蛋白質 1g ／碳水 5g ／熱量 25 大卡（生重約 100g ≈ 熟 ½ 碗）',
    tip: '💡 每日至少 3 份（約 1.5 碗熟菜）。生菜體積大、煮後縮水多，別被碗數嚇到。注意：牛蒡雖歸蔬菜但含醣較高！大番茄是蔬菜，小番茄是水果。',
    items: [
      { s: '深色葉菜（★ 優先）' },
      { n: '菠菜',       a: '生 1 碗',   w: '100g',   t: '高鐵、葉酸' },
      { n: '地瓜葉',     a: '生 1 碗',   w: '100g',   t: '★ 高纖、高鐵' },
      { n: '空心菜',     a: '生 1 碗',   w: '100g' },
      { n: '青江菜',     a: '生 1 碗 → 熟 ½ 碗', w: '100g', t: '葉沒有纖維，主要吃莖' },
      { n: '紅莧菜',     a: '生 1½ 碗 → 熟 ½ 碗', w: '100g', t: '高鈣、高鐵' },
      { n: '紫高麗苗',   a: '生 1 碗',   w: '100g',  t: '花青素，適合生食' },
      { s: '十字花科' },
      { n: '花椰菜（綠）',a: '生 1 碗 → 熟 ¾ 碗', w: '100g', t: '★ 鮮綠色再切，半分鐘就好' },
      { n: '高麗菜',     a: '生 1 碗 → 熟 ½ 碗', w: '100g' },
      { n: '高麗菜切絲（生）', a: '2 碗', w: '100g', t: '生食計份很多' },
      { s: '瓜果蔬菜' },
      { n: '大番茄',     a: '⅔ 顆 → 熟 ½ 碗', w: '100g', t: '蔬菜類！茄紅素加熱更好' },
      { n: '甜椒',       a: '¾ 碗 → 熟 ½ 碗', w: '100g', t: '★ 高維生素 C' },
      { n: '玉米筍',     a: '¾ 碗',     w: '100g',  t: '是蔬菜不是澱粉' },
      { n: '四季豆',     a: '¾ 碗 → 熟 ½ 碗', w: '100g' },
      { n: '秋葵',       a: '1 碗 → 熟 ¾ 碗', w: '100g', t: '水溶性膳食纖維' },
      { s: '根莖蔬菜' },
      { n: '胡蘿蔔',     a: '⅔ 根 → 熟 ½ 碗', w: '100g', t: 'β-胡蘿蔔素，加油更好吸收' },
      { n: '白蘿蔔',     a: '¾ 碗 → 熟 ½ 碗', w: '100g', t: '十字花科，鹼性蔬菜' },
      { n: '西洋芹',     a: '¾ 碗 → 熟 ½ 碗', w: '100g', t: '高鉀，控血壓' },
      { n: '牛蒡',       a: '1 碗',     w: '100g',  t: '⚠ 含醣高，但歸蔬菜' },
      { s: '菇類' },
      { n: '香菇',       a: '1 碗 → 熟 ½ 碗', w: '100g', t: '乾香菇鈣含量更高' },
      { n: '杏鮑菇',     a: '½ 根',     w: '100g' },
      { n: '金針菇',     a: '½ 包',     w: '100g', t: '高纖' },
      { n: '木耳',       a: '1 碗',     w: '100g', t: '★ 高纖、低熱量' },
      { s: '其他' },
      { n: '洋蔥',       a: '½ 個',     w: '100g' },
      { n: '蘆筍',       a: '5–6 根',   w: '100g' },
      { n: '豆芽菜',     a: '1 碗',     w: '100g' },
      { n: '海帶（昆布）',a: '1 碗',     w: '100g', t: '高碘、高纖' },
      { n: '紫菜',       a: '2 張',     w: '10g' },
    ]
  },
  fruit: {
    name: '水果類',
    emoji: '🍎',
    serving: '1 份 = 碳水 15g ／熱量 60 大卡（以可食量計）',
    tip: '💡 吃全果、不喝果汁。每日 1–2 份為宜。份量以「可食量」計算（去皮去籽後）。泰國芭樂是最平價的維生素 C 王！大番茄是蔬菜、小番茄（聖女）是水果。',
    items: [
      { s: '★ 低糖推薦' },
      { n: '泰國芭樂',   a: '1 碗',       w: '可食 160g', t: '★ 最平價 C 王！' },
      { n: '聖女番茄',   a: '約 20 顆（1 碗）', w: '可食 220g', t: '★ 低熱量' },
      { n: '蘋果',       a: '¾ 碗',       w: '購 145g → 可食 130g', t: '★ 高纖' },
      { n: '奇異果（綠）',a: '1.5 粒',    w: '可食 105g', t: '★ 高 C，促進腸道蠕動' },
      { n: '奇異果（黃）',a: '1 粒',      w: '可食 105g', t: '★ 高 C，甜度較高' },
      { s: '柑橘類' },
      { n: '柳丁',       a: '¾ 碗',       w: '購 170g → 可食 130g', t: '高維生素 C' },
      { n: '文旦',       a: '¾ 碗',       w: '可食 165g' },
      { n: '葡萄柚',     a: '½ 個',       w: '165g' },
      { s: '溫帶水果' },
      { n: '玫瑰桃',     a: '1 碗',       w: '可食 145g' },
      { n: '加州李',     a: '¾ 碗',       w: '購 125g → 可食 120g' },
      { n: '軟柿',       a: '1 碗',       w: '可食 100g',  t: '纖維是蘋果的 3 倍' },
      { n: '葡萄',       a: '11 粒（½ 碗）', w: '可食 85g' },
      { s: '瓜類' },
      { n: '西瓜',       a: '1 碗',       w: '購 320g → 可食 180g' },
      { n: '哈密瓜',     a: '¾ 碗',       w: '購 300g → 可食 150g' },
      { s: '熱帶水果（糖分較高）' },
      { n: '香蕉',       a: '大半根',     w: '購 95g → 可食 70g',  t: '糖分較高，勿超量' },
      { n: '鳳梨',       a: '¾ 碗',       w: '購 205g → 可食 110g' },
      { n: '愛文芒果',   a: '¾ 碗',       w: '購 225g → 可食 150g', t: '其實不算很甜' },
      { n: '木瓜',       a: '¾ 碗',       w: '購 165g → 可食 150g' },
      { n: '百香果',     a: '4 顆（¾ 碗）', w: '可食 140g', t: '維 A 是木瓜的 2.4 倍' },
      { n: '火龍果',     a: '¾ 碗',       w: '可食 110g' },
      { n: '荔枝',       a: '9–10 顆',    w: '購 185g → 可食 100g', t: '⚠ 糖分很高' },
      { s: '果乾（注意糖分濃縮）' },
      { n: '葡萄乾',     a: '1 湯匙',     w: '20g',  t: '⚠ 糖分濃縮，少量就好' },
    ]
  },
  oil: {
    name: '油脂與堅果種子類',
    emoji: '🫙',
    serving: '1 份 = 脂肪 5g ／熱量 45 大卡',
    tip: '💡 橄欖油選 Extra Virgin（冷壓初榨），不能高溫油炸。堅果務必選「原味無調味」。芝麻一定要磨碎才能吸收！酪梨是油脂類不是水果！',
    items: [
      { s: '植物油（★ 優先）' },
      { n: '橄欖油',     a: '⅓ 湯匙', w: '5g',  t: '★ 選 Extra Virgin' },
      { n: '苦茶油',     a: '⅓ 湯匙', w: '5g',  t: '★ 優先推薦' },
      { n: '椰子油',     a: '⅓ 湯匙', w: '5g',  t: '飽和脂肪高，少用' },
      { s: '堅果種子' },
      { n: '核桃仁',     a: '2 粒（½ 湯匙）', w: '7g',  t: '★ Omega-3，助腦健康' },
      { n: '杏仁果',     a: '6 粒（½ 湯匙）', w: '7g',  t: '★ 堅果界「低油」冠軍' },
      { n: '腰果',       a: '7 粒（½ 湯匙）', w: '10g' },
      { n: '花生仁',     a: '15 粒（1 湯匙）', w: '13g' },
      { n: '南瓜子',     a: '1 湯匙',   w: '10g',  t: '含鋅，男性保健' },
      { n: '葵瓜子',     a: '1 湯匙',   w: '10g' },
      { n: '黑（白）芝麻', a: '1 湯匙', w: '10g', t: '★ 務必磨碎才能吸收！' },
      { n: '亞麻仁籽',   a: '1 湯匙',   w: '12g', t: '★ Omega-3，降膽固醇' },
      { n: '奇亞籽',     a: '1 湯匙',   w: '15g', t: '★ 纖維是青江菜的 8 倍' },
      { s: '其他' },
      { n: '加州酪梨',   a: '⅙ 個中型（2 湯匙）', w: '40g', t: '★ 是油脂類不是水果！' },
      { n: '沙拉醬',     a: '½ 湯匙',   w: '10g',  t: '看標示選低脂' },
      { n: '花生醬',     a: '1.5 茶匙', w: '8g' },
      { n: '芝麻醬',     a: '1.5 茶匙', w: '8g' },
      { s: '動物油脂（⚠ 少用）' },
      { n: '牛油',       a: '⅓ 湯匙', w: '6g',  t: '飽和脂肪' },
      { n: '豬油',       a: '⅓ 湯匙', w: '5g',  t: '飽和脂肪' },
    ]
  },
  'eating-out': {
    name: '外食代換參考',
    emoji: '🍱',
    serving: 'C=全穀 P=蛋白質 V=蔬菜 O=油脂 M=乳品 ／數字=份數',
    tip: '💡 外食的份量拆解，幫助你估算一餐吃了多少。重點：看得懂代換就能控制熱量！便當類通常油脂偏高、蔬菜不足。',
    items: [
      { s: '早餐店' },
      { n: '鮮肉水煎包（1個）',   a: '274 kcal',  w: '92g',   t: '2C+0.9P+1.5O' },
      { n: '高麗菜水煎包（1個）', a: '227 kcal',  w: '100g',  t: '2.2C+0.2V+1.5O' },
      { n: '蛋餅（1份）',         a: '283 kcal',  w: '94g',   t: '2C+1P+1.5O' },
      { n: '蘿蔔糕（1份）',       a: '325 kcal',  w: '—',     t: '4C+1O' },
      { n: '三明治（1份）',       a: '312 kcal',  w: '119g',  t: '2.2C+1P+1O+0.2M' },
      { n: '原味貝果（1個）',     a: '258 kcal',  w: '107g',  t: '3.5C+0.1O' },
      { n: '飯糰（1個）',         a: '390 kcal',  w: '193g',  t: '4C+0.5P+0.2V+1.5O' },
      { n: '中杯奶茶',           a: '181 kcal',  w: '330cc', t: '1.8O+25g 糖 ⚠ 奶精是油' },
      { s: '中式麵食' },
      { n: '無糖豆漿（1杯）',    a: '128 kcal',  w: '330cc', t: '1.7P' },
      { n: '山東饅頭（1個）',     a: '444 kcal',  w: '180g',  t: '6C' },
      { n: '小籠包（1籠8顆）',   a: '540 kcal',  w: '213g',  t: '3C+2P+3O' },
      { n: '肉包（1個）',         a: '206 kcal',  w: '—',     t: '2C+0.8P+1.5O' },
      { n: '菜包（1個）',         a: '198 kcal',  w: '—',     t: '2C+0.5V+1O' },
      { n: '水餃（10顆）',       a: '489 kcal',  w: '229g',  t: '3.2C+2P+1V+2O' },
      { n: '鍋貼（10顆）',       a: '498 kcal',  w: '240g',  t: '3C+2P+0.5V+3O' },
      { s: '麵飯類' },
      { n: '乾麵（1碗）',         a: '450 kcal',  w: '342g',  t: '4C+1P+0.1V+2O' },
      { n: '麻醬麵（1碗）',       a: '463 kcal',  w: '288g',  t: '4C+0.1V+4O' },
      { n: '牛肉麵（1碗）',       a: '478 kcal',  w: '740g',  t: '4C+1.7P+0.1V+1O' },
      { n: '滷肉飯（1碗）',       a: '635 kcal',  w: '290g',  t: '6.5C+0.6P+3O' },
      { n: '肉羹麵（1碗）',       a: '378 kcal',  w: '444g',  t: '3C+1.5P+0.4V+1O' },
      { n: '涼麵（1盒）',         a: '395 kcal',  w: '300g',  t: '3C+0.2P+4O' },
      { s: '小吃類' },
      { n: '酸辣湯（1碗）',       a: '130 kcal',  w: '317g',  t: '0.5C+0.5P+0.5V+0.5O' },
      { n: '大餛飩（8顆）',       a: '335 kcal',  w: '242g',  t: '2C+2P+1O' },
      { n: '小餛飩（6顆）',       a: '225 kcal',  w: '174g',  t: '1.5C+1P+1O' },
      { n: '貢丸湯',             a: '98 kcal',   w: '428g',  t: '1P+0.5O' },
      { n: '燙青菜（1份）',       a: '83 kcal',   w: '131g',  t: '1.5V+1O' },
      { n: '豆皮壽司（3個）',     a: '330 kcal',  w: '150g',  t: '3C+1P+1O' },
      { n: '海苔壽司（6片）',     a: '403 kcal',  w: '217g',  t: '4C+1.5P+0.4V' },
      { n: '肉粽（1顆）',         a: '445 kcal',  w: '173g',  t: '4C+1P+2O' },
      { n: '甜不辣（1份）',       a: '455 kcal',  w: '229g',  t: '3C+2P+0.2V+2O' },
      { n: '大腸麵線（小碗）',   a: '278 kcal',  w: '295g',  t: '3C+0.3P+1O' },
      { n: '清蒸肉圓（2顆）',   a: '418 kcal',  w: '326g',  t: '4C+1.2P+0.1V+1O' },
      { s: '便當類' },
      { n: '排骨便當',           a: '818 kcal',  w: '499g',  t: '5C+3.5P+1V+3~4O' },
      { n: '炸雞腿便當',         a: '855 kcal',  w: '515g',  t: '5C+4P+1V+3~4O' },
      { n: '水煮便當（雞胸）',   a: '586 kcal',  w: '941g',  t: '4.8C+5P+2V' },
      { s: '異國料理' },
      { n: '蔬菜比薩（薄皮1片）', a: '150 kcal', w: '81g',   t: '1C+0.2V+1O+0.2M' },
      { n: '夏威夷比薩（厚皮1片）', a: '259 kcal', w: '108g', t: '2C+0.5P+0.1F+1O+0.2M' },
      { n: '肉醬義大利麵（1盤）', a: '480 kcal', w: '407g',  t: '5C+0.5P+0.1V+2O' },
      { n: '日式炸豬排定食',     a: '820 kcal',  w: '483g',  t: '6.5C+2.7P+1.4V+3O' },
      { n: '韓式豆腐鍋（1鍋）', a: '940 kcal',  w: '1080g', t: '10C+2.3P+0.8V+1O' },
      { n: '石鍋拌飯（1碗）',   a: '797 kcal',  w: '473g',  t: '7C+2.3P+1.1V+1.5O' },
      { n: '打拋豬飯（1碗）',   a: '880 kcal',  w: '539g',  t: '7.5C+3.2P+1V+2O' },
      { n: '綠咖哩雞飯（1碗）', a: '728 kcal',  w: '419g',  t: '6.7C+2P+0.8V' },
      { n: '牛肉河粉（1碗）',   a: '533 kcal',  w: '869g',  t: '5.5C+3.2P+0.7V+0.5O' },
      { n: '鐵板牛排（1客）',   a: '756 kcal',  w: '413g',  t: '5.3C+3.3P+0.5V+3O' },
      { n: '小火鍋（豬肉）',     a: '620 kcal',  w: '—',     t: '3C+3P+2V+1~3O' },
      { s: '壽司' },
      { n: '鮭魚壽司（1個）',   a: '52 kcal',   w: '27g',   t: '0.5C+0.3P' },
      { n: '鮪魚壽司（1個）',   a: '42 kcal',   w: '26g',   t: '0.5C+0.4P' },
      { n: '鮮蝦壽司（1個）',   a: '34 kcal',   w: '21g',   t: '0.4C+0.2P' },
      { n: '玉子燒壽司（1個）', a: '68 kcal',   w: '30g',   t: '0.6C+0.2P+0.2O' },
      { n: '鮭魚子壽司（1個）', a: '45 kcal',   w: '24g',   t: '0.5C+0.3P' },
      { s: '點心飲料' },
      { n: '茶碗蒸',             a: '85 kcal',   w: '135g',  t: '1P+2.5g 糖' },
      { n: '玉米濃湯（1碗）',   a: '150 kcal',  w: '242g',  t: '1.5C+1O' },
      { n: '珍珠鮮奶茶（全糖）', a: '355 kcal', w: '500cc', t: '2C+0.5M+35g 糖' },
      { n: '珍珠奶茶（全糖）',   a: '413 kcal', w: '500cc', t: '2C+2.5O+40g 糖 ⚠ 奶精' },
      { n: '葡式蛋塔（1個）',   a: '259 kcal',  w: '49g',   t: '0.7C+0.3P+3.3O' },
      { n: '蜂蜜蛋糕（1片）',   a: '173 kcal',  w: '80g',   t: '0.6C+0.3P+1O+15g 糖' },
      { n: '鳳梨酥（1個）',     a: '166 kcal',  w: '30g',   t: '1C+1.5O+7g 糖' },
      { n: '冰淇淋（1小盒）',   a: '230 kcal',  w: '88g',   t: '1M+20g 糖' },
      { n: '炸雞排（1片）',     a: '505 kcal',  w: '137g',  t: '1C+4P+3O' },
      { n: '蔥抓餅加蛋',         a: '410 kcal',  w: '172g',  t: '3.5C+1P+2O' },
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
