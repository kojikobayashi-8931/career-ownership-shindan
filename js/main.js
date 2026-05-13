/**
 * キャリアオーナーシップ診断 — メインロジック
 * NODIA Co., Ltd.
 */

/* ============================================================
   GAS エンドポイント設定
   ※ GASをデプロイ後、以下URLを実際のエンドポイントに変更してください
============================================================ */
const GAS_ENDPOINT = 'https://script.google.com/macros/s/YOUR_GAS_DEPLOYMENT_ID/exec';

/* ============================================================
   定数定義
============================================================ */

/** 領域名マップ */
const AREA_LABELS = {
  leadership: '経営・宣言',
  manager:    '管理職支援',
  culture:    '組織風土',
  system:     '制度設計',
  individual: '個人行動',
  data:       'データ把握',
};

/** 領域の重み */
const AREA_WEIGHTS = {
  leadership: 0.20,
  manager:    0.20,
  culture:    0.20,
  system:     0.15,
  individual: 0.15,
  data:       0.10,
};

/** 領域の優先順位（同スコア時の判定に使用） */
const AREA_PRIORITY = ['leadership', 'manager', 'culture', 'system', 'individual', 'data'];

/* ============================================================
   設問フロー定義
   type: 'question' | 'quantitative'
============================================================ */
const QUESTION_FLOW = [
  // ── 経営・宣言（Q1〜Q5）────────────────────────────
  {
    type: 'question', id: 'Q1', area: 'leadership',
    text: '経営層（CEO・CHROなど）が、キャリア自律の重要性を公式な場で繰り返し発信している',
  },
  {
    type: 'question', id: 'Q2', area: 'leadership',
    text: 'キャリアオーナーシップに関する方針が、中期経営計画や人材戦略の文書に明記されている',
  },
  {
    type: 'question', id: 'Q3', area: 'leadership',
    text: '「なぜキャリア自律が必要か」について、経営と人事の間で共通の言語・定義が存在している',
  },
  {
    type: 'question', id: 'Q4', area: 'leadership',
    text: '経営層が、社員のキャリア自律を「経営投資」として捉えて意思決定していると感じる',
  },
  {
    type: 'question', id: 'Q5', area: 'leadership',
    text: 'キャリアオーナーシップの推進が、事業成果や人的資本KPIと紐づけて語られている',
  },
  // ── 管理職支援（Q6）→ 定量①→ Q7〜Q10 ─────────────
  {
    type: 'question', id: 'Q6', area: 'manager',
    text: '管理職が、業務進捗以外にメンバーのキャリアについて対話する機会を定期的に設けている',
  },
  {
    type: 'quantitative', id: 'DQ1',
    title: '1on1の実施状況',
    fields: [
      {
        id: 'dq1_freq', label: '1on1の実施頻度', type: 'radio',
        options: ['週1回以上', '月2〜3回', '月1回', '四半期に1回程度', '実施していない'],
      },
      {
        id: 'dq1_rate', label: '1on1の実施率（わかる場合）',
        type: 'number', unit: '%', placeholder: '例：65',
      },
    ],
  },
  {
    type: 'question', id: 'Q7', area: 'manager',
    text: '管理職が、メンバーの「やりたいこと（Will）」を把握したうえで育成・配置に関わっている',
  },
  {
    type: 'question', id: 'Q8', area: 'manager',
    text: '管理職自身が自分のキャリアを主体的に考えており、メンバーへの支援姿勢に表れていると感じる',
  },
  {
    type: 'question', id: 'Q9', area: 'manager',
    text: '管理職が、メンバーの挑戦や異動希望を部門の損失として抵抗するのではなく、後押しする姿勢が組織に根付いている',
  },
  {
    type: 'question', id: 'Q10', area: 'manager',
    text: '管理職に対して、キャリア支援のスキルや対話方法に関するトレーニングが提供されている',
  },
  // ── 組織風土（Q11〜Q15）──────────────────────────────
  {
    type: 'question', id: 'Q11', area: 'culture',
    text: '社員が「キャリアについて考えること」を、日常的に自然なこととして受け入れていると感じる',
  },
  {
    type: 'question', id: 'Q12', area: 'culture',
    text: '挑戦や新しい役割への異動を試みた社員が、組織から肯定的に評価されていると感じる',
  },
  {
    type: 'question', id: 'Q13', area: 'culture',
    text: '失敗や軌道修正を経た社員に対して、それを成長として受け止め支援する組織風土がある',
  },
  {
    type: 'question', id: 'Q14', area: 'culture',
    text: '異なる部署・職種・年代の社員同士が、キャリアについて率直に話せる機会や場がある',
  },
  {
    type: 'question', id: 'Q15', area: 'culture',
    text: '「キャリアは個人の問題」ではなく「組織が一緒に考えるもの」という認識が浸透していると感じる',
  },
  // ── 制度設計（Q16）→ 定量②→ Q17 → 定量③→ Q18 → 定量④→ Q19 ──
  {
    type: 'question', id: 'Q16', area: 'system',
    text: '社内公募・FA制度・社内兼務など、社員が自らキャリアを動かせる制度が存在している',
  },
  {
    type: 'quantitative', id: 'DQ2',
    title: '社内公募・手挙げ制度の利用状況',
    fields: [
      {
        id: 'dq2_recruit_rate', label: '社内公募制度の応募率（直近1年間）',
        type: 'number', unit: '%', placeholder: '例：12',
        note: '制度がない場合はスキップしてください',
      },
      {
        id: 'dq2_apply_rate', label: '社内異動・手挙げ制度の利用率（直近1年間）',
        type: 'number', unit: '%', placeholder: '例：8',
        note: '制度がない場合はスキップしてください',
      },
    ],
  },
  {
    type: 'question', id: 'Q17', area: 'system',
    text: '学習・リスキリングを支援する制度（研修補助・学習時間の確保など）が整備されている',
  },
  {
    type: 'quantitative', id: 'DQ3',
    title: '研修・学習プログラムの受講状況',
    fields: [
      {
        id: 'dq3_training_rate', label: '研修・学習プログラムの受講率（直近1年間）',
        type: 'number', unit: '%', placeholder: '例：70',
      },
    ],
  },
  {
    type: 'question', id: 'Q18', area: 'system',
    text: 'キャリア面談・1on1など、社員が自分のキャリアを定期的に振り返れる仕組みがある',
  },
  {
    type: 'quantitative', id: 'DQ4',
    title: 'キャリア面談の実施状況',
    fields: [
      {
        id: 'dq4_career_talk_rate', label: 'キャリア面談の実施率（年1回以上実施されている社員の割合）',
        type: 'number', unit: '%', placeholder: '例：55',
      },
    ],
  },
  {
    type: 'question', id: 'Q19', area: 'system',
    text: '制度が「存在するだけ」でなく、社員に認知され実際に活用されていると感じる',
  },
  // ── 個人行動（Q20〜Q22）→ 定量⑤→ Q23 ────────────────
  {
    type: 'question', id: 'Q20', area: 'individual',
    text: '社員が、会社から求められる前に自発的にキャリアについて考え、行動している',
  },
  {
    type: 'question', id: 'Q21', area: 'individual',
    text: '社員が、自分の強みや価値観を言語化し、上司や人事に積極的に伝えようとしている',
  },
  {
    type: 'question', id: 'Q22', area: 'individual',
    text: '社員が、社内外の学習機会や越境体験を自ら取りに行く行動が見られる',
  },
  {
    type: 'quantitative', id: 'DQ5',
    title: '副業・兼業の利用状況',
    fields: [
      {
        id: 'dq5_side_count', label: '副業・兼業申請者数（直近1年間）',
        type: 'number', unit: '人', placeholder: '例：30',
      },
      {
        id: 'dq5_side_rate', label: '副業・兼業利用率（全社員に対する割合）',
        type: 'number', unit: '%', placeholder: '例：5',
      },
    ],
  },
  {
    type: 'question', id: 'Q23', area: 'individual',
    text: 'キャリア自律に積極的な社員が、周囲にも良い影響を与えていると感じる',
  },
  // ── データ把握（Q24）→ 定量⑥→ Q25〜Q26 ──────────────
  {
    type: 'question', id: 'Q24', area: 'data',
    text: 'エンゲージメントサーベイや離職率などのデータを定期的に収集・分析している',
  },
  {
    type: 'quantitative', id: 'DQ6',
    title: 'エンゲージメント・離職データ',
    fields: [
      {
        id: 'dq6_engagement', label: 'エンゲージメントサーベイのスコア（直近）',
        type: 'number', unit: '点', placeholder: '例：65',
        note: '使用しているサーベイツールの基準に従った数値をご入力ください',
      },
      {
        id: 'dq6_turnover', label: '離職率（直近1年間）',
        type: 'number', unit: '%', placeholder: '例：4.5',
      },
    ],
  },
  {
    type: 'question', id: 'Q25', area: 'data',
    text: 'キャリア関連データ（公募応募率・研修受講率など）が人事戦略の意思決定に活用されている',
  },
  {
    type: 'question', id: 'Q26', area: 'data',
    text: 'キャリアオーナーシップ推進施策の効果を測定する指標（KPI）が設定されている',
  },
];

/* ============================================================
   段階別メッセージ
============================================================ */
const STAGE_MESSAGES = {
  1: {
    name: '黎明期',
    description: `キャリアオーナーシップの推進に向けた組織的な取り組みが、まだ始まっていない段階です。経営・制度・文化のいずれの面でも基盤が整っておらず、今後の施策設計において「何から着手するか」の優先順位を定めることが最初のステップとなります。`,
    direction: `まず経営層がキャリア自律の必要性を認識し、人事がその意義を言語化することが起点となります。大規模な制度整備よりも、「なぜキャリアオーナーシップが自社に必要か」という問いに対する共通認識の形成を優先してください。`,
  },
  2: {
    name: '認知期',
    description: `キャリアオーナーシップという概念は組織内に認知され始めていますが、施策・制度・文化の整備はこれからの段階です。「言葉は知っているが、具体的に何をすればよいかわからない」という状態が多くの組織で共通して見られます。`,
    direction: `認知から理解へ移行するためには、経営層による明確な意思表明と、それを人事が制度設計に落とし込む連動が重要です。全社一斉の大規模施策よりも、まず1つの部門・職種でパイロット的に取り組みを始め、成功事例を社内に広げるアプローチが有効です。`,
  },
  3: {
    name: '理解期',
    description: `キャリアオーナーシップに関する施策が一定程度始まっており、組織としての理解は深まっています。しかし「共感はあるが行動に移せない」という2周目の壁に直面している段階です。制度は存在しても活用率が低い、管理職が制度の意義を現場に翻訳できていない、といった課題が典型的に見られます。`,
    direction: `施策の追加よりも、既存施策が機能しない構造的な要因の特定が先決です。経営・人事・管理職・現場の間で「キャリアオーナーシップ」の定義と粒度が揃っているかを確認し、管理職が現場で翻訳者としての役割を果たせる仕組みを整えることが次の焦点となります。`,
  },
  4: {
    name: '共感期',
    description: `制度と文化の基盤が整い、キャリアオーナーシップに共感し行動している社員が一定数現れている段階です。ただし、その取り組みが組織全体に広がっているとは言えず、部門や管理職によってばらつきが生じている状態です。`,
    direction: `一部の先行層の行動を組織全体に広げるためには、成功事例の可視化と横展開が重要です。また、キャリアオーナーシップの取り組みを人的資本KPIや事業成果と接続し、経営アジェンダとして位置づけることで、持続的な推進力を生み出すことができます。`,
  },
  5: {
    name: '実践期',
    description: `組織・上司・個人の三者が連動してキャリアオーナーシップを推進している段階です。制度・文化・経営方針が一体となって機能しており、キャリア自律が組織の経営インフラとして定着しつつあります。`,
    direction: `現在の取り組みをさらに高度化するためには、他社との比較データを活用した客観的な現在地の把握と、データドリブンなPDCAサイクルの確立が有効です。また、キャリアオーナーシップの効果を定量的に示すことで、経営層の継続的な投資判断を支えることができます。`,
  },
};

/* ============================================================
   領域別の強みコメント
============================================================ */
const AREA_STRENGTHS = {
  leadership: `経営層によるキャリアオーナーシップの意思表明と事業戦略との接続が進んでいます。この基盤を活かして、人事施策との連動をさらに強化することで、組織全体への浸透が加速します。`,
  manager:    `管理職によるメンバーへのキャリア支援の文化が根付いています。管理職の支援行動を定量的に測定・可視化することで、さらなる質の向上と組織全体への横展開が可能になります。`,
  culture:    `挑戦や対話を受け入れる組織風土が形成されています。この文化的基盤は、制度整備や個人行動の促進において強力な推進力となります。`,
  system:     `キャリア自律を支える制度の整備と活用が進んでいます。制度の利用データを蓄積・分析することで、さらなる改善と経営への説明根拠として活用できます。`,
  individual: `社員レベルでのキャリア自律行動が見られています。この積極的な層のストーリーを可視化・発信することで、まだ動き出せていない中間層への波及効果が期待できます。`,
  data:       `キャリア関連データの収集・活用体制が整っています。このデータ基盤を活かして、施策の効果検証と経営への説明責任を果たすサイクルを確立してください。`,
};

/* ============================================================
   領域別の課題コメント
============================================================ */
const AREA_ACTIONS = {
  leadership: {
    issue: `経営層によるキャリアオーナーシップの意思表明と、事業戦略との接続が不十分な状態です。人事が施策を推進しようとしても、経営の関与がなければ現場への浸透には限界があります。`,
    action: `まず、キャリアオーナーシップが事業成果や人的資本KPIとどう結びつくかを示すエビデンスを整備し、経営層が投資判断できるストーリーを構築してください。エンゲージメントスコアや離職率との相関データ、他社の先行事例が有効な材料になります。次のステップとして、中期経営計画や人材戦略文書にキャリアオーナーシップに関する方針を明記することを目指してください。`,
  },
  manager: {
    issue: `管理職がメンバーのキャリア支援を十分に行えていない状態です。管理職自身のキャリア意識が低いことや、支援スキルの不足、評価制度との不整合が主な要因として考えられます。`,
    action: `まず管理職自身が自分のキャリアを振り返る機会を設けることが起点となります。管理職向けのキャリアワークショップや異業種交流の場は、自己開示を促し、メンバー支援への動機づけにつながります。次に、1on1の対話ガイドを整備し、「どう聞くか・どう返すか」を具体化した支援ツールを提供することで、管理職の支援行動を標準化することができます。`,
  },
  culture: {
    issue: `挑戦や失敗を受け入れる文化、キャリアについて率直に話せる心理的安全性が不足している状態です。制度が整っていても、風土が整っていなければ社員は行動に踏み出しにくくなります。`,
    action: `組織風土の変革は短期間では難しいですが、「小さな成功体験の可視化」から始めることが有効です。現組織で挑戦した社員・異動した社員のストーリーを社内で積極的に共有し、それが組織から肯定的に評価されるメッセージを経営・人事が継続的に発信してください。また、部門を超えたキャリア対話の場（別部署・別階層社員とのメンタープログラム・越境体験プログラムなど）を設けることで、キャリアについて話すことを日常化することができます。`,
  },
  system: {
    issue: `社員がキャリアを自律的に動かすための制度（社内公募・学習支援・キャリア面談など）が整備されていないか、存在しても活用されていない状態です。制度の不在はキャリア自律の意欲がある社員にとっての障壁となります。`,
    action: `全制度を一度に整備しようとせず、自社の課題に最も直結する1〜2つの制度から着手することを推奨します。特に「キャリア面談の仕組み化」は比較的低コストで導入でき、社員のキャリア意識を高める起点になります。制度を設計する際には、「存在するだけ」にならないよう、社員への認知施策と管理職への翻訳支援をセットで設計してください。`,
  },
  individual: {
    issue: `社員レベルでのキャリア自律行動が十分に見られない状態です。制度や管理職支援が整っていても、社員個人が「自分事」としてキャリアを捉えていなければ行動変容には至りません。`,
    action: `個人の行動変容を促すためには、内発的動機（価値観・危機感・貢献意欲）と外発的動機（上司の問いかけ・社内公募・ロールモデルの存在）の両面からアプローチすることが有効です。特に組織内の約6割を占める「中間層」へのアプローチが鍵となります。中間層がキャリアを自分事にするトリガーとして、価値観の言語化ワークや、小さな挑戦機会の設計が効果的です。`,
  },
  data: {
    issue: `キャリアオーナーシップ推進の根拠となるデータの収集・活用が不十分な状態です。データがなければ施策の効果検証ができず、経営への説明責任も果たしにくくなります。`,
    action: `まずエンゲージメントサーベイや離職率など、すでに取得可能なデータをキャリアオーナーシップの観点で再分析することから始めてください。次に、公募応募率・研修受講率・キャリア面談実施率など、キャリア関連データの定期的な収集体制を整備し、人事戦略の意思決定に活用できるダッシュボードを構築することを目指してください。データと施策を接続することで、経営層に対して「キャリアオーナーシップへの投資が成果につながっている」というエビデンスを示せるようになります。`,
  },
};

/* ============================================================
   アプリケーション状態
============================================================ */
const state = {
  userInfo: {
    name: '', email: '', job: '', industry: '', size: '', company: '',
  },
  currentStep: 0,
  answers: {},       // { Q1: 3, Q2: 5, ... }
  quantData: {},     // { dq1_freq: '月1回', dq1_rate: '65', ... }
  areaScores: {},
  totalScore: 0,
  stage: null,
  gasSent: false,
};

/* ============================================================
   スコア計算
============================================================ */

/** 領域スコアを計算（0〜100点）*/
function calcAreaScore(answers) {
  const n = answers.length;
  const sum = answers.reduce((a, b) => a + b, 0);
  return Math.round(((sum - n) / (n * 5)) * 100 * 10) / 10;
}

/** 総合スコアを計算 */
function calcTotalScore(areaScores) {
  const total = Object.keys(AREA_WEIGHTS).reduce((sum, key) => {
    return sum + (areaScores[key] || 0) * AREA_WEIGHTS[key];
  }, 0);
  return Math.round(total * 10) / 10;
}

/** 段階判定 */
function getStage(score) {
  if (score < 20) return { level: 1, name: '黎明期' };
  if (score < 40) return { level: 2, name: '認知期' };
  if (score < 60) return { level: 3, name: '理解期' };
  if (score < 80) return { level: 4, name: '共感期' };
  return { level: 5, name: '実践期' };
}

/** 全スコアを一括計算してstateに保存 */
function computeAllScores() {
  const areaAnswers = {
    leadership: [], manager: [], culture: [],
    system: [], individual: [], data: [],
  };

  QUESTION_FLOW.forEach((step) => {
    if (step.type !== 'question') return;
    const val = state.answers[step.id];
    if (val !== undefined) areaAnswers[step.area].push(val);
  });

  Object.keys(areaAnswers).forEach((area) => {
    state.areaScores[area] = calcAreaScore(areaAnswers[area]);
  });

  state.totalScore = calcTotalScore(state.areaScores);
  state.stage = getStage(state.totalScore);
}

/* ============================================================
   コメント生成
============================================================ */

/** 上位2・下位2領域を特定 */
function rankAreas(areaScores) {
  const sorted = AREA_PRIORITY
    .map((key) => ({ key, score: areaScores[key] || 0 }))
    .sort((a, b) => b.score - a.score);

  return {
    strong: sorted.slice(0, 2),
    weak:   sorted.slice(-2).reverse(),
  };
}

/* ============================================================
   レーダーチャート描画
============================================================ */
function drawRadarChart(canvas, areaScores) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(cx, cy) * 0.62;
  const n = 6;
  const areas = ['leadership', 'manager', 'culture', 'system', 'individual', 'data'];
  const labels = ['経営・宣言', '管理職支援', '組織風土', '制度設計', '個人行動', 'データ把握'];

  ctx.clearRect(0, 0, W, H);

  const angle = (i) => (Math.PI * 2 * i / n) - Math.PI / 2;
  const pt = (i, r) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  // 背景グリッド（5段階）
  for (let level = 5; level >= 1; level--) {
    const r = radius * (level / 5);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = pt(i, r);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = level === 5 ? '#D0D8E0' : '#E8EDF2';
    ctx.lineWidth = level === 5 ? 1.5 : 1;
    ctx.stroke();
    ctx.fillStyle = level % 2 === 0 ? 'rgba(245,247,250,0.6)' : 'rgba(255,255,255,0.6)';
    ctx.fill();
  }

  // 軸線
  for (let i = 0; i < n; i++) {
    const p = pt(i, radius);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#D0D8E0';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // データエリア
  ctx.beginPath();
  areas.forEach((area, i) => {
    const score = areaScores[area] || 0;
    const r = radius * (score / 100);
    const p = pt(i, r);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(45,139,146,0.22)';
  ctx.fill();
  ctx.strokeStyle = '#2D8B92';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // データポイント
  areas.forEach((area, i) => {
    const score = areaScores[area] || 0;
    const r = radius * (score / 100);
    const p = pt(i, r);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#2D8B92';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // ラベル
  ctx.fillStyle = '#2C3E50';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  areas.forEach((_, i) => {
    const labelR = radius * 1.3;
    const p = pt(i, labelR);
    const score = (areaScores[areas[i]] || 0).toFixed(0);

    // 小さい画面でも読めるよう行を分ける
    const devicePixelRatio = window.devicePixelRatio || 1;
    const baseFontSize = Math.max(10, Math.floor(W / 36));
    ctx.font = `700 ${baseFontSize}px 'Noto Sans JP', sans-serif`;
    ctx.fillStyle = '#2C3E50';
    ctx.fillText(labels[i], p.x, p.y - 7);

    ctx.font = `500 ${baseFontSize - 1}px 'Noto Sans JP', sans-serif`;
    ctx.fillStyle = '#2D8B92';
    ctx.fillText(`${score}点`, p.x, p.y + 8);
  });
}

/* ============================================================
   GAS 送信
============================================================ */
async function sendToGAS(payload, retryCount = 0) {
  if (GAS_ENDPOINT.includes('YOUR_GAS_DEPLOYMENT_ID')) {
    console.warn('[GAS] エンドポイントが未設定です。GAS_ENDPOINTを実際のURLに変更してください。');
    return;
  }

  try {
    const res = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.info('[GAS] 送信完了');
  } catch (err) {
    console.error('[GAS] 送信エラー:', err);
    if (retryCount < 2) {
      await new Promise((r) => setTimeout(r, 2000 * (retryCount + 1)));
      return sendToGAS(payload, retryCount + 1);
    }
    console.error('[GAS] リトライ上限に達しました');
  }
}

/** スプレッドシートへ送るデータを組み立て */
function buildGASPayload(reportRequested = false) {
  const q = state.answers;
  const dq = state.quantData;
  return {
    timestamp: new Date().toISOString(),
    name: state.userInfo.name,
    email: state.userInfo.email,
    job: state.userInfo.job,
    industry: state.userInfo.industry,
    size: state.userInfo.size,
    company: state.userInfo.company,
    totalScore: state.totalScore,
    stage: state.stage?.name,
    scoreLeadership: state.areaScores.leadership,
    scoreManager:    state.areaScores.manager,
    scoreCulture:    state.areaScores.culture,
    scoreSystem:     state.areaScores.system,
    scoreIndividual: state.areaScores.individual,
    scoreData:       state.areaScores.data,
    // 個別回答
    Q1: q.Q1, Q2: q.Q2, Q3: q.Q3, Q4: q.Q4, Q5: q.Q5,
    Q6: q.Q6, Q7: q.Q7, Q8: q.Q8, Q9: q.Q9, Q10: q.Q10,
    Q11: q.Q11, Q12: q.Q12, Q13: q.Q13, Q14: q.Q14, Q15: q.Q15,
    Q16: q.Q16, Q17: q.Q17, Q18: q.Q18, Q19: q.Q19,
    Q20: q.Q20, Q21: q.Q21, Q22: q.Q22, Q23: q.Q23,
    Q24: q.Q24, Q25: q.Q25, Q26: q.Q26,
    // 定量データ
    dq1Freq:          dq.dq1_freq        ?? '',
    dq1Rate:          dq.dq1_rate        ?? '',
    dq2RecruitRate:   dq.dq2_recruit_rate ?? '',
    dq2ApplyRate:     dq.dq2_apply_rate  ?? '',
    dq3TrainingRate:  dq.dq3_training_rate ?? '',
    dq4CareerTalk:    dq.dq4_career_talk_rate ?? '',
    dq5SideCount:     dq.dq5_side_count  ?? '',
    dq5SideRate:      dq.dq5_side_rate   ?? '',
    dq6Engagement:    dq.dq6_engagement  ?? '',
    dq6Turnover:      dq.dq6_turnover    ?? '',
    reportRequested,
  };
}

/* ============================================================
   画面切替
============================================================ */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((el) => {
    el.classList.remove('screen--active');
  });
  const target = document.querySelector(`[data-screen="${name}"]`);
  if (target) {
    target.classList.add('screen--active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ============================================================
   質問フロー ── ステップ描画
============================================================ */

/** 全質問フローのうち type=question のものを収集し、通し番号を付ける */
const QUESTION_ONLY = QUESTION_FLOW.filter((s) => s.type === 'question');

function getCurrentStep() {
  return QUESTION_FLOW[state.currentStep];
}

function getAreaForStep(stepIndex) {
  const step = QUESTION_FLOW[stepIndex];
  if (!step) return null;
  if (step.type === 'question') return step.area;
  // 定量ステップは前後の質問ステップから領域を判定
  for (let i = stepIndex - 1; i >= 0; i--) {
    if (QUESTION_FLOW[i].type === 'question') return QUESTION_FLOW[i].area;
  }
  return null;
}

function getQuestionNumber(stepIndex) {
  let count = 0;
  for (let i = 0; i <= stepIndex; i++) {
    if (QUESTION_FLOW[i].type === 'question') count++;
  }
  return count;
}

/** プログレスナビを更新 */
function updateProgressNav(activeArea) {
  const items = document.querySelectorAll('.progress-nav__item');
  let passedActive = false;

  items.forEach((item) => {
    const area = item.dataset.area;
    item.classList.remove('is-active', 'is-done');
    if (area === activeArea) {
      item.classList.add('is-active');
      passedActive = true;
    } else if (!passedActive) {
      item.classList.add('is-done');
    }
  });
}

/** ステップを描画 */
function renderStep() {
  const step = getCurrentStep();
  const area = getAreaForStep(state.currentStep);

  // プログレスナビ
  updateProgressNav(area);

  // 問数カウンター（質問のみカウント）
  const qNum = QUESTION_ONLY.findIndex((q) => q.id === (step.type === 'question' ? step.id : null));
  const currentQNum = getQuestionNumber(state.currentStep);
  document.getElementById('question-counter-current').textContent = currentQNum;
  document.getElementById('question-counter-total').textContent = QUESTION_ONLY.length;

  // カード切替
  const qCard = document.getElementById('question-card');
  const dqCard = document.getElementById('quantitative-card');

  if (step.type === 'question') {
    qCard.hidden = false;
    dqCard.hidden = true;
    renderQuestionCard(step);
  } else {
    qCard.hidden = true;
    dqCard.hidden = false;
    renderQuantCard(step);
  }

  // 前へボタン
  const btnPrev = document.getElementById('btn-prev');
  btnPrev.style.visibility = state.currentStep === 0 ? 'hidden' : 'visible';
}

/** 質問カードを描画 */
function renderQuestionCard(step) {
  document.getElementById('q-area-label').textContent = AREA_LABELS[step.area];
  document.getElementById('q-text').textContent = step.text;

  // 選択済みの回答を復元（まず全クリア）
  const saved = state.answers[step.id];
  document.querySelectorAll('.answer-btn').forEach((btn) => {
    btn.classList.remove('is-selected');
    if (saved !== undefined && Number(btn.dataset.value) === saved) {
      btn.classList.add('is-selected');
    }
  });

  // 次へボタン：回答済みなら有効、未回答なら無効で表示
  const btnNext = document.getElementById('btn-next');
  btnNext.hidden = false;
  btnNext.textContent = '次へ →';
  btnNext.disabled = saved === undefined;
}

/** 定量参考カードを描画 */
function renderQuantCard(step) {
  // 次へボタンを定量カード用に設定
  const btnNext = document.getElementById('btn-next');
  btnNext.hidden = false;
  btnNext.textContent = '入力して次へ →';
  btnNext.disabled = false;

  const body = document.getElementById('quantitative-body');
  body.innerHTML = `<h3 style="font-size:15px;font-weight:700;color:var(--color-main);margin-bottom:16px;">${step.title}</h3>`;

  step.fields.forEach((field) => {
    const wrap = document.createElement('div');
    wrap.className = 'quant-field';

    const label = document.createElement('label');
    label.className = 'quant-field__label';
    label.textContent = field.label;
    wrap.appendChild(label);

    if (field.note) {
      const note = document.createElement('p');
      note.style.cssText = 'font-size:12px;color:var(--color-text-light);margin:0 0 8px;';
      note.textContent = field.note;
      wrap.appendChild(note);
    }

    if (field.type === 'radio') {
      const group = document.createElement('div');
      group.className = 'quant-radio-group';
      field.options.forEach((opt) => {
        const optLabel = document.createElement('label');
        optLabel.className = 'quant-radio-option';
        const savedVal = state.quantData[field.id];
        if (savedVal === opt) optLabel.classList.add('is-checked');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = field.id;
        radio.value = opt;
        if (savedVal === opt) radio.checked = true;
        radio.addEventListener('change', () => {
          document.querySelectorAll(`[name="${field.id}"]`).forEach((r) => {
            r.closest('.quant-radio-option').classList.remove('is-checked');
          });
          optLabel.classList.add('is-checked');
          state.quantData[field.id] = opt;
        });
        optLabel.appendChild(radio);
        optLabel.appendChild(document.createTextNode(opt));
        group.appendChild(optLabel);
      });
      wrap.appendChild(group);
    } else if (field.type === 'number') {
      const numWrap = document.createElement('div');
      numWrap.className = 'quant-number-wrap';
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'form-field__input';
      input.placeholder = field.placeholder || '';
      input.min = '0';
      input.id = `quant-input-${field.id}`;
      if (state.quantData[field.id] !== undefined) input.value = state.quantData[field.id];
      input.addEventListener('input', () => {
        state.quantData[field.id] = input.value;
      });
      numWrap.appendChild(input);
      if (field.unit) {
        const unit = document.createElement('span');
        unit.textContent = field.unit;
        numWrap.appendChild(unit);
      }
      wrap.appendChild(numWrap);
    }

    body.appendChild(wrap);
  });
}

/* ============================================================
   ステップ進行
============================================================ */
function goNext() {
  clearTimeout(autoAdvanceTimer);
  if (state.currentStep < QUESTION_FLOW.length - 1) {
    state.currentStep++;
    renderStep();
  } else {
    finishDiagnosis();
  }
}

function goPrev() {
  clearTimeout(autoAdvanceTimer);
  if (state.currentStep > 0) {
    state.currentStep--;
    renderStep();
  }
}

let autoAdvanceTimer = null;

/** 回答ボタンクリック */
function onAnswerClick(value) {
  const step = getCurrentStep();
  if (step.type !== 'question') return;

  state.answers[step.id] = value;

  // ボタンハイライト（まず全クリア）
  document.querySelectorAll('.answer-btn').forEach((btn) => {
    btn.classList.remove('is-selected');
    if (Number(btn.dataset.value) === value) btn.classList.add('is-selected');
  });

  // 次へボタンを有効化
  const btnNext = document.getElementById('btn-next');
  btnNext.disabled = false;

  // 500ms後に自動進行
  clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = setTimeout(() => {
    if (state.currentStep < QUESTION_FLOW.length - 1) {
      goNext();
    } else {
      finishDiagnosis();
    }
  }, 500);
}

/* ============================================================
   診断完了 → 結果画面
============================================================ */
function finishDiagnosis() {
  computeAllScores();
  showScreen('result');
  renderResult();

  // GAS送信
  const payload = buildGASPayload(false);
  sendToGAS(payload);
  state.gasSent = true;
}

/* ============================================================
   結果画面描画
============================================================ */
function renderResult() {
  const { totalScore, stage, areaScores, userInfo } = state;

  // ヒーロー
  document.getElementById('result-score-number').textContent = Math.round(totalScore);
  document.getElementById('result-stage-level').textContent = `Stage ${stage.level}`;
  document.getElementById('result-stage-name').textContent = stage.name;
  document.getElementById('result-user-name').textContent = `${userInfo.name} 様の診断結果`;

  // レーダーチャート
  const canvas = document.getElementById('radar-chart');
  requestAnimationFrame(() => drawRadarChart(canvas, areaScores));

  // 領域スコア一覧
  const areaList = document.getElementById('area-scores-list');
  areaList.innerHTML = '';
  AREA_PRIORITY.forEach((key) => {
    const score = areaScores[key] || 0;
    const row = document.createElement('div');
    row.className = 'area-score-row';
    row.innerHTML = `
      <span class="area-score-row__name">${AREA_LABELS[key]}</span>
      <div class="area-score-row__bar-wrap">
        <div class="area-score-row__bar" style="width:0%" data-target="${score}"></div>
      </div>
      <span class="area-score-row__score">${Math.round(score)}点</span>
    `;
    areaList.appendChild(row);
  });

  // バーアニメーション
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.querySelectorAll('.area-score-row__bar').forEach((bar) => {
        bar.style.width = `${bar.dataset.target}%`;
      });
    }, 300);
  });

  // 診断コメント
  const stageMsg = STAGE_MESSAGES[stage.level];
  document.getElementById('diagnosis-stage-label').textContent = `Stage ${stage.level}｜${stage.name}`;
  document.getElementById('diagnosis-body').innerHTML = `
    <div class="result-diagnosis__block">
      <h4>現状の説明</h4>
      <p>${stageMsg.description}</p>
    </div>
    <div class="result-diagnosis__block">
      <h4>次のフェーズへの方向性</h4>
      <p>${stageMsg.direction}</p>
    </div>
  `;

  // 強み・課題
  const { strong, weak } = rankAreas(areaScores);

  const strengthsList = document.getElementById('strengths-list');
  strengthsList.innerHTML = '';
  strong.forEach(({ key, score }) => {
    const item = document.createElement('div');
    item.className = 'strength-item';
    item.innerHTML = `
      <div class="strength-item__label">
        <span class="strength-item__icon">✓</span>
        <div>
          <div class="strength-item__name">${AREA_LABELS[key]}</div>
          <div class="strength-item__score">${Math.round(score)}点</div>
        </div>
      </div>
      <p class="strength-item__comment">${AREA_STRENGTHS[key]}</p>
    `;
    strengthsList.appendChild(item);
  });

  const weaknessesList = document.getElementById('weaknesses-list');
  weaknessesList.innerHTML = '';
  weak.forEach(({ key, score }) => {
    const action = AREA_ACTIONS[key];
    const item = document.createElement('div');
    item.className = 'weakness-item';
    item.innerHTML = `
      <div class="weakness-item__header">
        <span class="weakness-item__icon">▼</span>
        <span class="weakness-item__name">${AREA_LABELS[key]}</span>
        <span class="weakness-item__score">${Math.round(score)}点</span>
      </div>
      <div class="weakness-item__body">
        <div class="weakness-item__block">
          <div class="weakness-item__block-title">課題の説明</div>
          <p>${action.issue}</p>
        </div>
        <div class="weakness-item__block">
          <div class="weakness-item__block-title">推奨アクション</div>
          <p>${action.action}</p>
        </div>
      </div>
    `;
    weaknessesList.appendChild(item);
  });

  // 他社比較レポートのメールをプリセット
  document.getElementById('report-email').value = state.userInfo.email;

  // SNSシェアリンク設定
  setupShareLinks();
}

/* ============================================================
   SNSシェアリンク
============================================================ */
function setupShareLinks() {
  const score = Math.round(state.totalScore);
  const stage = state.stage.name;
  const pageUrl = encodeURIComponent(location.href);
  const text = encodeURIComponent(
    `自社のキャリアオーナーシップ診断を実施しました。\n総合スコア：${score}点 / ${stage}\n#キャリアオーナーシップ #NODIA`
  );

  document.getElementById('share-x').href =
    `https://twitter.com/intent/tweet?text=${text}&url=${pageUrl}`;
  document.getElementById('share-facebook').href =
    `https://www.facebook.com/sharer.php?u=${pageUrl}`;
}

/* ============================================================
   他社比較レポート希望
============================================================ */
function setupReportRequest() {
  const checkbox = document.getElementById('report-request-check');
  const emailWrap = document.getElementById('report-email-wrap');

  checkbox.addEventListener('change', () => {
    emailWrap.hidden = !checkbox.checked;
  });

  document.getElementById('btn-request-report').addEventListener('click', async () => {
    const email = document.getElementById('report-email').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('report-request-status').textContent =
        '有効なメールアドレスを入力してください';
      document.getElementById('report-request-status').style.color = 'var(--color-error)';
      return;
    }

    const btn = document.getElementById('btn-request-report');
    btn.disabled = true;
    btn.textContent = '送信中...';

    const payload = buildGASPayload(true);
    payload.reportEmail = email;
    await sendToGAS(payload);

    btn.textContent = '希望を登録しました ✓';
    document.getElementById('report-request-status').textContent =
      'データが蓄積され次第、NODIAよりご連絡いたします。';
    document.getElementById('report-request-status').style.color = 'var(--color-success)';
  });
}

/* ============================================================
   PDF ダウンロード（ブラウザ印刷ダイアログ経由）
============================================================ */
function downloadPDF() {
  window.print();
}

/* ============================================================
   フォームバリデーション
============================================================ */
function validateBasicInfo() {
  const fields = ['name', 'email', 'job', 'industry', 'size'];
  let valid = true;

  fields.forEach((key) => {
    const el = document.querySelector(`[data-field="${key}"]`);
    const errEl = document.querySelector(`[data-error="${key}"]`);
    const val = el?.value.trim() ?? '';

    let msg = '';
    if (!val) {
      msg = 'この項目は必須です';
    } else if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      msg = '有効なメールアドレスを入力してください';
    }

    if (msg) {
      el.classList.add('is-error');
      if (errEl) errEl.textContent = msg;
      valid = false;
    } else {
      el.classList.remove('is-error');
      if (errEl) errEl.textContent = '';
    }
  });

  return valid;
}

/** 必須フィールドが埋まっているかリアルタイムチェックして開始ボタンを活性化 */
function checkFormReady() {
  const required = ['name', 'email', 'job', 'industry', 'size'];
  const allFilled = required.every((key) => {
    const el = document.querySelector(`[data-field="${key}"]`);
    return el?.value.trim() !== '';
  });
  document.getElementById('btn-start').disabled = !allFilled;
}

/* ============================================================
   キーボードショートカット（1〜6キー）
============================================================ */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('#screen-question.screen--active') === null) return;
    const step = getCurrentStep();
    if (step?.type !== 'question') return;

    const num = Number(e.key);
    if (num >= 1 && num <= 6) {
      e.preventDefault();
      onAnswerClick(num);
    }
  });
}

/* ============================================================
   再診断
============================================================ */
function resetDiagnosis() {
  state.currentStep = 0;
  state.answers = {};
  state.quantData = {};
  state.areaScores = {};
  state.totalScore = 0;
  state.stage = null;
  state.gasSent = false;
  state.userInfo = { name: '', email: '', job: '', industry: '', size: '', company: '' };

  // フォームをリセット
  document.getElementById('form-basic-info').reset();
  document.getElementById('btn-start').disabled = true;

  showScreen('top');
}

/* ============================================================
   イベントリスナー登録
============================================================ */
function setupEventListeners() {
  // 基本情報フォーム：リアルタイムバリデーション
  document.getElementById('form-basic-info').addEventListener('input', checkFormReady);

  // 診断開始
  document.getElementById('form-basic-info').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateBasicInfo()) return;

    ['name', 'email', 'job', 'industry', 'size', 'company'].forEach((key) => {
      const el = document.querySelector(`[data-field="${key}"]`);
      state.userInfo[key] = el?.value.trim() ?? '';
    });

    state.currentStep = 0;
    showScreen('question');
    renderStep();
  });

  // 回答ボタン
  document.getElementById('answer-buttons').addEventListener('click', (e) => {
    const btn = e.target.closest('.answer-btn');
    if (!btn) return;
    onAnswerClick(Number(btn.dataset.value));
  });

  // 次へ（質問 — 通常は自動進行だがフォールバックとして）
  document.getElementById('btn-next').addEventListener('click', goNext);

  // 前へ
  document.getElementById('btn-prev').addEventListener('click', goPrev);

  // 定量参考：スキップ
  document.getElementById('btn-skip-quant').addEventListener('click', goNext);

  // PDFダウンロード
  document.getElementById('btn-download-pdf').addEventListener('click', downloadPDF);

  // 再診断
  document.getElementById('btn-retry').addEventListener('click', resetDiagnosis);

  // キーボード
  setupKeyboardShortcuts();

  // 他社比較レポート
  setupReportRequest();
}

/* ============================================================
   初期化
============================================================ */
function init() {
  setupEventListeners();
  // 初期状態では開始ボタンを無効化
  document.getElementById('btn-start').disabled = true;
}

document.addEventListener('DOMContentLoaded', init);
