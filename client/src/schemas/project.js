import { z } from 'zod';

export const step1Schema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(150),
    short_description: z
      .string()
      .min(30, 'Short description must be at least 30 characters')
      .max(500),
    problem_statement: z
      .string()
      .min(50, 'Problem statement must be at least 50 characters')
      .max(5000),
    objectives: z
      .array(z.string().min(1))
      .min(1, 'Add at least one objective'),
    project_type: z.enum(['mini', 'major', 'research', 'personal', 'hackathon', 'open_source']),
    ownership_mode: z.enum(['solo', 'team']),
    category_id: z.string().uuid().optional().nullable(),
    stage: z.enum([
      'idea',
      'planning',
      'design',
      'development',
      'testing',
      'completed',
      'maintenance',
    ]),
    duration_preset: z.enum(['lt1', '1-3', '3-6', '6-12', 'custom']).optional(),
    duration_min_months: z.number().int().min(0).max(60).optional().nullable(),
    duration_max_months: z.number().int().min(0).max(60).optional().nullable(),
    start_date: z.string().optional().nullable(),
    target_end_date: z.string().optional().nullable(),
    visibility: z.enum(['private', 'team', 'faculty', 'public']),
  })
  .refine(
    (d) => {
      if (d.start_date && d.target_end_date) {
        return new Date(d.target_end_date) >= new Date(d.start_date);
      }
      return true;
    },
    { message: 'Completion date cannot be before start date', path: ['target_end_date'] }
  );

export const PROJECT_TYPES = [
  { value: 'mini', label: 'Mini Project' },
  { value: 'major', label: 'Major / Final-Year Project' },
  { value: 'research', label: 'Research Project' },
  { value: 'personal', label: 'Personal / Side Project' },
  { value: 'hackathon', label: 'Hackathon Project' },
  { value: 'open_source', label: 'Open Source Project' },
];

export const STAGES = [
  { value: 'idea', label: 'Idea' },
  { value: 'planning', label: 'Planning' },
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing' },
  { value: 'completed', label: 'Completed' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team only' },
  { value: 'faculty', label: 'Faculty / authorized reviewers' },
  { value: 'public', label: 'Public showcase' },
];

export const DURATION_PRESETS = [
  { value: 'lt1', label: 'Less than one month', min: 0, max: 1 },
  { value: '1-3', label: '1–3 months', min: 1, max: 3 },
  { value: '3-6', label: '3–6 months', min: 3, max: 6 },
  { value: '6-12', label: '6–12 months', min: 6, max: 12 },
  { value: 'custom', label: 'Custom range', min: null, max: null },
];
