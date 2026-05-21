/**
 * キャリアオーナーシップ診断 — GAS バックエンド
 * NODIA Co., Ltd.
 *
 * 列構成（A列=1列目）:
 * A: セッションID
 * B: 回答ステータス
 * C: 離脱ポイント
 * D: 回答開始日時
 * E: 回答完了日時
 * F: 氏名
 * G: メールアドレス
 * H: キャリア領域
 * I: 職種グループ
 * J: 職種
 * K: 専門職種
 * L: 職種（フリーワード）
 * M: 業界
 * N: 従業員数
 * O: 在籍企業
 * P: 総合スコア
 * Q: 段階
 * R: 経営・宣言スコア
 * S: 管理職支援スコア
 * T: 組織風土スコア
 * U: 制度設計スコア
 * V: 個人行動スコア
 * W: データ把握スコア
 * X〜AM: Q1〜Q26（26列）
 * AN: DQ：1on1実施頻度
 * AO: DQ：1on1実施率(%)
 * AP: DQ：社内公募応募率(%)
 * AQ: DQ：手挙げ制度利用率(%)
 * AR: DQ：研修受講率(%)
 * AS: DQ：キャリア面談実施率(%)
 * AT: DQ：副業申請者数
 * AU: DQ：副業利用率(%)
 * AV: DQ：エンゲージメントスコア
 * AW: DQ：離職率(%)
 * AX: 他社比較レポート希望
 */

const SPREADSHEET_ID = '1VJLjfSXf8hI8sCFy7yaARLcGRliKiGcSmuFikpwb_Sc';
const SHEET_NAME     = 'シート1';

/** ヘッダー行（1行目） */
const HEADERS = [
  'セッションID', '回答ステータス', '離脱ポイント', '回答開始日時', '回答完了日時',
  '氏名', 'メールアドレス',
  'キャリア領域', '職種グループ', '職種', '専門職種', '職種（フリーワード）',
  '業界', '従業員数', '在籍企業',
  '総合スコア', '段階',
  '経営・宣言スコア', '管理職支援スコア', '組織風土スコア', '制度設計スコア', '個人行動スコア', 'データ把握スコア',
  'Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10',
  'Q11','Q12','Q13','Q14','Q15','Q16','Q17','Q18','Q19',
  'Q20','Q21','Q22','Q23','Q24','Q25','Q26',
  'DQ：1on1実施頻度', 'DQ：1on1実施率(%)',
  'DQ：社内公募応募率(%)', 'DQ：手挙げ制度利用率(%)',
  'DQ：研修受講率(%)', 'DQ：キャリア面談実施率(%)',
  'DQ：副業申請者数', 'DQ：副業利用率(%)',
  'DQ：エンゲージメントスコア', 'DQ：離職率(%)',
  '他社比較レポート希望',
];

/* ============================================================
   エントリーポイント
============================================================ */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const payload = JSON.parse(e.postData.contents);

    if (payload.type === 'initial') {
      handleInitial(payload);
    } else if (payload.type === 'complete') {
      handleComplete(payload);
    } else {
      // 旧形式の互換処理
      handleLegacy(payload);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('doPost error:', err);
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/* ============================================================
   第1送信処理（離脱データとして新規行を追加）
============================================================ */
function handleInitial(p) {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const row = buildEmptyRow();
  row[0]  = p.sessionId    || '';
  row[1]  = p.status       || '離脱';
  row[2]  = p.dropoffPoint || '設問画面遷移';
  row[3]  = p.startedAt    || new Date().toISOString();
  row[4]  = '';   // completedAt（空欄）
  row[5]  = p.name         || '';
  row[6]  = p.email        || '';
  row[7]  = p.careerArea   || '';
  row[8]  = p.occupationGroup || '';
  row[9]  = p.occupation   || '';
  row[10] = p.specializedOccupation || '';
  row[11] = p.jobFreeword  || '';
  row[12] = p.industry     || '';
  row[13] = p.size         || '';
  row[14] = p.company      || '';
  // スコア・回答・定量・レポートは空欄のまま

  sheet.appendRow(row);
}

/* ============================================================
   第2送信処理（sessionId で行を検索して更新）
============================================================ */
function handleComplete(p) {
  const sheet = getSheet();
  ensureHeaders(sheet);

  // sessionId が一致する行を検索
  const data = sheet.getDataRange().getValues();
  let targetRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.sessionId) {
      targetRow = i + 1; // 1-indexed
      break;
    }
  }

  const row = buildEmptyRow();
  row[0]  = p.sessionId    || '';
  row[1]  = p.status       || '完了';
  row[2]  = p.dropoffPoint || '結果画面表示済み';
  row[3]  = targetRow > 0 ? data[targetRow - 1][3] : ''; // startedAt を保持
  row[4]  = p.completedAt  || new Date().toISOString();
  row[5]  = p.name         || '';
  row[6]  = p.email        || '';
  row[7]  = p.careerArea   || '';
  row[8]  = p.occupationGroup || '';
  row[9]  = p.occupation   || '';
  row[10] = p.specializedOccupation || '';
  row[11] = p.jobFreeword  || '';
  row[12] = p.industry     || '';
  row[13] = p.size         || '';
  row[14] = p.company      || '';
  row[15] = p.totalScore   ?? '';
  row[16] = p.stage        || '';
  row[17] = p.scoreLeadership ?? '';
  row[18] = p.scoreManager    ?? '';
  row[19] = p.scoreCulture    ?? '';
  row[20] = p.scoreSystem     ?? '';
  row[21] = p.scoreIndividual ?? '';
  row[22] = p.scoreData       ?? '';
  // Q1〜Q26（インデックス 23〜48）
  for (let i = 1; i <= 26; i++) {
    row[22 + i] = p[`Q${i}`] ?? '';
  }
  // DQ（インデックス 49〜58）
  row[49] = p.dq1Freq         || '';
  row[50] = p.dq1Rate         || '';
  row[51] = p.dq2RecruitRate  || '';
  row[52] = p.dq2ApplyRate    || '';
  row[53] = p.dq3TrainingRate || '';
  row[54] = p.dq4CareerTalk   || '';
  row[55] = p.dq5SideCount    || '';
  row[56] = p.dq5SideRate     || '';
  row[57] = p.dq6Engagement   || '';
  row[58] = p.dq6Turnover     || '';
  row[59] = p.reportRequested ? 'TRUE' : '';

  if (targetRow > 0) {
    // 既存行を更新
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  } else {
    // 行が見つからない場合は新規追加（フォールバック）
    sheet.appendRow(row);
  }
}

/* ============================================================
   旧形式の互換処理（typeなし）
============================================================ */
function handleLegacy(p) {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const row = buildEmptyRow();
  row[0]  = p.sessionId    || Utilities.getUuid();
  row[1]  = '完了';
  row[2]  = '結果画面表示済み';
  row[3]  = p.timestamp    || '';
  row[4]  = p.timestamp    || '';
  row[5]  = p.name         || '';
  row[6]  = p.email        || '';
  row[7]  = p.careerArea   || p.job || '';
  row[8]  = p.occupationGroup || '';
  row[9]  = p.occupation   || '';
  row[10] = p.specializedOccupation || '';
  row[11] = p.jobFreeword  || '';
  row[12] = p.industry     || '';
  row[13] = p.size         || '';
  row[14] = p.company      || '';
  row[15] = p.totalScore   ?? '';
  row[16] = p.stage        || '';
  row[17] = p.scoreLeadership ?? '';
  row[18] = p.scoreManager    ?? '';
  row[19] = p.scoreCulture    ?? '';
  row[20] = p.scoreSystem     ?? '';
  row[21] = p.scoreIndividual ?? '';
  row[22] = p.scoreData       ?? '';
  for (let i = 1; i <= 26; i++) { row[22 + i] = p[`Q${i}`] ?? ''; }
  row[49] = p.dq1Freq         || '';
  row[50] = p.dq1Rate         || '';
  row[51] = p.dq2RecruitRate  || '';
  row[52] = p.dq2ApplyRate    || '';
  row[53] = p.dq3TrainingRate || '';
  row[54] = p.dq4CareerTalk   || '';
  row[55] = p.dq5SideCount    || '';
  row[56] = p.dq5SideRate     || '';
  row[57] = p.dq6Engagement   || '';
  row[58] = p.dq6Turnover     || '';
  row[59] = p.reportRequested ? 'TRUE' : '';

  sheet.appendRow(row);
}

/* ============================================================
   ユーティリティ
============================================================ */
function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  } else {
    const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (!firstRow[0] || firstRow[0] !== 'セッションID') {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }
  }
}

function buildEmptyRow() {
  return new Array(HEADERS.length).fill('');
}
