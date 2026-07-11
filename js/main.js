/**
 * キャリアオーナーシップ診断 — メインロジック
 * NODIA Co., Ltd.
 */

/* ============================================================
   GAS エンドポイント設定
   ※ GASをデプロイ後、以下URLを実際のエンドポイントに変更してください
============================================================ */
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxfwggSq-hS-9qFLbPZ9tFkILZi8xVLNVg6R-nIW8BVzDKPd51y-7-lS5fAek0dKy_d/exec';

/** GASと共有する簡易トークン（機械的スパム対策。GAS側 SHARED_TOKEN と一致させること） */
const GAS_TOKEN = 'nodia-cos-2026-Kx7mPq3Z';

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
   職種タクソノミー定義
============================================================ */
const OCCUPATION_TAXONOMY = [
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC01",occupation:"Webエンジニア",specializedOccupationId:"SO001",specializedOccupation:"フロントエンドエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC01",occupation:"Webエンジニア",specializedOccupationId:"SO002",specializedOccupation:"バックエンドエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC01",occupation:"Webエンジニア",specializedOccupationId:"SO003",specializedOccupation:"フルスタックエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC02",occupation:"モバイルエンジニア",specializedOccupationId:"SO004",specializedOccupation:"iOSエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC02",occupation:"モバイルエンジニア",specializedOccupationId:"SO005",specializedOccupation:"Androidエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC02",occupation:"モバイルエンジニア",specializedOccupationId:"SO006",specializedOccupation:"クロスプラットフォームエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC03",occupation:"インフラ・クラウドエンジニア",specializedOccupationId:"SO007",specializedOccupation:"インフラエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC03",occupation:"インフラ・クラウドエンジニア",specializedOccupationId:"SO008",specializedOccupation:"クラウドエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC03",occupation:"インフラ・クラウドエンジニア",specializedOccupationId:"SO009",specializedOccupation:"SRE/DevOpsエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC04",occupation:"QAエンジニア",specializedOccupationId:"SO010",specializedOccupation:"テストエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC04",occupation:"QAエンジニア",specializedOccupationId:"SO011",specializedOccupation:"テスト自動化エンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG02",occupationGroup:"データ・AI",occupationId:"OC05",occupation:"データサイエンティスト",specializedOccupationId:"SO012",specializedOccupation:"機械学習エンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG02",occupationGroup:"データ・AI",occupationId:"OC05",occupation:"データサイエンティスト",specializedOccupationId:"SO013",specializedOccupation:"データアナリスト" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG02",occupationGroup:"データ・AI",occupationId:"OC05",occupation:"データサイエンティスト",specializedOccupationId:"SO014",specializedOccupation:"統計モデリング" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG02",occupationGroup:"データ・AI",occupationId:"OC06",occupation:"データエンジニア",specializedOccupationId:"SO015",specializedOccupation:"ETLエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG02",occupationGroup:"データ・AI",occupationId:"OC06",occupation:"データエンジニア",specializedOccupationId:"SO016",specializedOccupation:"データアーキテクト" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG02",occupationGroup:"データ・AI",occupationId:"OC07",occupation:"AIエンジニア",specializedOccupationId:"SO017",specializedOccupation:"NLPエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG02",occupationGroup:"データ・AI",occupationId:"OC07",occupation:"AIエンジニア",specializedOccupationId:"SO018",specializedOccupation:"コンピュータビジョンエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG02",occupationGroup:"データ・AI",occupationId:"OC07",occupation:"AIエンジニア",specializedOccupationId:"SO019",specializedOccupation:"LLM/生成AIエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG03",occupationGroup:"ITマネジメント・プロダクト",occupationId:"OC08",occupation:"プロダクトマネージャー",specializedOccupationId:"SO020",specializedOccupation:"プロダクトマネージャー（BtoB）" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG03",occupationGroup:"ITマネジメント・プロダクト",occupationId:"OC08",occupation:"プロダクトマネージャー",specializedOccupationId:"SO021",specializedOccupation:"プロダクトマネージャー（BtoC）" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG03",occupationGroup:"ITマネジメント・プロダクト",occupationId:"OC09",occupation:"プロジェクトマネージャー（IT）",specializedOccupationId:"SO022",specializedOccupation:"ITプロジェクトマネージャー" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG03",occupationGroup:"ITマネジメント・プロダクト",occupationId:"OC09",occupation:"プロジェクトマネージャー（IT）",specializedOccupationId:"SO023",specializedOccupation:"スクラムマスター" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG03",occupationGroup:"ITマネジメント・プロダクト",occupationId:"OC10",occupation:"UX/UIデザイナー",specializedOccupationId:"SO024",specializedOccupation:"UXデザイナー" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG03",occupationGroup:"ITマネジメント・プロダクト",occupationId:"OC10",occupation:"UX/UIデザイナー",specializedOccupationId:"SO025",specializedOccupation:"UIデザイナー" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG04",occupationGroup:"ITセキュリティ・運用",occupationId:"OC11",occupation:"セキュリティエンジニア",specializedOccupationId:"SO026",specializedOccupation:"セキュリティアナリスト" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG04",occupationGroup:"ITセキュリティ・運用",occupationId:"OC11",occupation:"セキュリティエンジニア",specializedOccupationId:"SO027",specializedOccupation:"ペネトレーションテスター" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG04",occupationGroup:"ITセキュリティ・運用",occupationId:"OC12",occupation:"IT運用・サポート",specializedOccupationId:"SO028",specializedOccupation:"システム管理者" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG04",occupationGroup:"ITセキュリティ・運用",occupationId:"OC12",occupation:"IT運用・サポート",specializedOccupationId:"SO029",specializedOccupation:"ネットワークエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG48",occupationGroup:"IT・SaaS営業",occupationId:"OC88",occupation:"法人営業（IT・SaaS）",specializedOccupationId:"SO030",specializedOccupation:"フィールドセールス（IT・SaaS）" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG48",occupationGroup:"IT・SaaS営業",occupationId:"OC88",occupation:"法人営業（IT・SaaS）",specializedOccupationId:"SO031",specializedOccupation:"インサイドセールス（IT・SaaS）" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG51",occupationGroup:"メーカー営業",occupationId:"OC88",occupation:"法人営業",specializedOccupationId:"SO032",specializedOccupation:"メーカー技術営業" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG50",occupationGroup:"医療・ヘルスケア営業",occupationId:"OC89",occupation:"MR・医療機器営業・メディカルアフェアーズ",specializedOccupationId:"SO033",specializedOccupation:"医療機器営業" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG52",occupationGroup:"不動産営業",occupationId:"OC90",occupation:"個人向け営業",specializedOccupationId:"SO035",specializedOccupation:"不動産投資営業" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG52",occupationGroup:"不動産営業",occupationId:"OC90",occupation:"個人向け営業",specializedOccupationId:"SO036",specializedOccupation:"住宅営業" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG49",occupationGroup:"金融営業",occupationId:"OC90",occupation:"個人向け営業",specializedOccupationId:"SO037",specializedOccupation:"金融個人営業（FP）" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC15",occupation:"経営企画・事業開発",specializedOccupationId:"SO038",specializedOccupation:"経営企画担当" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC15",occupation:"経営企画・事業開発",specializedOccupationId:"SO039",specializedOccupation:"新規事業開発担当" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC15",occupation:"経営企画・事業開発",specializedOccupationId:"SO040",specializedOccupation:"M&Aアナリスト" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC16",occupation:"マーケティング",specializedOccupationId:"SO041",specializedOccupation:"デジタルマーケター（SEO/SEM）" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC16",occupation:"マーケティング",specializedOccupationId:"SO042",specializedOccupation:"SNSマーケター" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC16",occupation:"マーケティング",specializedOccupationId:"SO043",specializedOccupation:"プロダクトマーケティングマネージャー" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC16",occupation:"マーケティング",specializedOccupationId:"SO044",specializedOccupation:"ブランドマネージャー" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC17",occupation:"クリエイティブ",specializedOccupationId:"SO045",specializedOccupation:"コピーライター" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC17",occupation:"クリエイティブ",specializedOccupationId:"SO046",specializedOccupation:"コンテンツマーケター" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC18",occupation:"経理・財務・会計・内部統制",specializedOccupationId:"SO047",specializedOccupation:"CFO/財務責任者" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC18",occupation:"経理・財務・会計・内部統制",specializedOccupationId:"SO048",specializedOccupation:"財務アナリスト" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC18",occupation:"経理・財務・会計・内部統制",specializedOccupationId:"SO050",specializedOccupation:"経理" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC19",occupation:"法務・コンプライアンス",specializedOccupationId:"SO051",specializedOccupation:"企業法務（契約）" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC19",occupation:"法務・コンプライアンス",specializedOccupationId:"SO052",specializedOccupation:"知的財産" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC19",occupation:"法務・コンプライアンス",specializedOccupationId:"SO053",specializedOccupation:"コンプライアンス" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC20",occupation:"人事・組織開発",specializedOccupationId:"SO054",specializedOccupation:"中途採用" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC20",occupation:"人事・組織開発",specializedOccupationId:"SO055",specializedOccupation:"HRBP" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC20",occupation:"人事・組織開発",specializedOccupationId:"SO056",specializedOccupation:"タレントマネジメント" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC20",occupation:"人事・組織開発",specializedOccupationId:"SO057",specializedOccupation:"研修・人材開発" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC21",occupation:"経営・戦略コンサルタント",specializedOccupationId:"SO058",specializedOccupation:"経営戦略コンサルタント" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC21",occupation:"経営・戦略コンサルタント",specializedOccupationId:"SO059",specializedOccupation:"事業戦略コンサルタント" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC21",occupation:"経営・戦略コンサルタント",specializedOccupationId:"SO060",specializedOccupation:"M&Aアドバイザー" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC22",occupation:"ITコンサルタント",specializedOccupationId:"SO061",specializedOccupation:"DXコンサルタント" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC22",occupation:"ITコンサルタント",specializedOccupationId:"SO062",specializedOccupation:"ERPコンサルタント" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC22",occupation:"ITコンサルタント",specializedOccupationId:"SO063",specializedOccupation:"システムアーキテクト" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC23",occupation:"業務・組織コンサルタント",specializedOccupationId:"SO064",specializedOccupation:"BPRコンサルタント" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC23",occupation:"業務・組織コンサルタント",specializedOccupationId:"SO065",specializedOccupation:"SCMコンサルタント" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC23",occupation:"業務・組織コンサルタント",specializedOccupationId:"SO066",specializedOccupation:"人事・組織コンサルタント" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG08",occupationGroup:"銀行・証券",occupationId:"OC24",occupation:"銀行業務",specializedOccupationId:"SO067",specializedOccupation:"リテールバンキング" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG08",occupationGroup:"銀行・証券",occupationId:"OC24",occupation:"銀行業務",specializedOccupationId:"SO068",specializedOccupation:"コーポレートバンカー" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG08",occupationGroup:"銀行・証券",occupationId:"OC24",occupation:"銀行業務",specializedOccupationId:"SO069",specializedOccupation:"融資・審査" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG08",occupationGroup:"銀行・証券",occupationId:"OC25",occupation:"証券・投資",specializedOccupationId:"SO070",specializedOccupation:"株式トレーダー" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG08",occupationGroup:"銀行・証券",occupationId:"OC25",occupation:"証券・投資",specializedOccupationId:"SO071",specializedOccupation:"投資アナリスト" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG08",occupationGroup:"銀行・証券",occupationId:"OC25",occupation:"証券・投資",specializedOccupationId:"SO072",specializedOccupation:"ファンドマネージャー" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG09",occupationGroup:"保険",occupationId:"OC26",occupation:"損害保険",specializedOccupationId:"SO073",specializedOccupation:"損害査定員" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG09",occupationGroup:"保険",occupationId:"OC26",occupation:"損害保険",specializedOccupationId:"SO074",specializedOccupation:"アンダーライター（損保）" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG09",occupationGroup:"保険",occupationId:"OC27",occupation:"生命保険",specializedOccupationId:"SO075",specializedOccupation:"生命保険営業" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG09",occupationGroup:"保険",occupationId:"OC27",occupation:"生命保険",specializedOccupationId:"SO076",specializedOccupation:"アクチュアリー" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG11",occupationGroup:"医師・薬剤師",occupationId:"OC94",occupation:"内科系医師",specializedOccupationId:"SO077",specializedOccupation:"一般内科医" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG11",occupationGroup:"医師・薬剤師",occupationId:"OC94",occupation:"内科系医師",specializedOccupationId:"SO078",specializedOccupation:"循環器内科医" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG11",occupationGroup:"医師・薬剤師",occupationId:"OC29",occupation:"外科系医師",specializedOccupationId:"SO079",specializedOccupation:"一般外科医" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG11",occupationGroup:"医師・薬剤師",occupationId:"OC29",occupation:"外科系医師",specializedOccupationId:"SO080",specializedOccupation:"整形外科医" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG11",occupationGroup:"医師・薬剤師",occupationId:"OC30",occupation:"薬剤師",specializedOccupationId:"SO081",specializedOccupation:"病院薬剤師" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG11",occupationGroup:"医師・薬剤師",occupationId:"OC30",occupation:"薬剤師",specializedOccupationId:"SO082",specializedOccupation:"調剤薬局薬剤師" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG12",occupationGroup:"看護・介護",occupationId:"OC31",occupation:"病院看護師",specializedOccupationId:"SO083",specializedOccupation:"病棟看護師" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG12",occupationGroup:"看護・介護",occupationId:"OC31",occupation:"病院看護師",specializedOccupationId:"SO084",specializedOccupation:"ICU看護師" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG12",occupationGroup:"看護・介護",occupationId:"OC32",occupation:"地域・在宅看護師",specializedOccupationId:"SO085",specializedOccupation:"訪問看護師" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG12",occupationGroup:"看護・介護",occupationId:"OC32",occupation:"地域・在宅看護師",specializedOccupationId:"SO086",specializedOccupation:"保健師" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG12",occupationGroup:"看護・介護",occupationId:"OC97",occupation:"介護福祉士",specializedOccupationId:"SO087",specializedOccupation:"施設介護士" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG12",occupationGroup:"看護・介護",occupationId:"OC97",occupation:"介護福祉士",specializedOccupationId:"SO088",specializedOccupation:"ケアマネージャー" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG15",occupationGroup:"製品開発・設計",occupationId:"OC34",occupation:"機械設計エンジニア",specializedOccupationId:"SO089",specializedOccupation:"機械設計" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG15",occupationGroup:"製品開発・設計",occupationId:"OC34",occupation:"機械設計エンジニア",specializedOccupationId:"SO090",specializedOccupation:"CAD/CAE設計エンジニア" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG15",occupationGroup:"製品開発・設計",occupationId:"OC35",occupation:"電気・電子設計エンジニア",specializedOccupationId:"SO091",specializedOccupation:"回路設計エンジニア" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG15",occupationGroup:"製品開発・設計",occupationId:"OC35",occupation:"電気・電子設計エンジニア",specializedOccupationId:"SO092",specializedOccupation:"組込みソフトウェアエンジニア" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG16",occupationGroup:"生産・品質管理",occupationId:"OC36",occupation:"生産管理・生産技術",specializedOccupationId:"SO093",specializedOccupation:"生産計画" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG16",occupationGroup:"生産・品質管理",occupationId:"OC36",occupation:"生産管理・生産技術",specializedOccupationId:"SO094",specializedOccupation:"工程管理" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG16",occupationGroup:"生産・品質管理",occupationId:"OC37",occupation:"品質管理・品質保証",specializedOccupationId:"SO095",specializedOccupation:"品質管理" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG16",occupationGroup:"生産・品質管理",occupationId:"OC37",occupation:"品質管理・品質保証",specializedOccupationId:"SO096",specializedOccupation:"品質保証エンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG04",occupationGroup:"ITセキュリティ・運用",occupationId:"OC13",occupation:"テクニカルサポート・通信インフラ",specializedOccupationId:"SO097",specializedOccupation:"テクニカルサポートエンジニア" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG01",occupationGroup:"ソフトウェア・システム開発",occupationId:"OC03",occupation:"インフラ・クラウドエンジニア",specializedOccupationId:"SO098",specializedOccupation:"通信・ネットワークインフラエンジニア" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG23",occupationGroup:"クリエイティブ制作・コンテンツ",occupationId:"OC14",occupation:"ゲームプロデューサー・プランナー",specializedOccupationId:"SO099",specializedOccupation:"ゲームプロデューサー" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG23",occupationGroup:"クリエイティブ制作・コンテンツ",occupationId:"OC14",occupation:"ゲームプロデューサー・プランナー",specializedOccupationId:"SO100",specializedOccupation:"ゲームプランナー" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG05",occupationGroup:"カスタマーサクセス・ソリューションアーキテクト",occupationId:"OC91",occupation:"カスタマーサクセス・ソリューションアーキテクト",specializedOccupationId:"SO101",specializedOccupation:"カスタマーサクセス" },
  { careerAreaId:"CA01",careerArea:"IT・テクノロジー",occupationGroupId:"OG05",occupationGroup:"カスタマーサクセス・ソリューションアーキテクト",occupationId:"OC91",occupation:"カスタマーサクセス・ソリューションアーキテクト",specializedOccupationId:"SO102",specializedOccupation:"ITプリセールス・ソリューションアーキテクト" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC92",occupation:"財務・会計コンサルタント",specializedOccupationId:"SO103",specializedOccupation:"財務DDアドバイザー（FAS）" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC92",occupation:"財務・会計コンサルタント",specializedOccupationId:"SO104",specializedOccupation:"会計監査・内部統制コンサルタント" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC93",occupation:"リスク・サステナビリティコンサルタント",specializedOccupationId:"SO105",specializedOccupation:"ESG・サステナビリティコンサルタント" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG06",occupationGroup:"コンサルティング",occupationId:"OC93",occupation:"リスク・サステナビリティコンサルタント",specializedOccupationId:"SO106",specializedOccupation:"リスクマネジメントコンサルタント" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG08",occupationGroup:"銀行・証券",occupationId:"OC26",occupation:"リース・クレジット",specializedOccupationId:"SO107",specializedOccupation:"リース営業担当" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG08",occupationGroup:"銀行・証券",occupationId:"OC26",occupation:"リース・クレジット",specializedOccupationId:"SO108",specializedOccupation:"クレジット審査担当" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG09",occupationGroup:"保険",occupationId:"OC27",occupation:"損保・生保事務",specializedOccupationId:"SO109",specializedOccupation:"保険事務担当" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG09",occupationGroup:"保険",occupationId:"OC27",occupation:"損保・生保事務",specializedOccupationId:"SO110",specializedOccupation:"損害調査担当" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG10",occupationGroup:"フィンテック・資産運用",occupationId:"OC28",occupation:"資産運用・PEファンド",specializedOccupationId:"SO111",specializedOccupation:"プライベートエクイティアナリスト" },
  { careerAreaId:"CA03",careerArea:"金融・保険",occupationGroupId:"OG10",occupationGroup:"フィンテック・資産運用",occupationId:"OC28",occupation:"資産運用・PEファンド",specializedOccupationId:"SO112",specializedOccupation:"フィンテックプロダクトマネージャー" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG12",occupationGroup:"看護・介護",occupationId:"OC95",occupation:"リハビリテーション",specializedOccupationId:"SO113",specializedOccupation:"理学療法士（PT）" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG12",occupationGroup:"看護・介護",occupationId:"OC95",occupation:"リハビリテーション",specializedOccupationId:"SO114",specializedOccupation:"作業療法士（OT）" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG12",occupationGroup:"看護・介護",occupationId:"OC95",occupation:"リハビリテーション",specializedOccupationId:"SO115",specializedOccupation:"言語聴覚士（ST）" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG13",occupationGroup:"医療技術職・コメディカル",occupationId:"OC96",occupation:"コメディカル",specializedOccupationId:"SO116",specializedOccupation:"臨床検査技師" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG13",occupationGroup:"医療技術職・コメディカル",occupationId:"OC96",occupation:"コメディカル",specializedOccupationId:"SO117",specializedOccupation:"診療放射線技師" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG14",occupationGroup:"製薬・医療機器・ヘルスケア",occupationId:"OC31",occupation:"MR・医療機器営業・メディカルアフェアーズ",specializedOccupationId:"SO118",specializedOccupation:"MR（医薬品営業）" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG14",occupationGroup:"製薬・医療機器・ヘルスケア",occupationId:"OC31",occupation:"MR・医療機器営業・メディカルアフェアーズ",specializedOccupationId:"SO119",specializedOccupation:"メディカルアフェアーズ" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG14",occupationGroup:"製薬・医療機器・ヘルスケア",occupationId:"OC31",occupation:"MR・医療機器営業・メディカルアフェアーズ",specializedOccupationId:"SO120",specializedOccupation:"CRA" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG14",occupationGroup:"製薬・医療機器・ヘルスケア",occupationId:"OC31",occupation:"MR・医療機器営業・メディカルアフェアーズ",specializedOccupationId:"SO121",specializedOccupation:"CRC" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG15",occupationGroup:"製品開発・設計",occupationId:"OC33",occupation:"化学・素材開発エンジニア",specializedOccupationId:"SO122",specializedOccupation:"化学材料・素材研究開発エンジニア" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG15",occupationGroup:"製品開発・設計",occupationId:"OC33",occupation:"化学・素材開発エンジニア",specializedOccupationId:"SO123",specializedOccupation:"食品・医薬品製造技術職" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG16",occupationGroup:"生産・品質管理",occupationId:"OC34",occupation:"購買・調達エンジニア",specializedOccupationId:"SO124",specializedOccupation:"購買・調達エンジニア（サプライヤー管理）" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG16",occupationGroup:"生産・品質管理",occupationId:"OC35",occupation:"設備保全エンジニア",specializedOccupationId:"SO125",specializedOccupation:"設備保全・メンテナンスエンジニア" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG16",occupationGroup:"生産・品質管理",occupationId:"OC36",occupation:"生産技術エンジニア",specializedOccupationId:"SO126",specializedOccupation:"生産技術・製造プロセスエンジニア" },
  { careerAreaId:"CA06",careerArea:"人材・教育",occupationGroupId:"OG19",occupationGroup:"人材サービス",occupationId:"OC98",occupation:"キャリアアドバイザー・人材コンサルタント",specializedOccupationId:"SO127",specializedOccupation:"転職エージェント（CA：求職者支援）" },
  { careerAreaId:"CA06",careerArea:"人材・教育",occupationGroupId:"OG19",occupationGroup:"人材サービス",occupationId:"OC98",occupation:"キャリアアドバイザー・人材コンサルタント",specializedOccupationId:"SO128",specializedOccupation:"リクルーティングアドバイザー（RA：企業開拓）" },
  { careerAreaId:"CA06",careerArea:"人材・教育",occupationGroupId:"OG19",occupationGroup:"人材サービス",occupationId:"OC98",occupation:"キャリアアドバイザー・人材コンサルタント",specializedOccupationId:"SO129",specializedOccupation:"人材コーディネーター（派遣スタッフ管理）" },
  { careerAreaId:"CA06",careerArea:"人材・教育",occupationGroupId:"OG19",occupationGroup:"人材サービス",occupationId:"OC38",occupation:"採用支援・RPO",specializedOccupationId:"SO130",specializedOccupation:"採用代行・RPOコンサルタント" },
  { careerAreaId:"CA06",careerArea:"人材・教育",occupationGroupId:"OG20",occupationGroup:"教育・研修",occupationId:"OC39",occupation:"学校・塾講師",specializedOccupationId:"SO131",specializedOccupation:"学習塾講師・個別指導講師" },
  { careerAreaId:"CA06",careerArea:"人材・教育",occupationGroupId:"OG20",occupationGroup:"教育・研修",occupationId:"OC39",occupation:"学校・塾講師",specializedOccupationId:"SO132",specializedOccupation:"語学スクール講師" },
  { careerAreaId:"CA06",careerArea:"人材・教育",occupationGroupId:"OG20",occupationGroup:"教育・研修",occupationId:"OC40",occupation:"企業内教育・インストラクター",specializedOccupationId:"SO133",specializedOccupation:"法人研修講師・研修ファシリテーター" },
  { careerAreaId:"CA06",careerArea:"人材・教育",occupationGroupId:"OG20",occupationGroup:"教育・研修",occupationId:"OC40",occupation:"企業内教育・インストラクター",specializedOccupationId:"SO134",specializedOccupation:"eラーニング・コンテンツ開発担当" },
  { careerAreaId:"CA06",careerArea:"人材・教育",occupationGroupId:"OG20",occupationGroup:"教育・研修",occupationId:"OC41",occupation:"保育・教員",specializedOccupationId:"SO135",specializedOccupation:"保育士・幼稚園教諭" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG21",occupationGroup:"広告・PR",occupationId:"OC42",occupation:"広告プランナー・ディレクター",specializedOccupationId:"SO136",specializedOccupation:"総合広告代理店プランナー" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG21",occupationGroup:"広告・PR",occupationId:"OC42",occupation:"広告プランナー・ディレクター",specializedOccupationId:"SO137",specializedOccupation:"デジタル広告ディレクター" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG21",occupationGroup:"広告・PR",occupationId:"OC43",occupation:"PRプランナー・広報",specializedOccupationId:"SO138",specializedOccupation:"PRコンサルタント" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG21",occupationGroup:"広告・PR",occupationId:"OC43",occupation:"PRプランナー・広報",specializedOccupationId:"SO139",specializedOccupation:"コーポレート広報担当" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG22",occupationGroup:"メディア・出版",occupationId:"OC44",occupation:"編集・ライター",specializedOccupationId:"SO140",specializedOccupation:"雑誌・書籍編集者" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG22",occupationGroup:"メディア・出版",occupationId:"OC44",occupation:"編集・ライター",specializedOccupationId:"SO141",specializedOccupation:"Webコンテンツライター" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG22",occupationGroup:"メディア・出版",occupationId:"OC45",occupation:"記者・アナウンサー",specializedOccupationId:"SO142",specializedOccupation:"新聞・Web記者" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG22",occupationGroup:"メディア・出版",occupationId:"OC45",occupation:"記者・アナウンサー",specializedOccupationId:"SO143",specializedOccupation:"テレビ・ラジオアナウンサー" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG23",occupationGroup:"クリエイティブ制作・コンテンツ",occupationId:"OC46",occupation:"グラフィック・映像デザイナー",specializedOccupationId:"SO144",specializedOccupation:"グラフィックデザイナー（広告・印刷）" },
  { careerAreaId:"CA07",careerArea:"広告・メディア・クリエイティブ",occupationGroupId:"OG23",occupationGroup:"クリエイティブ制作・コンテンツ",occupationId:"OC46",occupation:"グラフィック・映像デザイナー",specializedOccupationId:"SO145",specializedOccupation:"映像ディレクター・動画編集者" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG24",occupationGroup:"物流オペレーション",occupationId:"OC47",occupation:"倉庫・物流管理",specializedOccupationId:"SO146",specializedOccupation:"倉庫管理・在庫管理担当" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG24",occupationGroup:"物流オペレーション",occupationId:"OC47",occupation:"倉庫・物流管理",specializedOccupationId:"SO147",specializedOccupation:"フォークリフトオペレーター" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG24",occupationGroup:"物流オペレーション",occupationId:"OC48",occupation:"ドライバー・配送",specializedOccupationId:"SO148",specializedOccupation:"大型トラックドライバー" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG24",occupationGroup:"物流オペレーション",occupationId:"OC48",occupation:"ドライバー・配送",specializedOccupationId:"SO149",specializedOccupation:"配送ドライバー（中小型）" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG25",occupationGroup:"物流企画・管理",occupationId:"OC49",occupation:"ロジスティクス企画",specializedOccupationId:"SO150",specializedOccupation:"ロジスティクスプランナー" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG25",occupationGroup:"物流企画・管理",occupationId:"OC49",occupation:"ロジスティクス企画",specializedOccupationId:"SO151",specializedOccupation:"3PL提案・物流コンサルタント" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG25",occupationGroup:"物流企画・管理",occupationId:"OC50",occupation:"貿易・通関",specializedOccupationId:"SO152",specializedOccupation:"貿易事務・通関士" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG25",occupationGroup:"物流企画・管理",occupationId:"OC50",occupation:"貿易・通関",specializedOccupationId:"SO153",specializedOccupation:"フォワーダー（国際輸送代理）" },
  { careerAreaId:"CA09",careerArea:"サービス・生活関連",occupationGroupId:"OG26",occupationGroup:"ホテル・観光・ブライダル",occupationId:"OC51",occupation:"ホテルフロント・コンシェルジュ",specializedOccupationId:"SO154",specializedOccupation:"ホテルフロントスタッフ" },
  { careerAreaId:"CA09",careerArea:"サービス・生活関連",occupationGroupId:"OG26",occupationGroup:"ホテル・観光・ブライダル",occupationId:"OC51",occupation:"ホテルフロント・コンシェルジュ",specializedOccupationId:"SO155",specializedOccupation:"ブライダルコーディネーター" },
  { careerAreaId:"CA09",careerArea:"サービス・生活関連",occupationGroupId:"OG26",occupationGroup:"ホテル・観光・ブライダル",occupationId:"OC52",occupation:"旅行・観光プランナー",specializedOccupationId:"SO156",specializedOccupation:"旅行会社ツアープランナー" },
  { careerAreaId:"CA09",careerArea:"サービス・生活関連",occupationGroupId:"OG26",occupationGroup:"ホテル・観光・ブライダル",occupationId:"OC52",occupation:"旅行・観光プランナー",specializedOccupationId:"SO157",specializedOccupation:"観光地域プロデューサー（DMO）" },
  { careerAreaId:"CA09",careerArea:"サービス・生活関連",occupationGroupId:"OG27",occupationGroup:"美容・ウェルネス",occupationId:"OC53",occupation:"美容師・ネイリスト",specializedOccupationId:"SO158",specializedOccupation:"美容師・ヘアスタイリスト" },
  { careerAreaId:"CA09",careerArea:"サービス・生活関連",occupationGroupId:"OG27",occupationGroup:"美容・ウェルネス",occupationId:"OC53",occupation:"美容師・ネイリスト",specializedOccupationId:"SO159",specializedOccupation:"エステティシャン・ネイリスト" },
  { careerAreaId:"CA09",careerArea:"サービス・生活関連",occupationGroupId:"OG27",occupationGroup:"美容・ウェルネス",occupationId:"OC54",occupation:"フィットネス・スポーツ",specializedOccupationId:"SO160",specializedOccupation:"パーソナルトレーナー" },
  { careerAreaId:"CA09",careerArea:"サービス・生活関連",occupationGroupId:"OG27",occupationGroup:"美容・ウェルネス",occupationId:"OC54",occupation:"フィットネス・スポーツ",specializedOccupationId:"SO161",specializedOccupation:"スポーツインストラクター" },
  { careerAreaId:"CA09",careerArea:"サービス・生活関連",occupationGroupId:"OG28",occupationGroup:"警備・清掃・施設管理",occupationId:"OC55",occupation:"警備・セキュリティ",specializedOccupationId:"SO162",specializedOccupation:"施設警備・交通誘導警備員" },
  { careerAreaId:"CA09",careerArea:"サービス・生活関連",occupationGroupId:"OG28",occupationGroup:"警備・清掃・施設管理",occupationId:"OC56",occupation:"ビルメンテナンス",specializedOccupationId:"SO163",specializedOccupation:"ビルメンテナンス" },
  { careerAreaId:"CA10",careerArea:"食品・飲食",occupationGroupId:"OG29",occupationGroup:"飲食・外食",occupationId:"OC57",occupation:"調理・キッチン",specializedOccupationId:"SO164",specializedOccupation:"料理人・シェフ" },
  { careerAreaId:"CA10",careerArea:"食品・飲食",occupationGroupId:"OG29",occupationGroup:"飲食・外食",occupationId:"OC57",occupation:"調理・キッチン",specializedOccupationId:"SO165",specializedOccupation:"フードコーディネーター" },
  { careerAreaId:"CA10",careerArea:"食品・飲食",occupationGroupId:"OG29",occupationGroup:"飲食・外食",occupationId:"OC58",occupation:"飲食店管理・SV",specializedOccupationId:"SO166",specializedOccupation:"飲食店舗マネージャー（店長）" },
  { careerAreaId:"CA10",careerArea:"食品・飲食",occupationGroupId:"OG29",occupationGroup:"飲食・外食",occupationId:"OC58",occupation:"飲食店管理・SV",specializedOccupationId:"SO167",specializedOccupation:"飲食チェーンSV（スーパーバイザー）" },
  { careerAreaId:"CA11",careerArea:"官公庁・公共",occupationGroupId:"OG30",occupationGroup:"行政・公務",occupationId:"OC59",occupation:"国家公務員",specializedOccupationId:"SO168",specializedOccupation:"国家公務員一般職・総合職" },
  { careerAreaId:"CA11",careerArea:"官公庁・公共",occupationGroupId:"OG30",occupationGroup:"行政・公務",occupationId:"OC59",occupation:"国家公務員",specializedOccupationId:"SO169",specializedOccupation:"国家専門職（国税・労基・外交官）" },
  { careerAreaId:"CA11",careerArea:"官公庁・公共",occupationGroupId:"OG30",occupationGroup:"行政・公務",occupationId:"OC60",occupation:"地方公務員",specializedOccupationId:"SO170",specializedOccupation:"都道府県・市区町村職員" },
  { careerAreaId:"CA11",careerArea:"官公庁・公共",occupationGroupId:"OG30",occupationGroup:"行政・公務",occupationId:"OC60",occupation:"地方公務員",specializedOccupationId:"SO171",specializedOccupation:"消防士・警察官" },
  { careerAreaId:"CA11",careerArea:"官公庁・公共",occupationGroupId:"OG31",occupationGroup:"公共・団体",occupationId:"OC61",occupation:"独立行政法人・公益法人",specializedOccupationId:"SO172",specializedOccupation:"独立行政法人研究員・職員" },
  { careerAreaId:"CA11",careerArea:"官公庁・公共",occupationGroupId:"OG31",occupationGroup:"公共・団体",occupationId:"OC61",occupation:"独立行政法人・公益法人",specializedOccupationId:"SO173",specializedOccupation:"公益財団・NPO職員" },
  { careerAreaId:"CA11",careerArea:"官公庁・公共",occupationGroupId:"OG31",occupationGroup:"公共・団体",occupationId:"OC62",occupation:"教育行政・福祉行政",specializedOccupationId:"SO174",specializedOccupation:"社会福祉士・生活保護担当" },
  { careerAreaId:"CA11",careerArea:"官公庁・公共",occupationGroupId:"OG31",occupationGroup:"公共・団体",occupationId:"OC62",occupation:"教育行政・福祉行政",specializedOccupationId:"SO175",specializedOccupation:"学校事務・教育委員会職員" },
  { careerAreaId:"CA12",careerArea:"商社",occupationGroupId:"OG32",occupationGroup:"商社営業・トレーディング",occupationId:"OC63",occupation:"総合商社営業",specializedOccupationId:"SO176",specializedOccupation:"資源・エネルギートレーダー" },
  { careerAreaId:"CA12",careerArea:"商社",occupationGroupId:"OG32",occupationGroup:"商社営業・トレーディング",occupationId:"OC63",occupation:"総合商社営業",specializedOccupationId:"SO177",specializedOccupation:"プラント・インフラ海外事業営業" },
  { careerAreaId:"CA12",careerArea:"商社",occupationGroupId:"OG32",occupationGroup:"商社営業・トレーディング",occupationId:"OC64",occupation:"専門商社営業",specializedOccupationId:"SO178",specializedOccupation:"専門商社営業（IT・食品・化学・鉄鋼等）" },
  { careerAreaId:"CA12",careerArea:"商社",occupationGroupId:"OG32",occupationGroup:"商社営業・トレーディング",occupationId:"OC64",occupation:"専門商社営業",specializedOccupationId:"SO179",specializedOccupation:"仕入れ・バイヤー（商社）" },
  { careerAreaId:"CA12",careerArea:"商社",occupationGroupId:"OG33",occupationGroup:"商社企画・管理",occupationId:"OC65",occupation:"トレードファイナンス・事業企画",specializedOccupationId:"SO180",specializedOccupation:"トレードファイナンス担当" },
  { careerAreaId:"CA12",careerArea:"商社",occupationGroupId:"OG33",occupationGroup:"商社企画・管理",occupationId:"OC65",occupation:"トレードファイナンス・事業企画",specializedOccupationId:"SO181",specializedOccupation:"商社事業企画・新規事業開発" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG34",occupationGroup:"不動産営業・開発",occupationId:"OC66",occupation:"不動産営業・仲介",specializedOccupationId:"SO182",specializedOccupation:"不動産売買仲介営業（宅建士）" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG34",occupationGroup:"不動産営業・開発",occupationId:"OC66",occupation:"不動産営業・仲介",specializedOccupationId:"SO183",specializedOccupation:"不動産賃貸仲介営業" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG34",occupationGroup:"不動産営業・開発",occupationId:"OC67",occupation:"不動産開発・用地仕入",specializedOccupationId:"SO184",specializedOccupation:"不動産デベロッパー（用地取得）" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG34",occupationGroup:"不動産営業・開発",occupationId:"OC67",occupation:"不動産開発・用地仕入",specializedOccupationId:"SO185",specializedOccupation:"不動産企画・事業開発担当" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG35",occupationGroup:"不動産運用・管理",occupationId:"OC68",occupation:"プロパティ・アセット管理",specializedOccupationId:"SO186",specializedOccupation:"プロパティマネージャー（PM）" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG35",occupationGroup:"不動産運用・管理",occupationId:"OC68",occupation:"プロパティ・アセット管理",specializedOccupationId:"SO187",specializedOccupation:"アセットマネージャー（AM）" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG36",occupationGroup:"建設・施工",occupationId:"OC69",occupation:"施工管理",specializedOccupationId:"SO188",specializedOccupation:"建築施工管理" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG36",occupationGroup:"建設・施工",occupationId:"OC69",occupation:"施工管理",specializedOccupationId:"SO189",specializedOccupation:"土木施工管理" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG36",occupationGroup:"建設・施工",occupationId:"OC70",occupation:"設計・積算",specializedOccupationId:"SO190",specializedOccupation:"建築設計（意匠・構造）" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG36",occupationGroup:"建設・施工",occupationId:"OC70",occupation:"設計・積算",specializedOccupationId:"SO191",specializedOccupation:"設備設計・積算担当" },
  { careerAreaId:"CA14",careerArea:"小売・流通",occupationGroupId:"OG37",occupationGroup:"店舗・販売",occupationId:"OC71",occupation:"販売スタッフ・店長",specializedOccupationId:"SO192",specializedOccupation:"小売店販売スタッフ・店長" },
  { careerAreaId:"CA14",careerArea:"小売・流通",occupationGroupId:"OG37",occupationGroup:"店舗・販売",occupationId:"OC71",occupation:"販売スタッフ・店長",specializedOccupationId:"SO193",specializedOccupation:"アパレル販売スタッフ・ショップマネージャー" },
  { careerAreaId:"CA14",careerArea:"小売・流通",occupationGroupId:"OG38",occupationGroup:"商品企画・MD",occupationId:"OC72",occupation:"バイヤー・MD",specializedOccupationId:"SO194",specializedOccupation:"バイヤー・仕入れ担当" },
  { careerAreaId:"CA14",careerArea:"小売・流通",occupationGroupId:"OG38",occupationGroup:"商品企画・MD",occupationId:"OC72",occupation:"バイヤー・MD",specializedOccupationId:"SO195",specializedOccupation:"マーチャンダイザー（MD）・VMD" },
  { careerAreaId:"CA14",careerArea:"小売・流通",occupationGroupId:"OG38",occupationGroup:"商品企画・MD",occupationId:"OC73",occupation:"店舗開発・エリアSV",specializedOccupationId:"SO196",specializedOccupation:"スーパーバイザー・エリアマネージャー" },
  { careerAreaId:"CA14",careerArea:"小売・流通",occupationGroupId:"OG38",occupationGroup:"商品企画・MD",occupationId:"OC73",occupation:"店舗開発・エリアSV",specializedOccupationId:"SO197",specializedOccupation:"店舗開発・FC開発担当" },
  { careerAreaId:"CA14",careerArea:"小売・流通",occupationGroupId:"OG39",occupationGroup:"EC・デジタル流通",occupationId:"OC74",occupation:"EC・通販運営",specializedOccupationId:"SO198",specializedOccupation:"ECサイト運営・通販MD" },
  { careerAreaId:"CA14",careerArea:"小売・流通",occupationGroupId:"OG39",occupationGroup:"EC・デジタル流通",occupationId:"OC74",occupation:"EC・通販運営",specializedOccupationId:"SO199",specializedOccupation:"ECカスタマーサービス・フルフィルメント管理" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC15",occupation:"経営企画・事業開発",specializedOccupationId:"SO200",specializedOccupation:"経営管理" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC18",occupation:"経理・財務・会計・内部統制",specializedOccupationId:"SO201",specializedOccupation:"財務・税務・管理会計" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC20",occupation:"人事・組織開発",specializedOccupationId:"SO202",specializedOccupation:"新卒採用" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC20",occupation:"人事・組織開発",specializedOccupationId:"SO203",specializedOccupation:"人事企画・人事制度" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC20",occupation:"人事・組織開発",specializedOccupationId:"SO204",specializedOccupation:"組織開発" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC75",occupation:"総務・購買",specializedOccupationId:"SO205",specializedOccupation:"総務・ファシリティ" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG14",occupationGroup:"製薬・医療機器・ヘルスケア",occupationId:"OC32",occupation:"医療経営・クリニック管理",specializedOccupationId:"SO206",specializedOccupation:"医療事務" },
  { careerAreaId:"CA04",careerArea:"医療・福祉・介護",occupationGroupId:"OG14",occupationGroup:"製薬・医療機器・ヘルスケア",occupationId:"OC32",occupation:"医療経営・クリニック管理",specializedOccupationId:"SO207",specializedOccupation:"クリニック運営管理" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG07",occupationGroup:"士業・専門事務所",occupationId:"OC76",occupation:"士業",specializedOccupationId:"SO208",specializedOccupation:"会計士" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG07",occupationGroup:"士業・専門事務所",occupationId:"OC76",occupation:"士業",specializedOccupationId:"SO209",specializedOccupation:"弁護士" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG07",occupationGroup:"士業・専門事務所",occupationId:"OC76",occupation:"士業",specializedOccupationId:"SO210",specializedOccupation:"弁理士・特許技術者" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG07",occupationGroup:"士業・専門事務所",occupationId:"OC76",occupation:"士業",specializedOccupationId:"SO211",specializedOccupation:"司法書士" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG07",occupationGroup:"士業・専門事務所",occupationId:"OC76",occupation:"士業",specializedOccupationId:"SO212",specializedOccupation:"行政書士" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG07",occupationGroup:"士業・専門事務所",occupationId:"OC76",occupation:"士業",specializedOccupationId:"SO213",specializedOccupation:"社会保険労務士" },
  { careerAreaId:"CA02",careerArea:"コンサルティング・専門サービス",occupationGroupId:"OG07",occupationGroup:"士業・専門事務所",occupationId:"OC76",occupation:"士業",specializedOccupationId:"SO214",specializedOccupation:"税理士" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG17",occupationGroup:"研究開発・先行技術",occupationId:"OC77",occupation:"基礎研究・先行開発・要素技術開発",specializedOccupationId:"SO215",specializedOccupation:"基礎研究・先行開発・要素技術開発" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG18",occupationGroup:"テクニカルセールス・フィールドエンジニア",occupationId:"OC78",occupation:"セールスエンジニア・FAE・アプリケーションエンジニア",specializedOccupationId:"SO216",specializedOccupation:"セールスエンジニア・FAE・アプリケーションエンジニア" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG18",occupationGroup:"テクニカルセールス・フィールドエンジニア",occupationId:"OC79",occupation:"サービスエンジニア・サポートエンジニア",specializedOccupationId:"SO217",specializedOccupation:"サービスエンジニア・サポートエンジニア" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG15",occupationGroup:"製品開発・設計",occupationId:"OC80",occupation:"回路設計・電気設計",specializedOccupationId:"SO218",specializedOccupation:"回路設計" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG15",occupationGroup:"製品開発・設計",occupationId:"OC80",occupation:"回路設計・電気設計",specializedOccupationId:"SO219",specializedOccupation:"電気設計・シーケンス制御" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG15",occupationGroup:"製品開発・設計",occupationId:"OC81",occupation:"評価・実装・デバイス開発",specializedOccupationId:"SO220",specializedOccupation:"評価・実装" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG15",occupationGroup:"製品開発・設計",occupationId:"OC81",occupation:"評価・実装・デバイス開発",specializedOccupationId:"SO221",specializedOccupation:"デバイス開発" },
  { careerAreaId:"CA05",careerArea:"メーカー・製造業",occupationGroupId:"OG16",occupationGroup:"生産・品質管理",occupationId:"OC81",occupation:"評価・実装・デバイス開発",specializedOccupationId:"SO222",specializedOccupation:"プロセスエンジニア" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC15",occupation:"経営企画・事業開発",specializedOccupationId:"SO223",specializedOccupation:"事業企画" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC15",occupation:"経営企画・事業開発",specializedOccupationId:"SO224",specializedOccupation:"営業企画・営業推進" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC15",occupation:"経営企画・事業開発",specializedOccupationId:"SO225",specializedOccupation:"リサーチ・市場調査" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC17",occupation:"クリエイティブ",specializedOccupationId:"SO226",specializedOccupation:"商品企画" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC18",occupation:"経理・財務・会計・内部統制",specializedOccupationId:"SO227",specializedOccupation:"内部統制" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC20",occupation:"人事・組織開発",specializedOccupationId:"SO228",specializedOccupation:"労務・給与社保" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC75",occupation:"総務・購買",specializedOccupationId:"SO229",specializedOccupation:"購買" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC82",occupation:"広報・IR・サステナビリティ",specializedOccupationId:"SO230",specializedOccupation:"広報" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC82",occupation:"広報・IR・サステナビリティ",specializedOccupationId:"SO231",specializedOccupation:"IR" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG41",occupationGroup:"管理・スタッフ",occupationId:"OC82",occupation:"広報・IR・サステナビリティ",specializedOccupationId:"SO232",specializedOccupation:"サステナビリティ" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG42",occupationGroup:"事務・アシスタント",occupationId:"OC83",occupation:"管理部門事務",specializedOccupationId:"SO233",specializedOccupation:"経理事務・財務アシスタント" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG42",occupationGroup:"事務・アシスタント",occupationId:"OC83",occupation:"管理部門事務",specializedOccupationId:"SO234",specializedOccupation:"総務アシスタント" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG42",occupationGroup:"事務・アシスタント",occupationId:"OC83",occupation:"管理部門事務",specializedOccupationId:"SO235",specializedOccupation:"法務アシスタント" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG42",occupationGroup:"事務・アシスタント",occupationId:"OC83",occupation:"管理部門事務",specializedOccupationId:"SO236",specializedOccupation:"人事アシスタント" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG42",occupationGroup:"事務・アシスタント",occupationId:"OC84",occupation:"企画・マーケティング事務",specializedOccupationId:"SO237",specializedOccupation:"マーケティングアシスタント" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG42",occupationGroup:"事務・アシスタント",occupationId:"OC84",occupation:"企画・マーケティング事務",specializedOccupationId:"SO238",specializedOccupation:"経営企画アシスタント" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG42",occupationGroup:"事務・アシスタント",occupationId:"OC85",occupation:"秘書・翻訳通訳",specializedOccupationId:"SO239",specializedOccupation:"秘書" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG42",occupationGroup:"事務・アシスタント",occupationId:"OC85",occupation:"秘書・翻訳通訳",specializedOccupationId:"SO240",specializedOccupation:"翻訳" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG42",occupationGroup:"事務・アシスタント",occupationId:"OC85",occupation:"秘書・翻訳通訳",specializedOccupationId:"SO241",specializedOccupation:"通訳" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG42",occupationGroup:"事務・アシスタント",occupationId:"OC86",occupation:"その他事務",specializedOccupationId:"SO242",specializedOccupation:"営業事務" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG42",occupationGroup:"事務・アシスタント",occupationId:"OC86",occupation:"その他事務",specializedOccupationId:"SO243",specializedOccupation:"一般事務" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG25",occupationGroup:"物流企画・管理",occupationId:"OC49",occupation:"ロジスティクス企画",specializedOccupationId:"SO244",specializedOccupation:"物流管理" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG25",occupationGroup:"物流企画・管理",occupationId:"OC49",occupation:"ロジスティクス企画",specializedOccupationId:"SO245",specializedOccupation:"SCM企画・物流企画・需要予測" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG25",occupationGroup:"物流企画・管理",occupationId:"OC87",occupation:"購買・物流・貿易事務",specializedOccupationId:"SO246",specializedOccupation:"物流・購買事務" },
  { careerAreaId:"CA08",careerArea:"物流・運輸",occupationGroupId:"OG25",occupationGroup:"物流企画・管理",occupationId:"OC87",occupation:"購買・物流・貿易事務",specializedOccupationId:"SO247",specializedOccupation:"貿易事務" },
  { careerAreaId:"CA06",careerArea:"人材・教育",occupationGroupId:"OG20",occupationGroup:"教育・研修",occupationId:"OC39",occupation:"学校・塾講師",specializedOccupationId:"SO248",specializedOccupation:"学校教職員" },
  { careerAreaId:"CA99",careerArea:"全業種共通（管理部門/企画/事務等）",occupationGroupId:"OG40",occupationGroup:"企画・マーケティング",occupationId:"OC17",occupation:"クリエイティブ",specializedOccupationId:"SO249",specializedOccupation:"WEBディレクター" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG36",occupationGroup:"建設・施工",occupationId:"OC69",occupation:"施工管理",specializedOccupationId:"SO250",specializedOccupation:"設備施工管理" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG36",occupationGroup:"建設・施工",occupationId:"OC70",occupation:"設計・積算",specializedOccupationId:"SO251",specializedOccupation:"土木設計" },
  { careerAreaId:"CA13",careerArea:"不動産・建設",occupationGroupId:"OG36",occupationGroup:"建設・施工",occupationId:"OC70",occupation:"設計・積算",specializedOccupationId:"SO252",specializedOccupation:"CAD/BIM/CIMオペレーター" },
];

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
  sessionId: '',     // UUID（ページロード時に生成）
  userInfo: {
    name: '', email: '',
    careerArea: '', occupationGroup: '', occupation: '', specializedOccupation: '', jobFreeword: '',
    industry: '', size: '', company: '',
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
    // GAS の doPost は e.postData.contents を読むため text/plain が最も確実。
    // no-cors では application/json ヘッダは仕様上ブラウザに除去されるため text/plain を明示する。
    console.info('[GAS] 送信ペイロード:', payload.type, 'token:', payload.token ? 'あり' : '無し');
    await fetch(GAS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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

/** 第1送信ペイロード（設問画面遷移時・離脱データ） */
function buildInitialGASPayload() {
  const u = state.userInfo;
  return {
    type: 'initial',
    token:              GAS_TOKEN,
    sessionId:          state.sessionId,
    status:             '離脱',
    dropoffPoint:       '設問画面遷移',
    startedAt:          new Date().toISOString(),
    name:               u.name,
    email:              u.email,
    careerArea:         u.careerArea,
    occupationGroup:    u.occupationGroup,
    occupation:         u.occupation,
    specializedOccupation: u.specializedOccupation,
    jobFreeword:        u.jobFreeword,
    industry:           u.industry,
    size:               u.size,
    company:            u.company,
  };
}

/** 第2送信ペイロード（結果画面表示時・完了データ） */
function buildGASPayload(reportRequested = false) {
  const u = state.userInfo;
  const q = state.answers;
  const dq = state.quantData;
  return {
    type: 'complete',
    token:              GAS_TOKEN,
    sessionId:          state.sessionId,
    status:             '完了',
    dropoffPoint:       '結果画面表示済み',
    completedAt:        new Date().toISOString(),
    name:               u.name,
    email:              u.email,
    careerArea:         u.careerArea,
    occupationGroup:    u.occupationGroup,
    occupation:         u.occupation,
    specializedOccupation: u.specializedOccupation,
    jobFreeword:        u.jobFreeword,
    industry:           u.industry,
    size:               u.size,
    company:            u.company,
    totalScore:         state.totalScore,
    stage:              state.stage?.name,
    scoreLeadership:    state.areaScores.leadership,
    scoreManager:       state.areaScores.manager,
    scoreCulture:       state.areaScores.culture,
    scoreSystem:        state.areaScores.system,
    scoreIndividual:    state.areaScores.individual,
    scoreData:          state.areaScores.data,
    // 個別回答
    Q1: q.Q1,  Q2: q.Q2,  Q3: q.Q3,  Q4: q.Q4,  Q5: q.Q5,
    Q6: q.Q6,  Q7: q.Q7,  Q8: q.Q8,  Q9: q.Q9,  Q10: q.Q10,
    Q11: q.Q11, Q12: q.Q12, Q13: q.Q13, Q14: q.Q14, Q15: q.Q15,
    Q16: q.Q16, Q17: q.Q17, Q18: q.Q18, Q19: q.Q19,
    Q20: q.Q20, Q21: q.Q21, Q22: q.Q22, Q23: q.Q23,
    Q24: q.Q24, Q25: q.Q25, Q26: q.Q26,
    // 定量データ
    dq1Freq:         dq.dq1_freq             ?? '',
    dq1Rate:         dq.dq1_rate             ?? '',
    dq2RecruitRate:  dq.dq2_recruit_rate     ?? '',
    dq2ApplyRate:    dq.dq2_apply_rate       ?? '',
    dq3TrainingRate: dq.dq3_training_rate    ?? '',
    dq4CareerTalk:   dq.dq4_career_talk_rate ?? '',
    dq5SideCount:    dq.dq5_side_count       ?? '',
    dq5SideRate:     dq.dq5_side_rate        ?? '',
    dq6Engagement:   dq.dq6_engagement       ?? '',
    dq6Turnover:     dq.dq6_turnover         ?? '',
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
  // ナビゲーション時刻を記録（iOS ゴーストクリック対策）
  lastNavigationTime = Date.now();

  // 回答ボタンの選択状態を即時クリア
  document.querySelectorAll('.answer-btn').forEach((btn) => btn.classList.remove('is-selected'));

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
  btnNext.textContent = '次へ →';
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
let lastNavigationTime = 0;

/** 回答ボタンクリック */
function onAnswerClick(value) {
  // iOS ゴーストクリック対策：ナビゲーション直後 200ms 以内は無視
  if (Date.now() - lastNavigationTime < 200) return;

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
   職種4階層連動プルダウン
============================================================ */
const FREEWORD_VALUE = '__FREEWORD__';
const FREEWORD_LABEL = '該当する職種が見つからない';

function _uniqueList(key, filter = () => true) {
  const seen = new Set();
  return OCCUPATION_TAXONOMY.filter(filter).reduce((acc, t) => {
    if (!seen.has(t[key])) { seen.add(t[key]); acc.push(t[key]); }
    return acc;
  }, []);
}

function _buildOptions(select, values) {
  select.innerHTML = '<option value="">選択してください</option>';
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
  const fw = document.createElement('option');
  fw.value = FREEWORD_VALUE;
  fw.textContent = FREEWORD_LABEL;
  select.appendChild(fw);
}

function _showWrap(id) { document.getElementById(id).hidden = false; }
function _hideWrap(id) { document.getElementById(id).hidden = true; }
function _resetSelect(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = '<option value="">選択してください</option>';
}

function _showFreeword() {
  _showWrap('field-jobFreeword-wrap');
  checkFormReady();
}
function _hideFreeword() {
  _hideWrap('field-jobFreeword-wrap');
  document.getElementById('field-jobFreeword').value = '';
}

function setupOccupationCascade() {
  const caSelect = document.getElementById('field-careerArea');
  const ogSelect = document.getElementById('field-occupationGroup');
  const ocSelect = document.getElementById('field-occupation');
  const soSelect = document.getElementById('field-specializedOccupation');
  const fwInput  = document.getElementById('field-jobFreeword');

  // キャリア領域の初期選択肢を構築（「全業種共通」を先頭に固定）
  const CA_TOP = '全業種共通（管理部門/企画/事務等）';
  const caList = _uniqueList('careerArea');
  const caListSorted = [CA_TOP, ...caList.filter(v => v !== CA_TOP)];
  _buildOptions(caSelect, caListSorted);

  // ── キャリア領域 変更 ──
  caSelect.addEventListener('change', () => {
    const val = caSelect.value;
    _hideFreeword();
    _hideWrap('field-occupationGroup-wrap');
    _hideWrap('field-occupation-wrap');
    _hideWrap('field-specializedOccupation-wrap');
    _resetSelect('field-occupationGroup');
    _resetSelect('field-occupation');
    _resetSelect('field-specializedOccupation');

    if (!val) { checkFormReady(); return; }
    if (val === FREEWORD_VALUE) { _showFreeword(); return; }

    _buildOptions(ogSelect, _uniqueList('occupationGroup', t => t.careerArea === val));
    _showWrap('field-occupationGroup-wrap');
    checkFormReady();
  });

  // ── 職種グループ 変更 ──
  ogSelect.addEventListener('change', () => {
    const caVal = caSelect.value;
    const val = ogSelect.value;
    _hideFreeword();
    _hideWrap('field-occupation-wrap');
    _hideWrap('field-specializedOccupation-wrap');
    _resetSelect('field-occupation');
    _resetSelect('field-specializedOccupation');

    if (!val) { checkFormReady(); return; }
    if (val === FREEWORD_VALUE) { _showFreeword(); return; }

    _buildOptions(ocSelect, _uniqueList('occupation', t => t.careerArea === caVal && t.occupationGroup === val));
    _showWrap('field-occupation-wrap');
    checkFormReady();
  });

  // ── 職種 変更 ──
  ocSelect.addEventListener('change', () => {
    const caVal = caSelect.value;
    const ogVal = ogSelect.value;
    const val = ocSelect.value;
    _hideFreeword();
    _hideWrap('field-specializedOccupation-wrap');
    _resetSelect('field-specializedOccupation');

    if (!val) { checkFormReady(); return; }
    if (val === FREEWORD_VALUE) { _showFreeword(); return; }

    _buildOptions(soSelect, _uniqueList('specializedOccupation',
      t => t.careerArea === caVal && t.occupationGroup === ogVal && t.occupation === val));
    _showWrap('field-specializedOccupation-wrap');
    checkFormReady();
  });

  // ── 専門職種 変更 ──
  soSelect.addEventListener('change', () => {
    const val = soSelect.value;
    if (val === FREEWORD_VALUE) { _showFreeword(); }
    else { _hideFreeword(); }
    checkFormReady();
  });

  // ── フリーワード入力 ──
  fwInput.addEventListener('input', checkFormReady);
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
  const basicFields = ['name', 'email', 'industry', 'size'];
  let valid = true;

  basicFields.forEach((key) => {
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
      el?.classList.add('is-error');
      if (errEl) errEl.textContent = msg;
      valid = false;
    } else {
      el?.classList.remove('is-error');
      if (errEl) errEl.textContent = '';
    }
  });

  // 職種階層バリデーション
  if (!isJobSelectionComplete()) {
    valid = false;
  }

  return valid;
}

/** 職種選択が終端（専門職種 or フリーワード）まで完了しているか */
function isJobSelectionComplete() {
  const freewordWrap = document.getElementById('field-jobFreeword-wrap');
  if (!freewordWrap.hidden) {
    return document.querySelector('[data-field="jobFreeword"]')?.value.trim() !== '';
  }
  const soWrap = document.getElementById('field-specializedOccupation-wrap');
  if (!soWrap.hidden) {
    return document.querySelector('[data-field="specializedOccupation"]')?.value.trim() !== '';
  }
  return false;
}

/** 必須フィールドが埋まっているかリアルタイムチェックして開始ボタンを活性化 */
function checkFormReady() {
  const basicFields = ['name', 'email', 'industry', 'size'];
  const allBasicFilled = basicFields.every((key) => {
    const el = document.querySelector(`[data-field="${key}"]`);
    return el?.value.trim() !== '';
  });
  const privacyChecked = document.getElementById('privacy-agree')?.checked !== false;
  document.getElementById('btn-start').disabled = !(allBasicFilled && isJobSelectionComplete() && privacyChecked);
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
  state.sessionId = crypto.randomUUID();
  state.userInfo = {
    name: '', email: '',
    careerArea: '', occupationGroup: '', occupation: '', specializedOccupation: '', jobFreeword: '',
    industry: '', size: '', company: '',
  };

  // 職種連動プルダウンをリセット
  ['field-occupationGroup-wrap','field-occupation-wrap','field-specializedOccupation-wrap','field-jobFreeword-wrap'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  });
  ['field-occupationGroup','field-occupation','field-specializedOccupation'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">選択してください</option>';
  });
  const fw = document.getElementById('field-jobFreeword');
  if (fw) fw.value = '';

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
  // プライバシーポリシー チェックボックス
  document.getElementById('privacy-agree').addEventListener('change', checkFormReady);

  // 診断開始
  document.getElementById('form-basic-info').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateBasicInfo()) return;

    // 基本フィールド収集
    ['name', 'email', 'industry', 'size', 'company'].forEach((key) => {
      const el = document.querySelector(`[data-field="${key}"]`);
      state.userInfo[key] = el?.value.trim() ?? '';
    });

    // 職種フィールド収集
    state.userInfo.careerArea = document.querySelector('[data-field="careerArea"]')?.value ?? '';
    const freewordWrap = document.getElementById('field-jobFreeword-wrap');
    if (!freewordWrap.hidden) {
      state.userInfo.jobFreeword        = document.querySelector('[data-field="jobFreeword"]')?.value.trim() ?? '';
      state.userInfo.occupationGroup    = '';
      state.userInfo.occupation         = '';
      state.userInfo.specializedOccupation = '';
    } else {
      state.userInfo.occupationGroup    = document.querySelector('[data-field="occupationGroup"]')?.value ?? '';
      state.userInfo.occupation         = document.querySelector('[data-field="occupation"]')?.value ?? '';
      state.userInfo.specializedOccupation = document.querySelector('[data-field="specializedOccupation"]')?.value ?? '';
      state.userInfo.jobFreeword        = '';
    }

    state.currentStep = 0;
    showScreen('question');
    renderStep();

    // 第1送信（離脱データ）
    sendToGAS(buildInitialGASPayload());
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
  // セッションID生成（UUID）
  state.sessionId = crypto.randomUUID();

  setupOccupationCascade();
  setupEventListeners();

  // 初期状態では開始ボタンを無効化
  document.getElementById('btn-start').disabled = true;
}

document.addEventListener('DOMContentLoaded', init);
