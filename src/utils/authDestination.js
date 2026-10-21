import { GRADE_CATEGORIES } from './gradeCategories';

export function needsGradeSelection(user) {
  return user?.role === 'student' && !GRADE_CATEGORIES.includes(user.gradeCategory);
}

export function needsLanguageSelection(user) {
  return user?.role === 'student' && !['uz','en','ru'].includes(user.language);
}
export function needsOnboarding(user) {
  return needsGradeSelection(user) || needsLanguageSelection(user);
}

export function hasCompleteProfile(user) {
  return Boolean(user?.name && user.tel && user.address && user.dateBorn && user.gender
    && (user.role !== "student" || (user.schoolName && user.schoolId)));
}

export function getAuthDestination(user) {
  if (needsOnboarding(user)) return "/auth";
  if (user?.role === "owner") return "/owner";
  if (user?.role === "admin") return "/admin";
  return "/dashboard";
}
