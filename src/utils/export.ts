import { EvaluationResult } from '../types';
import { marked } from 'marked';

/**
 * Downloads a plain text file containing the perfected full-mark answer
 * along with question and summary notes.
 */
export function downloadAnswerText(result: EvaluationResult): void {
  const content = `KHATA JUDGE - FULL-MARK ANSWER STUDY SHEET
=============================================
Date: ${new Date(result.timestamp).toLocaleDateString()}
Score: ${result.totalAwarded} / ${result.totalMarks} (${result.percentage}%) - Grade: ${result.letterGrade}
Verdict: ${result.verdictSummary}

QUESTION:
---------------------------------------------
${result.question}

YOUR FULL-MARK ANSWER:
---------------------------------------------
${result.fullMarkAnswer || result.studentAnswer}

HOW MARKS WERE GIVEN:
---------------------------------------------
${result.parameters
  .map(
    (p, i) =>
      `${i + 1}. ${p.parameterName}: ${p.marksAwarded} / ${p.maxMarks} marks\n   - What you did well: ${p.strengths.join(' ')}\n   - What lost marks: ${p.flaws.join(' ')}\n   - Advice: ${p.recommendation}`
  )
  .join('\n\n')}

TIPS FOR NEXT TIME:
---------------------------------------------
${(result.tips || []).map((t, i) => `${i + 1}. ${t}`).join('\n')}
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `full-mark-answer-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens a clean, beautiful, print-ready printable study sheet
 * which immediately invokes browser Print-to-PDF.
 */
export function printAnswerPdf(result: EvaluationResult): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Full-Mark Answer - Khata Judge</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 40px auto;
      max-width: 800px;
      color: #1e293b;
      line-height: 1.6;
      padding: 0 20px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
    }
    .tagline {
      font-size: 13px;
      color: #64748b;
    }
    .score-badge {
      text-align: right;
    }
    .score-num {
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
    }
    .score-label {
      font-size: 12px;
      color: #64748b;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      margin-top: 24px;
      margin-bottom: 8px;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 18px;
      font-size: 15px;
      white-space: pre-wrap;
    }
    .full-mark-box {
      background: #ffffff;
      border: 2px solid #2563eb;
      border-radius: 8px;
      padding: 20px;
      font-size: 15px;
      line-height: 1.7;
    }
    .full-mark-box ul, .full-mark-box ol { margin: 8px 0; padding-left: 24px; }
    .full-mark-box li { margin-bottom: 5px; }
    .full-mark-box p { margin: 0 0 10px 0; }
    .full-mark-box p:last-child { margin-bottom: 0; }
    .full-mark-box strong { font-weight: 700; color: #1e3a8a; }
    .point-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 10px;
    }
    .point-head {
      display: flex;
      justify-content: space-between;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 6px;
    }
    .bullet {
      margin: 4px 0;
      font-size: 13px;
      color: #334155;
    }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Khata Judge</div>
      <div class="tagline">Check your answer. Get the full-mark version.</div>
    </div>
    <div class="score-badge">
      <div class="score-num">${result.totalAwarded} / ${result.totalMarks}</div>
      <div class="score-label">${result.percentage}% • ${result.letterGrade}</div>
    </div>
  </div>

  <div class="section-title">Question</div>
  <div class="box">${escapeHtml(result.question)}</div>

  <div class="section-title">Your Full-Mark Answer (Study Sheet)</div>
  <div class="full-mark-box">${marked.parse(result.fullMarkAnswer || result.studentAnswer)}</div>

  <div class="section-title">How Marks Were Given</div>
  ${result.parameters
    .map(
      (p, i) => `
    <div class="point-card">
      <div class="point-head">
        <span>${i + 1}. ${escapeHtml(p.parameterName)}</span>
        <span>${p.marksAwarded} / ${p.maxMarks} marks</span>
      </div>
      <div class="bullet"><strong>What you did well:</strong> ${escapeHtml(p.strengths.join(' '))}</div>
      <div class="bullet"><strong>What lost marks:</strong> ${escapeHtml(p.flaws.join(' '))}</div>
    </div>`
    )
    .join('')}

  <div class="section-title">Tips for Next Time</div>
  <ul>
    ${(result.tips || []).map((t) => `<li style="font-size: 14px; margin-bottom: 6px;">${escapeHtml(t)}</li>`).join('')}
  </ul>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 200);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
