export interface DiffToken {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

/**
 * Computes a lightweight word/token-level diff between original and improved text
 * using an LCS (Longest Common Subsequence) algorithm. Zero external dependencies.
 */
export function computeWordDiff(originalText: string, improvedText: string): DiffToken[] {
  if (!originalText && !improvedText) return [];
  if (!originalText) return [{ type: 'added', value: improvedText }];
  if (!improvedText) return [{ type: 'removed', value: originalText }];

  // Tokenize into words and whitespace
  const tokenize = (text: string): string[] => {
    return text.match(/\S+|\s+/g) || [];
  };

  const tokensA = tokenize(originalText);
  const tokensB = tokenize(improvedText);

  const n = tokensA.length;
  const m = tokensB.length;

  // Build DP table for LCS
  // For performance on very long essays, if tokens are very large (> 2000),
  // we do paragraph-level or block diff to stay fast and snappy.
  if (n * m > 1_500_000) {
    // Fallback block/line diff for huge texts
    return computeParagraphDiff(originalText, improvedText);
  }

  // dp[i][j] holds length of LCS between tokensA[0..i-1] and tokensB[0..j-1]
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));

  for (let i = 1; i <= n; i++) {
    const a = tokensA[i - 1];
    for (let j = 1; j <= m; j++) {
      if (a === tokensB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build the diff
  let i = n;
  let j = m;
  const rawDiff: DiffToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokensA[i - 1] === tokensB[j - 1]) {
      rawDiff.push({ type: 'unchanged', value: tokensA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({ type: 'added', value: tokensB[j - 1] });
      j--;
    } else if (i > 0) {
      rawDiff.push({ type: 'removed', value: tokensA[i - 1] });
      i--;
    }
  }

  rawDiff.reverse();

  // Merge contiguous tokens of the same type for cleaner rendering
  const merged: DiffToken[] = [];
  for (const token of rawDiff) {
    const prev = merged[merged.length - 1];
    if (prev && prev.type === token.type) {
      prev.value += token.value;
    } else {
      merged.push({ ...token });
    }
  }

  return merged;
}

function computeParagraphDiff(textA: string, textB: string): DiffToken[] {
  const parasA = textA.split(/\n\n+/);
  const parasB = textB.split(/\n\n+/);
  const result: DiffToken[] = [];

  const maxLen = Math.max(parasA.length, parasB.length);
  for (let i = 0; i < maxLen; i++) {
    const a = parasA[i];
    const b = parasB[i];
    if (a === b && a !== undefined) {
      result.push({ type: 'unchanged', value: a + '\n\n' });
    } else {
      if (a !== undefined) result.push({ type: 'removed', value: a + '\n\n' });
      if (b !== undefined) result.push({ type: 'added', value: b + '\n\n' });
    }
  }
  return result;
}
