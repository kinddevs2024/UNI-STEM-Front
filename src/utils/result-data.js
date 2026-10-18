export function normalizeResult(result, olympiad) {
  const sourceUser = result.user && typeof result.user === 'object' ? result.user : {};
  const userName = result.userName || sourceUser.name || [sourceUser.firstName, sourceUser.secondName].filter(Boolean).join(' ') || 'Unknown participant';
  const score = Number(result.totalScore ?? result.score ?? 0);
  const totalPoints = Number(result.maxScore ?? result.totalPoints ?? olympiad?.totalPoints ?? result.olympiad?.totalPoints ?? 0);
  return {
    ...result,
    _id: result.resultId || result._id,
    userId: result.userId || sourceUser._id,
    userName,
    user: { ...sourceUser, _id: result.userId || sourceUser._id, name: userName, email: result.userEmail || sourceUser.email || '' },
    score, totalScore: score, totalPoints, maxScore: totalPoints,
    percentage: result.percentage ?? (totalPoints > 0 ? score / totalPoints * 100 : 0),
    completedAt: result.completedAt || result.submittedAt,
    olympiad: olympiad || result.olympiad,
    olympiadId: result.olympiadId || olympiad?._id,
    olympiadTitle: result.olympiadTitle || olympiad?.title || result.olympiad?.title,
    olympiadType: result.olympiadType || olympiad?.type || result.olympiad?.type,
  };
}
export function flattenResultGroups(groups) {
  return (groups || []).flatMap(group => (group.results || []).map(result => normalizeResult({ ...result, olympiadId: group.olympiadId }, group.olympiad)));
}