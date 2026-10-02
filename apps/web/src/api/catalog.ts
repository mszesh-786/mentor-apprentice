import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { Language, Skill, SkillCategory } from '@/api/types'

export function useLanguages() {
  return useQuery({
    queryKey: ['languages'],
    queryFn: () => apiFetch<Language[]>('/languages'),
    staleTime: 5 * 60_000,
  })
}

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => apiFetch<Skill[]>('/skills'),
    staleTime: 5 * 60_000,
  })
}

export function useSkillCategories() {
  return useQuery({
    queryKey: ['skills', 'categories'],
    queryFn: () => apiFetch<SkillCategory[]>('/skills/categories'),
    staleTime: 5 * 60_000,
  })
}
